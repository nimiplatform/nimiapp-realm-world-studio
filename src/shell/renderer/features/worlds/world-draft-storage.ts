import { type StudioScope } from '@renderer/app-shell/studio-scope.js';
import type { JsonValue } from '@nimiplatform/sdk/types';
import { getStudioClient } from '../../app-shell/studio-platform.js';
import type { DraftCharacter, WorldContent, WorldDraft, WorldProposal } from './world-draft.js';
import { isStoredWorldActivity, type WorldActivityPublication } from './world-activity-model.js';

export type WorldDraftDocument = {
  drafts: WorldDraft[];
  activityOutbox: WorldActivityPublication[];
};

const DRAFT_PATH = 'world-studio/drafts.json';

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
  let value: unknown;
  try {
    value = (await getStudioClient(scope).storage.readJson(DRAFT_PATH)).value;
  } catch (error) {
    if (!['not-found', 'APP_STORAGE_ENTRY_NOT_FOUND'].includes(String((error as { reasonCode?: string }).reasonCode))) throw error;
    value = { drafts: [], activityOutbox: [] };
  }
  assertSession(scope);
  assertWorldDraftDocument(value);
  return value;
}

// @nimi-authority: rule.realm-world-studio.runtime-ai.r015
/** One serialized write commits the draft and its pending publications together. */
export function updateWorldDraftDocument(scope: StudioScope,
  update: (current: WorldDraftDocument) => WorldDraftDocument,
  isCurrent: () => boolean = () => true,
): Promise<WorldDraftDocument> {
  const assertCurrent = () => {
    assertSession(scope);
    if (!isCurrent()) throw new Error('The Nimi session ended; reopen Realm World Studio.');
  };
  const write = getWorldDraftStorageState(scope).writeChain.then(async () => {
    assertCurrent();
    const current = await readWorldDraftDocument(scope);
    assertCurrent();
    const next = update(current);
    assertWorldDraftDocument(next);
    await getStudioClient(scope).storage.writeJson(DRAFT_PATH, JSON.parse(JSON.stringify(next)) as JsonValue);
    assertCurrent();
    return next;
  });
  getWorldDraftStorageState(scope).writeChain = write.catch(() => undefined);
  return write;
}

export function assertWorldDraftDocument(value: unknown): asserts value is WorldDraftDocument {
  const document = value as WorldDraftDocument | null;
  if (!document || Array.isArray(document)
    || Object.keys(document).length !== 2
    || !Array.isArray(document.drafts) || !document.drafts.every(isStoredDraft)
    || !Array.isArray(document.activityOutbox) || !document.activityOutbox.every(isStoredWorldActivity)
    || new Set(document.activityOutbox.map(entry => entry.key)).size !== document.activityOutbox.length) {
    throw new Error('Saved world drafts or review updates are unreadable. Existing storage has been preserved.');
  }
}

function isStoredDraft(value: unknown): value is WorldDraft {
  if (!value || typeof value !== 'object') return false;
  const draft = value as WorldDraft;
  return hasStringFields(value, ['id', 'brief', 'createdAt', 'updatedAt']) && isStoredContent(value)
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
  return { writeChain, sessionEnded };
}
const states = new WeakMap<StudioScope, ReturnType<typeof createWorldDraftStorageState>>();
export function getWorldDraftStorageState(scope: StudioScope) {
  let state = states.get(scope);
  if (!state) { state = createWorldDraftStorageState(); states.set(scope, state); }
  return state;
}
