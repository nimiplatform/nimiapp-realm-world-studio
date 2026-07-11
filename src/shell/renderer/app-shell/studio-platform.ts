import {
  createInstalledNimiAppBootstrap,
  type InstalledNimiAppBootstrap,
} from '@nimiplatform/sdk/app';
import { createNimiError } from '@nimiplatform/sdk/types';
import { REALM_WORLD_STUDIO_APP_ID } from '../../app-identity.js';
import { createInstalledNimiAppStandardShellSurface } from '../bridge/index.js';

export const STUDIO_RUNTIME_APP_ID = REALM_WORLD_STUDIO_APP_ID;
export const STUDIO_CAPABILITY_UNAVAILABLE_REASON =
  'world-studio-protected-operation-set-not-admitted';
export const STUDIO_CAPABILITY_UNAVAILABLE_ACTION =
  'wait_for_world_studio_protected_operation_admission';

export function createStudioInstalledAppBootstrap(): InstalledNimiAppBootstrap {
  const standardShell = createInstalledNimiAppStandardShellSurface();
  return createInstalledNimiAppBootstrap({ standardShell });
}

export function requireStudioProtectedOperationSet(): never {
  createStudioInstalledAppBootstrap();
  throw createStudioProtectedOperationUnavailableError();
}

export function createStudioProtectedOperationUnavailableError(): Error {
  return createNimiError({
    message:
      'Realm World Studio account, Realm, AI, and publication operations require a separately admitted protected installed session.',
    reasonCode: STUDIO_CAPABILITY_UNAVAILABLE_REASON,
    actionHint: STUDIO_CAPABILITY_UNAVAILABLE_ACTION,
    source: 'sdk',
  });
}
