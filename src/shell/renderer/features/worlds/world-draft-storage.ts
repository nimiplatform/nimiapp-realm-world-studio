import { type StudioScope } from '@renderer/app-shell/studio-scope.js';
import { createNimiAppRecordStore } from '@nimiplatform/kit/core/app-record-storage';
import { extractNimiErrorFields } from '@nimiplatform/sdk/types';
import { getStudioClient } from '../../app-shell/studio-platform.js';
import type { DraftCharacter, WorldContent, WorldDraft, WorldProposal } from './world-draft.js';
import { draftIdFromObjectRef, isStoredWorldActivity, type WorldActivityPublication } from './world-activity-model.js';

export type WorldDraftDocument = {
  drafts: WorldDraft[];
  activityOutbox: WorldActivityPublication[];
};

export class DraftWriteConflict extends Error {
  constructor(readonly draftId: string) { super('The saved draft changed in another connection.'); }
}

export function isDraftStorageConflict(error: unknown): boolean {
  return ['content-conflict', 'already-exists', 'APP_STORAGE_CONTENT_CONFLICT', 'APP_STORAGE_ENTRY_ALREADY_EXISTS']
    .includes(extractNimiErrorFields(error).reasonCode ?? '');
}

export async function readSavedWorldDraft(scope: StudioScope, id: string) {
  assertSession(scope);
  const record = await draftRecords(scope).read(id);
  assertSession(scope);
  return record?.draft ?? null;
}

type WorldDraftRecord = { id: string; draft: WorldDraft | null; activityOutbox: WorldActivityPublication[] };
const PREVIOUS_DRAFT_PATH = 'world-studio/drafts.json';
const RECORD_PREFIX = 'world-studio/drafts';

function assertSession(scope: StudioScope): void {
  scope.signal.throwIfAborted();
  if (getWorldDraftStorageState(scope).sessionEnded) throw new Error('The Nimi session ended; reopen Realm World Studio.');
}

export function endWorldDraftStorageSession(scope: StudioScope): void {
  getWorldDraftStorageState(scope).sessionEnded = true;
}

// @nimi-authority: rule.realm-world-studio.runtime-ai.r014
export async function readWorldDraftDocument(scope: StudioScope): Promise<WorldDraftDocument> {
  assertSession(scope);
  await importPreviousDrafts(scope);
  const records = await draftRecords(scope).list();
  assertSession(scope);
  return projectDocument(records);
}

function projectDocument(records: WorldDraftRecord[]): WorldDraftDocument {
  return {
    drafts: records.flatMap(record => record.draft ? [record.draft] : [])
      .sort((a, b) => b.id.localeCompare(a.id)),
    activityOutbox: records.flatMap(record => record.activityOutbox),
  };
}

function draftRecords(scope: StudioScope) {
  return createNimiAppRecordStore(getStudioClient(scope).storage.assets, RECORD_PREFIX, parseWorldDraftRecord);
}

function importPreviousDrafts(scope: StudioScope): Promise<void> {
  const state = getWorldDraftStorageState(scope);
  if (!state.imported) {
    state.imported = movePreviousDrafts(scope).catch(error => {
      state.imported = undefined;
      throw error;
    });
  }
  return state.imported;
}

async function movePreviousDrafts(scope: StudioScope): Promise<void> {
  const storage = getStudioClient(scope).storage;
  let value: unknown;
  try {
    value = (await storage.readJson(PREVIOUS_DRAFT_PATH)).value;
  } catch (error) {
    if (['not-found', 'APP_STORAGE_ENTRY_NOT_FOUND'].includes(extractNimiErrorFields(error).reasonCode ?? '')) return;
    throw error;
  }
  assertSession(scope);
  assertWorldDraftDocument(value);
  for (const record of recordsById(value).values()) {
    assertSession(scope);
    try {
      await storage.assets.write({ relativePath: `${RECORD_PREFIX}/${encodeURIComponent(record.id)}.json`,
        body: new TextEncoder().encode(JSON.stringify(record)), mediaType: 'application/json', overwrite: false });
    } catch (error) {
      if (!['already-exists', 'APP_STORAGE_ENTRY_ALREADY_EXISTS'].includes(extractNimiErrorFields(error).reasonCode ?? '')) throw error;
      if (!await draftRecords(scope).read(record.id)) throw error;
    }
  }
  assertSession(scope);
  await storage.removeJson(PREVIOUS_DRAFT_PATH);
}

// @nimi-authority: rule.realm-world-studio.runtime-ai.r015
export function updateWorldDraftRecords(scope: StudioScope,
  updates: ReadonlyMap<string, (current: WorldDraftRecord | null) => WorldDraftRecord>,
  onCommit: (record: WorldDraftRecord) => void,
): Promise<WorldDraftRecord[]> {
  return enqueueDraftWrite(scope, async assertCurrent => {
    await importPreviousDrafts(scope);
    assertCurrent();
    const records = draftRecords(scope);
    const committed: WorldDraftRecord[] = [];
    for (const [id, update] of updates) {
      const current = await records.readVersion(id);
      const next = update(current?.record ?? null);
      assertCurrent();
      try { await records.write(next, current?.sha256 ?? null); }
      catch (error) {
        if (isDraftStorageConflict(error)) throw new DraftWriteConflict(id);
        throw error;
      }
      assertCurrent();
      onCommit(next);
      committed.push(next);
    }
    return committed;
  });
}

/** Activity can update several outboxes. Only changed records are written. */
export function updateWorldDraftDocument(scope: StudioScope,
  update: (current: WorldDraftDocument) => WorldDraftDocument,
  isCurrent: () => boolean = () => true,
): Promise<WorldDraftDocument> {
  return enqueueDraftWrite(scope, async assertCurrent => {
    await importPreviousDrafts(scope);
    const records = draftRecords(scope);
    const versions = await records.listVersions();
    const current = projectDocument(versions.map(value => value.record));
    const hashes = new Map(versions.map(value => [value.record.id, value.sha256]));
    assertCurrent();
    const next = update(current);
    assertWorldDraftDocument(next);
    const before = recordsById(current), after = recordsById(next);
    for (const id of new Set([...before.keys(), ...after.keys()])) {
      const record = after.get(id) ?? { id, draft: null, activityOutbox: [] };
      if (JSON.stringify(before.get(id)) === JSON.stringify(record)) continue;
      assertCurrent();
      await records.write(record, hashes.get(id) ?? null);
    }
    assertCurrent();
    return next;
  }, isCurrent);
}

function enqueueDraftWrite<T>(scope: StudioScope, work: (assertCurrent: () => void) => Promise<T>, isCurrent: () => boolean = () => true): Promise<T> {
  const assertCurrent = () => {
    assertSession(scope);
    if (!isCurrent()) throw new Error('The Nimi session ended; reopen Realm World Studio.');
  };
  const write = getWorldDraftStorageState(scope).writeChain.then(() => {
    assertCurrent();
    return work(assertCurrent);
  });
  getWorldDraftStorageState(scope).writeChain = write.catch(() => undefined);
  return write;
}

function recordsById(document: WorldDraftDocument): Map<string, WorldDraftRecord> {
  const records = new Map(document.drafts.map(draft => [draft.id, { id: draft.id, draft, activityOutbox: [] }] as [string, WorldDraftRecord]));
  for (const entry of document.activityOutbox) {
    const id = draftIdFromObjectRef(entry.objectRef)!;
    const record = records.get(id) ?? { id, draft: null, activityOutbox: [] };
    record.activityOutbox.push(entry);
    records.set(id, record);
  }
  return records;
}

function parseWorldDraftRecord(value: unknown): WorldDraftRecord {
  const record = value as WorldDraftRecord | null;
  if (!record || typeof record !== 'object' || Object.keys(record).length !== 3
    || typeof record.id !== 'string' || !draftIdFromObjectRef(`draft:${record.id}`)
    || (record.draft !== null && (!isStoredDraft(record.draft) || record.draft.id !== record.id))
    || !Array.isArray(record.activityOutbox)
    || !record.activityOutbox.every(entry => isStoredWorldActivity(entry) && entry.objectRef === `draft:${record.id}`)
    || new Set(record.activityOutbox.map(entry => entry.key)).size !== record.activityOutbox.length) {
    throw new Error('Saved world draft or review updates are unreadable. Existing storage has been preserved.');
  }
  return record;
}

export function assertWorldDraftDocument(value: unknown): asserts value is WorldDraftDocument {
  const document = value as WorldDraftDocument | null;
  if (!document || Array.isArray(document)
    || Object.keys(document).length !== 2
    || !Array.isArray(document.drafts) || !document.drafts.every(isStoredDraft)
    || new Set(document.drafts.map(draft => draft.id)).size !== document.drafts.length
    || !Array.isArray(document.activityOutbox) || !document.activityOutbox.every(isStoredWorldActivity)
    || new Set(document.activityOutbox.map(entry => entry.key)).size !== document.activityOutbox.length) {
    throw new Error('Saved world drafts or review updates are unreadable. Existing storage has been preserved.');
  }
}

function isStoredDraft(value: unknown): value is WorldDraft {
  if (!value || typeof value !== 'object') return false;
  const draft = value as WorldDraft;
  return hasStringFields(value, ['id', 'brief', 'createdAt', 'updatedAt']) && !!draftIdFromObjectRef(`draft:${draft.id}`) && isStoredContent(value)
    && ['private', 'unlisted', 'public'].includes(draft.visibility)
    && (draft.source === null || Boolean(draft.source?.id && draft.source?.contentHash && typeof draft.source?.name === 'string'))
    && (draft.savedWorld === null || Boolean(draft.savedWorld?.id && draft.savedWorld?.core))
    && (draft.proposal === null || isStoredProposal(draft.proposal));
}

function hasStringFields(value: unknown, keys: readonly string[]): boolean {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value)
    && keys.every(key => typeof (value as Record<string, unknown>)[key] === 'string'));
}

function isStoredCharacter(value: unknown): value is DraftCharacter {
  return hasStringFields(value, ['id', 'name', 'role', 'summary', 'desire', 'flaw', 'voice']);
}

function isStoredContent(value: unknown): value is WorldContent {
  if (!hasStringFields(value, ['name', 'summary', 'genre', 'era', 'setting'])) return false;
  const content = value as WorldContent;
  return Array.isArray(content.rules) && content.rules.every(rule => hasStringFields(rule, ['id', 'name', 'statement']) && (rule.systemRef === undefined || typeof rule.systemRef === 'string'))
    && Array.isArray(content.places) && content.places.every(place => hasStringFields(place, ['id', 'name', 'summary']))
    && Array.isArray(content.characters) && content.characters.every(isStoredCharacter);
}

function isStoredProposal(value: unknown): value is WorldProposal {
  if (!hasStringFields(value, ['task', 'traceId', 'sourceUpdatedAt'])) return false;
  const proposal = value as WorldProposal;
  if (proposal.generatedAt !== undefined && typeof proposal.generatedAt !== 'string') return false;
  if (!Array.isArray(proposal.accepted) || !proposal.accepted.every(key => typeof key === 'string')
    || !Array.isArray(proposal.notes) || !proposal.notes.every(note => hasStringFields(note, ['title', 'detail', 'suggestion']))) return false;
  if (proposal.task === 'develop') return isStoredContent(proposal.content);
  if (proposal.task === 'cast') return Array.isArray(proposal.characters) && proposal.characters.every(isStoredCharacter);
  return proposal.task === 'review';
}

function createWorldDraftStorageState() {
  const writeChain: Promise<unknown> = Promise.resolve();
  const sessionEnded = false;
  return { writeChain, sessionEnded, imported: undefined as Promise<void> | undefined };
}
const states = new WeakMap<StudioScope, ReturnType<typeof createWorldDraftStorageState>>();
export function getWorldDraftStorageState(scope: StudioScope) {
  let state = states.get(scope);
  if (!state) { state = createWorldDraftStorageState(); states.set(scope, state); }
  return state;
}
