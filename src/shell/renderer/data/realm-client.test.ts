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

  beforeEach(() => {
    vi.clearAllMocks();
    getStudioLocalAppClientMock.mockReturnValue({
      realm: { worldCore: { list, create } },
    });
  });

  it('exposes only the declared Studio Realm core surface methods', () => {
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
    ]);
  });

  it('maps only world list and create onto the exact local-app Realm carrier', async () => {
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
        core: {},
        origin: { kind: 'manual' },
        visibility: 'private',
      },
    });

    expect(list).toHaveBeenCalledWith({ take: 5, visibility: 'private' });
    expect(create).toHaveBeenCalledWith({
      id: 'world-1',
      core: {},
      origin: { kind: 'manual' },
      visibility: 'private',
    });
  });

  it('keeps uncovered exact Realm operations unavailable instead of proxying them', () => {
    const realm = createStudioRealmClient();
    expect(() => realm.worldCoreControllerGetWorldCore({
      path: { worldId: 'world-1' },
    })).toThrow(/Realm world detail is not covered by the Nimi App Access operation set/);
    expect(list).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });
});
