import type { WorldCharacterCoreDto, WorldCoreDto } from '@nimiplatform/sdk/realm/generated';

export type CreatorWorldSummary = {
  id: string;
  name: string | null;
  summary: string | null;
  visibility: WorldCoreDto['visibility'];
  schemaVersion: string;
  contentHash: string;
  contentRevision: number;
  originKind: WorldCoreDto['origin']['kind'];
  creatorId: string | null;
  updatedAt: string;
  entityKinds: string[];
  relationshipTypes: string[];
  tags: string[];
  characterCountExact: number | null;
};

export type CreatorWorldCharacterSummary = {
  id: string;
  worldId: string;
  entityId: string;
  name: string | null;
  role: string | null;
  summary: string | null;
  schemaVersion: string;
  contentHash: string;
  contentRevision: number;
  originKind: WorldCharacterCoreDto['origin']['kind'];
  updatedAt: string;
  tags: string[];
};

export type CreatorWorldWorkbench = {
  world: CreatorWorldSummary;
  characters: CreatorWorldCharacterSummary[];
};

export type CreatorWorldCharacterDetail = {
  character: CreatorWorldCharacterSummary;
  rawCore: Record<string, unknown>;
};

type Path = readonly string[];

const WORLD_NAME_PATHS: readonly Path[] = [
  ['identity', 'name'],
  ['profile', 'name'],
  ['name'],
  ['title'],
  ['displayName'],
];

const WORLD_SUMMARY_PATHS: readonly Path[] = [
  ['identity', 'summary'],
  ['profile', 'summary'],
  ['summary'],
  ['description'],
];

const CHARACTER_NAME_PATHS: readonly Path[] = [
  ['profile', 'displayName'],
  ['profile', 'name'],
  ['identity', 'name'],
  ['displayName'],
  ['name'],
  ['title'],
];

const CHARACTER_ROLE_PATHS: readonly Path[] = [
  ['profile', 'role'],
  ['identity', 'role'],
  ['role'],
  ['archetype'],
];

const CHARACTER_SUMMARY_PATHS: readonly Path[] = [
  ['profile', 'summary'],
  ['identity', 'summary'],
  ['summary'],
  ['description'],
];

export function toCreatorWorldSummary(world: WorldCoreDto): CreatorWorldSummary {
  const core = requireRecord(world.core, 'WorldCoreDto.core');
  return {
    id: requireText(world.id, 'WorldCoreDto.id'),
    name: firstString(core, WORLD_NAME_PATHS) || null,
    summary: firstString(core, WORLD_SUMMARY_PATHS) || null,
    visibility: world.visibility,
    schemaVersion: requireText(world.schemaVersion, 'WorldCoreDto.schemaVersion'),
    contentHash: requireText(world.contentHash, 'WorldCoreDto.contentHash'),
    contentRevision: world.contentRevision,
    originKind: requireOriginKind(world.origin, 'WorldCoreDto.origin.kind'),
    creatorId: normalizeText(world.creatorId) || null,
    updatedAt: requireText(world.updatedAt, 'WorldCoreDto.updatedAt'),
    entityKinds: firstStringArray(core, [['ontology', 'entityKinds'], ['entityKinds']]),
    relationshipTypes: firstStringArray(core, [['ontology', 'relationshipTypes'], ['relationshipTypes']]),
    tags: firstStringArray(core, [['profile', 'tags'], ['tags']]),
    characterCountExact: firstNumber(core, [
      ['stats', 'characterCount'],
      ['counts', 'characterCount'],
      ['characterCount'],
    ]) ?? arrayLength(core, [['characters'], ['worldCharacters']]),
  };
}

export function toCreatorWorldCharacterSummary(character: WorldCharacterCoreDto): CreatorWorldCharacterSummary {
  const core = requireRecord(character.core, 'WorldCharacterCoreDto.core');
  return {
    id: requireText(character.id, 'WorldCharacterCoreDto.id'),
    worldId: requireText(character.worldId, 'WorldCharacterCoreDto.worldId'),
    entityId: requireText(character.entityId, 'WorldCharacterCoreDto.entityId'),
    name: firstString(core, CHARACTER_NAME_PATHS) || null,
    role: firstString(core, CHARACTER_ROLE_PATHS) || null,
    summary: firstString(core, CHARACTER_SUMMARY_PATHS) || null,
    schemaVersion: requireText(character.schemaVersion, 'WorldCharacterCoreDto.schemaVersion'),
    contentHash: requireText(character.contentHash, 'WorldCharacterCoreDto.contentHash'),
    contentRevision: character.contentRevision,
    originKind: requireOriginKind(character.origin, 'WorldCharacterCoreDto.origin.kind'),
    updatedAt: requireText(character.updatedAt, 'WorldCharacterCoreDto.updatedAt'),
    tags: firstStringArray(core, [['profile', 'tags'], ['tags']]),
  };
}

export function toCreatorWorldWorkbench(
  world: WorldCoreDto,
  characters: readonly WorldCharacterCoreDto[],
): CreatorWorldWorkbench {
  const worldSummary = toCreatorWorldSummary(world);
  return {
    world: {
      ...worldSummary,
      characterCountExact: characters.length,
    },
    characters: characters.map((character) => {
      if (character.worldId !== world.id) {
        throw new Error(`WorldCharacterCore parent mismatch: ${character.id}`);
      }
      return toCreatorWorldCharacterSummary(character);
    }),
  };
}

export function toCreatorWorldCharacterDetail(
  worldId: string,
  character: WorldCharacterCoreDto,
): CreatorWorldCharacterDetail {
  const normalizedWorldId = requireText(worldId, 'worldId');
  if (character.worldId !== normalizedWorldId) {
    throw new Error(`WorldCharacterCore parent mismatch: ${character.id}`);
  }
  return {
    character: toCreatorWorldCharacterSummary(character),
    rawCore: requireRecord(character.core, 'WorldCharacterCoreDto.core'),
  };
}

function requireRecord(value: unknown, fieldName: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${fieldName} must be an object in the Realm core contract.`);
  }
  return value as Record<string, unknown>;
}

function requireOriginKind(value: unknown, fieldName: string): WorldCoreDto['origin']['kind'] {
  const origin = requireRecord(value, fieldName.replace(/\.kind$/, ''));
  return requireText(origin.kind, fieldName) as WorldCoreDto['origin']['kind'];
}

function normalizeText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function requireText(value: unknown, fieldName: string): string {
  const normalized = normalizeText(value);
  if (!normalized) {
    throw new Error(`${fieldName} is required by the Realm core contract.`);
  }
  return normalized;
}

function readPath(record: Record<string, unknown>, path: Path): unknown {
  let current: unknown = record;
  for (const segment of path) {
    if (!current || typeof current !== 'object' || Array.isArray(current)) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[segment];
  }
  return current;
}

function firstString(record: Record<string, unknown>, paths: readonly Path[]): string {
  for (const path of paths) {
    const normalized = normalizeText(readPath(record, path));
    if (normalized) return normalized;
  }
  return '';
}

function firstStringArray(record: Record<string, unknown>, paths: readonly Path[]): string[] {
  for (const path of paths) {
    const value = readPath(record, path);
    if (Array.isArray(value)) {
      return value.map((item) => normalizeText(item)).filter(Boolean);
    }
  }
  return [];
}

function firstNumber(record: Record<string, unknown>, paths: readonly Path[]): number | null {
  for (const path of paths) {
    const value = Number(readPath(record, path));
    if (Number.isInteger(value) && value >= 0) return value;
  }
  return null;
}

function arrayLength(record: Record<string, unknown>, paths: readonly Path[]): number | null {
  for (const path of paths) {
    const value = readPath(record, path);
    if (Array.isArray(value)) return value.length;
  }
  return null;
}
