import { describe, expect, it } from 'vitest';
import type { RealmModel } from '@nimiplatform/sdk/realm/generated';
import {
  toCreatorWorldCharacterDetail,
  toCreatorWorldSummary,
  toCreatorWorldWorkbench,
} from './world-core-read-model.js';
import { TEST_WORLD_CHARACTER_CORE, TEST_WORLD_CORE } from './world-core-test-fixtures.js';

describe('Realm World Studio creator read model', () => {
  it('projects the current typed WorldCoreDto without public showcase semantics', () => {
    const summary = toCreatorWorldSummary(TEST_WORLD_CORE);

    expect(summary).toMatchObject({
      id: 'world-yuan-academy',
      name: '元代文人书院世界',
      summary: '创作者维护的元代文人世界源。',
      visibility: 'private',
      contentHash: 'hash-world-1',
      characterCountExact: null,
    });
    expect(summary.entityKinds).toEqual(['人物', '书院']);
    expect(summary.relationshipTypes).toEqual(['师承', '同僚']);
    expect(summary.tags).toEqual(['历史', '书院']);
  });

  it('requires parent world context and derives the exact character count from the typed list', () => {
    const workbench = toCreatorWorldWorkbench(TEST_WORLD_CORE, [TEST_WORLD_CHARACTER_CORE]);

    expect(workbench.world.characterCountExact).toBe(1);
    expect(workbench.characters[0]).toMatchObject({
      id: 'yao-sui',
      worldId: 'world-yuan-academy',
      entityId: 'entity-yao-sui',
      name: '姚燧',
      role: '元代文人',
    });
    expect(() => toCreatorWorldCharacterDetail('other-world', TEST_WORLD_CHARACTER_CORE)).toThrow(/parent mismatch/);
  });

  it('does not synthesize display names from Realm ids when source names are blank', () => {
    const unnamedWorld: RealmModel<'WorldCoreDto'> = {
      ...TEST_WORLD_CORE,
      core: {
        ...TEST_WORLD_CORE.core,
        identity: {
          ...TEST_WORLD_CORE.core.identity,
          name: '',
          summary: 'No name here.',
        },
      },
    };
    const unnamedCharacter: RealmModel<'WorldCharacterCoreDto'> = {
      ...TEST_WORLD_CHARACTER_CORE,
      profile: {
        ...TEST_WORLD_CHARACTER_CORE.profile,
        identity: {
          ...TEST_WORLD_CHARACTER_CORE.profile.identity,
          name: '',
        },
        presentation: {
          ...TEST_WORLD_CHARACTER_CORE.profile.presentation,
          displayName: '',
        },
      },
    };

    expect(toCreatorWorldSummary(unnamedWorld).name).toBeNull();
    expect(toCreatorWorldWorkbench(unnamedWorld, [unnamedCharacter]).characters[0]?.name).toBeNull();
  });

  it('fails closed when Realm core payloads are malformed', () => {
    const malformedWorld = {
      ...TEST_WORLD_CORE,
      core: null,
    } as unknown as RealmModel<'WorldCoreDto'>;
    const malformedCharacter = {
      ...TEST_WORLD_CHARACTER_CORE,
      profile: [],
    } as unknown as RealmModel<'WorldCharacterCoreDto'>;

    expect(() => toCreatorWorldSummary(malformedWorld)).toThrow(/WorldCoreDto\.core must be an object/);
    expect(() => toCreatorWorldCharacterDetail('world-yuan-academy', malformedCharacter)).toThrow(
      /WorldCharacterCoreDto\.profile must be an object/,
    );
  });
});
