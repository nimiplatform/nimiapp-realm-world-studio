import type { NimiAppActivityOpenRegistration } from '@nimiplatform/sdk/app';
import { getStudioLocalAppClient } from '../../app-shell/studio-platform.js';
import { logRendererEvent, describeError } from '../../infra/telemetry/renderer-log.js';
import type { WorldDraft } from './world-draft.js';
import { coauthorActivity, COAUTHOR_ACTIVITY_TYPE, draftIdFromObjectRef, mergeWorldActivities, type WorldActivityPublication } from './world-activity-model.js';
import { readWorldDraftDocument, updateWorldDraftDocument } from './world-draft-storage.js';

// @nimi-authority: rule.realm-world-studio.runtime-ai.r015
// Publications wait in the App's protected-storage outbox, which Runtime keeps
// per account. Work belongs to the session it started in: when the Host reports
// that session invalidated, in-flight work stops before its next publication or
// outbox write and Studio asks to be reopened; a reopened Studio resumes from
// the current account's outbox. A publication Runtime does not accept stays in
// the outbox, is reported as not synced, and can be retried; none is dropped.
let pendingPublications: WorldActivityPublication[] = [];

let queue: Promise<unknown> = Promise.resolve();
let sessionEpoch = 0;
let sessionActive = false;
let retryTimer: ReturnType<typeof setTimeout> | undefined;
let retryDelayMs = 15_000;
// null means the storage failure prevents determining an accurate count.
let unsynced: number | null = 0;
const syncListeners = new Set<(unsynced: number | null) => void>();

function serialized<T>(task: () => Promise<T>): Promise<T> {
  const run = queue.then(task, task);
  queue = run.then(() => undefined, () => undefined);
  return run;
}

function reasonCodeOf(error: unknown): string {
  return String((error as { reasonCode?: unknown })?.reasonCode ?? '');
}

function identity(entry: WorldActivityPublication): string {
  return `${entry.key}@${entry.revision}`;
}

/** Revisions follow the candidate lifecycle, so a conflict means Runtime already holds this or a later state. */
function settled(error: unknown): boolean {
  const reasonCode = reasonCodeOf(error);
  return reasonCode === 'content-conflict' || reasonCode === 'APP_ACTIVITY_REVISION_CONFLICT';
}

function reportUnsynced(count: number | null): void {
  unsynced = count;
  for (const listener of syncListeners) listener(count);
}

function clearRetry(): void {
  if (retryTimer !== undefined) clearTimeout(retryTimer);
  retryTimer = undefined;
}

function scheduleRetry(epoch: number): void {
  if (!sessionActive || epoch !== sessionEpoch) return;
  clearRetry();
  retryTimer = setTimeout(() => { void flushWorldActivity().catch(() => undefined); }, retryDelayMs);
  retryDelayMs = Math.min(retryDelayMs * 2, 5 * 60_000);
}

/** Reports, after every publication attempt, how many publications are still not synced. */
export function subscribeWorldActivitySync(listener: (unsynced: number | null) => void): () => void {
  syncListeners.add(listener);
  listener(unsynced);
  return () => { syncListeners.delete(listener); };
}

/** Starts activity work for the session that is bound now. */
export function beginWorldActivitySession(): void {
  endWorldActivitySession();
  sessionActive = true;
}

/** Ends the session's activity work: in-flight steps stop before their next publication or write. */
export function endWorldActivitySession(): void {
  sessionEpoch += 1;
  sessionActive = false;
  pendingPublications = [];
  clearRetry();
  retryDelayMs = 15_000;
  reportUnsynced(0);
}

/**
 * Reconciled candidates remain queued if their outbox write fails. Lifecycle
 * changes enter the durable outbox atomically with their draft save instead.
 */
export function queueWorldActivity(entries: readonly WorldActivityPublication[]): Promise<void> {
  if (!sessionActive) {
    logRendererEvent({ level: 'info', area: 'world-activity', message: 'action:activity-session-ended', details: { entries: entries.length } });
    return Promise.resolve();
  }
  pendingPublications = mergeWorldActivities(pendingPublications, entries);
  return flushWorldActivity().then(() => undefined);
}

/** Publishes every outbox entry; resolves with the number still not synced. */
export function flushWorldActivity(): Promise<number | null> {
  if (!sessionActive) return Promise.resolve(unsynced);
  const epoch = sessionEpoch;
  return serialized(() => flush(epoch));
}

/** The user's explicit retry: publishes now and restarts the retry backoff. */
export function retryWorldActivity(): Promise<number | null> {
  retryDelayMs = 15_000;
  return flushWorldActivity();
}

async function flush(epoch: number): Promise<number | null> {
  if (epoch !== sessionEpoch) return unsynced;
  clearRetry();
  try {
    const pending = pendingPublications;
    const isCurrent = () => sessionActive && epoch === sessionEpoch;
    const document = pending.length
      ? await updateWorldDraftDocument(current => ({
        ...current, activityOutbox: mergeWorldActivities(current.activityOutbox, pending),
      }), isCurrent)
      : await readWorldDraftDocument();
    if (!isCurrent()) return unsynced;
    pendingPublications = pendingPublications.filter(entry => !pending.includes(entry));
    const outbox = document.activityOutbox;
    const done = new Set<string>();
    for (const entry of outbox) {
      if (epoch !== sessionEpoch) return unsynced;
      try {
        await getStudioLocalAppClient().activity.put(entry);
        done.add(identity(entry));
      } catch (error) {
        if (settled(error)) done.add(identity(entry));
        else logRendererEvent({ level: 'warn', area: 'world-activity', message: 'action:activity-publication-failed', details: { key: entry.key, error: describeError(error) } });
      }
    }
    if (epoch !== sessionEpoch) return unsynced;
    let remaining = outbox.length - done.size;
    if (done.size) {
      // Only the handled entries leave the outbox; anything queued meanwhile stays.
      const latest = await updateWorldDraftDocument(current => ({
        ...current, activityOutbox: current.activityOutbox.filter(entry => !done.has(identity(entry))),
      }), isCurrent);
      if (!isCurrent()) return unsynced;
      remaining = latest.activityOutbox.length;
    }
    reportUnsynced(remaining);
    if (remaining) scheduleRetry(epoch);
    else retryDelayMs = 15_000;
    return remaining;
  } catch (error) {
    if (epoch !== sessionEpoch) return unsynced;
    logRendererEvent({ level: 'warn', area: 'world-activity', message: 'action:activity-outbox-unavailable', details: { error: describeError(error) } });
    reportUnsynced(null);
    scheduleRetry(epoch);
    return unsynced;
  }
}

/** Republishes every stored candidate that still awaits review. */
export function reconcileWorldActivity(drafts: readonly WorldDraft[]): Promise<void> {
  const open = drafts
    .filter((draft) => draft.proposal && !draft.savedWorld)
    .map((draft) => coauthorActivity(draft, draft.proposal!, 'open', draft.proposal!.generatedAt ?? draft.proposal!.sourceUpdatedAt));
  return open.length ? queueWorldActivity(open) : flushWorldActivity().then(() => undefined);
}

/**
 * Confirms an open request only after Studio has navigated into the
 * requested draft of the current account.
 */
export function registerWorldActivityOpenHandler(input: {
  readonly findDraft: (draftId: string) => Promise<WorldDraft | undefined>;
  readonly navigate: (path: string) => void;
  readonly focus: () => Promise<void>;
}): NimiAppActivityOpenRegistration {
  const epoch = sessionEpoch;
  return getStudioLocalAppClient().activity.onOpenRequest(async (request) => {
    const draftId = draftIdFromObjectRef(request.objectRef);
    if (!draftId || request.type !== COAUTHOR_ACTIVITY_TYPE) return 'object-unavailable';
    const draft = await input.findDraft(draftId);
    if (!draft || !sessionActive || epoch !== sessionEpoch) return 'object-unavailable';
    input.navigate(`/drafts/${encodeURIComponent(draft.id)}`);
    await input.focus().catch(() => undefined);
    return 'opened';
  });
}
