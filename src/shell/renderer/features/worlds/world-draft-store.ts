import { useStudioScope, type StudioScope } from '@renderer/app-shell/studio-scope.js';
import { create } from 'zustand';
import { createWorldDraft, type WorldDraft, type WorldRecord } from './world-draft.js';
import { coauthorActivity, draftIdFromObjectRef, mergeWorldActivities, type WorldActivityPublication } from './world-activity-model.js';
import { flushWorldActivity } from './world-activity.js';
import { DraftWriteConflict, endWorldDraftStorageSession, readSavedWorldDraft, readWorldDraftDocument, updateWorldDraftRecords } from './world-draft-storage.js';

type DraftState = {
  drafts: WorldDraft[]; loaded: boolean; loading: boolean; saving: boolean; error: string | null; conflictId?: string;
};

function errorText(error: unknown): string { return error instanceof Error ? error.message : String(error); }

// @nimi-authority: rule.realm-world-studio.runtime-ai.r014
export async function loadWorldDrafts(scope: StudioScope): Promise<void> {
  if (getWorldDraftState(scope).sessionEnded) return;
  if (getWorldDraftState(scope).store.getState().loaded || getWorldDraftState(scope).store.getState().loading) return;
  getWorldDraftState(scope).store.setState({ loading: true, error: null });
  try {
    const document = await readWorldDraftDocument(scope);
    const state = getWorldDraftState(scope);
    state.savedDrafts = new Map(document.drafts.map(draft => [draft.id, draft]));
    state.store.setState({ drafts: document.drafts, loaded: true, loading: false });
  } catch (error) { getWorldDraftState(scope).store.setState({ loading: false, error: errorText(error) }); }
}

// @nimi-authority: rule.realm-world-studio.runtime-ai.r015
/**
 * Stages publications in the same document write as their draft changes.
 * Failed writes retain both changes for retry and publish nothing.
 */
export function publishAfterDraftSave(scope: StudioScope, entries: readonly WorldActivityPublication[]): void {
  if (getWorldDraftState(scope).sessionEnded || !entries.length) return;
  getWorldDraftState(scope).pendingPublications = mergeWorldActivities(getWorldDraftState(scope).pendingPublications, entries);
}

export function persistWorldDrafts(scope: StudioScope): Promise<void> {
  return saveWorldDrafts(scope);
}

async function saveWorldDrafts(scope: StudioScope, extraPublications: readonly WorldActivityPublication[] = [], onlyId?: string): Promise<void> {
  const state = getWorldDraftState(scope);
  if (state.sessionEnded) throw new Error('The Nimi session ended; reopen Realm World Studio.');
  if (!state.store.getState().loaded) throw new Error('Draft storage has not loaded.');
  if (!onlyId) clearTimeout(state.saveTimer);
  const currentRevision = ++state.revision;
  const drafts = new Map(state.store.getState().drafts.map(draft => [draft.id, draft]));
  const edits = new Set(onlyId ? [onlyId] : [...drafts.keys(), ...state.savedDrafts.keys()]);
  if (!onlyId) {
    for (const id of edits) if (drafts.get(id) === state.savedDrafts.get(id)) edits.delete(id);
  }
  const publications = [...state.pendingPublications, ...extraPublications];
  const ids = new Set(edits);
  for (const entry of publications) {
    const id = draftIdFromObjectRef(entry.objectRef);
    if (id && (!onlyId || id === onlyId)) ids.add(id);
  }
  state.store.setState({ saving: true, error: null, conflictId: undefined });
  try {
    const records = await updateWorldDraftRecords(scope, new Map([...ids].map(id => [id, current => {
      if (edits.has(id) && JSON.stringify(current?.draft ?? null) !== JSON.stringify(state.savedDrafts.get(id) ?? null)) {
        throw new DraftWriteConflict(id);
      }
      return {
        id, draft: edits.has(id) ? drafts.get(id) ?? null : current?.draft ?? null,
        activityOutbox: mergeWorldActivities(current?.activityOutbox ?? [], publications.filter(entry => draftIdFromObjectRef(entry.objectRef) === id)),
      };
    }])), ({ id, draft }) => {
      if (edits.has(id)) {
        if (draft) state.savedDrafts.set(id, draft);
        else state.savedDrafts.delete(id);
      }
      state.pendingPublications = state.pendingPublications.filter(entry => !publications.includes(entry)
        || draftIdFromObjectRef(entry.objectRef) !== id);
    });
    if (currentRevision === state.revision) state.store.setState({ saving: false, error: null });
    if (records.some(record => record.activityOutbox.length)) void flushWorldActivity(scope).catch(() => undefined);
  } catch (error) {
    if (currentRevision === state.revision) state.store.setState({ saving: false, error: errorText(error), conflictId: error instanceof DraftWriteConflict ? error.draftId : undefined });
    throw error;
  }
}

/** Stops the ended session's pending draft saves and their publications. */
export function endWorldDraftSession(scope: StudioScope): void {
  getWorldDraftState(scope).sessionEnded = true;
  endWorldDraftStorageSession(scope);
  getWorldDraftState(scope).revision++;
  clearTimeout(getWorldDraftState(scope).saveTimer);
  getWorldDraftState(scope).pendingPublications = [];
}

export function addWorldDraft(scope: StudioScope, brief = '', source: WorldRecord | null = null): WorldDraft {
  if (getWorldDraftState(scope).sessionEnded) throw new Error('The Nimi session ended; reopen Realm World Studio.');
  if (!getWorldDraftState(scope).store.getState().loaded) throw new Error('Draft storage has not loaded.');
  const draft = createWorldDraft(brief, source);
  getWorldDraftState(scope).store.setState(state => ({ drafts: [draft, ...state.drafts] }));
  void persistWorldDrafts(scope).catch(() => {});
  return draft;
}

export function updateWorldDraft(scope: StudioScope, id: string, patch: Partial<WorldDraft>): void {
  if (getWorldDraftState(scope).sessionEnded) return;
  getWorldDraftState(scope).revision++;
  getWorldDraftState(scope).store.setState(state => ({ saving: true, drafts: state.drafts.map(draft => draft.id === id ? { ...draft, ...patch, id, updatedAt: Object.keys(patch).some(key => key !== 'proposal') ? new Date().toISOString() : draft.updatedAt } : draft) }));
  clearTimeout(getWorldDraftState(scope).saveTimer);
  getWorldDraftState(scope).saveTimer = setTimeout(() => { void persistWorldDrafts(scope).catch(() => {}); }, 450);
}

export async function removeWorldDraft(scope: StudioScope, id: string): Promise<void> {
  if (getWorldDraftState(scope).sessionEnded) throw new Error('The Nimi session ended; reopen Realm World Studio.');
  const removed = getWorldDraftState(scope).store.getState().drafts.find(draft => draft.id === id);
  if (!removed) return;
  getWorldDraftState(scope).store.setState(state => ({ drafts: state.drafts.filter(draft => draft.id !== id) }));
  try {
    await saveWorldDrafts(scope, removed.proposal
      ? [coauthorActivity(removed, removed.proposal, 'cancelled', new Date().toISOString())] : [], id);
  }
  catch (error) {
    getWorldDraftState(scope).store.setState(state => ({ drafts: [...state.drafts, removed] }));
    throw error;
  }
}

export async function reloadConflictingWorldDraft(scope: StudioScope, id: string): Promise<void> {
  const state = getWorldDraftState(scope);
  try {
    const draft = await readSavedWorldDraft(scope, id);
    if (state.sessionEnded || state.store.getState().conflictId !== id) return;
    if (draft) state.savedDrafts.set(id, draft);
    else state.savedDrafts.delete(id);
    state.pendingPublications = state.pendingPublications.filter(entry => draftIdFromObjectRef(entry.objectRef) !== id);
    state.store.setState(view => ({ drafts: [...(draft ? [draft] : []), ...view.drafts.filter(item => item.id !== id)], error: null, conflictId: undefined }));
  } catch (error) {
    if (!state.sessionEnded) state.store.setState({ error: errorText(error) });
  }
}

function createWorldDraftState() {
  const useWorldDrafts = create<DraftState>(() => ({ drafts: [], loaded: false, loading: false, saving: false, error: null }));
  const revision = 0;
  const saveTimer = undefined as ReturnType<typeof setTimeout> | undefined;
  const pendingPublications: WorldActivityPublication[] = [];
  const sessionEnded = false;
  return { store: useWorldDrafts, revision, saveTimer, pendingPublications, sessionEnded, savedDrafts: new Map<string, WorldDraft>() };
}
const states = new WeakMap<StudioScope, ReturnType<typeof createWorldDraftState>>();
export function getWorldDraftState(scope: StudioScope) {
  let state = states.get(scope);
  if (!state) { state = createWorldDraftState(); states.set(scope, state); }
  return state;
}
export function useWorldDrafts<T = DraftState>(selector: (state: DraftState) => T = state => state as unknown as T): T {
  const scope = useStudioScope();
  return getWorldDraftState(scope).store(selector);
}
