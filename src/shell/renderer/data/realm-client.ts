import type { Realm } from '@nimiplatform/sdk/realm';
import { getCurrentStudioNimiClient } from '@renderer/app-shell/studio-platform.js';

export const STUDIO_REALM_SURFACE_METHODS = [
  'worldPublicControllerGetWorld',
  'worldPublicControllerGetWorldDetailWithCharacters',
  'worldPublicControllerListWorldCharacters',
  'worldPublicControllerListWorlds',
] as const;

export type StudioRealmSurfaceMethod = typeof STUDIO_REALM_SURFACE_METHODS[number];
export type StudioRealmSurface = Pick<Realm['generated'], StudioRealmSurfaceMethod>;

export function createStudioRealmSurface(realm: Pick<Realm, 'generated'>): StudioRealmSurface {
  const generated = realm.generated;
  return {
    worldPublicControllerGetWorld: generated.worldPublicControllerGetWorld.bind(generated),
    worldPublicControllerGetWorldDetailWithCharacters: generated.worldPublicControllerGetWorldDetailWithCharacters.bind(generated),
    worldPublicControllerListWorldCharacters: generated.worldPublicControllerListWorldCharacters.bind(generated),
    worldPublicControllerListWorlds: generated.worldPublicControllerListWorlds.bind(generated),
  };
}

export function createStudioRealmClient(): StudioRealmSurface {
  const realm = getCurrentStudioNimiClient().realm;
  if (!realm) {
    throw new Error(
      'Realm World Studio Realm client is unavailable. Reopen Studio after Runtime account bootstrap completes.',
    );
  }
  return createStudioRealmSurface(realm);
}
