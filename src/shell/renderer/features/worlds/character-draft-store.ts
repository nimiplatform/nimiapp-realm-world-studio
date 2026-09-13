import { create } from 'zustand';
import type { JsonValue } from '@nimiplatform/sdk/types';
import { getStudioLocalAppClient } from '../../app-shell/studio-platform.js';
import { assertCharacterDraftContext, CHARACTER_FIELDS, type CharacterDraft } from './world-character-model.js';

const PATH = 'world-studio/character-drafts.json';
export const useCharacterDrafts = create<{ drafts: CharacterDraft[]; loaded: boolean; loading: boolean; saving: boolean; error: string | null }>(() => ({ drafts: [], loaded: false, loading: false, saving: false, error: null }));
let chain = Promise.resolve();
let revision = 0;
let saveTimer: ReturnType<typeof setTimeout> | undefined;

export async function loadCharacterDrafts(): Promise<void> {
  if (useCharacterDrafts.getState().loaded || useCharacterDrafts.getState().loading) return;
  useCharacterDrafts.setState({ loading: true, error: null });
  try {
    let value: unknown;
    try { value = (await getStudioLocalAppClient().storage.readJson(PATH)).value; }
    catch (error) { if ((error as { reasonCode?: string }).reasonCode !== 'not-found') throw error; value = []; }
    if (!Array.isArray(value) || !value.every(item => item && typeof item.id === 'string' && typeof item.worldId === 'string' && typeof item.entityId === 'string' && typeof item.entityCreated === 'boolean' && typeof item.saved === 'boolean' && typeof item.updatedAt === 'string' && CHARACTER_FIELDS.every(key => typeof item.form?.[key] === 'string') && (item.proposal === null || CHARACTER_FIELDS.every(key => typeof item.proposal?.[key] === 'string')) && (item.source === null || (item.source?.id === item.id && item.source?.worldId === item.worldId && typeof item.source?.contentHash === 'string')))) throw new Error('Character draft storage is unreadable. Existing data has been preserved.');
    useCharacterDrafts.setState({ drafts: value, loaded: true, loading: false });
  } catch (error) { useCharacterDrafts.setState({ loading: false, error: String(error instanceof Error ? error.message : error) }); }
}

// @nimi-authority: rule.realm-world-studio.scope.r016
export function putCharacterDraft(draft: CharacterDraft): Promise<void> {
  if (!useCharacterDrafts.getState().loaded) return Promise.reject(new Error('Character drafts must load before writing.'));
  try { validateDraftWrite(draft); } catch (error) { return Promise.reject(error); }
  useCharacterDrafts.setState(state => ({ drafts: [draft, ...state.drafts.filter(item => item.id !== draft.id)], saving: true, error: null }));
  return persistCharacterDrafts();
}

export function persistCharacterDrafts(): Promise<void> {
  if (!useCharacterDrafts.getState().loaded) return Promise.reject(new Error('Character drafts must load before writing.'));
  clearTimeout(saveTimer);
  const current = ++revision;
  const data = JSON.parse(JSON.stringify(useCharacterDrafts.getState().drafts)) as JsonValue;
  useCharacterDrafts.setState({ saving: true, error: null });
  const write = chain.then(() => getStudioLocalAppClient().storage.writeJson(PATH, data));
  chain = write.then(() => { if (current === revision) useCharacterDrafts.setState({ saving: false }); }, error => { if (current === revision) useCharacterDrafts.setState({ saving: false, error: String(error instanceof Error ? error.message : error) }); });
  return write.then(() => undefined);
}

export function changeCharacterDraft(draft: CharacterDraft): void {
  validateDraftWrite(draft);
  revision++;
  useCharacterDrafts.setState(state => ({ drafts: [draft, ...state.drafts.filter(item => item.id !== draft.id)], saving: true, error: null }));
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => { void persistCharacterDrafts().catch(() => {}); }, 450);
}

function validateDraftWrite(draft: CharacterDraft): void {
  assertCharacterDraftContext(draft);
  if (useCharacterDrafts.getState().drafts.some(item => item.id === draft.id && item.worldId !== draft.worldId)) throw new Error('CHARACTER_DRAFT_WORLD_MISMATCH');
}
