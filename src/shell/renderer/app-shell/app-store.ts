import { create } from 'zustand';
import type { StudioProtectedSessionFailure } from './protected-session-state.js';

export type AuthStatus = 'bootstrapping' | 'authenticated' | 'unauthenticated';

interface AppState {
  // Studio stores only Desktop-supervised session posture. Account identity
  // and auth token values never enter renderer state.
  auth: {
    status: AuthStatus;
  };
  bootstrapReady: boolean;
  bootstrapError: string | null;
  bootstrapFailure: StudioProtectedSessionFailure | null;

  setProtectedSessionBound: () => void;
  clearAuthSession: () => void;
  setBootstrapReady: (ready: boolean) => void;
  setBootstrapError: (error: string | null) => void;
  setBootstrapFailure: (failure: StudioProtectedSessionFailure | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  auth: {
    status: 'bootstrapping',
  },
  bootstrapReady: false,
  bootstrapError: null,
  bootstrapFailure: null,

  setProtectedSessionBound() {
    set({ auth: { status: 'authenticated' } });
  },
  clearAuthSession() {
    set({
      auth: { status: 'unauthenticated' },
    });
  },
  setBootstrapReady: (ready) => set({ bootstrapReady: ready }),
  setBootstrapError: (error) => set({ bootstrapError: error }),
  setBootstrapFailure: (failure) => set({ bootstrapFailure: failure }),
}));
