import { beforeEach, expect, it, vi } from 'vitest';

const { ends } = vi.hoisted(() => ({
  ends: { activity: vi.fn(), drafts: vi.fn(), characters: vi.fn() },
}));

vi.mock('../features/worlds/world-activity.js', () => ({ endWorldActivitySession: ends.activity }));
vi.mock('../features/worlds/world-draft-store.js', () => ({ endWorldDraftSession: ends.drafts }));
vi.mock('../features/worlds/character-draft-store.js', () => ({ endCharacterDraftSession: ends.characters }));

import { useAppStore } from './app-store.js';
import { watchStudioSession } from './session-boundary.js';

let invalidate: (() => void) | undefined;

beforeEach(() => {
  vi.clearAllMocks();
  invalidate = undefined;
  Object.defineProperty(window, 'realmWorldStudio', {
    configurable: true,
    value: {
      onSessionInvalidated: (listener: () => void) => {
        invalidate = listener;
        return () => { invalidate = undefined; };
      },
    },
  });
  useAppStore.setState({ bootstrapReady: true, sessionEnded: false });
});

it('stops the bound session work once when the Host reports the session invalidated', () => {
  const stop = watchStudioSession();
  invalidate!();
  invalidate!();
  expect(ends.activity).toHaveBeenCalledTimes(1);
  expect(ends.drafts).toHaveBeenCalledTimes(1);
  expect(ends.characters).toHaveBeenCalledTimes(1);
  expect(useAppStore.getState().sessionEnded).toBe(true);
  stop();
  expect(invalidate).toBeUndefined();
});

it('leaves an unbound session to the bootstrap flow', () => {
  useAppStore.setState({ bootstrapReady: false });
  watchStudioSession();
  invalidate!();
  expect(ends.activity).not.toHaveBeenCalled();
  expect(useAppStore.getState().sessionEnded).toBe(false);
});
