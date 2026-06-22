import { describe, expect, it, vi } from 'vitest';
import type { StudioRealmSurface } from '@renderer/data/realm-client.js';
import {
  listRealmCoreCockpitWorlds,
  searchRealmCoreCockpitWorlds,
} from './world-core-cockpit.js';

const hallidayAccountId = '01J00000000000000000000000';

function worldCore(id: string, overrides: Record<string, unknown> = {}) {
  return {
    id,
    schemaVersion: 'realm.world-core/v1',
    contentRevision: 3,
    contentHash: `hash-${id}`,
    origin: {
      kind: 'forge' as const,
      sourceId: `source:${id}`,
      sourceVersion: '2026.06.22',
      sourceContentHash: `source-hash-${id}`,
    },
    creatorId: hallidayAccountId,
    visibility: 'public' as const,
    core: {
      identity: {
        name: '星舰边境',
        summary: 'A frontier world for interstellar factions and exploration.',
        worldType: 'simulation',
        genre: 'science fiction',
        themes: ['frontier', 'factions', 'exploration'],
      },
      presentation: {
        displayName: '星舰边境',
        tagline: 'Deep-space governance and crew drama.',
      },
      ontology: {
        entityKinds: ['starship', 'planet', 'faction', 'crew'],
        relationshipTypes: ['commands', 'allied-with', 'located-at'],
        concepts: [
          {
            conceptId: 'jump-lane',
            name: 'Jump lane',
            summary: 'Stable long-range route.',
          },
        ],
      },
      timeModel: {
        mode: 'static',
        flowRatio: 1,
        isPaused: true,
        anchor: {
          realStartedAt: '2026-06-22T00:00:00.000Z',
          worldStartedAt: '2351-01-01T00:00:00.000Z',
          worldStartedAtDisplay: '2351.01.01',
        },
        pausedWorldTime: null,
        calendar: 'frontier-standard',
        displayFormat: 'YYYY.MM.DD',
      },
      timeline: { events: [{ eventId: 'first-contact', title: 'First contact' }] },
      entities: [{ entityId: 'ship-1', kind: 'starship', label: 'NSS Long Arc' }],
      relationships: [],
      systems: [{ systemId: 'politics', name: 'Faction politics', summary: 'Faction influence.' }],
      scenes: [{ sceneId: 'bridge', name: 'Bridge', summary: 'Command deck.' }],
      assets: {
        resourceRefs: [{ refId: 'banner-1', kind: 'image', purpose: 'banner' }],
        intents: [],
      },
      authoring: {
        source: 'forge-import',
        maintainers: ['halliday@nimi.ai'],
        review: { status: 'needs-review' },
      },
      ...overrides,
    },
    createdAt: '2026-06-22T00:00:00.000Z',
    updatedAt: '2026-06-22T01:00:00.000Z',
  };
}

function itemPage(prefix: string, count: number) {
  return Array.from({ length: count }).map((_, index) => ({
    id: `${prefix}-${String(index + 1).padStart(3, '0')}`,
    worldId: 'world-scifi',
    entityId: `entity-${index + 1}`,
    sourceEntityId: `entity-${index + 1}`,
    targetEntityId: `entity-${index + 2}`,
    type: 'linked-to',
    kind: 'starship',
    schemaVersion: 'realm.core/v1',
    contentRevision: 1,
    contentHash: `hash-${prefix}-${index + 1}`,
    origin: { kind: 'forge' as const, sourceId: `${prefix}:${index + 1}`, sourceVersion: '1' },
    core: {},
    createdAt: '2026-06-22T00:00:00.000Z',
    updatedAt: '2026-06-22T00:00:00.000Z',
  }));
}

function realmSurface() {
  return {
    worldCoreControllerListWorldCores: vi.fn(async () => [
      worldCore('world-scifi'),
      worldCore('world-other', { identity: { name: 'Other', summary: 'Other world.' } }),
      { ...worldCore('world-email-owned'), creatorId: 'halliday@nimi.ai' },
    ]),
    worldCoreControllerListWorldEntities: vi.fn(async (input: { path: { worldId: string }; query?: { afterId?: string } }) => {
      if (input.path.worldId === 'world-scifi' && !input.query?.afterId) return itemPage('entity', 500);
      if (input.path.worldId === 'world-scifi' && input.query?.afterId === 'entity-500') return itemPage('entity-tail', 2);
      if (input.path.worldId === 'world-other') return itemPage('other-entity', 1);
      return [];
    }),
    worldCoreControllerListWorldRelationships: vi.fn(async (input: { path: { worldId: string } }) =>
      input.path.worldId === 'world-scifi' ? itemPage('relationship', 3) : []),
    worldCoreControllerListWorldCharacters: vi.fn(async (input: { path: { worldId: string } }) =>
      input.path.worldId === 'world-scifi' ? itemPage('character', 4) : []),
  } as unknown as StudioRealmSurface;
}

function repeatedWorlds(count: number) {
  return Array.from({ length: count }).map((_, index) =>
    worldCore(`world-${String(index + 1).padStart(3, '0')}`));
}

describe('Realm Core Cockpit read model', () => {
  it('keeps only stable-account creator worlds and preserves generic WorldCore schema fields', async () => {
    const realm = realmSurface();

    const result = await listRealmCoreCockpitWorlds(realm);

    expect(result.worlds.map((world) => world.id)).toEqual(['world-scifi', 'world-other']);
    expect(result.worlds[0]).toMatchObject({
      id: 'world-scifi',
      title: '星舰边境',
      worldType: 'simulation',
      genre: 'science fiction',
      themes: ['frontier', 'factions', 'exploration'],
      schemaVersion: 'realm.world-core/v1',
      contentRevision: 3,
      contentHash: 'hash-world-scifi',
      origin: {
        kind: 'forge',
        sourceId: 'source:world-scifi',
        sourceContentHash: 'source-hash-world-scifi',
      },
      ontology: {
        entityKinds: ['starship', 'planet', 'faction', 'crew'],
        relationshipTypes: ['commands', 'allied-with', 'located-at'],
      },
      counts: {
        entities: { state: 'available', value: 502 },
        relationships: { state: 'available', value: 3 },
        characters: { state: 'available', value: 4 },
      },
      structure: {
        timelineEventCount: { state: 'available', value: 1 },
        systemCount: { state: 'available', value: 1 },
        sceneCount: { state: 'available', value: 1 },
        declaredAssetRefCount: { state: 'available', value: 1 },
      },
    });
    expect(result.metrics.worldCount).toMatchObject({ state: 'available', value: 2 });
    expect(realm.worldCoreControllerListWorldEntities).toHaveBeenCalledWith({
      path: { worldId: 'world-scifi' },
      query: { take: 500 },
    });
    expect(realm.worldCoreControllerListWorldEntities).toHaveBeenCalledWith({
      path: { worldId: 'world-scifi' },
      query: { take: 500, afterId: 'entity-500' },
    });
  });

  it('derives explicit health issues instead of fake ready metrics', async () => {
    const result = await listRealmCoreCockpitWorlds(realmSurface());
    const scifi = result.worlds[0]!;

    expect(scifi.healthIssues.map((issue) => issue.ruleId)).toContain('assets.resolver.unavailable');
    expect(scifi.healthIssues.map((issue) => issue.ruleId)).toContain('runtime.summary.unavailable');
    expect(scifi.unavailableContracts).toEqual(['asset-resolution-summary', 'runtime-materialization-summary']);
    expect(result.metrics.unavailableContractCount).toBeGreaterThan(0);
    expect(result.metrics.schemaIssueCount).toBe(1);
  });

  it('filters registry rows across generic fields and issue text', async () => {
    const result = await listRealmCoreCockpitWorlds(realmSurface());

    expect(searchRealmCoreCockpitWorlds(result.worlds, 'science fiction').map((world) => world.id)).toEqual(['world-scifi']);
    expect(searchRealmCoreCockpitWorlds(result.worlds, 'asset resolver').map((world) => world.id)).toContain('world-scifi');
  });

  it('marks world count unavailable when listWorldCores may be truncated', async () => {
    const realm = {
      worldCoreControllerListWorldCores: vi.fn(async () => repeatedWorlds(100)),
      worldCoreControllerListWorldEntities: vi.fn(async () => []),
      worldCoreControllerListWorldRelationships: vi.fn(async () => []),
      worldCoreControllerListWorldCharacters: vi.fn(async () => []),
    } as unknown as StudioRealmSurface;

    const result = await listRealmCoreCockpitWorlds(realm);

    expect(result.metrics.worldCount).toMatchObject({
      state: 'unavailable',
      reason: 'Realm WorldCoreController.listWorldCores returned the maximum page size; total maintainable WorldCore count is not exact.',
    });
  });

  it('pages relationship and character counts and fails closed when pagination ids are unstable', async () => {
    const pageWithMissingLastId = itemPage('entity', 500).map((item, index) =>
      index === 499 ? { ...item, id: '' } : item);
    const realm = {
      worldCoreControllerListWorldCores: vi.fn(async () => [worldCore('world-scifi')]),
      worldCoreControllerListWorldEntities: vi.fn(async () => pageWithMissingLastId),
      worldCoreControllerListWorldRelationships: vi.fn(async (input: { query?: { afterId?: string } }) =>
        input.query?.afterId === 'relationship-500' ? itemPage('relationship-tail', 1) : itemPage('relationship', 500)),
      worldCoreControllerListWorldCharacters: vi.fn(async (input: { query?: { afterId?: string } }) =>
        input.query?.afterId === 'character-500' ? itemPage('character-tail', 1) : itemPage('character', 500)),
    } as unknown as StudioRealmSurface;

    const result = await listRealmCoreCockpitWorlds(realm);
    const world = result.worlds[0]!;

    expect(world.counts.entities).toMatchObject({
      state: 'unavailable',
      reason: 'Realm WorldCoreController.listWorldEntities did not return a stable pagination id.',
    });
    expect(world.counts.relationships).toMatchObject({ state: 'available', value: 501 });
    expect(world.counts.characters).toMatchObject({ state: 'available', value: 501 });
    expect(realm.worldCoreControllerListWorldRelationships).toHaveBeenCalledWith({
      path: { worldId: 'world-scifi' },
      query: { take: 500, afterId: 'relationship-500' },
    });
    expect(realm.worldCoreControllerListWorldCharacters).toHaveBeenCalledWith({
      path: { worldId: 'world-scifi' },
      query: { take: 500, afterId: 'character-500' },
    });
  });

  it('fails closed for missing contentHash and missing required structure arrays', async () => {
    const brokenWorld = {
      ...worldCore('world-broken', {
        timeline: {},
        systems: undefined,
        scenes: undefined,
        assets: {},
      }),
      contentHash: '',
    };
    const realm = {
      worldCoreControllerListWorldCores: vi.fn(async () => [brokenWorld]),
      worldCoreControllerListWorldEntities: vi.fn(async () => {
        throw new Error('entity graph unavailable');
      }),
      worldCoreControllerListWorldRelationships: vi.fn(async () => []),
      worldCoreControllerListWorldCharacters: vi.fn(async () => []),
    } as unknown as StudioRealmSurface;

    const result = await listRealmCoreCockpitWorlds(realm);
    const world = result.worlds[0]!;

    expect(world.contentHash).toBeNull();
    expect(world.structure.timelineEventCount).toMatchObject({ state: 'unavailable' });
    expect(world.structure.systemCount).toMatchObject({ state: 'unavailable' });
    expect(world.structure.sceneCount).toMatchObject({ state: 'unavailable' });
    expect(world.structure.declaredAssetRefCount).toMatchObject({ state: 'unavailable' });
    expect(world.healthIssues.map((issue) => issue.ruleId)).toEqual(expect.arrayContaining([
      'contentHash.missing',
      'structure.timeline.events.unavailable',
      'structure.systems.unavailable',
      'structure.scenes.unavailable',
      'structure.assets.unavailable',
      'graph.entities.unavailable',
    ]));
  });
});
