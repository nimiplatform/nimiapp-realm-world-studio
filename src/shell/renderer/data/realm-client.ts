import type { Realm } from '@nimiplatform/sdk/realm';
import { createStudioProtectedOperationUnavailableError } from '@renderer/app-shell/studio-platform.js';

export const STUDIO_REALM_SURFACE_METHODS = [
  'worldCoreControllerListWorldCores',
  'worldCoreControllerGetWorldCore',
  'worldCoreControllerCreateWorldCore',
  'worldCoreControllerReplaceWorldCore',
  'worldCoreControllerListWorldCharacters',
  'worldCoreControllerGetWorldCharacter',
  'worldCoreControllerCreateWorldCharacter',
  'worldCoreControllerReplaceWorldCharacter',
  'worldCoreControllerListWorldEntities',
  'worldCoreControllerGetWorldEntity',
  'worldCoreControllerListWorldRelationships',
  'worldCoreControllerGetWorldRelationship',
  'worldCoreControllerCreateSourceMaterializationPacket',
] as const;

export type StudioRealmSurfaceMethod = typeof STUDIO_REALM_SURFACE_METHODS[number];
export type StudioRealmSurface = Pick<Realm['worldCore'], StudioRealmSurfaceMethod>;

export function createStudioRealmSurface(realm: Pick<Realm, 'worldCore'>): StudioRealmSurface {
  const worldCore = realm.worldCore;
  return {
    worldCoreControllerListWorldCores: worldCore.worldCoreControllerListWorldCores,
    worldCoreControllerGetWorldCore: worldCore.worldCoreControllerGetWorldCore,
    worldCoreControllerCreateWorldCore: worldCore.worldCoreControllerCreateWorldCore,
    worldCoreControllerReplaceWorldCore: worldCore.worldCoreControllerReplaceWorldCore,
    worldCoreControllerListWorldCharacters: worldCore.worldCoreControllerListWorldCharacters,
    worldCoreControllerGetWorldCharacter: worldCore.worldCoreControllerGetWorldCharacter,
    worldCoreControllerCreateWorldCharacter: worldCore.worldCoreControllerCreateWorldCharacter,
    worldCoreControllerReplaceWorldCharacter: worldCore.worldCoreControllerReplaceWorldCharacter,
    worldCoreControllerListWorldEntities: worldCore.worldCoreControllerListWorldEntities,
    worldCoreControllerGetWorldEntity: worldCore.worldCoreControllerGetWorldEntity,
    worldCoreControllerListWorldRelationships: worldCore.worldCoreControllerListWorldRelationships,
    worldCoreControllerGetWorldRelationship: worldCore.worldCoreControllerGetWorldRelationship,
    worldCoreControllerCreateSourceMaterializationPacket: worldCore.worldCoreControllerCreateSourceMaterializationPacket,
  };
}

export function createStudioRealmClient(): StudioRealmSurface {
  throw createStudioProtectedOperationUnavailableError();
}
