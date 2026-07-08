import type {
  CreateWorldCoreDto,
  RealmCoreOriginDto,
  ReplaceWorldCharacterCoreDto,
  ReplaceWorldCoreDto,
  WorldCharacterCoreDto,
  WorldCoreDto,
} from '@nimiplatform/sdk/realm/generated';
import { createStudioRealmClient } from '@renderer/data/realm-client.js';
import {
  toCreatorWorldCharacterDetail,
  toCreatorWorldSummary,
  toCreatorWorldWorkbench,
  type CreatorWorldCharacterDetail,
  type CreatorWorldSummary,
  type CreatorWorldWorkbench,
} from './world-core-read-model.js';

const WORLD_LIST_TAKE = 50;
const WORLD_CHARACTER_LIST_TAKE = 100;

export type CreatorWorldCreateInput = {
  id?: string;
  core: Record<string, unknown>;
  origin: RealmCoreOriginDto;
  visibility?: CreateWorldCoreDto['visibility'];
};

export type CreatorWorldReplaceInput = {
  id?: string;
  baseContentHash: string;
  core: Record<string, unknown>;
  origin: RealmCoreOriginDto;
  visibility?: ReplaceWorldCoreDto['visibility'];
};

export type CreatorWorldCharacterReplaceInput = {
  id?: string;
  baseContentHash: string;
  core: Record<string, unknown>;
  entityId: string;
  origin: RealmCoreOriginDto;
};

export async function listCreatorWorlds(): Promise<CreatorWorldSummary[]> {
  const realm = createStudioRealmClient();
  const worlds = await realm.worldCoreControllerListWorldCores({
    path: {},
    query: { take: WORLD_LIST_TAKE },
  });
  worlds.forEach((world) => assertWorldCoreContract(world));
  return worlds.map(toCreatorWorldSummary);
}

export async function getCreatorWorld(worldId: string): Promise<WorldCoreDto> {
  const normalizedWorldId = requireRouteId(worldId, 'worldId');
  const realm = createStudioRealmClient();
  const world = await realm.worldCoreControllerGetWorldCore({
    path: { worldId: normalizedWorldId },
  });
  assertWorldCoreContract(world);
  assertWorldId(normalizedWorldId, world);
  return world;
}

export async function getCreatorWorldWorkbench(worldId: string): Promise<CreatorWorldWorkbench> {
  const normalizedWorldId = requireRouteId(worldId, 'worldId');
  const realm = createStudioRealmClient();
  const [world, characters] = await Promise.all([
    realm.worldCoreControllerGetWorldCore({ path: { worldId: normalizedWorldId } }),
    realm.worldCoreControllerListWorldCharacters({
      path: { worldId: normalizedWorldId },
      query: { take: WORLD_CHARACTER_LIST_TAKE },
    }),
  ]);
  assertWorldCoreContract(world);
  assertWorldId(normalizedWorldId, world);
  characters.forEach((character) => assertWorldCharacterCoreContract(character));
  return toCreatorWorldWorkbench(world, characters);
}

export async function getCreatorWorldCharacterCore(
  worldId: string,
  characterId: string,
): Promise<WorldCharacterCoreDto> {
  const normalizedWorldId = requireRouteId(worldId, 'worldId');
  const normalizedCharacterId = requireRouteId(characterId, 'characterId');
  const realm = createStudioRealmClient();
  const character = await realm.worldCoreControllerGetWorldCharacter({
    path: { characterId: normalizedCharacterId },
  });
  assertWorldCharacterCoreContract(character);
  assertCharacterId(normalizedCharacterId, character);
  assertCharacterParent(normalizedWorldId, character);
  return character;
}

export async function getCreatorWorldCharacterDetail(
  worldId: string,
  characterId: string,
): Promise<CreatorWorldCharacterDetail> {
  const normalizedWorldId = requireRouteId(worldId, 'worldId');
  const character = await getCreatorWorldCharacterCore(normalizedWorldId, characterId);
  return toCreatorWorldCharacterDetail(normalizedWorldId, character);
}

export async function createCreatorWorldCore(input: CreatorWorldCreateInput): Promise<WorldCoreDto> {
  const realm = createStudioRealmClient();
  const id = optionalText(input.id);
  const body: CreateWorldCoreDto = {
    core: requireCore(input.core),
    origin: requireOrigin(input.origin),
    ...(id ? { id } : {}),
    ...(input.visibility ? { visibility: input.visibility } : {}),
  };
  const world = await realm.worldCoreControllerCreateWorldCore({
    path: {},
    body,
  });
  assertWorldCoreContract(world);
  if (id) assertWorldId(id, world);
  return world;
}

export async function replaceCreatorWorldCore(
  worldId: string,
  input: CreatorWorldReplaceInput,
): Promise<WorldCoreDto> {
  const normalizedWorldId = requireRouteId(worldId, 'worldId');
  const realm = createStudioRealmClient();
  const id = optionalText(input.id);
  const body: ReplaceWorldCoreDto = {
    baseContentHash: requireRouteId(input.baseContentHash, 'baseContentHash'),
    core: requireCore(input.core),
    origin: requireOrigin(input.origin),
    ...(id ? { id } : {}),
    ...(input.visibility ? { visibility: input.visibility } : {}),
  };
  const world = await realm.worldCoreControllerReplaceWorldCore({
    path: { worldId: normalizedWorldId },
    body,
  });
  assertWorldCoreContract(world);
  assertWorldId(normalizedWorldId, world);
  return world;
}

export async function replaceCreatorWorldCharacterCore(
  worldId: string,
  characterId: string,
  input: CreatorWorldCharacterReplaceInput,
): Promise<WorldCharacterCoreDto> {
  const normalizedWorldId = requireRouteId(worldId, 'worldId');
  const normalizedCharacterId = requireRouteId(characterId, 'characterId');
  const realm = createStudioRealmClient();
  const id = optionalText(input.id);
  const body: ReplaceWorldCharacterCoreDto = {
    baseContentHash: requireRouteId(input.baseContentHash, 'baseContentHash'),
    core: requireCore(input.core),
    entityId: requireRouteId(input.entityId, 'entityId'),
    origin: requireOrigin(input.origin),
    ...(id ? { id } : {}),
  };
  const character = await realm.worldCoreControllerReplaceWorldCharacter({
    path: { characterId: normalizedCharacterId },
    body,
  });
  assertWorldCharacterCoreContract(character);
  assertCharacterId(normalizedCharacterId, character);
  assertCharacterParent(normalizedWorldId, character);
  return character;
}

function assertWorldCoreContract(world: WorldCoreDto): void {
  requireRouteId(world.id, 'WorldCoreDto.id');
  requireRouteId(world.contentHash, 'WorldCoreDto.contentHash');
  requireCore(world.core);
  requireOrigin(world.origin);
}

function assertWorldCharacterCoreContract(character: WorldCharacterCoreDto): void {
  requireRouteId(character.id, 'WorldCharacterCoreDto.id');
  requireRouteId(character.worldId, 'WorldCharacterCoreDto.worldId');
  requireRouteId(character.entityId, 'WorldCharacterCoreDto.entityId');
  requireRouteId(character.contentHash, 'WorldCharacterCoreDto.contentHash');
  requireCore(character.core);
  requireOrigin(character.origin);
}

function assertWorldId(worldId: string, world: WorldCoreDto): void {
  if (world.id !== worldId) {
    throw new Error(`WorldCore response id mismatch: ${world.id}`);
  }
}

function assertCharacterId(characterId: string, character: WorldCharacterCoreDto): void {
  if (character.id !== characterId) {
    throw new Error(`WorldCharacterCore response id mismatch: ${character.id}`);
  }
}

function assertCharacterParent(worldId: string, character: WorldCharacterCoreDto): void {
  if (character.worldId !== worldId) {
    throw new Error(`WorldCharacterCore parent mismatch: ${character.id}`);
  }
}

function requireCore(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Realm core payload must be an object before submitting a typed write.');
  }
  return value as Record<string, unknown>;
}

function requireOrigin(value: unknown): RealmCoreOriginDto {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Realm core origin.kind is required before submitting a typed write.');
  }
  const origin = value as RealmCoreOriginDto;
  const kind = optionalText(origin.kind);
  if (!kind) {
    throw new Error('Realm core origin.kind is required before submitting a typed write.');
  }
  return origin;
}

function optionalText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function requireRouteId(value: unknown, label: string): string {
  const normalized = optionalText(value);
  if (!normalized) {
    throw new Error(`${label} is required before loading Realm World Studio creator data.`);
  }
  return normalized;
}
