import type {
  RealmCoreOriginDto,
  WorldCoreDto,
} from '@nimiplatform/sdk/realm/generated';
import { createStudioRealmClient, type StudioRealmSurface } from '@renderer/data/realm-client.js';
import {
  NIMI_WORLD_STUDIO_MAINTAINER_ACCOUNT_ID,
  NIMI_WORLD_STUDIO_MAINTAINER_EMAIL,
} from './world-studio-client.js';

type JsonRecord = Record<string, unknown>;

const GRAPH_PAGE_TAKE = 500;
const WORLD_LIST_TAKE = 100;

type CountFamily = 'entities' | 'relationships' | 'characters';
type StructureCountFamily = 'timelineEventCount' | 'systemCount' | 'sceneCount' | 'declaredAssetRefCount';

export type SourceBackedCount =
  | {
    state: 'available';
    value: number;
    source: string;
  }
  | {
    state: 'unavailable';
    value: null;
    source: string;
    reason: string;
  };

export type CoreHealthIssue = {
  ruleId: string;
  severity: 'error' | 'warning' | 'info';
  family: 'WorldCore' | 'WorldEntityCore' | 'WorldRelationshipCore' | 'WorldCharacterCore' | 'ExternalContract';
  objectId: string;
  jsonPath: string;
  message: string;
  source: string;
};

export type RealmCoreCockpitWorld = {
  id: string;
  title: string;
  summary: string;
  tagline: string;
  worldType: string | null;
  genre: string | null;
  themes: string[];
  schemaVersion: string;
  contentRevision: number;
  contentHash: string | null;
  creatorId: string;
  creatorEmail: string;
  visibility: string;
  origin: RealmCoreOriginDto;
  updatedAt: string;
  ontology: {
    entityKinds: string[];
    relationshipTypes: string[];
    concepts: Array<{
      conceptId: string;
      name: string;
      summary: string;
    }>;
  };
  timeModel: {
    mode: string | null;
    flowRatio: number | null;
    isPaused: boolean | null;
    calendar: string | null;
    displayFormat: string | null;
    worldStartedAtDisplay: string | null;
  };
  structure: {
    timelineEventCount: SourceBackedCount;
    systemCount: SourceBackedCount;
    sceneCount: SourceBackedCount;
    declaredAssetRefCount: SourceBackedCount;
    authoringSource: string | null;
    authoringReviewStatus: string | null;
  };
  counts: Record<CountFamily, SourceBackedCount>;
  healthIssues: CoreHealthIssue[];
  unavailableContracts: string[];
};

export type RealmCoreCockpitResult = {
  worlds: RealmCoreCockpitWorld[];
  metrics: {
    worldCount: SourceBackedCount;
    entities: SourceBackedCount;
    relationships: SourceBackedCount;
    characters: SourceBackedCount;
    schemaIssueCount: number;
    unavailableContractCount: number;
  };
};

function readRecord(value: unknown): JsonRecord {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as JsonRecord : {};
}

function readSection(core: JsonRecord, key: string): JsonRecord {
  return readRecord(core[key]);
}

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function readNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function readBoolean(value: unknown): boolean | null {
  return typeof value === 'boolean' ? value : null;
}

function readStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.map((item) => String(item || '').trim()).filter(Boolean)
    : [];
}

function readArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function describeUnknownError(error: unknown): string {
  if (error instanceof Error && error.message.trim()) return error.message.trim();
  if (typeof error === 'string' && error.trim()) return error.trim();
  return 'Realm request failed without a typed message.';
}

function availableCount(value: number, source: string): SourceBackedCount {
  return { state: 'available', value, source };
}

function unavailableCount(source: string, reason: string): SourceBackedCount {
  return { state: 'unavailable', value: null, source, reason };
}

function sumCounts(counts: readonly SourceBackedCount[], source: string): SourceBackedCount {
  const unavailable = counts.find((count) => count.state === 'unavailable');
  if (unavailable) {
    return unavailableCount(source, unavailable.reason);
  }
  return availableCount(
    counts.reduce((total, count) => total + (count.state === 'available' ? count.value : 0), 0),
    source,
  );
}

function requiredArrayCount(value: unknown, source: string, path: string): SourceBackedCount {
  if (!Array.isArray(value)) {
    return unavailableCount(source, `${path} is unavailable or not an array.`);
  }
  return availableCount(value.length, source);
}

async function countPaginatedRecords(
  source: string,
  listPage: (query: { take: number; afterId?: string }) => Promise<ReadonlyArray<{ id?: string }>>,
): Promise<SourceBackedCount> {
  let afterId: string | undefined;
  let total = 0;
  for (let pageIndex = 0; pageIndex < 1000; pageIndex += 1) {
    try {
      const query = afterId ? { take: GRAPH_PAGE_TAKE, afterId } : { take: GRAPH_PAGE_TAKE };
      const page = await listPage(query);
      total += page.length;
      if (page.length < GRAPH_PAGE_TAKE) {
        return availableCount(total, source);
      }
      const nextAfterId = readString(page[page.length - 1]?.id);
      if (!nextAfterId || nextAfterId === afterId) {
        return unavailableCount(source, `${source} did not return a stable pagination id.`);
      }
      afterId = nextAfterId;
    } catch (error) {
      return unavailableCount(source, describeUnknownError(error));
    }
  }
  return unavailableCount(source, `${source} pagination exceeded the Studio safety limit.`);
}

function countWorldEntities(realm: StudioRealmSurface, worldId: string): Promise<SourceBackedCount> {
  return countPaginatedRecords('Realm WorldCoreController.listWorldEntities', (query) =>
    realm.worldCoreControllerListWorldEntities({ path: { worldId }, query }));
}

function countWorldRelationships(realm: StudioRealmSurface, worldId: string): Promise<SourceBackedCount> {
  return countPaginatedRecords('Realm WorldCoreController.listWorldRelationships', (query) =>
    realm.worldCoreControllerListWorldRelationships({ path: { worldId }, query }));
}

function countWorldCharacters(realm: StudioRealmSurface, worldId: string): Promise<SourceBackedCount> {
  return countPaginatedRecords('Realm WorldCoreController.listWorldCharacters', (query) =>
    realm.worldCoreControllerListWorldCharacters({ path: { worldId }, query }));
}

function conceptSummaries(ontology: JsonRecord): RealmCoreCockpitWorld['ontology']['concepts'] {
  return readArray(ontology.concepts).flatMap((item) => {
    const concept = readRecord(item);
    const conceptId = readString(concept.conceptId);
    const name = readString(concept.name);
    if (!conceptId && !name) return [];
    return {
      conceptId: conceptId || name || '',
      name: name || conceptId || '',
      summary: readString(concept.summary) || '',
    };
  });
}

function declaredAssetRefCount(value: unknown): SourceBackedCount {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return unavailableCount('WorldCore.core.assets', 'core.assets is unavailable or not an object.');
  }
  const assets = value as JsonRecord;
  if (!Array.isArray(assets.resourceRefs)) {
    return unavailableCount('WorldCore.core.assets.resourceRefs', 'core.assets.resourceRefs is unavailable or not an array.');
  }
  if (!Array.isArray(assets.intents)) {
    return unavailableCount('WorldCore.core.assets.intents', 'core.assets.intents is unavailable or not an array.');
  }
  if (assets.externalRefs !== undefined && !Array.isArray(assets.externalRefs)) {
    return unavailableCount('WorldCore.core.assets.externalRefs', 'core.assets.externalRefs is not an array.');
  }
  return availableCount(
    assets.resourceRefs.length + assets.intents.length + (Array.isArray(assets.externalRefs) ? assets.externalRefs.length : 0),
    'WorldCore.core.assets',
  );
}

function issue(
  ruleId: string,
  severity: CoreHealthIssue['severity'],
  family: CoreHealthIssue['family'],
  objectId: string,
  jsonPath: string,
  message: string,
  source: string,
): CoreHealthIssue {
  return { ruleId, severity, family, objectId, jsonPath, message, source };
}

function deriveHealthIssues(world: {
  id: string;
  summary: string;
  contentHash: string | null;
  ontology: RealmCoreCockpitWorld['ontology'];
  structure: RealmCoreCockpitWorld['structure'];
  counts: Record<CountFamily, SourceBackedCount>;
}): CoreHealthIssue[] {
  const issues: CoreHealthIssue[] = [];
  if (!world.contentHash) {
    issues.push(issue(
      'contentHash.missing',
      'error',
      'WorldCore',
      world.id,
      'contentHash',
      'WorldCore contentHash is missing; Studio cannot prove optimistic concurrency state.',
      'WorldCoreDto.contentHash',
    ));
  }
  if (!world.summary) {
    issues.push(issue(
      'identity.summary.missing',
      'error',
      'WorldCore',
      world.id,
      'core.identity.summary',
      'WorldCore identity summary is unavailable.',
      'WorldCore.core.identity.summary',
    ));
  }
  if (world.ontology.entityKinds.length === 0) {
    issues.push(issue(
      'ontology.entityKinds.empty',
      'warning',
      'WorldCore',
      world.id,
      'core.ontology.entityKinds',
      'WorldCore ontology has no entity kinds.',
      'WorldCore.core.ontology.entityKinds',
    ));
  }
  if (world.ontology.relationshipTypes.length === 0) {
    issues.push(issue(
      'ontology.relationshipTypes.empty',
      'warning',
      'WorldCore',
      world.id,
      'core.ontology.relationshipTypes',
      'WorldCore ontology has no relationship types.',
      'WorldCore.core.ontology.relationshipTypes',
    ));
  }
  for (const [family, count] of Object.entries(world.counts) as Array<[CountFamily, SourceBackedCount]>) {
    if (count.state === 'unavailable') {
      issues.push(issue(
        `graph.${family}.unavailable`,
        'error',
        family === 'entities'
          ? 'WorldEntityCore'
          : family === 'relationships'
            ? 'WorldRelationshipCore'
            : 'WorldCharacterCore',
        world.id,
        `graph.${family}`,
        `${family} exact count is unavailable: ${count.reason}`,
        count.source,
      ));
    }
  }
  const structureRules: Array<{
    family: StructureCountFamily;
    ruleId: string;
    jsonPath: string;
  }> = [
    { family: 'timelineEventCount', ruleId: 'structure.timeline.events.unavailable', jsonPath: 'core.timeline.events' },
    { family: 'systemCount', ruleId: 'structure.systems.unavailable', jsonPath: 'core.systems' },
    { family: 'sceneCount', ruleId: 'structure.scenes.unavailable', jsonPath: 'core.scenes' },
    { family: 'declaredAssetRefCount', ruleId: 'structure.assets.unavailable', jsonPath: 'core.assets' },
  ];
  for (const structureRule of structureRules) {
    const count = world.structure[structureRule.family];
    if (count.state === 'unavailable') {
      issues.push(issue(
        structureRule.ruleId,
        'error',
        'WorldCore',
        world.id,
        structureRule.jsonPath,
        `${structureRule.jsonPath} count is unavailable: ${count.reason}`,
        count.source,
      ));
    }
  }
  if (world.counts.entities.state === 'available' && world.counts.entities.value === 0) {
    issues.push(issue(
      'graph.entities.empty',
      'warning',
      'WorldEntityCore',
      world.id,
      'WorldEntityCore[]',
      'World has no WorldEntityCore records.',
      world.counts.entities.source,
    ));
  }
  if (
    world.counts.entities.state === 'available'
    && world.counts.entities.value > 1
    && world.counts.relationships.state === 'available'
    && world.counts.relationships.value === 0
  ) {
    issues.push(issue(
      'graph.relationships.empty',
      'warning',
      'WorldRelationshipCore',
      world.id,
      'WorldRelationshipCore[]',
      'World has multiple entities but no WorldRelationshipCore records.',
      world.counts.relationships.source,
    ));
  }
  if (world.counts.characters.state === 'available' && world.counts.characters.value === 0) {
    issues.push(issue(
      'characters.empty',
      'info',
      'WorldCharacterCore',
      world.id,
      'WorldCharacterCore[]',
      'World has no WorldCharacterCore records exposed to Studio.',
      world.counts.characters.source,
    ));
  }
  if (
    world.structure.declaredAssetRefCount.state === 'available'
    && world.structure.declaredAssetRefCount.value > 0
  ) {
    issues.push(issue(
      'assets.resolver.unavailable',
      'info',
      'ExternalContract',
      world.id,
      'core.assets',
      'Asset resolver contract is unavailable; Studio can count declared refs but cannot claim resource readiness.',
      'WorldCore.core.assets',
    ));
  }
  issues.push(issue(
    'runtime.summary.unavailable',
    'info',
    'ExternalContract',
    world.id,
    'runtime.materializationSummary',
    'Runtime materialization summary is unavailable on the Realm Core Cockpit; RuntimeSourceSnapshot is character-detail by-value materialization.',
    'Runtime-owned contract unavailable',
  ));
  return issues;
}

function unavailableContracts(issues: readonly CoreHealthIssue[]): string[] {
  const contracts = new Set<string>();
  if (issues.some((item) => item.ruleId === 'assets.resolver.unavailable')) {
    contracts.add('asset-resolution-summary');
  }
  if (issues.some((item) => item.ruleId === 'runtime.summary.unavailable')) {
    contracts.add('runtime-materialization-summary');
  }
  return [...contracts];
}

async function normalizeCockpitWorld(
  world: WorldCoreDto,
  realm: StudioRealmSurface,
): Promise<RealmCoreCockpitWorld> {
  const core = readRecord(world.core);
  const identity = readSection(core, 'identity');
  const presentation = readSection(core, 'presentation');
  const ontology = readSection(core, 'ontology');
  const timeModel = readSection(core, 'timeModel');
  const anchor = readRecord(timeModel.anchor);
  const timeline = readSection(core, 'timeline');
  const authoring = readSection(core, 'authoring');
  const review = readRecord(authoring.review);
  const [entities, relationships, characters] = await Promise.all([
    countWorldEntities(realm, world.id),
    countWorldRelationships(realm, world.id),
    countWorldCharacters(realm, world.id),
  ]);
  const summary = readString(identity.summary) || '';
  const normalizedBase = {
    id: world.id,
    title: readString(presentation.displayName)
      || readString(presentation.title)
      || readString(identity.name)
      || world.id,
    summary,
    tagline: readString(presentation.tagline) || readString(identity.tagline) || '',
    worldType: readString(identity.worldType),
    genre: readString(identity.genre),
    themes: readStringArray(identity.themes),
    schemaVersion: world.schemaVersion,
    contentRevision: world.contentRevision,
    contentHash: readString(world.contentHash),
    creatorId: NIMI_WORLD_STUDIO_MAINTAINER_ACCOUNT_ID,
    creatorEmail: NIMI_WORLD_STUDIO_MAINTAINER_EMAIL,
    visibility: world.visibility,
    origin: world.origin,
    updatedAt: world.updatedAt,
    ontology: {
      entityKinds: readStringArray(ontology.entityKinds),
      relationshipTypes: readStringArray(ontology.relationshipTypes),
      concepts: conceptSummaries(ontology),
    },
    timeModel: {
      mode: readString(timeModel.mode),
      flowRatio: readNumber(timeModel.flowRatio),
      isPaused: readBoolean(timeModel.isPaused),
      calendar: readString(timeModel.calendar),
      displayFormat: readString(timeModel.displayFormat),
      worldStartedAtDisplay: readString(anchor.worldStartedAtDisplay),
    },
    structure: {
      timelineEventCount: requiredArrayCount(timeline.events, 'WorldCore.core.timeline.events', 'core.timeline.events'),
      systemCount: requiredArrayCount(core.systems, 'WorldCore.core.systems', 'core.systems'),
      sceneCount: requiredArrayCount(core.scenes, 'WorldCore.core.scenes', 'core.scenes'),
      declaredAssetRefCount: declaredAssetRefCount(core.assets),
      authoringSource: readString(authoring.source),
      authoringReviewStatus: readString(review.status),
    },
    counts: {
      entities,
      relationships,
      characters,
    },
  };
  const healthIssues = deriveHealthIssues(normalizedBase);
  return {
    ...normalizedBase,
    healthIssues,
    unavailableContracts: unavailableContracts(healthIssues),
  };
}

export async function listRealmCoreCockpitWorlds(
  realm: StudioRealmSurface = createStudioRealmClient(),
): Promise<RealmCoreCockpitResult> {
  const worlds = await realm.worldCoreControllerListWorldCores({ path: {}, query: { take: WORLD_LIST_TAKE } });
  const maintainedWorlds = worlds.filter((world) => readString(world.creatorId) === NIMI_WORLD_STUDIO_MAINTAINER_ACCOUNT_ID);
  const normalizedWorlds = await Promise.all(
    maintainedWorlds.map((world) => normalizeCockpitWorld(world, realm)),
  );
  const unavailableContractsAcrossWorlds = new Set(
    normalizedWorlds.flatMap((world) => world.unavailableContracts),
  );
  return {
    worlds: normalizedWorlds,
    metrics: {
      entities: sumCounts(normalizedWorlds.map((world) => world.counts.entities), 'Realm WorldCoreController.listWorldEntities'),
      relationships: sumCounts(normalizedWorlds.map((world) => world.counts.relationships), 'Realm WorldCoreController.listWorldRelationships'),
      characters: sumCounts(normalizedWorlds.map((world) => world.counts.characters), 'Realm WorldCoreController.listWorldCharacters'),
      worldCount: worlds.length >= WORLD_LIST_TAKE
        ? unavailableCount(
          'Realm WorldCoreController.listWorldCores',
          'Realm WorldCoreController.listWorldCores returned the maximum page size; total maintainable WorldCore count is not exact.',
        )
        : availableCount(normalizedWorlds.length, 'Realm WorldCoreController.listWorldCores'),
      schemaIssueCount: normalizedWorlds.reduce(
        (total, world) => total + world.healthIssues.filter((item) => item.family !== 'ExternalContract').length,
        0,
      ),
      unavailableContractCount: unavailableContractsAcrossWorlds.size,
    },
  };
}

export function searchRealmCoreCockpitWorlds(
  worlds: readonly RealmCoreCockpitWorld[],
  query: string,
): RealmCoreCockpitWorld[] {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  if (!normalizedQuery) return [...worlds];
  return worlds.filter((world) => {
    const haystack = [
      world.id,
      world.title,
      world.summary,
      world.tagline,
      world.worldType,
      world.genre,
      world.visibility,
      world.origin.kind,
      world.origin.sourceId,
      world.origin.sourceVersion,
      ...world.themes,
      ...world.ontology.entityKinds,
      ...world.ontology.relationshipTypes,
      ...world.healthIssues.map((item) => `${item.ruleId} ${item.message}`),
    ].filter(Boolean).join(' ').toLocaleLowerCase();
    return haystack.includes(normalizedQuery);
  });
}
