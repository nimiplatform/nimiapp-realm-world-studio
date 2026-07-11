import { create } from 'zustand';
import type { StudioProtectedSessionFailure } from './protected-session-state.js';

export type AuthUser = {
  id: string;
  displayName: string;
  email?: string;
  avatarUrl?: string;
};

export type AuthStatus = 'bootstrapping' | 'authenticated' | 'unauthenticated';

interface AppState {
  // Studio stores only Runtime-projected account identity and the Studio
  // defaults allowlist. Auth token values never enter renderer state.
  auth: {
    status: AuthStatus;
    user: AuthUser | null;
  };
  bootstrapReady: boolean;
  bootstrapError: string | null;
  bootstrapFailure: StudioProtectedSessionFailure | null;

  setAuthSession: (user: AuthUser) => void;
  clearAuthSession: () => void;
  setBootstrapReady: (ready: boolean) => void;
  setBootstrapError: (error: string | null) => void;
  setBootstrapFailure: (failure: StudioProtectedSessionFailure | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  auth: {
    status: 'bootstrapping',
    user: null,
  },
  bootstrapReady: false,
  bootstrapError: null,
  bootstrapFailure: null,

  setAuthSession(user) {
    set({ auth: { status: 'authenticated', user } });
  },
  clearAuthSession() {
    set({
      auth: { status: 'unauthenticated', user: null },
    });
  },
  setBootstrapReady: (ready) => set({ bootstrapReady: ready }),
  setBootstrapError: (error) => set({ bootstrapError: error }),
  setBootstrapFailure: (failure) => set({ bootstrapFailure: failure }),
}));
