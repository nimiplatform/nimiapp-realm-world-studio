import { type StudioScope } from '@renderer/app-shell/studio-scope.js';
import type { NimiAppActivityOpenRegistration } from '@nimiplatform/sdk/app';
import { getStudioClient } from '../../app-shell/studio-platform.js';
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

// null means the storage failure prevents determining an accurate count.

function serialized<T>(scope: StudioScope, task: () => Promise<T>): Promise<T> {
  const run = getWorldActivityState(scope).queue.then(task, task);
  getWorldActivityState(scope).queue = run.then(() => undefined, () => undefined);
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

function reportUnsynced(scope: StudioScope, count: number | null): void {
  getWorldActivityState(scope).unsynced = count;
  for (const listener of getWorldActivityState(scope).syncListeners) listener(count);
}

function clearRetry(scope: StudioScope): void {
  if (getWorldActivityState(scope).retryTimer !== undefined) clearTimeout(getWorldActivityState(scope).retryTimer);
  getWorldActivityState(scope).retryTimer = undefined;
}

function scheduleRetry(scope: StudioScope, epoch: number): void {
  if (!getWorldActivityState(scope).sessionActive || epoch !== getWorldActivityState(scope).sessionEpoch) return;
  clearRetry(scope);
  getWorldActivityState(scope).retryTimer = setTimeout(() => { void flushWorldActivity(scope).catch(() => undefined); }, getWorldActivityState(scope).retryDelayMs);
  getWorldActivityState(scope).retryDelayMs = Math.min(getWorldActivityState(scope).retryDelayMs * 2, 5 * 60_000);
}

/** Reports, after every publication attempt, how many publications are still not synced. */
export function subscribeWorldActivitySync(scope: StudioScope, listener: (unsynced: number | null) => void): () => void {
  getWorldActivityState(scope).syncListeners.add(listener);
  listener(getWorldActivityState(scope).unsynced);
  return () => { getWorldActivityState(scope).syncListeners.delete(listener); };
}

/** Starts activity work for the session that is bound now. */
export function beginWorldActivitySession(scope: StudioScope): void {
  endWorldActivitySession(scope);
  getWorldActivityState(scope).sessionActive = true;
}

/** Ends the session's activity work: in-flight steps stop before their next publication or write. */
export function endWorldActivitySession(scope: StudioScope): void {
  getWorldActivityState(scope).sessionEpoch += 1;
  getWorldActivityState(scope).sessionActive = false;
  getWorldActivityState(scope).pendingPublications = [];
  clearRetry(scope);
  getWorldActivityState(scope).retryDelayMs = 15_000;
  reportUnsynced(scope, 0);
}

/**
 * Reconciled candidates remain queued if their outbox write fails. Lifecycle
 * changes enter the durable outbox atomically with their draft save instead.
 */
export function queueWorldActivity(scope: StudioScope, entries: readonly WorldActivityPublication[]): Promise<void> {
  if (!getWorldActivityState(scope).sessionActive) {
    logRendererEvent({ level: 'info', area: 'world-activity', message: 'action:activity-session-ended', details: { entries: entries.length } });
    return Promise.resolve();
  }
  getWorldActivityState(scope).pendingPublications = mergeWorldActivities(getWorldActivityState(scope).pendingPublications, entries);
  return flushWorldActivity(scope).then(() => undefined);
}

/** Publishes every outbox entry; resolves with the number still not synced. */
export function flushWorldActivity(scope: StudioScope): Promise<number | null> {
  if (!getWorldActivityState(scope).sessionActive) return Promise.resolve(getWorldActivityState(scope).unsynced);
  const epoch = getWorldActivityState(scope).sessionEpoch;
  return serialized(scope, () => flush(scope, epoch));
}

/** The user's explicit retry: publishes now and restarts the retry backoff. */
export function retryWorldActivity(scope: StudioScope): Promise<number | null> {
  getWorldActivityState(scope).retryDelayMs = 15_000;
  return flushWorldActivity(scope);
}

async function flush(scope: StudioScope, epoch: number): Promise<number | null> {
  if (epoch !== getWorldActivityState(scope).sessionEpoch) return getWorldActivityState(scope).unsynced;
  clearRetry(scope);
  try {
    const pending = getWorldActivityState(scope).pendingPublications;
    const isCurrent = () => !scope.signal.aborted && getWorldActivityState(scope).sessionActive && epoch === getWorldActivityState(scope).sessionEpoch;
    const document = pending.length
      ? await updateWorldDraftDocument(scope, current => ({
        ...current, activityOutbox: mergeWorldActivities(current.activityOutbox, pending),
      }), isCurrent)
      : await readWorldDraftDocument(scope);
    if (!isCurrent()) return getWorldActivityState(scope).unsynced;
    getWorldActivityState(scope).pendingPublications = getWorldActivityState(scope).pendingPublications.filter(entry => !pending.includes(entry));
    const outbox = document.activityOutbox;
    const done = new Set<string>();
    for (const entry of outbox) {
      if (epoch !== getWorldActivityState(scope).sessionEpoch) return getWorldActivityState(scope).unsynced;
      try {
        await getStudioClient(scope).activity.put(entry);
        done.add(identity(entry));
      } catch (error) {
        if (settled(error)) done.add(identity(entry));
        else logRendererEvent({ level: 'warn', area: 'world-activity', message: 'action:activity-publication-failed', details: { key: entry.key, error: describeError(error) } });
      }
    }
    if (epoch !== getWorldActivityState(scope).sessionEpoch) return getWorldActivityState(scope).unsynced;
    let remaining = outbox.length - done.size;
    if (done.size) {
      // Only the handled entries leave the outbox; anything queued meanwhile stays.
      const latest = await updateWorldDraftDocument(scope, current => ({
        ...current, activityOutbox: current.activityOutbox.filter(entry => !done.has(identity(entry))),
      }), isCurrent);
      if (!isCurrent()) return getWorldActivityState(scope).unsynced;
      remaining = latest.activityOutbox.length;
    }
    reportUnsynced(scope, remaining);
    if (remaining) scheduleRetry(scope, epoch);
    else getWorldActivityState(scope).retryDelayMs = 15_000;
    return remaining;
  } catch (error) {
    if (epoch !== getWorldActivityState(scope).sessionEpoch) return getWorldActivityState(scope).unsynced;
    logRendererEvent({ level: 'warn', area: 'world-activity', message: 'action:activity-outbox-unavailable', details: { error: describeError(error) } });
    reportUnsynced(scope, null);
    scheduleRetry(scope, epoch);
    return getWorldActivityState(scope).unsynced;
  }
}

/** Republishes every stored candidate that still awaits review. */
export function reconcileWorldActivity(scope: StudioScope, drafts: readonly WorldDraft[]): Promise<void> {
  const open = drafts
    .filter((draft) => draft.proposal && !draft.savedWorld)
    .map((draft) => coauthorActivity(draft, draft.proposal!, 'open', draft.proposal!.generatedAt ?? draft.proposal!.sourceUpdatedAt));
  return open.length ? queueWorldActivity(scope, open) : flushWorldActivity(scope).then(() => undefined);
}

/**
 * Confirms an open request only after Studio has navigated into the
 * requested draft of the current account.
 */
export function registerWorldActivityOpenHandler(scope: StudioScope, input: {
  readonly findDraft: (draftId: string) => Promise<WorldDraft | undefined>;
  readonly navigate: (path: string) => void;
  readonly focus?: () => Promise<void>;
}): NimiAppActivityOpenRegistration {
  const epoch = getWorldActivityState(scope).sessionEpoch;
  return getStudioClient(scope).activity.onOpenRequest(async (request) => {
    const draftId = draftIdFromObjectRef(request.objectRef);
    if (!draftId || request.type !== COAUTHOR_ACTIVITY_TYPE) return 'object-unavailable';
    const draft = await input.findDraft(draftId);
    if (scope.signal.aborted || !draft || !getWorldActivityState(scope).sessionActive || epoch !== getWorldActivityState(scope).sessionEpoch) return 'object-unavailable';
    input.navigate(`/drafts/${encodeURIComponent(draft.id)}`);
    await input.focus?.().catch(() => undefined);
    return 'opened';
  });
}

function createWorldActivityState() {
  const pendingPublications: WorldActivityPublication[] = [];
  const queue: Promise<unknown> = Promise.resolve();
  const sessionEpoch = 0;
  const sessionActive = false;
  const retryTimer = undefined as ReturnType<typeof setTimeout> | undefined;
  const retryDelayMs = 15_000;
  const unsynced: number | null = 0;
  const syncListeners = new Set<(unsynced: number | null) => void>();
  return { pendingPublications, queue, sessionEpoch, sessionActive, retryTimer, retryDelayMs, unsynced: unsynced as number | null, syncListeners };
}
const states = new WeakMap<StudioScope, ReturnType<typeof createWorldActivityState>>();
export function getWorldActivityState(scope: StudioScope) {
  let state = states.get(scope);
  if (!state) { state = createWorldActivityState(); states.set(scope, state); }
  return state;
}
