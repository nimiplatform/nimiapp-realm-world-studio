import { describe, expect, it, vi } from 'vitest';
import type { StudioRealmSurface } from '@renderer/data/realm-client.js';
import {
  getCreatorWorldCharacterDetail,
  type CreatorWorldCharacterDetailLoadError,
} from './world-studio-client.js';

const worldId = 'world-cbdb';
const characterId = 'character-su-shi';

function worldCharacter(overrides: Record<string, unknown> = {}) {
  return {
    id: characterId,
    schemaVersion: 'world-character-core/v1',
    contentRevision: 1,
    contentHash: 'hash-character-su-shi',
    origin: { kind: 'forge' as const, sourceId: 'cbdb:person:su-shi', sourceVersion: '0.1.0' },
    entityId: 'cbdb:person:su-shi',
    worldId,
    core: {
      handle: 'cbdb-su-shi',
      displayName: '蘇軾',
      canonicalName: '蘇軾',
      aliases: ['子瞻'],
      sourceKind: 'CBDB',
      sourceProfile: 'cbdb-historical',
      sourceRefs: ['CBDB:255e4506ce'],
      birthYear: 1036,
      deathYear: 1101,
      representativeFacts: ['蘇軾 has CBDB birth year 1036.'],
      state: 'INCUBATING',
      ...overrides,
    },
    createdAt: '2026-06-16T00:00:00.000Z',
    updatedAt: '2026-06-16T00:00:00.000Z',
  };
}

function runtimeSnapshot() {
  return {
    snapshotSchemaVersion: 'runtime-source-snapshot/v1',
    snapshotId: 'snapshot-character-su-shi',
    sourceKind: 'worldCharacter' as const,
    sourceId: characterId,
    sourceWorldId: worldId,
    sourceContentRevision: 1,
    sourceContentHash: 'hash-character-su-shi',
    capturedAt: '2026-06-16T00:00:00.000Z',
    payloadHash: 'checksum:sushi',
    runtimeSourceRef: 'runtime-source:worldCharacter:character-su-shi:checksum:sushi',
    payload: {},
  };
}

function realmSurface(input: {
  character?: ReturnType<typeof worldCharacter>;
  characterError?: Error;
} = {}): StudioRealmSurface {
  return {
    worldCoreControllerGetWorldCharacter: vi.fn(async () => {
      if (input.characterError) throw input.characterError;
      return input.character || worldCharacter();
    }),
    worldCoreControllerCreateRuntimeSourceSnapshot: vi.fn(async () => runtimeSnapshot()),
  } as unknown as StudioRealmSurface;
}

describe('world-studio WorldCharacterCore client', () => {
  it('derives source skeleton and readiness from WorldCharacterCore', async () => {
    const realm = realmSurface({
      character: worldCharacter({ aliases: ['子瞻', '文忠', '東坡居士'] }),
    });

    const detail = await getCreatorWorldCharacterDetail(worldId, characterId, realm);

    expect(realm.worldCoreControllerGetWorldCharacter).toHaveBeenCalledWith({
      path: { characterId: characterId },
    });
    expect(realm.worldCoreControllerCreateRuntimeSourceSnapshot).toHaveBeenCalledWith({
      path: {},
      body: {
        sourceRef: {
          kind: 'worldCharacter',
          worldId,
          sourceId: characterId,
          sourceContentHash: 'hash-character-su-shi',
        },
      },
    });
    expect(detail.sourceSkeleton.aliases).toEqual(['子瞻', '文忠', '東坡居士']);
    expect(detail.chatReadiness).toMatchObject({
      authorityReason: 'WORLD_CHARACTER_CORE',
      consumerSurface: 'RUNTIME_SOURCE_SNAPSHOT',
      runtimeProjectionChecksum: 'checksum:sushi',
    });
  });

  it('reports character-detail as the failing load stage', async () => {
    const realm = realmSurface({
      characterError: new Error('WorldCharacterCore unavailable'),
    });

    await expect(getCreatorWorldCharacterDetail(worldId, characterId, realm)).rejects.toMatchObject({
      stage: 'character-detail',
      originalMessage: 'WorldCharacterCore unavailable',
    } satisfies Partial<CreatorWorldCharacterDetailLoadError>);
  });

  it('fails closed when the character belongs to a different world', async () => {
    const realm = realmSurface({
      character: worldCharacter({}),
    });
    vi.mocked(realm.worldCoreControllerGetWorldCharacter).mockResolvedValueOnce({
      ...worldCharacter(),
      worldId: 'world-other',
    });

    await expect(getCreatorWorldCharacterDetail(worldId, characterId, realm)).rejects.toThrow(
      'belongs to world-other',
    );
  });
});
