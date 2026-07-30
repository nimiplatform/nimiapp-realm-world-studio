import { createNimiClient } from '@nimiplatform/sdk';
import type { NimiLocalAppClient } from '@nimiplatform/sdk/app';
import { createNimiError } from '@nimiplatform/sdk/types';
import { REALM_WORLD_STUDIO_APP_ID } from '../../app-identity.js';
import { createNimiLocalAppStandardShellSurface } from '../bridge/index.js';

export const STUDIO_RUNTIME_APP_ID = REALM_WORLD_STUDIO_APP_ID;
export const STUDIO_CAPABILITY_UNAVAILABLE_REASON =
  'world-studio-protected-operation-set-not-admitted';
export const STUDIO_CAPABILITY_UNAVAILABLE_ACTION =
  'wait_for_world_studio_protected_operation_admission';

let studioLocalAppClient: NimiLocalAppClient | null = null;

export function getStudioLocalAppClient(): NimiLocalAppClient {
  studioLocalAppClient ??= createNimiClient({
    localApp: {
      standardShell: createNimiLocalAppStandardShellSurface(),
    },
  });
  return studioLocalAppClient;
}

export function requireStudioProtectedOperation(operation?: string): never {
  throw createStudioProtectedOperationUnavailableError(operation);
}

export function createStudioProtectedOperationUnavailableError(
  operation = 'Realm World Studio account, Realm, AI, and publication operations',
): Error {
  return createNimiError({
    message: `${operation} require an admitted Desktop-supervised protected operation.`,
    reasonCode: STUDIO_CAPABILITY_UNAVAILABLE_REASON,
    actionHint: STUDIO_CAPABILITY_UNAVAILABLE_ACTION,
    source: 'sdk',
  });
}
