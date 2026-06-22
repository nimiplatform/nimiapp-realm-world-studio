import { describe, expect, it, vi } from 'vitest';
import type { StudioRealmSurface } from '@renderer/data/realm-client.js';
import {
  getCreatorWorldCharacterDetail,
  listCreatorWorlds,
  NIMI_WORLD_STUDIO_MAINTAINER_ID,
  type CreatorWorldCharacterDetailLoadError,
  updateCreatorWorldCharacter,
} from './world-studio-client.js';

const worldId = 'world-cbdb';
const characterId = 'character-su-shi';
const hallidayAccountId = '01J00000000000000000000000';

function worldCharacter(overrides: Record<string, unknown> = {}) {
  const core = {
    identity: {
      name: '蘇軾',
      summary: '蘇軾 is grounded in CBDB historical source material.',
      aliases: ['子瞻'],
    },
    presentation: {
      displayName: '蘇軾',
      shortBio: '蘇軾 is grounded in CBDB historical source material.',
    },
    placement: {
      worldId,
      entityId: 'cbdb:person:su-shi',
      sceneRefs: [],
    },
    biography: {
      milestones: [],
      sourceNotes: ['蘇軾 has CBDB birth year 1036.'],
    },
    psychology: {
      drives: [],
      boundaries: [],
    },
    knowledge: {
      topics: [],
      constraints: [],
    },
    relationships: [],
    capabilities: {
      interactionModes: ['dialogue'],
      tools: [],
    },
    interactionProfile: {
      tone: 'measured',
      cadence: 'slow',
    },
    assets: {
      resourceRefs: [],
      intents: [],
    },
    authoring: {
      source: 'cbdb-historical',
      notes: [],
      extensions: {
        candidateId: 'candidate-su-shi',
        sourceRefs: ['CBDB:255e4506ce'],
        sourceFacts: {
          birthYear: 1036,
          deathYear: 1101,
          representativeFacts: ['蘇軾 has CBDB birth year 1036.'],
        },
        worldStudioSettings: {
          communication: {},
          positioning: {},
        },
      },
    },
    ...overrides,
  };
  return {
    id: characterId,
    schemaVersion: 'realm.world-character-core/v1',
    contentRevision: 1,
    contentHash: 'hash-character-su-shi',
    origin: { kind: 'forge' as const, sourceId: 'cbdb:person:su-shi', sourceVersion: '0.1.0' },
    entityId: 'cbdb:person:su-shi',
    worldId,
    core,
    createdAt: '2026-06-16T00:00:00.000Z',
    updatedAt: '2026-06-16T00:00:00.000Z',
  };
}

function runtimeSnapshot() {
  return {
    snapshotSchemaVersion: 'realm.runtime-source-snapshot/v1',
    snapshotId: 'snapshot-character-su-shi',
    sourceKind: 'worldCharacter' as const,
    sourceId: characterId,
    sourceWorldId: worldId,
    sourceContentRevision: 1,
    sourceContentHash: 'hash-character-su-shi',
    capturedAt: '2026-06-16T00:00:00.000Z',
    payloadHash: 'checksum:sushi',
    runtimeSourceRef: 'runtime-source:worldCharacter:world-cbdb:character-su-shi:hash-character-su-shi',
    payload: {},
  };
}

function worldEntity(overrides: Record<string, unknown> = {}) {
  const core = {
    identity: {
      name: '蘇軾',
      summary: '蘇軾 entity record grounded in CBDB.',
      kind: 'person',
      aliases: ['子瞻', '文忠', '東坡居士'],
    },
    classification: {
      tags: ['cbdb', 'song'],
    },
    facts: [
      {
        factId: 'birth-year',
        type: 'birthYear',
        label: 'Birth year',
        value: 1036,
        sourceRefs: ['CBDB:255e4506ce'],
        confidence: 'recorded',
      },
      {
        factId: 'death-year',
        type: 'deathYear',
        label: 'Death year',
        value: 1101,
        sourceRefs: ['CBDB:255e4506ce'],
        confidence: 'recorded',
      },
    ],
    evidence: {
      sourceRefs: ['CBDB:255e4506ce'],
      completeness: 'complete',
    },
    assets: {
      resourceRefs: [],
      intents: [],
    },
    authoring: {
      source: 'cbdb-historical',
      notes: [],
      extensions: {},
    },
    ...overrides,
  };
  return {
    id: 'cbdb:person:su-shi',
    schemaVersion: 'realm.world-entity-core/v1',
    contentRevision: 1,
    contentHash: 'hash-entity-su-shi',
    origin: { kind: 'forge' as const, sourceId: 'cbdb:person:su-shi', sourceVersion: '0.1.0' },
    worldId,
    kind: 'person',
    core,
    createdAt: '2026-06-16T00:00:00.000Z',
    updatedAt: '2026-06-16T00:00:00.000Z',
  };
}

function worldCore(id: string, creatorId: string | null, entityCount: number) {
  return {
    id,
    schemaVersion: 'realm.world-core/v1',
    contentRevision: 1,
    contentHash: `hash-${id}`,
    origin: { kind: 'forge' as const, sourceId: id, sourceVersion: '0.1.0' },
    creatorId,
    visibility: 'public' as const,
    core: {
      identity: {
        name: id,
        summary: `${id} summary`,
      },
      presentation: {},
      entities: Array.from({ length: entityCount }).map((_, index) => ({
        entityId: `${id}-entity-${index + 1}`,
        kind: 'person',
      })),
    },
    createdAt: '2026-06-16T00:00:00.000Z',
    updatedAt: '2026-06-16T00:00:00.000Z',
  };
}

function realmSurface(input: {
  character?: ReturnType<typeof worldCharacter>;
  entity?: ReturnType<typeof worldEntity>;
  characterError?: Error;
  entityError?: Error;
  snapshotError?: Error;
} = {}): StudioRealmSurface {
  return {
    worldCoreControllerGetWorldCharacter: vi.fn(async () => {
      if (input.characterError) throw input.characterError;
      return input.character || worldCharacter();
    }),
    worldCoreControllerGetWorldEntity: vi.fn(async () => {
      if (input.entityError) throw input.entityError;
      return input.entity || worldEntity();
    }),
    worldCoreControllerCreateRuntimeSourceSnapshot: vi.fn(async () => {
      if (input.snapshotError) throw input.snapshotError;
      return runtimeSnapshot();
    }),
    worldCoreControllerReplaceWorldCharacter: vi.fn(async () => ({
      ...worldCharacter(),
      contentRevision: 2,
      contentHash: 'hash-character-su-shi-updated',
    })),
  } as unknown as StudioRealmSurface;
}

describe('world-studio WorldCharacterCore client', () => {
  it('treats halliday email login worlds as maintained by the stable Realm account id', async () => {
    const realm = {
      worldCoreControllerListWorldCores: vi.fn(async () => [
        worldCore('cbdb-tang-literati-world', hallidayAccountId, 20),
        worldCore('cbdb-ming-lettered-networks-world', hallidayAccountId, 100),
        worldCore('world-email-owned', 'halliday@nimi.ai', 1),
        worldCore('world-other', 'other-account-id', 1),
      ]),
      worldCoreControllerListWorldCharacters: vi.fn(async () => [
        worldCharacter(),
      ]),
    } as unknown as StudioRealmSurface;

    const worlds = await listCreatorWorlds(realm);

    expect(worlds.map((world) => world.id)).toEqual([
      'cbdb-tang-literati-world',
      'cbdb-ming-lettered-networks-world',
    ]);
    expect(worlds.every((world) => world.creatorId === hallidayAccountId)).toBe(true);
    expect(realm.worldCoreControllerListWorldCharacters).toHaveBeenCalledTimes(2);
  });

  it('lists only Nimi-maintained worlds and counts characters from WorldCharacterCore list', async () => {
    const realm = {
      worldCoreControllerListWorldCores: vi.fn(async () => [
        worldCore('world-maintained', NIMI_WORLD_STUDIO_MAINTAINER_ID, 99),
        worldCore('world-other', 'other@example.test', 1),
        worldCore('world-system', null, 5),
      ]),
      worldCoreControllerListWorldCharacters: vi.fn(async () => [
        worldCharacter(),
        { ...worldCharacter(), id: 'character-li-qingzhao' },
      ]),
    } as unknown as StudioRealmSurface;

    const worlds = await listCreatorWorlds(realm);

    expect(realm.worldCoreControllerListWorldCores).toHaveBeenCalledWith({ path: {}, query: { take: 100 } });
    expect(worlds).toEqual([
      expect.objectContaining({
        id: 'world-maintained',
        creatorId: NIMI_WORLD_STUDIO_MAINTAINER_ID,
        authorityReason: 'NIMI_MAINTAINER',
        characterCount: 2,
      }),
    ]);
    expect(realm.worldCoreControllerListWorldCharacters).toHaveBeenCalledTimes(1);
  });

  it('derives source skeleton and readiness from WorldCharacterCore', async () => {
    const realm = realmSurface({
      character: worldCharacter({
        identity: {
          name: '蘇軾',
          summary: '蘇軾 is grounded in CBDB historical source material.',
          aliases: ['子瞻', '文忠', '東坡居士'],
        },
      }),
    });

    const detail = await getCreatorWorldCharacterDetail(worldId, characterId, realm);

    expect(realm.worldCoreControllerGetWorldCharacter).toHaveBeenCalledWith({
      path: { characterId: characterId },
    });
    expect(realm.worldCoreControllerGetWorldEntity).toHaveBeenCalledWith({
      path: { entityId: 'cbdb:person:su-shi' },
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
    expect(detail.sourceSkeleton.sourceRefs[0]).toMatchObject({
      sourceRef: 'CBDB:255e4506ce',
      kind: 'sourceRecord',
      worldId,
      sourceId: 'cbdb:person:su-shi',
      sourceContentHash: 'hash-entity-su-shi',
    });
    expect(detail.chatReadiness).toMatchObject({
      authorityReason: 'WORLD_CHARACTER_CORE',
      consumerSurface: 'RUNTIME_SOURCE_SNAPSHOT',
      runtimeProjectionChecksum: 'checksum:sushi',
      gates: {
        runtimeSourceIdentityReady: true,
      },
    });
  });

  it('keeps character detail available when RuntimeSourceSnapshot creation fails', async () => {
    const realm = realmSurface({
      snapshotError: new Error('snapshot unavailable'),
    });

    const detail = await getCreatorWorldCharacterDetail(worldId, characterId, realm);

    expect(detail.chatReadiness.runtimeProjectionChecksum).toBe('hash-character-su-shi');
    expect(detail.chatReadiness.runtimeSourceSnapshotError).toBe('snapshot unavailable');
    expect(detail.chatReadiness.gates.runtimeSourceIdentityReady).toBe(false);
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

  it('fails closed when entityId is missing', async () => {
    const realm = realmSurface({
      character: {
        ...worldCharacter(),
        entityId: '',
      },
    });

    await expect(getCreatorWorldCharacterDetail(worldId, characterId, realm)).rejects.toThrow(
      'missing required entityId',
    );
    expect(realm.worldCoreControllerGetWorldEntity).not.toHaveBeenCalled();
  });

  it('fails closed when the bound entity belongs to a different world', async () => {
    const realm = realmSurface({
      entity: {
        ...worldEntity(),
        worldId: 'world-other',
      },
    });

    await expect(getCreatorWorldCharacterDetail(worldId, characterId, realm)).rejects.toThrow(
      'WorldEntityCore cbdb:person:su-shi belongs to world-other',
    );
  });

  it('submits only canonical nested WorldCharacterCore fields on update', async () => {
    const realm = realmSurface();

    await updateCreatorWorldCharacter(worldId, characterId, {
      displayName: '東坡先生',
      description: 'Creator-reviewed public character description.',
      greeting: '久候了。',
      avatarUrl: 'https://example.test/avatar.png',
      profileCoverUrl: 'https://example.test/cover.png',
      contentStyle: 'literary and concise',
      targetAudience: 'Song history readers',
      positioning: 'Historical companion',
      voiceId: 'preset_voice_id:su-shi',
      voiceDescription: 'Measured baritone',
      speechModelId: 'speech-v1',
      speechRoutePolicy: 'cloud',
    }, realm);

    const replace = vi.mocked(realm.worldCoreControllerReplaceWorldCharacter);
    expect(replace).toHaveBeenCalledWith({
      path: { characterId },
      body: expect.objectContaining({
        baseContentHash: 'hash-character-su-shi',
        origin: { kind: 'forge', sourceId: 'cbdb:person:su-shi', sourceVersion: '0.1.0' },
        entityId: 'cbdb:person:su-shi',
      }),
    });

    const submitted = replace.mock.calls[0]?.[0].body as { core: Record<string, unknown> };
    expect(submitted.core).toMatchObject({
      identity: {
        name: '東坡先生',
        summary: 'Creator-reviewed public character description.',
      },
      presentation: {
        displayName: '東坡先生',
        shortBio: 'Creator-reviewed public character description.',
      },
      interactionProfile: {
        greeting: '久候了。',
      },
      assets: {
        externalRefs: [
          expect.objectContaining({ kind: 'avatar', uri: 'https://example.test/avatar.png' }),
          expect.objectContaining({ kind: 'profileCover', uri: 'https://example.test/cover.png' }),
        ],
      },
      authoring: {
        extensions: {
          worldStudioSettings: {
            communication: { contentStyle: 'literary and concise' },
            positioning: {
              targetAudience: 'Song history readers',
              positioning: 'Historical companion',
            },
            voice: {
              voiceId: 'preset_voice_id:su-shi',
              description: 'Measured baritone',
              speechModelId: 'speech-v1',
              speechRoutePolicy: 'cloud',
            },
          },
        },
      },
    });
    for (const legacyField of [
      'displayName',
      'description',
      'greeting',
      'avatarUrl',
      'profileCoverUrl',
      'communication',
      'positioning',
      'voice',
    ]) {
      expect(submitted.core).not.toHaveProperty(legacyField);
    }
  });

  it('fails closed when replaceWorldCharacter returns no canonical character', async () => {
    const realm = realmSurface();
    vi.mocked(realm.worldCoreControllerReplaceWorldCharacter).mockResolvedValueOnce(undefined as never);

    await expect(updateCreatorWorldCharacter(worldId, characterId, {
      displayName: '東坡先生',
      description: 'Creator-reviewed public character description.',
      greeting: '',
      avatarUrl: '',
      profileCoverUrl: '',
      contentStyle: '',
      targetAudience: '',
      positioning: '',
      voiceId: '',
      voiceDescription: '',
      speechModelId: '',
      speechRoutePolicy: '',
    }, realm)).rejects.toThrow('replace returned an invalid canonical response');
  });
});
