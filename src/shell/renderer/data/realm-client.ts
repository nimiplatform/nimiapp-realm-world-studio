import type { Realm } from '@nimiplatform/sdk/realm';
import { getCurrentStudioNimiClient } from '@renderer/app-shell/studio-platform.js';

export const STUDIO_REALM_SURFACE_METHODS = [
  'worldCoreControllerListWorldCores',
  'worldCoreControllerGetWorldCore',
  'worldCoreControllerListWorldEntities',
  'worldCoreControllerGetWorldEntity',
  'worldCoreControllerListWorldRelationships',
  'worldCoreControllerListWorldCharacters',
  'worldCoreControllerGetWorldCharacter',
  'worldCoreControllerReplaceWorldCharacter',
  'worldCoreControllerCreateRuntimeSourceSnapshot',
] as const;

export type StudioRealmSurfaceMethod = typeof STUDIO_REALM_SURFACE_METHODS[number];
export type StudioRealmSurface = Pick<Realm['generated'], StudioRealmSurfaceMethod>;

export function createStudioRealmSurface(realm: Pick<Realm, 'generated'>): StudioRealmSurface {
  const generated = realm.generated;
  return {
    worldCoreControllerListWorldCores: generated.worldCoreControllerListWorldCores.bind(generated),
    worldCoreControllerGetWorldCore: generated.worldCoreControllerGetWorldCore.bind(generated),
    worldCoreControllerListWorldEntities: generated.worldCoreControllerListWorldEntities.bind(generated),
    worldCoreControllerGetWorldEntity: generated.worldCoreControllerGetWorldEntity.bind(generated),
    worldCoreControllerListWorldRelationships: generated.worldCoreControllerListWorldRelationships.bind(generated),
    worldCoreControllerListWorldCharacters: generated.worldCoreControllerListWorldCharacters.bind(generated),
    worldCoreControllerGetWorldCharacter: generated.worldCoreControllerGetWorldCharacter.bind(generated),
    worldCoreControllerReplaceWorldCharacter: generated.worldCoreControllerReplaceWorldCharacter.bind(generated),
    worldCoreControllerCreateRuntimeSourceSnapshot: generated.worldCoreControllerCreateRuntimeSourceSnapshot.bind(generated),
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
