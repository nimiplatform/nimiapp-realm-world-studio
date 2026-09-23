import { endCharacterDraftSession } from '../features/worlds/character-draft-store.js';
import { endWorldActivitySession } from '../features/worlds/world-activity.js';
import { endWorldDraftSession } from '../features/worlds/world-draft-store.js';
import { useAppStore } from './app-store.js';

type StudioHostEvents = {
  readonly onSessionInvalidated: (listener: () => void) => () => void;
};

declare global {
  interface Window {
    /** Studio's preload forwards the Kit Host's session invalidation. */
    readonly realmWorldStudio?: StudioHostEvents;
  }
}

/**
 * Ends every piece of work that belongs to the bound Nimi session once the
 * Host reports it invalidated, for example after an account change. Studio
 * does not follow a new session in place: pending draft saves and activity
 * publications stop, and the user reopens Studio, which then loads only the
 * current account's storage. Before a session is bound, the bootstrap flow
 * reports the posture instead.
 */
export function endStudioSession(): void {
  const state = useAppStore.getState();
  if (!state.bootstrapReady || state.sessionEnded) return;
  endWorldActivitySession();
  endWorldDraftSession();
  endCharacterDraftSession();
  state.setSessionEnded();
}

export function watchStudioSession(): () => void {
  return window.realmWorldStudio?.onSessionInvalidated(endStudioSession) ?? (() => undefined);
}
