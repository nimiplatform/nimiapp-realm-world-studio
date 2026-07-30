import type { RealmModel } from '@nimiplatform/sdk/realm/generated';
import {
  createStudioRealmClient,
  type StudioRealmSurface,
} from '@renderer/data/realm-client.js';
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

type WorldCore = RealmModel<'WorldCoreDto'>;
type WorldCharacterCore = RealmModel<'WorldCharacterCoreDto'>;
type CreateWorldCoreBody = Parameters<
  StudioRealmSurface['worldCoreControllerCreateWorldCore']
>[0]['body'];
type ReplaceWorldCoreBody = Parameters<
  StudioRealmSurface['worldCoreControllerReplaceWorldCore']
>[0]['body'];
type ReplaceWorldCharacterBody = Parameters<
  StudioRealmSurface['worldCoreControllerReplaceWorldCharacter']
>[0]['body'];
type RealmCoreOrigin = CreateWorldCoreBody['origin'];
type WorldCharacterProfileInput = ReplaceWorldCharacterBody['profile'];

export type CreatorWorldCreateInput = {
  id?: string;
  core: Record<string, unknown>;
  origin: RealmCoreOrigin;
  visibility?: CreateWorldCoreBody['visibility'];
};

export type CreatorWorldReplaceInput = {
  id?: string;
  baseContentHash: string;
  core: Record<string, unknown>;
  origin: RealmCoreOrigin;
  visibility?: ReplaceWorldCoreBody['visibility'];
};

export type CreatorWorldCharacterReplaceInput = {
  id?: string;
  baseContentHash: string;
  profile: Record<string, unknown>;
  entityId: string;
  origin: RealmCoreOrigin;
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

export async function getCreatorWorld(worldId: string): Promise<WorldCore> {
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
): Promise<WorldCharacterCore> {
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

export async function createCreatorWorldCore(input: CreatorWorldCreateInput): Promise<WorldCore> {
  const realm = createStudioRealmClient();
  const id = optionalText(input.id);
  const body: CreateWorldCoreBody = {
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
): Promise<WorldCore> {
  const normalizedWorldId = requireRouteId(worldId, 'worldId');
  const realm = createStudioRealmClient();
  const id = optionalText(input.id);
  const body: ReplaceWorldCoreBody = {
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
): Promise<WorldCharacterCore> {
  const normalizedWorldId = requireRouteId(worldId, 'worldId');
  const normalizedCharacterId = requireRouteId(characterId, 'characterId');
  const realm = createStudioRealmClient();
  const id = optionalText(input.id);
  const body: ReplaceWorldCharacterBody = {
    baseContentHash: requireRouteId(input.baseContentHash, 'baseContentHash'),
    profile: requireProfile(input.profile),
    origin: requireOrigin(input.origin),
    worldEntityRef: {
      kind: 'worldEntity',
      worldId: normalizedWorldId,
      entityId: requireRouteId(input.entityId, 'entityId'),
    },
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

function assertWorldCoreContract(world: WorldCore): void {
  requireRouteId(world.id, 'WorldCoreDto.id');
  requireRouteId(world.contentHash, 'WorldCoreDto.contentHash');
  requireCore(world.core);
  requireOrigin(world.origin);
}

function assertWorldCharacterCoreContract(character: WorldCharacterCore): void {
  requireRouteId(character.id, 'WorldCharacterCoreDto.id');
  requireRouteId(character.worldId, 'WorldCharacterCoreDto.worldId');
  requireRouteId(character.worldEntityRef.entityId, 'WorldCharacterCoreDto.worldEntityRef.entityId');
  requireRouteId(character.worldEntityRef.worldId, 'WorldCharacterCoreDto.worldEntityRef.worldId');
  requireRouteId(character.contentHash, 'WorldCharacterCoreDto.contentHash');
  requireProfile(character.profile);
  requireOrigin(character.origin);
}

function assertWorldId(worldId: string, world: WorldCore): void {
  if (world.id !== worldId) {
    throw new Error(`WorldCore response id mismatch: ${world.id}`);
  }
}

function assertCharacterId(characterId: string, character: WorldCharacterCore): void {
  if (character.id !== characterId) {
    throw new Error(`WorldCharacterCore response id mismatch: ${character.id}`);
  }
}

function assertCharacterParent(worldId: string, character: WorldCharacterCore): void {
  if (character.worldId !== worldId || character.worldEntityRef.worldId !== worldId) {
    throw new Error(`WorldCharacterCore parent mismatch: ${character.id}`);
  }
}

function requireCore(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Realm core payload must be an object before submitting a typed write.');
  }
  return value as Record<string, unknown>;
}

function requireProfile(value: unknown): WorldCharacterProfileInput {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('World character profile must be an object before submitting a typed write.');
  }
  return value as WorldCharacterProfileInput;
}

function requireOrigin(value: unknown): RealmCoreOrigin {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Realm core origin.kind is required before submitting a typed write.');
  }
  const origin = value as RealmCoreOrigin;
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
