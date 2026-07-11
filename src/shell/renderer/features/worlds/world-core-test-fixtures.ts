import type { WorldCharacterCoreDto, WorldCoreDto } from '@nimiplatform/sdk/realm/generated';

export const TEST_WORLD_CORE: WorldCoreDto = {
  id: 'world-yuan-academy',
  creatorId: 'creator-1',
  visibility: 'private',
  schemaVersion: 'realm.world-core/v1',
  contentHash: 'hash-world-1',
  contentRevision: 7,
  createdAt: '2026-07-09T00:00:00.000Z',
  updatedAt: '2026-07-09T01:00:00.000Z',
  origin: { kind: 'manual' },
  core: {
    assets: { intents: [], resourceRefs: [] },
    authoring: { source: 'realm-world-studio-test' },
    entities: [{ entityId: 'entity-yao-sui', kind: 'worldCharacter', label: '姚燧' }],
    identity: {
      name: '元代文人书院世界',
      summary: '创作者维护的元代文人世界源。',
      themes: ['历史', '书院'],
    },
    ontology: {
      entityKinds: ['人物', '书院'],
      relationshipTypes: ['师承', '同僚'],
    },
    presentation: { displayName: '元代文人书院世界' },
    relationships: [],
    scenes: [],
    systems: [],
    timeModel: {
      anchor: {
        realStartedAt: '2026-07-09T00:00:00.000Z',
        worldStartedAt: '1271-01-01T00:00:00.000Z',
        worldStartedAtDisplay: '至元八年',
      },
      calendar: null,
      displayFormat: null,
      flowRatio: 1,
      isPaused: true,
      mode: 'static',
      pausedWorldTime: '1271-01-01T00:00:00.000Z',
    },
    timeline: { events: [] },
  },
};

export const TEST_WORLD_CHARACTER_CORE: WorldCharacterCoreDto = {
  id: 'yao-sui',
  worldId: 'world-yuan-academy',
  entityId: 'entity-yao-sui',
  creatorId: 'creator-1',
  visibility: 'private',
  schemaVersion: 'realm.world-character-core/v1',
  contentHash: 'hash-character-1',
  contentRevision: 3,
  createdAt: '2026-07-09T00:10:00.000Z',
  updatedAt: '2026-07-09T01:10:00.000Z',
  origin: { kind: 'manual' },
  core: {
    profile: {
      displayName: '姚燧',
      role: '元代文人',
      summary: '世界拥有的人物源。',
      tags: ['文人'],
    },
  },
};
