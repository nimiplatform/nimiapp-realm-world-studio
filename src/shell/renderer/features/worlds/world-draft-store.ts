import { create } from 'zustand';
import { createWorldDraft, type WorldDraft, type WorldRecord } from './world-draft.js';
import { coauthorActivity, mergeWorldActivities, type WorldActivityPublication } from './world-activity-model.js';
import { flushWorldActivity } from './world-activity.js';
import { endWorldDraftStorageSession, readWorldDraftDocument, updateWorldDraftDocument } from './world-draft-storage.js';

type DraftState = {
  drafts: WorldDraft[]; loaded: boolean; loading: boolean; saving: boolean; error: string | null;
};
export const useWorldDrafts = create<DraftState>(() => ({ drafts: [], loaded: false, loading: false, saving: false, error: null }));
let revision = 0;
let saveTimer: ReturnType<typeof setTimeout> | undefined;
let pendingPublications: WorldActivityPublication[] = [];
let sessionEnded = false;

function errorText(error: unknown): string { return error instanceof Error ? error.message : String(error); }

// @nimi-authority: rule.realm-world-studio.runtime-ai.r014
export async function loadWorldDrafts(): Promise<void> {
  if (sessionEnded) return;
  if (useWorldDrafts.getState().loaded || useWorldDrafts.getState().loading) return;
  useWorldDrafts.setState({ loading: true, error: null });
  try {
    const document = await readWorldDraftDocument();
    useWorldDrafts.setState({ drafts: document.drafts, loaded: true, loading: false });
  } catch (error) { useWorldDrafts.setState({ loading: false, error: errorText(error) }); }
}

// @nimi-authority: rule.realm-world-studio.runtime-ai.r015
/**
 * Stages publications in the same document write as their draft changes.
 * Failed writes retain both changes for retry and publish nothing.
 */
export function publishAfterDraftSave(entries: readonly WorldActivityPublication[]): void {
  if (sessionEnded || !entries.length) return;
  pendingPublications = mergeWorldActivities(pendingPublications, entries);
}

export function persistWorldDrafts(): Promise<void> {
  return saveWorldDrafts();
}

function saveWorldDrafts(extraPublications: readonly WorldActivityPublication[] = []): Promise<void> {
  if (sessionEnded) return Promise.reject(new Error('The Nimi session ended; reopen Realm World Studio.'));
  if (!useWorldDrafts.getState().loaded) return Promise.reject(new Error('Draft storage has not loaded.'));
  clearTimeout(saveTimer);
  const currentRevision = ++revision;
  const publications = pendingPublications;
  useWorldDrafts.setState({ saving: true, error: null });
  const drafts = JSON.parse(JSON.stringify(useWorldDrafts.getState().drafts)) as WorldDraft[];
  return updateWorldDraftDocument(current => ({
    drafts,
    activityOutbox: mergeWorldActivities(current.activityOutbox, [...publications, ...extraPublications]),
  })).then(document => {
    pendingPublications = pendingPublications.filter(entry => !publications.includes(entry));
    if (currentRevision === revision) useWorldDrafts.setState({ saving: false, error: null });
    if (document.activityOutbox.length) void flushWorldActivity().catch(() => undefined);
  }).catch(error => {
    if (currentRevision === revision) useWorldDrafts.setState({ saving: false, error: errorText(error) });
    throw error;
  });
}

/** Stops the ended session's pending draft saves and their publications. */
export function endWorldDraftSession(): void {
  sessionEnded = true;
  endWorldDraftStorageSession();
  revision++;
  clearTimeout(saveTimer);
  pendingPublications = [];
}

export function addWorldDraft(brief = '', source: WorldRecord | null = null): WorldDraft {
  if (sessionEnded) throw new Error('The Nimi session ended; reopen Realm World Studio.');
  if (!useWorldDrafts.getState().loaded) throw new Error('Draft storage has not loaded.');
  const draft = createWorldDraft(brief, source);
  useWorldDrafts.setState(state => ({ drafts: [draft, ...state.drafts] }));
  void persistWorldDrafts().catch(() => {});
  return draft;
}

export function updateWorldDraft(id: string, patch: Partial<WorldDraft>): void {
  if (sessionEnded) return;
  revision++;
  useWorldDrafts.setState(state => ({ saving: true, drafts: state.drafts.map(draft => draft.id === id ? { ...draft, ...patch, id, updatedAt: Object.keys(patch).some(key => key !== 'proposal') ? new Date().toISOString() : draft.updatedAt } : draft) }));
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => { void persistWorldDrafts().catch(() => {}); }, 450);
}

export async function removeWorldDraft(id: string): Promise<void> {
  if (sessionEnded) throw new Error('The Nimi session ended; reopen Realm World Studio.');
  const removed = useWorldDrafts.getState().drafts.find(draft => draft.id === id);
  useWorldDrafts.setState(state => ({ drafts: state.drafts.filter(draft => draft.id !== id) }));
  try {
    await saveWorldDrafts(removed?.proposal
      ? [coauthorActivity(removed, removed.proposal, 'cancelled', new Date().toISOString())] : []);
  }
  catch (error) {
    if (removed) useWorldDrafts.setState(state => ({ drafts: [...state.drafts, removed] }));
    throw error;
  }
}
