// Studio mirrors parentos PO-SHELL-008 / K-ACCSVC-008: the app does not own
// access/refresh token custody. Auth session storage commands and token
// exchange commands stay disabled at the host layer and are not re-exported
// here.
export {
  hasTauriInvoke,
  invoke,
  invokeChecked,
  BridgeError,
  getDaemonStatus,
  getRuntimeDefaults,
  oauthListenForCode,
  openExternalUrl,
  focusMainWindow,
  startWindowDrag,
  parseRuntimeBridgeDaemonStatus,
  hasElectronRuntime,
  hasShellHostInvoke,
  hasTauriRuntime,
  invokeTauri,
} from '@nimiplatform/kit/shell/renderer/bridge';
export type {
  RuntimeBridgeDaemonStatus,
  JsonValue,
  JsonObject,
  JsonPrimitive,
  RuntimeDefaults,
} from '@nimiplatform/kit/shell/renderer/bridge';

import type { ShellOAuthBridge } from '@nimiplatform/kit/core/oauth';
import {
  focusMainWindow,
  getRuntimeDefaults as getNimiRuntimeDefaults,
  hasShellHostInvoke,
  oauthListenForCode,
  openExternalUrl,
} from '@nimiplatform/kit/shell/renderer/bridge';

export const STUDIO_TOKEN_EXCHANGE_FORBIDDEN =
  'Realm World Studio does not expose OAuth token exchange; Runtime account service owns token custody.';

export type StudioRuntimeDefaults = {
  readonly realm: {
    readonly realmBaseUrl: string | null;
  } | null;
};

export async function getStudioRuntimeDefaults(): Promise<StudioRuntimeDefaults> {
  const defaults = await getNimiRuntimeDefaults();
  const realmBaseUrl = String(defaults.realm.realmBaseUrl || '').trim() || null;
  return {
    realm: {
      realmBaseUrl,
    },
  };
}

export const studioTauriOAuthBridge: ShellOAuthBridge = {
  hasShellHostInvoke,
  oauthListenForCode,
  openExternalUrl,
  focusMainWindow,
  oauthTokenExchange: async () => {
    throw new Error(STUDIO_TOKEN_EXCHANGE_FORBIDDEN);
  },
};
