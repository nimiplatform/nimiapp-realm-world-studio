import { studioTestScope } from '../../../../test/studio-scope.js';
import { beforeEach, expect, it, vi } from 'vitest';

vi.mock('../../app-shell/studio-platform.js', () => ({ getStudioClient: vi.fn() }));

beforeEach(() => { vi.resetModules(); vi.clearAllMocks(); });

it.each(['world', 'character'])('stops queued %s writes and rejects unfinished work after the session ends', async (kind) => {
  const platform = await import('../../app-shell/studio-platform.js');
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  const originalWrite = vi.fn(async () => { await gate; });
  const nextAccountWrite = vi.fn(async () => undefined);
  const readJson = vi.fn(async () => ({ value: { drafts: [], activityOutbox: [] } }));
  vi.mocked(platform.getStudioClient).mockReturnValue({ storage: { readJson, writeJson: originalWrite } } as never);
  const worlds = await import('./world-draft-store.js');
  const characters = await import('./character-draft-store.js');
  worlds.getWorldDraftState(studioTestScope).store.setState({ loaded: true, drafts: [] });
  characters.getCharacterDraftState(studioTestScope).store.setState({ loaded: true, drafts: [] });
  const persist = kind === 'world' ? worlds.persistWorldDrafts : characters.persistCharacterDrafts;
  const end = kind === 'world' ? worlds.endWorldDraftSession : characters.endCharacterDraftSession;
  const first = persist(studioTestScope);
  await vi.waitFor(() => expect(originalWrite).toHaveBeenCalledTimes(1));
  const second = persist(studioTestScope);
  const settled = Promise.allSettled([first, second]);
  end(studioTestScope);
  vi.mocked(platform.getStudioClient).mockReturnValue({ storage: { readJson, writeJson: nextAccountWrite } } as never);
  release();
  expect((await settled).map(result => result.status)).toEqual(['rejected', 'rejected']);
  expect(nextAccountWrite).not.toHaveBeenCalled();
});
