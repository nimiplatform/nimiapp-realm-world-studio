import { describe, expect, it } from 'vitest';
import { STUDIO_REALM_SURFACE_METHODS } from './realm-client.js';

describe('studio Realm facade boundary', () => {
  it('exposes only the admitted Studio Realm core surface methods', () => {
    expect([...STUDIO_REALM_SURFACE_METHODS]).toEqual([
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
    ]);
  });
});
