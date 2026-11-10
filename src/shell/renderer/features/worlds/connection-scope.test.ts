import { expect, it, vi } from 'vitest';
import { createStudioTestScope } from '../../../../test/studio-scope.js';
import { worldDraftRecordPath, worldDraftStorageFixture } from '../../../../test/world-draft-storage.js';
import { createWorldDraft } from './world-draft.js';
import { getWorldDraftState, loadWorldDrafts, updateWorldDraft, persistWorldDrafts, endWorldDraftSession } from './world-draft-store.js';

function fixture(name: string) {
  const draft = createWorldDraft(name);
  const { storage } = worldDraftStorageFixture(new Map([[worldDraftRecordPath(draft.id), { id: draft.id, draft, activityOutbox: [] }]]));
  return { scope: createStudioTestScope({ storage }), write: storage.assets.write, draft };
}

it('keeps draft views and pending writes inside their captured connection', async () => {
  const a = fixture('Account A'), b = fixture('Account B');
  await Promise.all([loadWorldDrafts(a.scope), loadWorldDrafts(b.scope)]);
  const aDraft = getWorldDraftState(a.scope).store.getState().drafts[0]!;
  updateWorldDraft(a.scope, aDraft.id, { brief: 'Saved only for A' });
  await persistWorldDrafts(a.scope);
  expect(a.write).toHaveBeenCalledTimes(1);
  expect(b.write).not.toHaveBeenCalled();
  expect(getWorldDraftState(b.scope).store.getState().drafts[0]?.brief).toBe('Account B');
  endWorldDraftSession(a.scope);
  await expect(persistWorldDrafts(a.scope)).rejects.toThrow('session ended');
  updateWorldDraft(b.scope, b.draft.id, { brief: 'Saved only for B' });
  await persistWorldDrafts(b.scope);
  expect(b.write).toHaveBeenCalledTimes(1);
});

it('does not restore a late read after its connection is canceled', async () => {
  const abort = new AbortController();
  let release!: (value: unknown) => void;
  const read = new Promise(resolve => { release = resolve; });
  const scope = { ...createStudioTestScope({ storage: { readJson: () => read } }), signal: abort.signal };
  const pending = loadWorldDrafts(scope);
  abort.abort();
  release({ value: { drafts: [createWorldDraft('Ended connection')], activityOutbox: [] }, sizeBytes: 100 });
  await pending;
  expect(getWorldDraftState(scope).store.getState()).toMatchObject({ loaded: false, drafts: [] });
});

it.each(['APP_STORAGE_ENTRY_NOT_FOUND', 'APP_SCOPE_FORBIDDEN'])('handles the actual remote storage reason %s', async reasonCode => {
  const { storage } = worldDraftStorageFixture();
  storage.readJson.mockRejectedValue({ reasonCode });
  const scope = createStudioTestScope({ storage });
  await loadWorldDrafts(scope);
  expect(getWorldDraftState(scope).store.getState().loaded).toBe(reasonCode === 'APP_STORAGE_ENTRY_NOT_FOUND');
  expect(storage.assets.write).not.toHaveBeenCalled();
});
