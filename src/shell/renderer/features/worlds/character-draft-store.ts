import { useStudioScope, type StudioScope } from '@renderer/app-shell/studio-scope.js';
import { create } from 'zustand';
import { createNimiAppRecordStore } from '@nimiplatform/kit/core/app-record-storage';
import { extractNimiErrorFields } from '@nimiplatform/sdk/types';
import { DraftWriteConflict, isDraftStorageConflict } from './world-draft-storage.js';
import { getStudioClient } from '../../app-shell/studio-platform.js';
import { assertCharacterDraftContext, CHARACTER_FIELDS, type CharacterDraft } from './world-character-model.js';

const PATH = 'world-studio/character-drafts.json';

const PREFIX = 'world-studio/character-drafts';

function parseCharacterDraft(value: unknown): CharacterDraft {
  const item = value as CharacterDraft | null;
  if (!(item && typeof item.id === 'string' && typeof item.worldId === 'string' && typeof item.entityId === 'string' && typeof item.entityCreated === 'boolean' && typeof item.saved === 'boolean' && typeof item.updatedAt === 'string' && CHARACTER_FIELDS.every(key => typeof item.form?.[key] === 'string') && (item.proposal === null || CHARACTER_FIELDS.every(key => typeof item.proposal?.[key] === 'string')) && (item.source === null || (item.source?.id === item.id && item.source?.worldId === item.worldId && typeof item.source?.contentHash === 'string')))) {
    throw new Error('Character draft storage is unreadable. Existing data has been preserved.');
  }
  assertCharacterDraftContext(item);
  return item;
}

function characterRecords(scope: StudioScope) {
  return createNimiAppRecordStore(getStudioClient(scope).storage.assets, PREFIX, parseCharacterDraft);
}

async function movePreviousDrafts(scope: StudioScope): Promise<void> {
  const storage = getStudioClient(scope).storage;
  let value: unknown;
  try { value = (await storage.readJson(PATH)).value; }
  catch (error) {
    if (['not-found', 'APP_STORAGE_ENTRY_NOT_FOUND'].includes(extractNimiErrorFields(error).reasonCode ?? '')) return;
    throw error;
  }
  assertSession(scope);
  if (!Array.isArray(value)) throw new Error('Character draft storage is unreadable.');
  const drafts = value.map(parseCharacterDraft);
  if (new Set(drafts.map(item => item.id)).size !== drafts.length) throw new Error('Character draft IDs are duplicated.');
  const records = characterRecords(scope);
  for (const draft of drafts) {
    assertSession(scope);
    try { await records.write(draft, null); }
    catch (error) {
      if (!isDraftStorageConflict(error) || !await records.read(draft.id)) throw error;
    }
  }
  assertSession(scope);
  await storage.removeJson(PATH);
}

function assertSession(scope: StudioScope): void {
  scope.signal.throwIfAborted();
  if (getCharacterDraftState(scope).sessionEnded) throw new Error('The Nimi session ended; reopen Realm World Studio.');
}

export async function loadCharacterDrafts(scope: StudioScope): Promise<void> {
  if (getCharacterDraftState(scope).sessionEnded) return;
  if (getCharacterDraftState(scope).store.getState().loaded || getCharacterDraftState(scope).store.getState().loading) return;
  getCharacterDraftState(scope).store.setState({ loading: true, error: null });
  try {
    await movePreviousDrafts(scope);
    const drafts = await characterRecords(scope).list();
    assertSession(scope);
    const state = getCharacterDraftState(scope);
    state.savedDrafts = new Map(drafts.map(draft => [draft.id, draft]));
    state.store.setState({ drafts, loaded: true, loading: false });
  } catch (error) { getCharacterDraftState(scope).store.setState({ loading: false, error: String(error instanceof Error ? error.message : error) }); }
}

// @nimi-authority: rule.realm-world-studio.scope.r016
export function putCharacterDraft(scope: StudioScope, draft: CharacterDraft): Promise<void> {
  if (getCharacterDraftState(scope).sessionEnded) return Promise.reject(new Error('The Nimi session ended; reopen Realm World Studio.'));
  if (!getCharacterDraftState(scope).store.getState().loaded) return Promise.reject(new Error('Character drafts must load before writing.'));
  try { validateDraftWrite(scope, draft); } catch (error) { return Promise.reject(error); }
  getCharacterDraftState(scope).store.setState(state => ({ drafts: [draft, ...state.drafts.filter(item => item.id !== draft.id)], saving: true, error: null }));
  return persistCharacterDrafts(scope);
}

export function persistCharacterDrafts(scope: StudioScope): Promise<void> {
  if (getCharacterDraftState(scope).sessionEnded) return Promise.reject(new Error('The Nimi session ended; reopen Realm World Studio.'));
  if (!getCharacterDraftState(scope).store.getState().loaded) return Promise.reject(new Error('Character drafts must load before writing.'));
  clearTimeout(getCharacterDraftState(scope).saveTimer);
  const current = ++getCharacterDraftState(scope).revision;
  const state = getCharacterDraftState(scope);
  const edits = state.store.getState().drafts.filter(draft => draft !== state.savedDrafts.get(draft.id));
  state.store.setState({ saving: true, error: null, conflictId: undefined });
  const write = getCharacterDraftState(scope).chain.then(async () => {
    assertSession(scope);
    const records = characterRecords(scope);
    for (const draft of edits) {
      const saved = await records.readVersion(draft.id);
      assertSession(scope);
      if (JSON.stringify(saved?.record ?? null) !== JSON.stringify(state.savedDrafts.get(draft.id) ?? null)) {
        throw new DraftWriteConflict(draft.id);
      }
      try { await records.write(draft, saved?.sha256 ?? null); }
      catch (error) {
        if (isDraftStorageConflict(error)) throw new DraftWriteConflict(draft.id);
        throw error;
      }
      assertSession(scope);
      state.savedDrafts.set(draft.id, draft);
    }
  });
  getCharacterDraftState(scope).chain = write.then(() => { if (current === getCharacterDraftState(scope).revision) getCharacterDraftState(scope).store.setState({ saving: false }); }, error => { if (current === getCharacterDraftState(scope).revision) getCharacterDraftState(scope).store.setState({ saving: false, error: String(error instanceof Error ? error.message : error), conflictId: error instanceof DraftWriteConflict ? error.draftId : undefined }); });
  return write.then(() => undefined);
}

export function changeCharacterDraft(scope: StudioScope, draft: CharacterDraft): void {
  if (getCharacterDraftState(scope).sessionEnded) return;
  validateDraftWrite(scope, draft);
  getCharacterDraftState(scope).revision++;
  getCharacterDraftState(scope).store.setState(state => ({ drafts: [draft, ...state.drafts.filter(item => item.id !== draft.id)], saving: true, error: null }));
  clearTimeout(getCharacterDraftState(scope).saveTimer);
  getCharacterDraftState(scope).saveTimer = setTimeout(() => { void persistCharacterDrafts(scope).catch(() => {}); }, 450);
}

/** Stops the ended session's pending character draft saves. */
export function endCharacterDraftSession(scope: StudioScope): void {
  getCharacterDraftState(scope).sessionEnded = true;
  getCharacterDraftState(scope).revision++;
  clearTimeout(getCharacterDraftState(scope).saveTimer);
}

export async function reloadConflictingCharacterDraft(scope: StudioScope, id: string): Promise<void> {
  const state = getCharacterDraftState(scope);
  try {
    const draft = await characterRecords(scope).read(id);
    assertSession(scope);
    if (state.store.getState().conflictId !== id) return;
    if (draft) state.savedDrafts.set(id, draft);
    else state.savedDrafts.delete(id);
    state.store.setState(view => ({ drafts: [...(draft ? [draft] : []), ...view.drafts.filter(item => item.id !== id)], error: null, conflictId: undefined }));
  } catch (error) {
    if (!state.sessionEnded) state.store.setState({ error: String(error instanceof Error ? error.message : error) });
  }
}

function validateDraftWrite(scope: StudioScope, draft: CharacterDraft): void {
  assertCharacterDraftContext(draft);
  if (getCharacterDraftState(scope).store.getState().drafts.some(item => item.id === draft.id && item.worldId !== draft.worldId)) throw new Error('CHARACTER_DRAFT_WORLD_MISMATCH');
}

type CharacterDraftState = { drafts: CharacterDraft[]; loaded: boolean; loading: boolean; saving: boolean; error: string | null; conflictId?: string };
function createCharacterDraftState() {
  const useCharacterDrafts = create<CharacterDraftState>(() => ({ drafts: [], loaded: false, loading: false, saving: false, error: null }));
  const chain = Promise.resolve();
  const revision = 0;
  const saveTimer = undefined as ReturnType<typeof setTimeout> | undefined;
  const sessionEnded = false;
  return { store: useCharacterDrafts, chain, revision, saveTimer, sessionEnded, savedDrafts: new Map<string, CharacterDraft>() };
}
const states = new WeakMap<StudioScope, ReturnType<typeof createCharacterDraftState>>();
export function getCharacterDraftState(scope: StudioScope) {
  let state = states.get(scope);
  if (!state) { state = createCharacterDraftState(); states.set(scope, state); }
  return state;
}
export function useCharacterDrafts<T = CharacterDraftState>(selector: (state: CharacterDraftState) => T = state => state as unknown as T): T {
  const scope = useStudioScope();
  return getCharacterDraftState(scope).store(selector);
}
