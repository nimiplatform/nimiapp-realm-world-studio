import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { WorldCharacterCoreDto, WorldCoreDto } from '@nimiplatform/sdk/realm/generated';
import { createStudioRealmClient, type StudioRealmSurface } from '@renderer/data/realm-client.js';
import {
  createCreatorWorldCore,
  getCreatorWorldWorkbench,
  replaceCreatorWorldCharacterCore,
  replaceCreatorWorldCore,
} from './world-core-client.js';

vi.mock('@renderer/data/realm-client.js', () => ({
  createStudioRealmClient: vi.fn(),
}));

const worldCore = {
  id: 'world-1',
  creatorId: 'creator-1',
  visibility: 'private',
  schemaVersion: 'world-core.v1',
  contentHash: 'hash-world-1',
  contentRevision: 1,
  createdAt: '2026-07-09T00:00:00.000Z',
  updatedAt: '2026-07-09T00:00:00.000Z',
  origin: { kind: 'manual' },
  core: { identity: { name: 'World 1' } },
} satisfies WorldCoreDto;

const characterCore = {
  id: 'character-1',
  worldId: 'world-1',
  entityId: 'entity-1',
  schemaVersion: 'world-character-core.v1',
  contentHash: 'hash-character-1',
  contentRevision: 1,
  createdAt: '2026-07-09T00:00:00.000Z',
  updatedAt: '2026-07-09T00:00:00.000Z',
  origin: { kind: 'manual' },
  core: { profile: { displayName: 'Character 1' } },
} satisfies WorldCharacterCoreDto;

function installRealmSurface(overrides: Partial<Record<keyof StudioRealmSurface, ReturnType<typeof vi.fn>>> = {}) {
  const realm = {
    worldCoreControllerListWorldCores: vi.fn(),
    worldCoreControllerGetWorldCore: vi.fn(),
    worldCoreControllerCreateWorldCore: vi.fn(),
    worldCoreControllerReplaceWorldCore: vi.fn(),
    worldCoreControllerListWorldCharacters: vi.fn(),
    worldCoreControllerGetWorldCharacter: vi.fn(),
    worldCoreControllerCreateWorldCharacter: vi.fn(),
    worldCoreControllerReplaceWorldCharacter: vi.fn(),
    worldCoreControllerListWorldEntities: vi.fn(),
    worldCoreControllerGetWorldEntity: vi.fn(),
    worldCoreControllerListWorldRelationships: vi.fn(),
    worldCoreControllerGetWorldRelationship: vi.fn(),
    worldCoreControllerCreateSourceMaterializationPacket: vi.fn(),
    ...overrides,
  } satisfies Record<keyof StudioRealmSurface, ReturnType<typeof vi.fn>>;
  vi.mocked(createStudioRealmClient).mockReturnValue(realm as unknown as StudioRealmSurface);
  return realm;
}

describe('Realm World Studio world-core client writes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates worlds through WorldCoreController.createWorldCore only', async () => {
    const realm = installRealmSurface({
      worldCoreControllerCreateWorldCore: vi.fn().mockResolvedValue(worldCore),
    });

    await createCreatorWorldCore({
      id: 'world-1',
      core: { identity: { name: 'World 1' } },
      origin: { kind: 'manual' },
      visibility: 'private',
    });

    expect(realm.worldCoreControllerCreateWorldCore).toHaveBeenCalledWith({
      path: {},
      body: {
        id: 'world-1',
        core: { identity: { name: 'World 1' } },
        origin: { kind: 'manual' },
        visibility: 'private',
      },
    });
  });

  it('replaces worlds with baseContentHash and validates returned world id', async () => {
    const realm = installRealmSurface({
      worldCoreControllerReplaceWorldCore: vi.fn().mockResolvedValue({
        ...worldCore,
        contentHash: 'hash-world-2',
      }),
    });

    await replaceCreatorWorldCore('world-1', {
      id: 'world-1',
      baseContentHash: 'hash-world-1',
      core: { identity: { name: 'Updated World' } },
      origin: { kind: 'manual' },
      visibility: 'unlisted',
    });

    expect(realm.worldCoreControllerReplaceWorldCore).toHaveBeenCalledWith({
      path: { worldId: 'world-1' },
      body: {
        id: 'world-1',
        baseContentHash: 'hash-world-1',
        core: { identity: { name: 'Updated World' } },
        origin: { kind: 'manual' },
        visibility: 'unlisted',
      },
    });
  });

  it('fails closed when workbench WorldCore response does not match the route world id', async () => {
    installRealmSurface({
      worldCoreControllerGetWorldCore: vi.fn().mockResolvedValue({
        ...worldCore,
        id: 'other-world',
      }),
      worldCoreControllerListWorldCharacters: vi.fn().mockResolvedValue([]),
    });

    await expect(getCreatorWorldWorkbench('world-1')).rejects.toThrow(/WorldCore response id mismatch/);
  });

  it('fails closed when create returns malformed canonical WorldCore data', async () => {
    installRealmSurface({
      worldCoreControllerCreateWorldCore: vi.fn().mockResolvedValue({
        ...worldCore,
        contentHash: '',
      }),
    });

    await expect(createCreatorWorldCore({
      id: 'world-1',
      core: { identity: { name: 'World 1' } },
      origin: { kind: 'manual' },
      visibility: 'private',
    })).rejects.toThrow(/WorldCoreDto\.contentHash/);
  });

  it('fails closed when a world-character replace response does not match the selected parent world', async () => {
    installRealmSurface({
      worldCoreControllerReplaceWorldCharacter: vi.fn().mockResolvedValue({
        ...characterCore,
        worldId: 'other-world',
      }),
    });

    await expect(replaceCreatorWorldCharacterCore('world-1', 'character-1', {
      id: 'character-1',
      baseContentHash: 'hash-character-1',
      core: { profile: { displayName: 'Updated Character' } },
      entityId: 'entity-1',
      origin: { kind: 'manual' },
    })).rejects.toThrow(/parent mismatch/);
  });
});
