import {
  Runtime,
  createNimiRuntimeAppSessionMetadataProvider,
} from '@nimiplatform/sdk/runtime';
import type { CoreMetadata } from '@nimiplatform/sdk/types';
import type {
  ElectronRuntimeBridgeTrustedMetadata,
  ElectronRuntimeBridgeTrustedMetadataProvider,
} from '@nimiplatform/kit/shell/electron/main';
import {
  REALM_WORLD_STUDIO_RUNTIME_APP_ID,
  REALM_WORLD_STUDIO_RUNTIME_APP_INSTANCE_ID,
  REALM_WORLD_STUDIO_RUNTIME_APP_SESSION_DEVICE_ID,
  REALM_WORLD_STUDIO_RUNTIME_APP_SESSION_INSTANCE_ID,
} from '../src/shell/app-identity.js';

const runtimeAppSessionTtlSeconds = 3600;
const runtimeAppSessionRefreshSkewMs = 30_000;
const runtimeCapabilities: readonly string[] = [];
const runtimeDeveloperRegistration = false;
const runtimeCallerKind = 'local-first-party-app';

export function createRealmWorldStudioElectronTrustedRuntimeMetadataProvider(input: {
  readonly appId: string;
  readonly runtimeEndpoint: string;
}): ElectronRuntimeBridgeTrustedMetadataProvider {
  const appId = requireText(input.appId, 'appId');
  const runtimeEndpoint = requireText(input.runtimeEndpoint, 'runtimeEndpoint');
  if (appId !== REALM_WORLD_STUDIO_RUNTIME_APP_ID) {
    throw new Error(`Realm World Studio Electron Runtime auth received unexpected appId: ${appId}`);
  }

  let appSessionMetadataProvider = createAppSessionMetadataProvider(appId, runtimeEndpoint);
  const trustedMetadataProvider: ElectronRuntimeBridgeTrustedMetadataProvider = async () => {
    const appSessionMetadata = await appSessionMetadataProvider();
    return toTrustedMetadata(appId, appSessionMetadata);
  };
  trustedMetadataProvider.invalidate = () => {
    appSessionMetadataProvider = createAppSessionMetadataProvider(appId, runtimeEndpoint);
  };
  return trustedMetadataProvider;
}

function createAppSessionMetadataProvider(
  appId: string,
  runtimeEndpoint: string,
): () => Promise<CoreMetadata> {
  const runtime = new Runtime({
    appId,
    transport: {
      type: 'node-grpc',
      endpoint: runtimeEndpoint,
    },
  });
  return createNimiRuntimeAppSessionMetadataProvider({
    appId,
    appInstanceId: REALM_WORLD_STUDIO_RUNTIME_APP_SESSION_INSTANCE_ID,
    deviceId: REALM_WORLD_STUDIO_RUNTIME_APP_SESSION_DEVICE_ID,
    capabilities: [...runtimeCapabilities],
    developerRegistration: runtimeDeveloperRegistration,
    ttlSeconds: runtimeAppSessionTtlSeconds,
    refreshSkewMs: runtimeAppSessionRefreshSkewMs,
    auth: runtime.auth,
  });
}

function toTrustedMetadata(
  appId: string,
  metadata: CoreMetadata,
): ElectronRuntimeBridgeTrustedMetadata {
  const sessionId = normalizeText(metadata['x-nimi-session-id']);
  const sessionToken = normalizeText(metadata['x-nimi-session-token']);
  return {
    metadata: {
      participantId: appId,
      callerKind: runtimeCallerKind,
      callerId: REALM_WORLD_STUDIO_RUNTIME_APP_INSTANCE_ID,
      surfaceId: 'realm-world-studio',
    },
    ...(sessionId && sessionToken ? { appSession: { sessionId, sessionToken } } : {}),
  };
}

function requireText(value: unknown, field: string): string {
  const normalized = normalizeText(value);
  if (!normalized) {
    throw new Error(`Realm World Studio Electron Runtime auth requires ${field}`);
  }
  return normalized;
}

function normalizeText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}
