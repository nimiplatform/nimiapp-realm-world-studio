import type { RealmModel } from '@nimiplatform/sdk/realm/generated';

export const TEST_WORLD_CORE: RealmModel<'WorldCoreDto'> = {
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

export const TEST_WORLD_CHARACTER_CORE: RealmModel<'WorldCharacterCoreDto'> = {
  id: 'yao-sui',
  worldId: 'world-yuan-academy',
  creatorId: 'creator-1',
  visibility: 'private',
  schemaVersion: 'realm.world-character-core/v1',
  contentHash: 'hash-character-1',
  contentRevision: 3,
  sourceHash: 'source-hash-character-1',
  createdAt: '2026-07-09T00:10:00.000Z',
  updatedAt: '2026-07-09T01:10:00.000Z',
  origin: { kind: 'manual' },
  materializationReadiness: {
    status: 'ready',
    blockers: [],
  },
  validity: {
    status: 'valid',
    issues: [],
  },
  worldEntityRef: {
    kind: 'worldEntity',
    worldId: 'world-yuan-academy',
    entityId: 'entity-yao-sui',
  },
  profile: {
    assets: {
      intents: [],
      resourceRefs: [],
    },
    authoring: {
      source: 'realm-world-studio-test',
    },
    identity: {
      name: '姚燧',
      summary: '世界拥有的人物源。',
    },
    interactionProfile: {
      interactionModes: [],
    },
    narrative: {
      archetype: '元代文人',
      summary: '世界拥有的人物源。',
      traits: ['文人'],
    },
    presentation: {
      displayName: '姚燧',
    },
    profileCoverage: {
      aggregateStatus: 'complete',
      diagnostics: [],
      manifestSchemaVersion: 'realm.character-profile-coverage/v1',
      optionalRefs: [],
      optionalSections: [],
      profileCoverageHash: 'profile-coverage-hash-character-1',
      requiredRefs: [],
      requiredSections: [],
    },
    profileHash: 'profile-hash-character-1',
    profileSchemaVersion: 'realm.character-profile-core/v1',
  },
};
