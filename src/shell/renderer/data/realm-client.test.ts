import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getStudioLocalAppClientMock } = vi.hoisted(() => ({
  getStudioLocalAppClientMock: vi.fn(),
}));

vi.mock('@renderer/app-shell/studio-platform.js', () => ({
  getStudioLocalAppClient: getStudioLocalAppClientMock,
  requireStudioProtectedOperation: (operation: string) => {
    throw Object.assign(new Error(`${operation} is not covered by the Nimi App Access operation set available to this app.`), {
      reasonCode: 'world-studio-operation-not-in-app-access',
      actionHint: 'wait_for_platform_app_surface',
    });
  },
}));

import {
  createStudioRealmClient,
  STUDIO_REALM_SURFACE_METHODS,
} from './realm-client.js';

describe('studio Realm facade boundary', () => {
  const list = vi.fn();
  const create = vi.fn();
  const get = vi.fn();
  const replace = vi.fn();
  const getCreationEligibility = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    getStudioLocalAppClientMock.mockReturnValue({
      realm: { worldCore: { list, create, get, replace, getCreationEligibility } },
    });
  });

  it('exposes only the declared Studio Realm core surface methods', () => {
    expect([...STUDIO_REALM_SURFACE_METHODS]).toEqual([
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
    ]);
  });

  it('maps world list and create onto the exact local-app Realm carrier', async () => {
    list.mockResolvedValue([]);
    create.mockResolvedValue({ id: 'world-1' });
    const realm = createStudioRealmClient();

    await realm.worldCoreControllerListWorldCores({
      path: {},
      query: { take: 5, visibility: 'private' },
    });
    await realm.worldCoreControllerCreateWorldCore({
      path: {},
      body: {
        id: 'world-1',
        core: {} as never,
        lorebookDeclaration: {
          identityBaseSetting: 'Test world.',
          worldRules: [],
          rolePlacements: [],
        },
        origin: { kind: 'manual' },
        visibility: 'private',
      },
    });

    expect(list).toHaveBeenCalledWith({ take: 5, visibility: 'private' });
    expect(create).toHaveBeenCalledWith({
      id: 'world-1',
      lorebookDeclaration: {
        identityBaseSetting: 'Test world.',
        worldRules: [],
        rolePlacements: [],
      },
      core: {},
      origin: { kind: 'manual' },
      visibility: 'private',
    });
  });

  it('forwards exact detail, eligibility and replacement calls and preserves owner failure', async () => {
    const realm = createStudioRealmClient();
    await realm.worldCoreControllerGetWorldCore({ path: { worldId: 'world-1' } });
    expect(get).toHaveBeenCalledWith('world-1');
    await realm.worldCoreControllerGetWorldCreationEligibility({ path: {} });
    expect(getCreationEligibility).toHaveBeenCalledWith();
    const failure = Object.assign(new Error('denied'), { reasonCode: 'access-denied' });
    replace.mockRejectedValueOnce(failure);
    await expect(realm.worldCoreControllerReplaceWorldCore({ path: { worldId: 'world-1' }, body: { baseContentHash: 'a'.repeat(64) } as never })).rejects.toBe(failure);
    expect(list).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });
});
