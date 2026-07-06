import type {
  WorldPublicDetailWithCharactersDto,
  WorldPublicDetailDto,
  WorldPublicSceneDto,
  WorldPublicSceneResourceDto,
  WorldPublicSourceCardDto,
  WorldPublicTimelineEventDto,
} from '@nimiplatform/sdk/realm/generated';
import { createStudioRealmClient } from '@renderer/data/realm-client.js';
import type {
  ExplorationRoute,
  ShowcaseCharacter,
  ShowcaseCharacterLifeEvent,
  ShowcaseCharacterLifeEventKind,
  ShowcaseResource,
  ShowcaseScene,
  ShowcaseSceneResource,
  ShowcaseTimelineItem,
  WorldSettingSummary,
  WorldShowcase,
  WorldShowcaseStats,
  WorldShowcaseStatsCard,
} from './world-showcase-types.js';
import { historyCardFallback, historyHeroFallback, resolveWorldTheme } from './world-showcase-theme.js';

type WorldPublicCharacterLifeEventProjection = {
  readonly id?: string;
  readonly kind?: string;
  readonly periodLabel?: string | null;
  readonly title?: string;
  readonly summary?: string;
  readonly source?: string;
};

type WorldPublicCharacterBiographyProjection = {
  readonly lifeEvents?: readonly WorldPublicCharacterLifeEventProjection[];
  readonly sourceNotes?: readonly string[];
};

type WorldPublicSourceCardWithBiography = WorldPublicSourceCardDto & {
  readonly characterBiography?: WorldPublicCharacterBiographyProjection | null;
};

function normalizeText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function firstNonEmpty(...values: Array<string | null | undefined>): string {
  return values.map((value) => normalizeText(value)).find(Boolean) || '';
}

function compact(values: readonly (string | null | undefined)[]): string[] {
  return values.map((value) => normalizeText(value)).filter(Boolean);
}

function unique(values: readonly string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function themeTypeLabel(themeId: string): string {
  switch (themeId) {
    case 'future':
      return '未来世界';
    case 'xianxia':
      return '修仙世界';
    case 'cyberpunk':
      return '赛博世界';
    default:
      return '历史世界';
  }
}

function pickWorldHero(world: WorldPublicDetailDto): string {
  return firstNonEmpty(
    world.media.heroUrl,
    world.media.assets?.hero?.url,
    world.media.bannerUrl,
    world.media.assets?.banner?.url,
    historyHeroFallback,
  );
}

function pickWorldIcon(world: WorldPublicDetailDto): string {
  return firstNonEmpty(
    world.media.iconUrl,
    world.media.assets?.icon?.url,
    world.media.highlightUrls[0],
    world.media.assets?.highlights[0]?.url,
    historyCardFallback,
  );
}

function pickCharacterAvatar(card: WorldPublicSourceCardDto): string | null {
  return firstNonEmpty(card.media.avatarUrl, card.media.assets?.avatar?.url) || null;
}

function pickSceneImage(scene: WorldPublicSceneDto): string | null {
  return firstNonEmpty(scene.media[0]?.url) || null;
}

function resourceTypeLabel(kind: WorldPublicSceneResourceDto['kind']): string {
  switch (kind) {
    case 'system':
      return '世界资料';
    case 'entity':
      return '实体资料';
    case 'relationship':
      return '关系资料';
    case 'timelineEvent':
      return '事件资料';
    case 'rule':
      return '理解说明';
    default:
      return '资料';
  }
}

function makeStats(
  world: WorldPublicDetailDto,
  resourceCount: number,
  routeCount: number,
): WorldShowcaseStats {
  return {
    characters: world.stats.characterCount,
    resources: resourceCount,
    scenes: world.scenes.length,
    routes: routeCount,
  };
}

function makeStatsCards(stats: WorldShowcaseStats): WorldShowcaseStatsCard[] {
  return [
    { id: 'characters', value: String(stats.characters), label: '位可结识人物' },
    { id: 'resources', value: String(stats.resources), label: '条可查阅资料' },
    { id: 'scenes', value: String(stats.scenes), label: '个可探索场景' },
    { id: 'routes', value: String(stats.routes), label: '条推荐探索路线' },
  ];
}

function toShowcaseSceneResource(resource: WorldPublicSceneResourceDto): ShowcaseSceneResource {
  return {
    id: resource.id,
    title: resource.title,
    kind: resource.kind,
    summary: resource.summary ?? null,
    entityRefs: [...resource.entityRefs],
    eventRefs: [...resource.eventRefs],
  };
}

function makeResources(world: WorldPublicDetailDto): ShowcaseResource[] {
  const records = new Map<
    string,
    {
      resource: ShowcaseSceneResource;
      relatedCharacters: Set<string>;
      relatedScenes: Set<string>;
    }
  >();

  for (const scene of world.scenes) {
    for (const resource of scene.relatedResources.map(toShowcaseSceneResource)) {
      const current = records.get(resource.id) ?? {
        resource,
        relatedCharacters: new Set<string>(),
        relatedScenes: new Set<string>(),
      };
      current.relatedScenes.add(scene.name);
      for (const character of scene.relatedCharacters) {
        current.relatedCharacters.add(character.displayName);
      }
      records.set(resource.id, current);
    }
  }

  return Array.from(records.values()).map(({ resource, relatedCharacters, relatedScenes }) => {
    const recordCount = resource.entityRefs.length + resource.eventRefs.length;
    return {
      id: resource.id,
      title: resource.title,
      type: resourceTypeLabel(resource.kind),
      summary: firstNonEmpty(resource.summary, resource.title),
      relatedCharacters: Array.from(relatedCharacters),
      relatedScenes: Array.from(relatedScenes),
      recordCount: recordCount > 0 ? recordCount : null,
      tags: unique([resourceTypeLabel(resource.kind), ...world.tags]).slice(0, 4),
    };
  });
}

function suggestedQuestionsFor(card: WorldPublicSourceCardDto): string[] {
  const name = card.displayName;
  const tags = card.tags.length > 0 ? card.tags : compact([card.role]);
  const firstTag = tags[0] || '这个世界';
  return [
    `${name}熟悉哪些${firstTag}相关内容？`,
    `我应该从哪里开始理解${name}的关系网络？`,
    `有哪些资料能帮助我继续探索${name}？`,
  ];
}

function normalizeLifeEventKind(value: unknown): ShowcaseCharacterLifeEventKind {
  switch (value) {
    case 'birth':
    case 'office':
    case 'work':
    case 'relationship':
    case 'learning':
    case 'death':
      return value;
    default:
      return 'other';
  }
}

function lifeEventKindLabel(kind: ShowcaseCharacterLifeEventKind): string {
  switch (kind) {
    case 'birth':
      return '出生';
    case 'office':
      return '任职';
    case 'work':
      return '著述';
    case 'relationship':
      return '交游';
    case 'learning':
      return '讲学';
    case 'death':
      return '去世';
    case 'other':
    default:
      return '经历';
  }
}

function lifeEventSourceLabel(source: unknown): string {
  return source === 'relationshipSummary' ? '关系线索' : '生平资料';
}

function characterLifeEvents(card: WorldPublicSourceCardDto): ShowcaseCharacterLifeEvent[] {
  const biography = (card as WorldPublicSourceCardWithBiography).characterBiography;
  if (!biography) {
    return [];
  }
  return (biography.lifeEvents ?? [])
    .map((event): ShowcaseCharacterLifeEvent | null => {
      const id = normalizeText(event.id);
      const title = normalizeText(event.title);
      const summary = normalizeText(event.summary);
      if (!id || !title || !summary) {
        return null;
      }
      const kind = normalizeLifeEventKind(event.kind);
      return {
        id,
        kind,
        kindLabel: lifeEventKindLabel(kind),
        periodLabel: normalizeText(event.periodLabel) || null,
        title,
        summary,
        sourceLabel: lifeEventSourceLabel(event.source),
      };
    })
    .filter((event): event is ShowcaseCharacterLifeEvent => Boolean(event));
}

function characterLifeSourceNotes(card: WorldPublicSourceCardDto): string[] {
  const biography = (card as WorldPublicSourceCardWithBiography).characterBiography;
  return biography ? compact(biography.sourceNotes ?? []) : [];
}

function readLifeEventYear(event: ShowcaseCharacterLifeEvent): number | null {
  const match = event.periodLabel?.match(/([0-9]{3,4})\s*年/);
  return match?.[1] ? Number(match[1]) : null;
}

function characterTimeSummary(events: readonly ShowcaseCharacterLifeEvent[]): string | null {
  const years = events
    .map((event) => readLifeEventYear(event))
    .filter((year): year is number => Number.isFinite(year));
  if (years.length === 0) {
    return null;
  }

  const birthEvent = events.find((event) => event.kind === 'birth');
  const deathEvent = events.find((event) => event.kind === 'death');
  const birthYear = birthEvent ? readLifeEventYear(birthEvent) : null;
  const deathYear = deathEvent ? readLifeEventYear(deathEvent) : null;
  const startYear = birthYear ?? Math.min(...years);
  const endYear = deathYear ?? Math.max(...years);
  if (startYear === endYear) {
    return `${startYear}年`;
  }
  return `${startYear}年 - ${endYear}年`;
}

function relatedScenesForCharacter(world: WorldPublicDetailDto, cardId: string): readonly WorldPublicSceneDto[] {
  return world.scenes.filter((scene) => scene.relatedCharacters.some((character) => character.id === cardId));
}

function toShowcaseCharacter(world: WorldPublicDetailDto, card: WorldPublicSourceCardDto): ShowcaseCharacter {
  const scenes = relatedScenesForCharacter(world, card.id);
  const relatedResources = unique(
    scenes.flatMap((scene) => scene.relatedResources.map((resource) => resource.title)),
  );
  const tags = compact(card.tags);
  const expertise = tags.length > 0 ? tags : compact([card.role]);
  const lifeEvents = characterLifeEvents(card);
  return {
    id: card.id,
    name: card.displayName,
    avatar: pickCharacterAvatar(card),
    role: firstNonEmpty(card.role, '世界人物'),
    shortBio: card.summary,
    expertise,
    topics: suggestedQuestionsFor(card).slice(0, 2),
    resourceCount: relatedResources.length > 0 ? relatedResources.length : null,
    relationCount: null,
    timeSummary: characterTimeSummary(lifeEvents),
    status: card.relation.state === 'unavailable' ? 'unavailable' : 'available',
    isFriend: card.relation.state === 'connected',
    relationState: card.relation.state,
    relatedResources,
    relatedScenes: scenes.map((scene) => scene.name),
    lifeEvents,
    lifeSourceNotes: characterLifeSourceNotes(card),
    suggestedQuestions: suggestedQuestionsFor(card),
  };
}

function makeCharacters(
  world: WorldPublicDetailDto,
  cards: readonly WorldPublicSourceCardDto[],
): ShowcaseCharacter[] {
  return cards
    .filter((card) => card.sourceKind === 'worldCharacter')
    .map((card) => toShowcaseCharacter(world, card));
}

function toTimelineItem(event: WorldPublicTimelineEventDto, world: WorldPublicDetailDto): ShowcaseTimelineItem {
  const relatedScenes = world.scenes.filter((scene) =>
    scene.relatedEvents.some((sceneEvent) => sceneEvent.eventId === event.eventId),
  );
  const relatedCharacters = unique(
    relatedScenes.flatMap((scene) => scene.relatedCharacters.map((character) => character.displayName)),
  );
  const relatedResources = unique(
    relatedScenes.flatMap((scene) =>
      scene.relatedResources
        .filter((resource) => resource.eventRefs.includes(event.eventId))
        .map((resource) => resource.title),
    ),
  );
  return {
    id: event.eventId,
    eventId: event.eventId,
    period: firstNonEmpty(
      event.timestamp,
      event.startsAt,
      event.endsAt,
      world.time.currentWorldTimeDisplay,
      world.time.anchorWorldStartedAtDisplay,
      '世界时间',
    ),
    title: event.title,
    summary: event.summary ?? null,
    sceneRefs: [...event.sceneRefs],
    locationRefs: [...event.locationRefs],
    entityRefs: [...event.entityRefs],
    characterRefs: [...event.characterRefs],
    sourceRefs: [...event.sourceRefs],
    relatedCharacters,
    relatedResources,
  };
}

function suggestedQuestionsForScene(scene: WorldPublicSceneDto): string[] {
  const questions: string[] = [];
  if (scene.counts.relatedCharacterCount > 0) {
    questions.push(`这个场景里有哪些人物可以认识？`);
  }
  if (scene.counts.relatedEventCount > 0) {
    questions.push(`「${scene.name}」关联了哪些事件？`);
  }
  if (scene.counts.relatedResourceCount > 0) {
    questions.push(`有哪些资料能解释「${scene.name}」？`);
  }
  return questions.length > 0 ? questions : [`「${scene.name}」目前有哪些已解析线索？`];
}

function makeScenes(
  world: WorldPublicDetailDto,
  characters: readonly ShowcaseCharacter[],
): ShowcaseScene[] {
  const charactersById = new Map(characters.map((character) => [character.id, character]));
  return world.scenes.map((scene) => ({
    id: scene.sceneId,
    sceneId: scene.sceneId,
    title: scene.name,
    image: pickSceneImage(scene),
    summary: scene.summary,
    activeEntities: scene.activeEntities.map((entity) => ({
      id: entity.id,
      kind: entity.kind,
      label: entity.label ?? null,
      summary: entity.summary ?? null,
    })),
    relatedCharacters: scene.relatedCharacters.map(
      (card) => charactersById.get(card.id) ?? toShowcaseCharacter(world, card),
    ),
    relatedEvents: scene.relatedEvents.map((event) => toTimelineItem(event, world)),
    relatedResources: scene.relatedResources.map(toShowcaseSceneResource),
    counts: {
      activeEntityCount: scene.counts.activeEntityCount,
      relatedCharacterCount: scene.counts.relatedCharacterCount,
      relatedEventCount: scene.counts.relatedEventCount,
      relatedResourceCount: scene.counts.relatedResourceCount,
    },
    suggestedQuestions: suggestedQuestionsForScene(scene),
  }));
}

function makeTimeline(world: WorldPublicDetailDto): ShowcaseTimelineItem[] {
  return world.timeline.map((event) => toTimelineItem(event, world));
}

function makeRoutes(
  world: WorldPublicDetailDto,
  characters: readonly ShowcaseCharacter[],
  resources: readonly ShowcaseResource[],
  scenes: readonly ShowcaseScene[],
): ExplorationRoute[] {
  const routes: ExplorationRoute[] = [];
  if (characters.length > 0) {
    routes.push({
      id: 'characters-first',
      title: '从核心人物开始',
      summary: `先认识${characters[0]?.name || '世界人物'}，用人物关系打开世界。`,
      steps: ['查看人物档案', '加为好友', '围绕推荐问题开始对话'],
      primaryAction: '浏览人物',
    });
  }
  if (resources.length > 0) {
    routes.push({
      id: 'library-first',
      title: `进入${resolveWorldTheme({ name: world.name, type: world.type, tags: world.tags }).moduleNames.library}`,
      summary: '先查阅基础资料，再回到人物和场景中验证理解。',
      steps: ['查看热门资料', '跟随关联人物', '进入相关场景'],
      primaryAction: '查看资料',
    });
  }
  if (scenes.length > 0) {
    routes.push({
      id: 'scene-first',
      title: '从场景进入世界',
      summary: `选择「${scenes[0]?.title || '场景'}」这样的空间，以具体情境开始探索。`,
      steps: ['进入场景', '查看涉及人物', '沿推荐问题继续'],
      primaryAction: '探索场景',
    });
  }
  if (world.timeline.length > 0) {
    routes.push({
      id: 'timeline-first',
      title: '沿时间线理解世界',
      summary: '按阶段理解关键事件，再进入人物与资料细节。',
      steps: ['查看时间节点', '打开关联资料', '认识节点人物'],
      primaryAction: '查看时间长河',
    });
  }
  return routes;
}

function makeSettings(world: WorldPublicDetailDto, themeId: string): WorldSettingSummary {
  return {
    worldType: themeTypeLabel(themeId),
    era: firstNonEmpty(world.time.currentWorldTimeDisplay, world.time.anchorWorldStartedAtDisplay, '未标注'),
    background: world.summary,
    groups: unique([...world.entityKinds, ...world.relationshipTypes]).slice(0, 8),
    contentBoundary: world.visibility === 'public' ? '公开世界资料、人物档案、场景与时间线。' : '系统世界资料与公开可读内容。',
    dialogueRule: '本世界中的人物对话会优先使用已收录资料作为上下文。',
    trustNote: '如果资料不足，人物会明确说明不确定，而不是编造答案。',
  };
}

export function toWorldShowcase(dto: WorldPublicDetailWithCharactersDto): WorldShowcase {
  const world = dto.world;
  const theme = resolveWorldTheme({ name: world.name, type: world.type, tags: world.tags });
  const resources = makeResources(world);
  const characters = makeCharacters(world, dto.sources.characters);
  const scenes = makeScenes(world, characters);
  const timeline = makeTimeline(world);
  const explorationRoutes = makeRoutes(world, characters, resources, scenes);
  const stats = makeStats(world, resources.length, explorationRoutes.length);
  const timelineEmptyMessage = `${theme.moduleNames.timeline}正在整理中，你可以先从人物和${theme.moduleNames.library}开始探索。`;
  const characterIds = characters.map((character) => character.id);

  return {
    id: world.id,
    name: world.name,
    subtitle: firstNonEmpty(world.tagline, world.tags[0], '进入这个世界，认识人物并沿资料继续探索'),
    description: world.summary,
    type: theme.id,
    tags: [...world.tags],
    coverImage: pickWorldHero(world),
    icon: pickWorldIcon(world),
    theme,
    moduleNames: theme.moduleNames,
    stats,
    statsCards: makeStatsCards(stats),
    explorationRoutes,
    characters,
    resources,
    scenes,
    timeline,
    timelineEmptyMessage,
    settings: makeSettings(world, theme.id),
    userRelation: {
      isCollected: false,
      friendCount: characters.filter((character) => character.isFriend).length,
      recentCharacterIds: characterIds.filter((_, index) => index < 2),
      recommendedCharacterIds: characterIds.filter((_, index) => index < 3),
    },
  };
}

export async function getWorldShowcase(worldId: string): Promise<WorldShowcase> {
  const normalizedWorldId = normalizeText(worldId);
  if (!normalizedWorldId) {
    throw new Error('World id is required before loading a World Atlas detail page.');
  }
  const realm = createStudioRealmClient();
  const detail = await realm.worldPublicControllerGetWorldDetailWithCharacters({
    path: { worldId: normalizedWorldId },
  });
  return toWorldShowcase(detail);
}
