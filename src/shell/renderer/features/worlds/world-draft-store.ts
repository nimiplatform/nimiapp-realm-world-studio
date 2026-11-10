import { useStudioScope, type StudioScope } from '@renderer/app-shell/studio-scope.js';
import { create } from 'zustand';
import { createWorldDraft, type WorldDraft, type WorldRecord } from './world-draft.js';
import { coauthorActivity, mergeWorldActivities, type WorldActivityPublication } from './world-activity-model.js';
import { flushWorldActivity } from './world-activity.js';
import { endWorldDraftStorageSession, readWorldDraftDocument, updateWorldDraftDocument } from './world-draft-storage.js';

type DraftState = {
  drafts: WorldDraft[]; loaded: boolean; loading: boolean; saving: boolean; error: string | null;
};

function errorText(error: unknown): string { return error instanceof Error ? error.message : String(error); }

// @nimi-authority: rule.realm-world-studio.runtime-ai.r014
export async function loadWorldDrafts(scope: StudioScope): Promise<void> {
  if (getWorldDraftState(scope).sessionEnded) return;
  if (getWorldDraftState(scope).store.getState().loaded || getWorldDraftState(scope).store.getState().loading) return;
  getWorldDraftState(scope).store.setState({ loading: true, error: null });
  try {
    const document = await readWorldDraftDocument(scope);
    getWorldDraftState(scope).store.setState({ drafts: document.drafts, loaded: true, loading: false });
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

function saveWorldDrafts(scope: StudioScope, extraPublications: readonly WorldActivityPublication[] = []): Promise<void> {
  if (getWorldDraftState(scope).sessionEnded) return Promise.reject(new Error('The Nimi session ended; reopen Realm World Studio.'));
  if (!getWorldDraftState(scope).store.getState().loaded) return Promise.reject(new Error('Draft storage has not loaded.'));
  clearTimeout(getWorldDraftState(scope).saveTimer);
  const currentRevision = ++getWorldDraftState(scope).revision;
  const publications = getWorldDraftState(scope).pendingPublications;
  getWorldDraftState(scope).store.setState({ saving: true, error: null });
  const drafts = JSON.parse(JSON.stringify(getWorldDraftState(scope).store.getState().drafts)) as WorldDraft[];
  return updateWorldDraftDocument(scope, current => ({
    drafts,
    activityOutbox: mergeWorldActivities(current.activityOutbox, [...publications, ...extraPublications]),
  })).then(document => {
    getWorldDraftState(scope).pendingPublications = getWorldDraftState(scope).pendingPublications.filter(entry => !publications.includes(entry));
    if (currentRevision === getWorldDraftState(scope).revision) getWorldDraftState(scope).store.setState({ saving: false, error: null });
    if (document.activityOutbox.length) void flushWorldActivity(scope).catch(() => undefined);
  }).catch(error => {
    if (currentRevision === getWorldDraftState(scope).revision) getWorldDraftState(scope).store.setState({ saving: false, error: errorText(error) });
    throw error;
  });
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
  getWorldDraftState(scope).store.setState(state => ({ drafts: state.drafts.filter(draft => draft.id !== id) }));
  try {
    await saveWorldDrafts(scope, removed?.proposal
      ? [coauthorActivity(removed, removed.proposal, 'cancelled', new Date().toISOString())] : []);
  }
  catch (error) {
    if (removed) getWorldDraftState(scope).store.setState(state => ({ drafts: [...state.drafts, removed] }));
    throw error;
  }
}

function createWorldDraftState() {
  const useWorldDrafts = create<DraftState>(() => ({ drafts: [], loaded: false, loading: false, saving: false, error: null }));
  const revision = 0;
  const saveTimer = undefined as ReturnType<typeof setTimeout> | undefined;
  const pendingPublications: WorldActivityPublication[] = [];
  const sessionEnded = false;
  return { store: useWorldDrafts, revision, saveTimer, pendingPublications, sessionEnded };
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
