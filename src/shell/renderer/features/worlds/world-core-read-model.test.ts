import { describe, expect, it } from 'vitest';
import type { WorldCharacterCoreDto, WorldCoreDto } from '@nimiplatform/sdk/realm/generated';
import {
  toCreatorWorldCharacterDetail,
  toCreatorWorldSummary,
  toCreatorWorldWorkbench,
} from './world-core-read-model.js';

const worldCore = {
  id: 'world-yuan-academy',
  creatorId: 'creator-1',
  visibility: 'private',
  schemaVersion: 'world-core.v1',
  contentHash: 'hash-world-1',
  contentRevision: 7,
  createdAt: '2026-07-09T00:00:00.000Z',
  updatedAt: '2026-07-09T01:00:00.000Z',
  origin: { kind: 'manual' },
  core: {
    identity: {
      name: '元代文人书院世界',
      summary: '创作者维护的元代文人世界源。',
    },
    ontology: {
      entityKinds: ['人物', '书院'],
      relationshipTypes: ['师承', '同僚'],
    },
    tags: ['历史', '书院'],
    stats: {
      characterCount: 1,
    },
  },
} satisfies WorldCoreDto;

const characterCore = {
  id: 'yao-sui',
  worldId: 'world-yuan-academy',
  entityId: 'entity-yao-sui',
  schemaVersion: 'world-character.v1',
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
} satisfies WorldCharacterCoreDto;

describe('Realm World Studio creator read model', () => {
  it('projects WorldCoreDto without public showcase semantics', () => {
    const summary = toCreatorWorldSummary(worldCore);

    expect(summary).toMatchObject({
      id: 'world-yuan-academy',
      name: '元代文人书院世界',
      summary: '创作者维护的元代文人世界源。',
      visibility: 'private',
      contentHash: 'hash-world-1',
      characterCountExact: 1,
    });
    expect(summary.entityKinds).toEqual(['人物', '书院']);
    expect(summary.relationshipTypes).toEqual(['师承', '同僚']);
  });

  it('requires parent world context for WorldCharacterCore projections', () => {
    const workbench = toCreatorWorldWorkbench(worldCore, [characterCore]);

    expect(workbench.world.characterCountExact).toBe(1);
    expect(workbench.characters[0]).toMatchObject({
      id: 'yao-sui',
      worldId: 'world-yuan-academy',
      entityId: 'entity-yao-sui',
      name: '姚燧',
      role: '元代文人',
    });
    expect(() => toCreatorWorldCharacterDetail('other-world', characterCore)).toThrow(/parent mismatch/);
  });

  it('does not synthesize display names from Realm ids when source names are missing', () => {
    const unnamedWorld = {
      ...worldCore,
      core: { identity: { summary: 'No name here.' } },
    } satisfies WorldCoreDto;
    const unnamedCharacter = {
      ...characterCore,
      core: { profile: { summary: 'No character name here.' } },
    } satisfies WorldCharacterCoreDto;

    expect(toCreatorWorldSummary(unnamedWorld).name).toBeNull();
    expect(toCreatorWorldWorkbench(unnamedWorld, [unnamedCharacter]).characters[0]?.name).toBeNull();
  });

  it('fails closed when Realm core payloads are malformed', () => {
    const malformedWorld = {
      ...worldCore,
      core: null,
    } as unknown as WorldCoreDto;
    const malformedCharacter = {
      ...characterCore,
      core: [],
    } as unknown as WorldCharacterCoreDto;

    expect(() => toCreatorWorldSummary(malformedWorld)).toThrow(/WorldCoreDto\.core must be an object/);
    expect(() => toCreatorWorldCharacterDetail('world-yuan-academy', malformedCharacter)).toThrow(
      /WorldCharacterCoreDto\.core must be an object/,
    );
  });
});
