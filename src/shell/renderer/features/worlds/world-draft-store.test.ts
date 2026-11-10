import { createStudioTestScope, studioTestScope } from '../../../../test/studio-scope.js';
import { beforeEach, expect, it, vi } from 'vitest';
import { coauthorActivity } from './world-activity-model.js';
import { createWorldDraft, type WorldProposal } from './world-draft.js';
import { worldDraftRecordPath, worldDraftStorageFixture } from '../../../../test/world-draft-storage.js';

vi.mock('../../app-shell/studio-platform.js', () => ({ getStudioClient: vi.fn() }));
vi.mock('./world-activity.js', () => ({ flushWorldActivity: vi.fn(async () => 0) }));

async function loadStore(write: () => Promise<unknown> = async () => undefined) {
  const events: string[] = [];
  const draft = createWorldDraft('A drowned archive');
  const proposal: WorldProposal = {
    task: 'review', notes: [], traceId: 'trace-test', sourceUpdatedAt: draft.updatedAt,
    generatedAt: draft.updatedAt, accepted: [],
  };
  draft.proposal = proposal;
  const publication = coauthorActivity(draft, proposal, 'completed', draft.updatedAt);
  const { storage, document } = worldDraftStorageFixture(new Map([[worldDraftRecordPath(draft.id), { id: draft.id, draft, activityOutbox: [] }]]));
  const writeRecord = storage.assets.write.getMockImplementation()!;
  storage.assets.write.mockImplementation(async input => {
    events.push('write');
    await write();
    return writeRecord(input);
  });
  const platform = await import('../../app-shell/studio-platform.js');
  const client = { storage };
  vi.mocked(platform.getStudioClient).mockReturnValue(client as never);
  const store = await import('./world-draft-store.js');
  const activity = await import('./world-activity.js');
  vi.mocked(activity.flushWorldActivity).mockImplementation(async () => { events.push('flush'); return 0; });
  await store.loadWorldDrafts(studioTestScope);
  return { store, events, draft, publication, client, document };
}

beforeEach(() => { vi.resetModules(); vi.clearAllMocks(); });

it('saves a completed review and its publication together before flushing', async () => {
  const { store, events, draft, publication, client, document } = await loadStore();
  store.updateWorldDraft(studioTestScope, draft.id, { proposal: null });
  store.publishAfterDraftSave(studioTestScope, [publication]);
  expect(events).toEqual([]);
  await store.persistWorldDrafts(studioTestScope);
  expect(events).toEqual(['write', 'flush']);
  expect(client.storage.assets.write).toHaveBeenCalledTimes(1);
  expect(document().drafts[0]!.proposal).toBeNull();
  expect(document().activityOutbox).toEqual([publication]);
});

it('keeps the unsaved review and publication for retry if the single write fails', async () => {
  let fail = true;
  const { store, events, draft, publication, document } = await loadStore(async () => {
    if (fail) throw new Error('storage unavailable');
  });
  store.updateWorldDraft(studioTestScope, draft.id, { proposal: null });
  store.publishAfterDraftSave(studioTestScope, [publication]);
  await expect(store.persistWorldDrafts(studioTestScope)).rejects.toThrow('storage unavailable');
  expect(events).toEqual(['write']);
  expect(document().drafts[0]!.proposal).not.toBeNull();
  expect(document().activityOutbox).toEqual([]);
  expect(store.getWorldDraftState(studioTestScope).store.getState().error).toBe('storage unavailable');
  fail = false;
  await store.persistWorldDrafts(studioTestScope);
  expect(events).toEqual(['write', 'write', 'flush']);
  expect(document().drafts[0]!.proposal).toBeNull();
  expect(document().activityOutbox).toEqual([publication]);
});

it('recovers the terminal publication after reloading a completed draft', async () => {
  const { store, draft, publication, client } = await loadStore();
  store.updateWorldDraft(studioTestScope, draft.id, { proposal: null });
  store.publishAfterDraftSave(studioTestScope, [publication]);
  await store.persistWorldDrafts(studioTestScope);
  vi.resetModules();
  const platform = await import('../../app-shell/studio-platform.js');
  vi.mocked(platform.getStudioClient).mockReturnValue(client as never);
  const reopened = await import('./world-draft-store.js');
  const storage = await import('./world-draft-storage.js');
  await reopened.loadWorldDrafts(studioTestScope);
  expect(reopened.getWorldDraftState(studioTestScope).store.getState().drafts[0]!.proposal).toBeNull();
  expect((await storage.readWorldDraftDocument(studioTestScope)).activityOutbox).toEqual([publication]);
});

it('saves deletion and cancellation atomically without requiring the deleted draft on retry', async () => {
  const { store, draft, document } = await loadStore();
  await store.removeWorldDraft(studioTestScope, draft.id);
  expect(document().drafts).toEqual([]);
  expect(document().activityOutbox).toEqual([expect.objectContaining({ todoState: 'cancelled', revision: 2 })]);
});

it('does not cancel a restored draft after its deletion failed', async () => {
  let fail = true;
  const { store, draft, document } = await loadStore(async () => {
    if (fail) throw new Error('storage unavailable');
  });
  await expect(store.removeWorldDraft(studioTestScope, draft.id)).rejects.toThrow('storage unavailable');
  expect(store.getWorldDraftState(studioTestScope).store.getState().drafts).toHaveLength(1);
  fail = false;
  await store.persistWorldDrafts(studioTestScope);
  expect(document().activityOutbox).toEqual([]);
  expect(document().drafts[0]!.id).toBe(draft.id);
});

it('stops debounced saves and publications when the session ends', async () => {
  vi.useFakeTimers();
  try {
    const { store, events, draft, publication } = await loadStore();
    store.updateWorldDraft(studioTestScope, draft.id, { name: 'Changed' });
    store.publishAfterDraftSave(studioTestScope, [publication]);
    store.endWorldDraftSession(studioTestScope);
    await vi.advanceTimersByTimeAsync(1_000);
    expect(events).toEqual([]);
    await expect(store.persistWorldDrafts(studioTestScope)).rejects.toThrow(/session ended/u);
  } finally {
    vi.useRealTimers();
  }
});

it('preserves different drafts saved from two connections that loaded the same account storage', async () => {
  const { store, draft } = await loadStore();
  const second = createStudioTestScope();
  await store.loadWorldDrafts(second);
  const firstDraft = createWorldDraft('First connection');
  const secondDraft = createWorldDraft('Second connection');
  store.getWorldDraftState(studioTestScope).store.setState(state => ({ drafts: [firstDraft, ...state.drafts] }));
  store.getWorldDraftState(second).store.setState(state => ({ drafts: [secondDraft, ...state.drafts] }));
  await Promise.all([store.persistWorldDrafts(studioTestScope), store.persistWorldDrafts(second)]);
  const reopened = createStudioTestScope();
  await store.loadWorldDrafts(reopened);
  expect(store.getWorldDraftState(reopened).store.getState().drafts.map(item => item.id).sort()).toEqual([draft.id, firstDraft.id, secondDraft.id].sort());
});

it('rejects edits from a stale connection and keeps its unsaved text until an explicit reload', async () => {
  const { store, draft, document } = await loadStore();
  const stale = createStudioTestScope();
  await store.loadWorldDrafts(stale);
  store.updateWorldDraft(studioTestScope, draft.id, { name: 'Saved elsewhere' });
  await store.persistWorldDrafts(studioTestScope);
  store.updateWorldDraft(stale, draft.id, { name: 'Unsaved local edit' });
  await expect(store.persistWorldDrafts(stale)).rejects.toMatchObject({ draftId: draft.id });
  expect(document().drafts[0]?.name).toBe('Saved elsewhere');
  expect(store.getWorldDraftState(stale).store.getState().drafts[0]?.name).toBe('Unsaved local edit');
  await store.reloadConflictingWorldDraft(stale, draft.id);
  expect(store.getWorldDraftState(stale).store.getState().drafts[0]?.name).toBe('Saved elsewhere');
});
