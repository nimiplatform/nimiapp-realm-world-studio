import { beforeEach, expect, it, vi } from 'vitest';

vi.mock('../../app-shell/studio-platform.js', () => ({ getStudioLocalAppClient: vi.fn() }));

beforeEach(() => { vi.resetModules(); vi.clearAllMocks(); });

it.each(['world', 'character'])('stops queued %s writes and rejects unfinished work after the session ends', async (kind) => {
  const platform = await import('../../app-shell/studio-platform.js');
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  const originalWrite = vi.fn(async () => { await gate; });
  const nextAccountWrite = vi.fn(async () => undefined);
  const readJson = vi.fn(async () => ({ value: { drafts: [], activityOutbox: [] } }));
  vi.mocked(platform.getStudioLocalAppClient).mockReturnValue({ storage: { readJson, writeJson: originalWrite } } as never);
  const worlds = await import('./world-draft-store.js');
  const characters = await import('./character-draft-store.js');
  worlds.useWorldDrafts.setState({ loaded: true, drafts: [] });
  characters.useCharacterDrafts.setState({ loaded: true, drafts: [] });
  const persist = kind === 'world' ? worlds.persistWorldDrafts : characters.persistCharacterDrafts;
  const end = kind === 'world' ? worlds.endWorldDraftSession : characters.endCharacterDraftSession;
  const first = persist();
  await vi.waitFor(() => expect(originalWrite).toHaveBeenCalledTimes(1));
  const second = persist();
  const settled = Promise.allSettled([first, second]);
  end();
  vi.mocked(platform.getStudioLocalAppClient).mockReturnValue({ storage: { readJson, writeJson: nextAccountWrite } } as never);
  release();
  expect((await settled).map(result => result.status)).toEqual(['rejected', 'rejected']);
  expect(nextAccountWrite).not.toHaveBeenCalled();
});
