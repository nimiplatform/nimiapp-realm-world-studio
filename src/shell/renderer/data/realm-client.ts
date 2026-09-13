import type { Realm } from '@nimiplatform/sdk/realm';
import { getStudioLocalAppClient } from '@renderer/app-shell/studio-platform.js';

export const STUDIO_REALM_SURFACE_METHODS = [
  'worldCoreControllerGetWorldCreationEligibility',
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
  'worldCoreControllerCreateWorldEntity',
  'worldCoreControllerListWorldRelationships',
  'worldCoreControllerGetWorldRelationship',
] as const;

export type StudioRealmSurfaceMethod = typeof STUDIO_REALM_SURFACE_METHODS[number];
export type StudioRealmSurface = Pick<Realm['worldCore'], StudioRealmSurfaceMethod>;

export function createStudioRealmClient(): StudioRealmSurface {
  const worlds = getStudioLocalAppClient().realm.worldCore;
  return {
    worldCoreControllerGetWorldCreationEligibility: () => worlds.getCreationEligibility(),
    worldCoreControllerListWorldCores: async (request) =>
      worlds.list(request.query),
    worldCoreControllerCreateWorldCore: async (request) =>
      worlds.create(request.body),
    worldCoreControllerGetWorldCore: request => worlds.get(request.path.worldId),
    worldCoreControllerReplaceWorldCore: request => worlds.replace(request.path.worldId, request.body),
    worldCoreControllerListWorldCharacters: request => worlds.listCharacters(request.path.worldId, request.query),
    worldCoreControllerGetWorldCharacter: request => worlds.getCharacter(request.path.characterId),
    worldCoreControllerCreateWorldCharacter: request => worlds.createCharacter(request.path.worldId, request.body),
    worldCoreControllerReplaceWorldCharacter: request => worlds.replaceCharacter(request.path.characterId, request.body),
    worldCoreControllerListWorldEntities: request => worlds.listEntities(request.path.worldId, request.query),
    worldCoreControllerGetWorldEntity: request => worlds.getEntity(request.path.entityId),
    worldCoreControllerCreateWorldEntity: request => worlds.createEntity(request.path.worldId, request.body),
    worldCoreControllerListWorldRelationships: request => worlds.listRelationships(request.path.worldId, request.query),
    worldCoreControllerGetWorldRelationship: request => worlds.getRelationship(request.path.relationshipId),
  };
}
