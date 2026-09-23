import { beforeEach, expect, it, vi } from 'vitest';
import { getStudioLocalAppClient } from '../src/shell/renderer/app-shell/studio-platform.js';
import { createWorldDraft } from '../src/shell/renderer/features/worlds/world-draft.js';
import { convertDevelopmentWorldDrafts } from './convert-development-world-drafts.js';

vi.mock('../src/shell/renderer/app-shell/studio-platform.js', () => ({ getStudioLocalAppClient: vi.fn() }));

let invalidate: () => void;
beforeEach(() => {
  Object.defineProperty(window, 'realmWorldStudio', {
    configurable: true,
    value: { onSessionInvalidated: (listener: () => void) => { invalidate = listener; return () => undefined; } },
  });
});

function clientFor(drafts: unknown) {
  const client = {
    auth: { status: async () => ({ sessionBound: true }) },
    storage: {
      readJson: vi.fn(async (path: string) => ({ value: path.endsWith('/drafts.json') ? drafts : [] })),
      writeJson: vi.fn(async () => undefined),
    },
  };
  vi.mocked(getStudioLocalAppClient).mockReturnValue(client as never);
  return client;
}

it('previews without writing, then backs up before explicitly converting development drafts', async () => {
  const drafts = [createWorldDraft('Keep this local notebook')];
  const client = clientFor(drafts);
  await expect(convertDevelopmentWorldDrafts()).resolves.toEqual({ drafts: 1, publications: 0, applied: false });
  expect(client.storage.writeJson).not.toHaveBeenCalled();
  const result = await convertDevelopmentWorldDrafts({ apply: true });
  expect(result.applied).toBe(true);
  expect(client.storage.writeJson.mock.calls).toEqual([
    [expect.stringMatching(/^world-studio\/development-backups\/[0-9A-Z]{26}\.json$/u), { drafts, activityOutbox: [] }],
    ['world-studio/drafts.json', { drafts, activityOutbox: [] }],
  ]);
});

it('preserves unreadable data without attempting a backup or conversion', async () => {
  const client = clientFor([null]);
  await expect(convertDevelopmentWorldDrafts({ apply: true })).rejects.toThrow('unreadable');
  expect(client.storage.writeJson).not.toHaveBeenCalled();
});

it('stops before the target write if the session changes while backing up', async () => {
  const client = clientFor([createWorldDraft()]);
  client.storage.writeJson.mockImplementationOnce(async () => { invalidate(); });
  await expect(convertDevelopmentWorldDrafts({ apply: true })).rejects.toThrow('session changed');
  expect(client.storage.writeJson).toHaveBeenCalledTimes(1);
});
