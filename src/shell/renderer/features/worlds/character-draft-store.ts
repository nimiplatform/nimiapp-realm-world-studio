import { useStudioScope, type StudioScope } from '@renderer/app-shell/studio-scope.js';
import { create } from 'zustand';
import type { JsonValue } from '@nimiplatform/sdk/types';
import { getStudioClient } from '../../app-shell/studio-platform.js';
import { assertCharacterDraftContext, CHARACTER_FIELDS, type CharacterDraft } from './world-character-model.js';

const PATH = 'world-studio/character-drafts.json';

function assertSession(scope: StudioScope): void {
  scope.signal.throwIfAborted();
  if (getCharacterDraftState(scope).sessionEnded) throw new Error('The Nimi session ended; reopen Realm World Studio.');
}

export async function loadCharacterDrafts(scope: StudioScope): Promise<void> {
  if (getCharacterDraftState(scope).sessionEnded) return;
  if (getCharacterDraftState(scope).store.getState().loaded || getCharacterDraftState(scope).store.getState().loading) return;
  getCharacterDraftState(scope).store.setState({ loading: true, error: null });
  try {
    let value: unknown;
    try { value = (await getStudioClient(scope).storage.readJson(PATH)).value; }
    catch (error) { if (!['not-found', 'APP_STORAGE_ENTRY_NOT_FOUND'].includes(String((error as { reasonCode?: string }).reasonCode))) throw error; value = []; }
    if (!Array.isArray(value) || !value.every(item => item && typeof item.id === 'string' && typeof item.worldId === 'string' && typeof item.entityId === 'string' && typeof item.entityCreated === 'boolean' && typeof item.saved === 'boolean' && typeof item.updatedAt === 'string' && CHARACTER_FIELDS.every(key => typeof item.form?.[key] === 'string') && (item.proposal === null || CHARACTER_FIELDS.every(key => typeof item.proposal?.[key] === 'string')) && (item.source === null || (item.source?.id === item.id && item.source?.worldId === item.worldId && typeof item.source?.contentHash === 'string')))) throw new Error('Character draft storage is unreadable. Existing data has been preserved.');
    assertSession(scope);
    getCharacterDraftState(scope).store.setState({ drafts: value, loaded: true, loading: false });
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
  const data = JSON.parse(JSON.stringify(getCharacterDraftState(scope).store.getState().drafts)) as JsonValue;
  getCharacterDraftState(scope).store.setState({ saving: true, error: null });
  const write = getCharacterDraftState(scope).chain.then(async () => {
    assertSession(scope);
    await getStudioClient(scope).storage.writeJson(PATH, data);
    assertSession(scope);
  });
  getCharacterDraftState(scope).chain = write.then(() => { if (current === getCharacterDraftState(scope).revision) getCharacterDraftState(scope).store.setState({ saving: false }); }, error => { if (current === getCharacterDraftState(scope).revision) getCharacterDraftState(scope).store.setState({ saving: false, error: String(error instanceof Error ? error.message : error) }); });
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

function validateDraftWrite(scope: StudioScope, draft: CharacterDraft): void {
  assertCharacterDraftContext(draft);
  if (getCharacterDraftState(scope).store.getState().drafts.some(item => item.id === draft.id && item.worldId !== draft.worldId)) throw new Error('CHARACTER_DRAFT_WORLD_MISMATCH');
}

type CharacterDraftState = { drafts: CharacterDraft[]; loaded: boolean; loading: boolean; saving: boolean; error: string | null };
function createCharacterDraftState() {
  const useCharacterDrafts = create<{ drafts: CharacterDraft[]; loaded: boolean; loading: boolean; saving: boolean; error: string | null }>(() => ({ drafts: [], loaded: false, loading: false, saving: false, error: null }));
  const chain = Promise.resolve();
  const revision = 0;
  const saveTimer = undefined as ReturnType<typeof setTimeout> | undefined;
  const sessionEnded = false;
  return { store: useCharacterDrafts, chain, revision, saveTimer, sessionEnded };
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
