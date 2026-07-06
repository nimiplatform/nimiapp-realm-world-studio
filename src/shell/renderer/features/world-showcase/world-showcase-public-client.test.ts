import { describe, expect, it } from 'vitest';
import type { WorldPublicDetailWithCharactersDto } from '@nimiplatform/sdk/realm/generated';
import { toWorldShowcase } from './world-showcase-public-client.js';

const publicWorld = {
  world: {
    id: 'yuan-academy-world',
    name: '元代文人书院世界',
    tagline: '探索元代士人的交游、仕宦与著述网络',
    summary: '本世界聚焦元代士人群体的学术社交网络，以书院、交游、仕宦与著述为核心线索。',
    type: 'CREATOR',
    visibility: 'public',
    tags: ['历史', '书院', '文人', '元代'],
    entityKinds: ['人物', '书院', '官职', '地点'],
    relationshipTypes: ['师承', '同僚', '诗文交游'],
    systems: ['书院讲学网络', '仕宦流动'],
    rules: ['人物回答优先依据已公开资料；资料不足时说明不确定。'],
    scenes: [
      {
        sceneId: 'academy-hall',
        name: '书院讲堂',
        summary: '进入讲学、研讨与师承关系的核心空间。',
        media: [
          {
            id: 'scene-image-resource',
            url: 'https://example.test/scene.png',
            mimeType: 'image/png',
            kind: 'highlight',
            provider: 'local',
            provenance: {},
          },
        ],
        activeEntities: [
          {
            id: 'academy-entity',
            kind: '书院',
            label: '书院讲堂',
            summary: '讲学、研讨与师承关系的核心空间。',
          },
        ],
        relatedCharacters: [
          {
            id: 'yao-sui',
            displayName: '姚燧',
            handle: 'yao-sui',
            role: '元代文人、官员、文章家',
            summary: '熟悉元代士人交游、书院讲学与仕宦经历。',
            tags: ['文人', '官员', '诗文'],
            sourceKind: 'worldCharacter',
            worldId: 'yuan-academy-world',
            worldName: '元代文人书院世界',
            ownership: 'worldOwned',
            updatedAt: '2026-06-27T03:10:00.000Z',
            media: {
              avatarUrl: 'https://example.test/yao.png',
              profileCoverUrl: 'https://example.test/yao-cover.png',
            },
            relation: {
              state: 'connectable',
              connectionId: null,
              runtimeSourceRef: null,
            },
            characterBiography: {
              sourceNotes: ['源自已接纳的历史人物图谱。'],
              lifeEvents: [
                {
                  id: 'yao-birth',
                  kind: 'birth',
                  periodLabel: '1254年',
                  title: '1254年出生',
                  summary: '1254年出生于元代士人家庭。',
                  sequence: 1,
                  source: 'biographyMilestone',
                },
                {
                  id: 'yao-office',
                  kind: 'office',
                  periodLabel: '1314年',
                  title: '1314年任书院山长',
                  summary: '1314年任书院山长，主持讲学与士人往来。',
                  sequence: 2,
                  source: 'biographyMilestone',
                },
                {
                  id: 'relationship-works',
                  kind: 'work',
                  periodLabel: '1320年',
                  title: '著述线索',
                  summary: '1320年参与整理书院讲义与诗文材料。',
                  sequence: null,
                  source: 'relationshipSummary',
                },
                {
                  id: 'yao-death',
                  kind: 'death',
                  periodLabel: '1331年',
                  title: '1331年去世',
                  summary: '1331年去世，后由门人整理其诗文材料。',
                  sequence: 3,
                  source: 'biographyMilestone',
                },
              ],
            },
            sourceRef: {
              kind: 'worldCharacter',
              sourceId: 'yao-sui',
              worldId: 'yuan-academy-world',
              sourceContentHash: 'hash-yao-sui',
            },
          },
        ],
        relatedEvents: [
          {
            eventId: 'academy-lecture',
            title: '书院讲学',
            summary: '书院中的讲学与问答。',
            sequence: 1,
            timestamp: '元代',
            startsAt: null,
            endsAt: null,
            importance: 0.8,
            sceneRefs: ['academy-hall'],
            locationRefs: ['academy-entity'],
            entityRefs: ['academy-entity'],
            characterRefs: ['yao-sui'],
            sourceRefs: [],
          },
        ],
        relatedResources: [
          {
            id: 'resource-academy-network',
            kind: 'system',
            title: '书院讲学网络',
            summary: '记录书院、人物与讲学关系。',
            entityRefs: ['academy-entity'],
            eventRefs: ['academy-lecture'],
          },
        ],
        counts: {
          activeEntityCount: 1,
          relatedCharacterCount: 1,
          relatedEventCount: 1,
          relatedResourceCount: 1,
        },
      },
      {
        sceneId: 'literati-gathering',
        name: '文人雅集',
        summary: '文人交流诗文与关系的场景。',
        media: [],
        activeEntities: [],
        relatedCharacters: [],
        relatedEvents: [],
        relatedResources: [],
        counts: {
          activeEntityCount: 0,
          relatedCharacterCount: 0,
          relatedEventCount: 0,
          relatedResourceCount: 0,
        },
      },
      {
        sceneId: 'official-route',
        name: '仕宦之路',
        summary: '仕宦流动与身份变化的路径。',
        media: [],
        activeEntities: [],
        relatedCharacters: [],
        relatedEvents: [],
        relatedResources: [],
        counts: {
          activeEntityCount: 0,
          relatedCharacterCount: 0,
          relatedEventCount: 0,
          relatedResourceCount: 0,
        },
      },
    ],
    timeline: [
      {
        eventId: 'academy-lecture',
        title: '书院讲学',
        summary: '书院中的讲学与问答。',
        sequence: 1,
        timestamp: '元代',
        startsAt: null,
        endsAt: null,
        importance: 0.8,
        sceneRefs: ['academy-hall'],
        locationRefs: ['academy-entity'],
        entityRefs: ['academy-entity'],
        characterRefs: ['yao-sui'],
        sourceRefs: [],
      },
    ],
    media: {
      iconUrl: 'https://example.test/icon.png',
      heroUrl: 'https://example.test/hero.png',
      bannerUrl: 'https://example.test/banner.png',
      highlightUrls: ['https://example.test/highlight.png'],
    },
    stats: {
      characterCount: 50,
      entityCount: 42,
      relationshipCount: 72,
      sceneCount: 3,
      systemCount: 2,
      timelineEventCount: 0,
      personaCount: 0,
    },
    time: {
      anchorRealStartedAt: '2026-06-27T00:00:00.000Z',
      anchorWorldStartedAt: '1271',
      anchorWorldStartedAtDisplay: '元代',
      computedAt: '2026-06-27T03:10:00.000Z',
      currentWorldTime: '1271',
      currentWorldTimeDisplay: '静态历史世界',
      flowRatio: 1,
      isPaused: true,
      mode: 'static',
      calendar: '历史纪年',
      displayFormat: 'era',
    },
    createdAt: '2026-06-27T00:00:00.000Z',
    updatedAt: '2026-06-27T03:10:00.000Z',
  },
  sources: {
    characters: [
      {
        id: 'yao-sui',
        displayName: '姚燧',
        handle: 'yao-sui',
        role: '元代文人、官员、文章家',
        summary: '熟悉元代士人交游、书院讲学与仕宦经历。',
        tags: ['文人', '官员', '诗文'],
        sourceKind: 'worldCharacter',
        worldId: 'yuan-academy-world',
        worldName: '元代文人书院世界',
        ownership: 'worldOwned',
        updatedAt: '2026-06-27T03:10:00.000Z',
        media: {
          avatarUrl: 'https://example.test/yao.png',
          profileCoverUrl: 'https://example.test/yao-cover.png',
        },
        relation: {
          state: 'connectable',
          connectionId: null,
          runtimeSourceRef: null,
        },
        characterBiography: {
          sourceNotes: ['源自已接纳的历史人物图谱。'],
          lifeEvents: [
            {
              id: 'yao-birth',
              kind: 'birth',
              periodLabel: '1254年',
              title: '1254年出生',
              summary: '1254年出生于元代士人家庭。',
              sequence: 1,
              source: 'biographyMilestone',
            },
            {
              id: 'yao-office',
              kind: 'office',
              periodLabel: '1314年',
              title: '1314年任书院山长',
              summary: '1314年任书院山长，主持讲学与士人往来。',
              sequence: 2,
              source: 'biographyMilestone',
            },
            {
              id: 'relationship-works',
              kind: 'work',
              periodLabel: '1320年',
              title: '著述线索',
              summary: '1320年参与整理书院讲义与诗文材料。',
              sequence: null,
              source: 'relationshipSummary',
            },
            {
              id: 'yao-death',
              kind: 'death',
              periodLabel: '1331年',
              title: '1331年去世',
              summary: '1331年去世，后由门人整理其诗文材料。',
              sequence: 3,
              source: 'biographyMilestone',
            },
          ],
        },
        sourceRef: {
          kind: 'worldCharacter',
          sourceId: 'yao-sui',
          worldId: 'yuan-academy-world',
          sourceContentHash: 'hash-yao-sui',
        },
      },
    ],
    personas: [
      {
        id: 'persona-not-showcase-authority',
        displayName: 'Owner Persona',
        summary: 'Should not appear in the World Atlas detail page.',
        tags: [],
        sourceKind: 'realmPersona',
        worldId: 'yuan-academy-world',
        worldName: '元代文人书院世界',
        ownership: 'userOwned',
        updatedAt: '2026-06-27T03:10:00.000Z',
        media: {},
        relation: {
          state: 'unavailable',
          connectionId: null,
          runtimeSourceRef: null,
        },
        sourceRef: {
          kind: 'realmPersona',
          sourceId: 'owner-persona',
          worldId: 'yuan-academy-world',
          sourceContentHash: 'hash-owner-persona',
        },
      },
    ],
  },
} as unknown as WorldPublicDetailWithCharactersDto;

describe('World Showcase public projection', () => {
  it('maps public world detail into user-facing showcase data without creator-console semantics', () => {
    const showcase = toWorldShowcase(publicWorld);

    expect(showcase.id).toBe('yuan-academy-world');
    expect(showcase.name).toBe('元代文人书院世界');
    expect(showcase.theme.id).toBe('history');
    expect(showcase.moduleNames.library).toBe('资料馆');
    expect(showcase.moduleNames.timeline).toBe('时间长河');
    expect(showcase.stats).toEqual({
      characters: 50,
      resources: 1,
      scenes: 3,
      routes: 4,
    });
    expect(showcase.statsCards.map((card) => card.label)).toEqual([
      '位可结识人物',
      '条可查阅资料',
      '个可探索场景',
      '条推荐探索路线',
    ]);
    expect(showcase.characters).toHaveLength(1);
    expect(showcase.characters[0]?.name).toBe('姚燧');
    expect(showcase.characters[0]?.relationState).toBe('connectable');
    expect(showcase.characters[0]?.timeSummary).toBe('1254年 - 1331年');
    expect(showcase.characters[0]?.lifeEvents).toEqual([
      {
        id: 'yao-birth',
        kind: 'birth',
        kindLabel: '出生',
        periodLabel: '1254年',
        title: '1254年出生',
        summary: '1254年出生于元代士人家庭。',
        sourceLabel: '生平资料',
      },
      {
        id: 'yao-office',
        kind: 'office',
        kindLabel: '任职',
        periodLabel: '1314年',
        title: '1314年任书院山长',
        summary: '1314年任书院山长，主持讲学与士人往来。',
        sourceLabel: '生平资料',
      },
      {
        id: 'relationship-works',
        kind: 'work',
        kindLabel: '著述',
        periodLabel: '1320年',
        title: '著述线索',
        summary: '1320年参与整理书院讲义与诗文材料。',
        sourceLabel: '关系线索',
      },
      {
        id: 'yao-death',
        kind: 'death',
        kindLabel: '去世',
        periodLabel: '1331年',
        title: '1331年去世',
        summary: '1331年去世，后由门人整理其诗文材料。',
        sourceLabel: '生平资料',
      },
    ]);
    expect(showcase.characters[0]?.lifeSourceNotes).toEqual(['源自已接纳的历史人物图谱。']);
    expect(showcase.characters[0]?.relatedScenes).toEqual(['书院讲堂']);
    expect(showcase.resources.map((resource) => resource.title)).toContain('书院讲学网络');
    expect(showcase.resources.map((resource) => resource.title)).not.toContain('Owner Persona');
    expect(showcase.scenes[0]?.sceneId).toBe('academy-hall');
    expect(showcase.scenes[0]?.counts).toEqual({
      activeEntityCount: 1,
      relatedCharacterCount: 1,
      relatedEventCount: 1,
      relatedResourceCount: 1,
    });
    expect(showcase.scenes[0]?.relatedEvents[0]?.eventId).toBe('academy-lecture');
    expect(showcase.scenes[0]?.relatedResources[0]?.title).toBe('书院讲学网络');
    expect(showcase.timeline[0]?.sceneRefs).toEqual(['academy-hall']);
    expect(showcase.timelineEmptyMessage).toBe('时间长河正在整理中，你可以先从人物和资料馆开始探索。');
  });
});
