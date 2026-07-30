import type { Realm } from '@nimiplatform/sdk/realm';
import {
  getStudioLocalAppClient,
  requireStudioProtectedOperation,
} from '@renderer/app-shell/studio-platform.js';

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
] as const;

export type StudioRealmSurfaceMethod = typeof STUDIO_REALM_SURFACE_METHODS[number];
export type StudioRealmSurface = Pick<Realm['worldCore'], StudioRealmSurfaceMethod>;

export function createStudioRealmClient(): StudioRealmSurface {
  return {
    worldCoreControllerListWorldCores: async (request) =>
      getStudioLocalAppClient().realm.worldCore.list(request.query),
    worldCoreControllerCreateWorldCore: async (request) =>
      getStudioLocalAppClient().realm.worldCore.create(request.body),
    worldCoreControllerGetWorldCore: () =>
      requireStudioProtectedOperation('Realm world detail'),
    worldCoreControllerReplaceWorldCore: () =>
      requireStudioProtectedOperation('Realm world replacement'),
    worldCoreControllerListWorldCharacters: () =>
      requireStudioProtectedOperation('Realm world-character list'),
    worldCoreControllerGetWorldCharacter: () =>
      requireStudioProtectedOperation('Realm world-character detail'),
    worldCoreControllerCreateWorldCharacter: () =>
      requireStudioProtectedOperation('Realm world-character creation'),
    worldCoreControllerReplaceWorldCharacter: () =>
      requireStudioProtectedOperation('Realm world-character replacement'),
    worldCoreControllerListWorldEntities: () =>
      requireStudioProtectedOperation('Realm world-entity list'),
    worldCoreControllerGetWorldEntity: () =>
      requireStudioProtectedOperation('Realm world-entity detail'),
    worldCoreControllerListWorldRelationships: () =>
      requireStudioProtectedOperation('Realm world-relationship list'),
    worldCoreControllerGetWorldRelationship: () =>
      requireStudioProtectedOperation('Realm world-relationship detail'),
  };
}
