import { create } from 'zustand';
import type { JsonValue } from '@nimiplatform/sdk/types';
import { getStudioLocalAppClient } from '../../app-shell/studio-platform.js';
import { createWorldDraft, type DraftCharacter, type WorldContent, type WorldDraft, type WorldProposal, type WorldRecord } from './world-draft.js';

const DRAFT_PATH = 'world-studio/drafts.json';
type DraftState = {
  drafts: WorldDraft[]; loaded: boolean; loading: boolean; saving: boolean; error: string | null;
};
export const useWorldDrafts = create<DraftState>(() => ({ drafts: [], loaded: false, loading: false, saving: false, error: null }));
let writeChain = Promise.resolve();
let revision = 0;
let saveTimer: ReturnType<typeof setTimeout> | undefined;

function errorText(error: unknown): string { return error instanceof Error ? error.message : String(error); }

// @nimi-authority: rule.realm-world-studio.runtime-ai.r014
export async function loadWorldDrafts(): Promise<void> {
  if (useWorldDrafts.getState().loaded || useWorldDrafts.getState().loading) return;
  useWorldDrafts.setState({ loading: true, error: null });
  try {
    let value: unknown;
    try { value = (await getStudioLocalAppClient().storage.readJson(DRAFT_PATH)).value; }
    catch (error) {
      if ((error as { reasonCode?: string }).reasonCode !== 'not-found') throw error;
      value = [];
    }
    if (!Array.isArray(value) || !value.every(isStoredDraft)) throw new Error('Saved world drafts are unreadable. Existing storage has been preserved.');
    useWorldDrafts.setState({ drafts: value, loaded: true, loading: false });
  } catch (error) { useWorldDrafts.setState({ loading: false, error: errorText(error) }); }
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
  if (!Array.isArray(proposal.accepted) || !proposal.accepted.every(key => typeof key === 'string')
    || !Array.isArray(proposal.notes) || !proposal.notes.every(note => hasStringFields(note, ['title', 'detail', 'suggestion']))) return false;
  if (proposal.task === 'develop') return isStoredContent(proposal.content);
  if (proposal.task === 'cast') return Array.isArray(proposal.characters) && proposal.characters.every(isStoredCharacter);
  return proposal.task === 'review';
}

export function persistWorldDrafts(): Promise<void> {
  if (!useWorldDrafts.getState().loaded) return Promise.reject(new Error('Draft storage has not loaded.'));
  clearTimeout(saveTimer);
  const currentRevision = ++revision;
  useWorldDrafts.setState({ saving: true, error: null });
  const data = JSON.parse(JSON.stringify(useWorldDrafts.getState().drafts)) as JsonValue;
  const write = writeChain.then(async () => {
    await getStudioLocalAppClient().storage.writeJson(DRAFT_PATH, data);
    if (currentRevision === revision) useWorldDrafts.setState({ saving: false, error: null });
  });
  writeChain = write.catch(error => {
    if (currentRevision === revision) useWorldDrafts.setState({ saving: false, error: errorText(error) });
  });
  return write;
}

export function addWorldDraft(brief = '', source: WorldRecord | null = null): WorldDraft {
  if (!useWorldDrafts.getState().loaded) throw new Error('Draft storage has not loaded.');
  const draft = createWorldDraft(brief, source);
  useWorldDrafts.setState(state => ({ drafts: [draft, ...state.drafts] }));
  void persistWorldDrafts().catch(() => {});
  return draft;
}

export function updateWorldDraft(id: string, patch: Partial<WorldDraft>): void {
  revision++;
  useWorldDrafts.setState(state => ({ saving: true, drafts: state.drafts.map(draft => draft.id === id ? { ...draft, ...patch, id, updatedAt: Object.keys(patch).some(key => key !== 'proposal') ? new Date().toISOString() : draft.updatedAt } : draft) }));
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => { void persistWorldDrafts().catch(() => {}); }, 450);
}

export async function removeWorldDraft(id: string): Promise<void> {
  const removed = useWorldDrafts.getState().drafts.find(draft => draft.id === id);
  useWorldDrafts.setState(state => ({ drafts: state.drafts.filter(draft => draft.id !== id) }));
  try { await persistWorldDrafts(); }
  catch (error) {
    if (removed) useWorldDrafts.setState(state => ({ drafts: [...state.drafts, removed] }));
    throw error;
  }
}
