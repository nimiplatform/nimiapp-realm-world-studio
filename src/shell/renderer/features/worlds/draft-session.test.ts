import { worldDraftStorageFixture } from '../../../../test/world-draft-storage.js';
import { createStudioTestScope, studioTestScope } from '../../../../test/studio-scope.js';
import { beforeEach, expect, it, vi } from 'vitest';

vi.mock('../../app-shell/studio-platform.js', () => ({ getStudioClient: vi.fn() }));

beforeEach(() => { vi.resetModules(); vi.clearAllMocks(); });

it.each(['world', 'character'])('stops queued %s writes and rejects unfinished work after the session ends', async (kind) => {
  const platform = await import('../../app-shell/studio-platform.js');
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  const originalWrite = vi.fn(async () => { await gate; });
  const nextAccountWrite = vi.fn(async () => undefined);
  const { storage } = worldDraftStorageFixture();
  storage.assets.write.mockImplementation(originalWrite as never);
  vi.mocked(platform.getStudioClient).mockReturnValue({ storage: { ...storage, writeJson: originalWrite } } as never);
  const worlds = await import('./world-draft-store.js');
  const characters = await import('./character-draft-store.js');
  const { createWorldDraft } = await import('./world-draft.js');
  worlds.getWorldDraftState(studioTestScope).store.setState({ loaded: true, drafts: [createWorldDraft('Pending')] });
  const { newCharacterDraft } = await import('./world-character-model.js');
  characters.getCharacterDraftState(studioTestScope).store.setState({ loaded: true, drafts: [newCharacterDraft('world', 'character', null)] });
  const persist = kind === 'world' ? worlds.persistWorldDrafts : characters.persistCharacterDrafts;
  const end = kind === 'world' ? worlds.endWorldDraftSession : characters.endCharacterDraftSession;
  const first = persist(studioTestScope);
  await vi.waitFor(() => expect(originalWrite).toHaveBeenCalledTimes(1));
  const second = persist(studioTestScope);
  const settled = Promise.allSettled([first, second]);
  end(studioTestScope);
  vi.mocked(platform.getStudioClient).mockReturnValue({ storage: { ...storage, assets: { ...storage.assets, write: nextAccountWrite }, writeJson: nextAccountWrite } } as never);
  release();
  expect((await settled).map(result => result.status)).toEqual(['rejected', 'rejected']);
  expect(nextAccountWrite).not.toHaveBeenCalled();
});

it('imports character drafts independently and preserves newer records from an interrupted migration', async () => {
  const { newCharacterDraft } = await import('./world-character-model.js');
  const { loadCharacterDrafts, getCharacterDraftState } = await import('./character-draft-store.js');
  const platform = await import('../../app-shell/studio-platform.js');
  const old = newCharacterDraft('world', 'first', null);
  const newer = { ...old, form: { ...old.form, name: 'Newer saved record' } };
  const second = newCharacterDraft('world', 'second', null);
  const legacy = 'world-studio/character-drafts.json';
  const { files, storage } = worldDraftStorageFixture(new Map<string, unknown>([
    [legacy, [old, second]],
    ['world-studio/character-drafts/first.json', newer],
  ]));
  vi.mocked(platform.getStudioClient).mockReturnValue({ storage } as never);
  const scope = createStudioTestScope();
  await loadCharacterDrafts(scope);
  expect(getCharacterDraftState(scope).store.getState().drafts).toEqual(expect.arrayContaining([newer, second]));
  expect(files.has(legacy)).toBe(false);
});
