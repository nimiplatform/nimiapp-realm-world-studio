import { useStudioScope, type StudioScope } from '@renderer/app-shell/studio-scope.js';
import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { nimiToast } from '@nimiplatform/kit/ui';
import { focusMainWindow, hasElectronRuntime } from '../../bridge/index.js';
import { loadWorldDrafts, getWorldDraftState } from './world-draft-store.js';
import {
  beginWorldActivitySession,
  endWorldActivitySession,
  reconcileWorldActivity,
  registerWorldActivityOpenHandler,
  retryWorldActivity,
  subscribeWorldActivitySync,
} from './world-activity.js';
import type { WorldDraft } from './world-draft.js';

async function loadedDrafts(scope: StudioScope): Promise<readonly WorldDraft[]> {
  await loadWorldDrafts(scope);
  const state = getWorldDraftState(scope).store.getState();
  if (state.loaded) return state.drafts;
  if (state.error) throw new Error(state.error);
  return new Promise((resolve, reject) => {
    const cleanup = () => { unsubscribe(); scope.signal.removeEventListener('abort', aborted); };
    const aborted = () => { cleanup(); reject(scope.signal.reason); };
    const unsubscribe = getWorldDraftState(scope).store.subscribe((next) => {
      if (next.loaded) { cleanup(); resolve(next.drafts); }
      else if (!next.loading && next.error) { cleanup(); reject(new Error(next.error)); }
    });
    scope.signal.addEventListener('abort', aborted, { once: true });
    if (scope.signal.aborted) aborted();
  });
}

/**
 * Mounted once the protected session is bound: binds activity work to this
 * session's account storage, republishes candidates still awaiting review,
 * and accepts open requests for this account's drafts. Unmounting ends the
 * session's activity work, including an in-flight flush.
 */
export function WorldActivityBridge() {
  const scope = useStudioScope();
  // The router replaces navigate on every route change; the session must
  // follow this component's mount, not navigation, or a publication queued
  // just before navigating would be dropped as belonging to an ended session.
  const navigate = useNavigate();
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;
  useEffect(() => {
    let active = true;
    beginWorldActivitySession(scope);
    const registration = registerWorldActivityOpenHandler(scope, {
      findDraft: async (draftId) => (await loadedDrafts(scope)).find((draft) => draft.id === draftId),
      navigate: (path) => navigateRef.current(path),
      ...(hasElectronRuntime() ? { focus: focusMainWindow } : {}),
    });
    void loadedDrafts(scope).then((drafts) => (active ? reconcileWorldActivity(scope, drafts) : undefined)).catch(() => {
      // The draft document also holds pending review updates. Surface its read
      // failure even when the creator opened a page without a draft notice.
      if (active) void retryWorldActivity(scope).catch(() => undefined);
    });
    return () => {
      active = false;
      void registration.stop();
      endWorldActivitySession(scope);
    };
  }, []);
  useUnsyncedActivityNotice();
  return null;
}

/**
 * Keeps a warning visible while publications have not reached Nimi, with an
 * explicit retry. It appears when unsynced publications first remain and again
 * after a retry that did not sync them all.
 */
function useUnsyncedActivityNotice() {
  const scope = useStudioScope();
  const { t } = useTranslation();
  const translate = useRef(t);
  translate.current = t;
  useEffect(() => {
    let active = true;
    let toastId: string | null = null;
    let shown: number | null = 0;
    const show = (count: number | null) => {
      if (!active) return;
      if (toastId) nimiToast.dismiss(toastId);
      toastId = nimiToast.warning(count === null
        ? translate.current('activity.storageUnavailable')
        : translate.current('activity.unsynced', { count }), {
        sticky: true,
        action: {
          label: translate.current('activity.retryNow'),
          onClick: () => {
            void retryWorldActivity(scope).then((remaining) => { if (remaining !== 0) show(remaining); }).catch(() => show(shown));
          },
        },
      });
      shown = count;
    };
    const unsubscribe = subscribeWorldActivitySync(scope, (count) => {
      if (count === 0) {
        if (toastId) nimiToast.dismiss(toastId);
        toastId = null;
        shown = 0;
      } else if (shown !== count) {
        show(count);
      }
    });
    return () => {
      active = false;
      unsubscribe();
      if (toastId) nimiToast.dismiss(toastId);
    };
  }, []);
}
