import {
  createNimiClient,
  type NimiClient,
} from '@nimiplatform/sdk';
import {
  AccountSessionState,
  type AccountProjection,
} from '@nimiplatform/sdk/runtime/generated';
import {
  Runtime,
  createNimiLocalFirstPartyRuntimeAccountCaller,
  createNimiRuntimeAppSessionMetadataProvider,
  createNimiRuntimeFullAppRegistration,
  type NimiRuntimeAccountCaller,
  type RuntimeOptions,
} from '@nimiplatform/sdk/runtime';
import { createNimiError, ReasonCode, type CoreMetadata } from '@nimiplatform/sdk/types';
import {
  REALM_WORLD_STUDIO_RUNTIME_APP_ID,
  REALM_WORLD_STUDIO_RUNTIME_APP_INSTANCE_ID,
  REALM_WORLD_STUDIO_RUNTIME_APP_SESSION_DEVICE_ID,
  REALM_WORLD_STUDIO_RUNTIME_APP_SESSION_INSTANCE_ID,
  REALM_WORLD_STUDIO_RUNTIME_DEVICE_ID,
} from '../../app-identity.js';
import { createStudioRealmBridgeOptions } from './studio-realm-transport.js';
import { hasElectronRuntime } from '../bridge/index.js';
import { getStudioNimiClient, setStudioNimiClient } from '../infra/studio-nimi-client.js';

// Studio is a Nimi first-party local Runtime account/session consumer.
// Runtime owns login custody, app sessions, protected account state, and Realm
// mediation. Raw Realm account tokens are not exposed here.
export const STUDIO_RUNTIME_APP_ID = REALM_WORLD_STUDIO_RUNTIME_APP_ID;
export const STUDIO_RUNTIME_APP_INSTANCE_ID = REALM_WORLD_STUDIO_RUNTIME_APP_INSTANCE_ID;
export const STUDIO_RUNTIME_DEVICE_ID = REALM_WORLD_STUDIO_RUNTIME_DEVICE_ID;

const STUDIO_RUNTIME_APP_SESSION_INSTANCE_ID = REALM_WORLD_STUDIO_RUNTIME_APP_SESSION_INSTANCE_ID;
const STUDIO_RUNTIME_APP_SESSION_DEVICE_ID = REALM_WORLD_STUDIO_RUNTIME_APP_SESSION_DEVICE_ID;
const STUDIO_RUNTIME_APP_SESSION_TTL_SECONDS = 3600;
const STUDIO_RUNTIME_APP_SESSION_REFRESH_SKEW_MS = 30_000;
const STUDIO_RUNTIME_CAPABILITIES: readonly string[] = [];
const STUDIO_RUNTIME_DEVELOPER_REGISTRATION = false;
const RUNTIME_BRIDGE_NAMESPACE = 'runtime_bridge';

export type StudioRuntimeHostKind = 'electron' | 'tauri';

export const studioRuntimeAccountCaller: NimiRuntimeAccountCaller =
  createNimiLocalFirstPartyRuntimeAccountCaller({
    appId: STUDIO_RUNTIME_APP_ID,
    appInstanceId: STUDIO_RUNTIME_APP_INSTANCE_ID,
    deviceId: STUDIO_RUNTIME_DEVICE_ID,
    scopes: [],
  });

export type StudioAuthUser = {
  id: string;
  displayName: string;
};

export function normalizeStudioAccountProjection(
  projection: AccountProjection | null | undefined,
): StudioAuthUser | null {
  const accountId = String(projection?.accountId || '').trim();
  if (!accountId) {
    return null;
  }
  return {
    id: accountId,
    displayName: String(projection?.displayName || accountId).trim(),
  };
}

export async function loadStudioRuntimeAccountUser(runtime: Runtime): Promise<StudioAuthUser | null> {
  const response = await runtime.account.getAccountSessionStatus({
    caller: studioRuntimeAccountCaller,
  });
  if (response.state !== AccountSessionState.AUTHENTICATED) {
    return null;
  }
  return normalizeStudioAccountProjection(response.accountProjection);
}

export function resolveStudioRuntimeHostKind(): StudioRuntimeHostKind {
  return hasElectronRuntime() ? 'electron' : 'tauri';
}

export function createStudioRuntimeTransportConfig(
  hostKind: StudioRuntimeHostKind = resolveStudioRuntimeHostKind(),
): RuntimeOptions['transport'] {
  if (hostKind === 'electron') {
    return { type: 'electron-ipc' };
  }
  return {
    type: 'tauri-ipc',
    commandNamespace: RUNTIME_BRIDGE_NAMESPACE,
    eventNamespace: RUNTIME_BRIDGE_NAMESPACE,
  };
}

function studioRuntimeOptions(input: {
  readonly authMetadata?: () => Promise<CoreMetadata>;
  readonly hostKind?: StudioRuntimeHostKind;
} = {}): RuntimeOptions {
  const hostKind = input.hostKind ?? resolveStudioRuntimeHostKind();
  return {
    appId: STUDIO_RUNTIME_APP_ID,
    metadata: {
      callerId: STUDIO_RUNTIME_APP_ID,
      surfaceId: 'realm-world-studio',
    },
    ...(input.authMetadata && hostKind !== 'electron' ? { authMetadata: input.authMetadata } : {}),
    transport: createStudioRuntimeTransportConfig(hostKind),
  };
}

async function registerStudioRuntimeAccountCaller(accountRuntime: Runtime): Promise<void> {
  await createNimiRuntimeFullAppRegistration(
    () => ({ auth: accountRuntime.auth }),
    {
      appId: STUDIO_RUNTIME_APP_ID,
      appInstanceId: studioRuntimeAccountCaller.appInstanceId,
      deviceId: studioRuntimeAccountCaller.deviceId,
      capabilities: [...STUDIO_RUNTIME_CAPABILITIES],
      developerRegistration: STUDIO_RUNTIME_DEVELOPER_REGISTRATION,
      rejectionLabel: 'Realm World Studio Runtime account caller registration rejected',
    },
  )();
}

function createStudioRuntimeAuthMetadataProvider(accountRuntime: Runtime): () => Promise<CoreMetadata> {
  const requiredRuntimeSessionMetadata = createNimiRuntimeAppSessionMetadataProvider({
    appId: STUDIO_RUNTIME_APP_ID,
    appInstanceId: STUDIO_RUNTIME_APP_SESSION_INSTANCE_ID,
    deviceId: STUDIO_RUNTIME_APP_SESSION_DEVICE_ID,
    ttlSeconds: STUDIO_RUNTIME_APP_SESSION_TTL_SECONDS,
    refreshSkewMs: STUDIO_RUNTIME_APP_SESSION_REFRESH_SKEW_MS,
    capabilities: [...STUDIO_RUNTIME_CAPABILITIES],
    developerRegistration: STUDIO_RUNTIME_DEVELOPER_REGISTRATION,
    auth: accountRuntime.auth,
  });
  return async () => {
    const session = await accountRuntime.account.getAccountSessionStatus({
      caller: studioRuntimeAccountCaller,
    });
    if (session.state !== AccountSessionState.AUTHENTICATED || !session.accountProjection?.accountId) {
      return {};
    }
    return requiredRuntimeSessionMetadata();
  };
}

function normalizeStudioText(value: unknown): string {
  return String(value || '').trim();
}

export async function buildStudioNimiClient(options: { realmBaseUrl?: string | null } = {}): Promise<NimiClient> {
  const realmBaseUrl = normalizeStudioText(options.realmBaseUrl);
  if (!realmBaseUrl) {
    throw createNimiError({
      message: 'Realm World Studio Realm base URL is unavailable from Runtime defaults.',
      reasonCode: ReasonCode.SDK_REALM_BASE_URL_REQUIRED,
      actionHint: 'provide_studio_runtime_realm_defaults',
      source: 'sdk',
    });
  }
  const hostKind = resolveStudioRuntimeHostKind();
  const accountRuntime = new Runtime(studioRuntimeOptions({ hostKind }));
  await accountRuntime.ready();
  await registerStudioRuntimeAccountCaller(accountRuntime);
  const runtime = new Runtime(studioRuntimeOptions({
    hostKind,
    authMetadata: createStudioRuntimeAuthMetadataProvider(accountRuntime),
  }));
  const client = createNimiClient({
    appId: STUDIO_RUNTIME_APP_ID,
    runtime,
    realm: createStudioRealmBridgeOptions(realmBaseUrl, accountRuntime, studioRuntimeAccountCaller),
    app: false,
    permissions: false,
  });
  await client.runtime.ready();
  return client;
}

export function getCurrentStudioNimiClient(): NimiClient {
  return getStudioNimiClient();
}

export function clearStudioNimiClient(): void {
  setStudioNimiClient(null);
}
