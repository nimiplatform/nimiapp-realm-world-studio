import type {
  CreateRuntimeSourceSnapshotDto,
  RealmCoreOriginDto,
  ReplaceWorldCharacterCoreDto,
  RuntimeSourceSnapshotDto,
  WorldCharacterCoreDto,
  WorldCoreDto,
  WorldEntityCoreDto,
} from '@nimiplatform/sdk/realm/generated';
import { createStudioRealmClient, type StudioRealmSurface } from '@renderer/data/realm-client.js';

type StudioRealmClient = StudioRealmSurface;
type JsonRecord = Record<string, unknown>;
export const NIMI_WORLD_STUDIO_MAINTAINER_EMAIL = 'halliday@nimi.ai';
export const NIMI_WORLD_STUDIO_MAINTAINER_ACCOUNT_ID = '01J00000000000000000000000';
export const NIMI_WORLD_STUDIO_MAINTAINER_ID = NIMI_WORLD_STUDIO_MAINTAINER_ACCOUNT_ID;

export type CreatorWorldSourceRef = {
  sourceRef: string;
  kind?: 'worldCharacter' | 'worldEntity' | 'sourceRecord';
  worldId?: string;
  sourceId?: string;
  sourceContentHash?: string;
  sourceKind?: string;
  factPath?: string;
  label?: string;
};

export type CreatorWorldCandidateValueProvenance = {
  category: string;
  refs: string[];
  summary: string;
};

export type CreatorWorldCharacterSettingsDto = {
  characterId: string;
  worldId: string;
  displayName: string;
  description: string;
  greeting: string;
  characterCoreRevision: number;
  updatedAt: string;
  boundaries: JsonRecord;
  communication: {
    contentStyle?: string;
  } & JsonRecord;
  identity: JsonRecord;
  personality: JsonRecord;
  positioning: {
    targetAudience?: string;
    positioning?: string;
  } & JsonRecord;
};

export type CreatorWorldCharacterSourceSkeleton = {
  characterId: string;
  worldId: string;
  sourceKind: string;
  skeletonId: string;
  sourceEntityId: string;
  candidateId: string;
  sourceIdentityId: string;
  sourceRefs: CreatorWorldSourceRef[];
  canonicalName: string;
  aliases: string[];
  sourceFacts: {
    birthYear: number | null;
    deathYear: number | null;
    timelineFactCount: number;
    representativeFacts: string[];
    officeFacts: Array<{
      eventId?: string;
      name?: string;
      officeName?: string;
      summary: string;
    }>;
    relationships: Array<{
      relationshipId?: string;
      targetEntityId?: string;
      targetName: string;
      relationType: string;
      context?: string;
    }>;
  };
  missingFields: string[];
  completionBrief: {
    description: string;
    contentStyle: string;
    positioning: string;
    avatarBrief: string;
    voiceBrief: string;
    greetingBrief: string;
    dnaBrief: string;
  };
  runtimeReadiness: {
    roleplayRuntime: 'ready' | 'blocked';
    reason: string;
    requiredCreatorActions: string[];
  };
  packageId: string;
  packageVersion: string;
};

export type CreatorWorldCharacterChatReadiness = {
  characterId: string;
  worldId: string;
  ownerScope: 'creator-world';
  authorityReason: 'WORLD_CHARACTER_CORE';
  consumerSurface: 'RUNTIME_SOURCE_SNAPSHOT';
  selectedInputCount: number;
  suppressedInputCount: number;
  selectedOwnerSettingFields: string[];
  runtimeProjectionChecksum: string;
  runtimeSourceSnapshotError?: string;
  appliedAuthoringTargets: string[];
  rawCoreTextExposed: false;
  worldCoreSectionCount: 0;
  characterCoreSectionCount: 0;
  gates: {
    authoringDraftReady: boolean;
    behaviorDnaReady: boolean;
    dialogueExemplarsReady: boolean;
    greetingReady: boolean;
    runtimeSourceIdentityReady: boolean;
    ownerSettingsReady: boolean;
    profileContextReady: boolean;
    profileCoverReady: boolean;
    profileMediaReady: boolean;
    speechRouteReady: boolean;
    voiceReferenceReady: boolean;
  };
  profile: {
    displayName: string;
    handle: string;
    avatarResourceId: string;
    avatarUrl: string;
    profileCoverResourceId: string;
    profileCoverUrl: string;
    defaultVoiceReference: string;
    speechModelId: string;
    speechRoutePolicy: 'local' | 'cloud' | '';
  };
};

export type CreatorWorldCharacterAuthoringGenerationContext = {
  sourceSkeleton: CreatorWorldCharacterSourceSkeleton;
  currentFinalState: {
    settings: CreatorWorldCharacterSettingsDto;
    media: {
      avatarResourceId: string;
      avatarUrl: string;
      profileCoverResourceId: string;
      profileCoverUrl: string;
    };
    voice: {
      voice: JsonRecord | null;
    };
  };
  groundingRefs: CreatorWorldSourceRef[];
  requiredTargets: string[];
  targetStatuses: Array<{
    targetKey: string;
    latestReviewStatus?: CreatorWorldCharacterAuthoringReviewStatus;
    latestCandidateId?: string;
    latestBatchId?: string;
    appliedAt?: string | null;
  }>;
};

export type CreatorWorldCharacterAuthoringReviewStatus =
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'edited'
  | 'applied';

export type CreatorWorldCharacterAuthoringDraftCandidateValue =
  | {
    kind: 'text';
    text?: string;
    provenance: CreatorWorldCandidateValueProvenance[];
  }
  | {
    kind: 'media';
    media?: {
      resourceId?: string;
      url?: string;
      model?: string;
      width?: number;
      height?: number;
      mime?: string;
      prompt?: string;
      moderation: { status: string; reason?: string };
      provenance?: CreatorWorldCandidateValueProvenance[];
    };
    provenance: CreatorWorldCandidateValueProvenance[];
  }
  | {
    kind: 'voice';
    voice?: {
      historicalClaim: string;
      narrationDirection: string;
      providerVoiceRef?: string;
      voiceAssetResourceId?: string;
      speechModelId?: string;
      speechRoutePolicy?: string;
    };
    provenance: CreatorWorldCandidateValueProvenance[];
  }
  | {
    kind: 'dialogue';
    dialogue?: { exemplars: string[] };
    provenance: CreatorWorldCandidateValueProvenance[];
  }
  | {
    kind: 'behavior';
    behavior?: { directives: string[] };
    provenance: CreatorWorldCandidateValueProvenance[];
  };

export type CreatorWorldCharacterAuthoringDraftCandidateInput = {
  targetKey: string;
  value: CreatorWorldCharacterAuthoringDraftCandidateValue;
  sourceRefs: CreatorWorldSourceRef[];
  generatedAt: string;
  modelId: string;
  routePolicy: string;
  promptDigestSha256: string;
  runtimeTraceId: string;
  provenance: JsonRecord;
};

export type CreatorWorldCharacterAuthoringDraftCandidate = {
  id: string;
  targetKey: string;
  reviewStatus: CreatorWorldCharacterAuthoringReviewStatus;
  value: CreatorWorldCharacterAuthoringDraftCandidateValue;
  editedValue?: CreatorWorldCharacterAuthoringDraftCandidateValue | null;
  modelId: string;
  routePolicy: string;
  promptDigestSha256: string;
  runtimeTraceId: string;
  provenance?: JsonRecord;
  generatedAt: string;
  reviewedAt?: string | null;
  reviewerId?: string | null;
  appliedAt?: string | null;
  sourceRefs: CreatorWorldSourceRef[];
};

export type CreatorWorldCharacterAuthoringDraftBatch = {
  id: string;
  worldId?: string;
  characterId?: string;
  sourceKind?: string;
  skeletonId: string;
  createdBy: string;
  status: 'ready_for_review' | 'pending_review' | 'ready_to_apply' | 'applied' | 'partially_applied' | 'failed';
  createdAt: string;
  updatedAt: string;
  appliedAt?: string | null;
  failureCode?: string;
  failureMessage?: string;
  metadata?: JsonRecord;
  candidates: CreatorWorldCharacterAuthoringDraftCandidate[];
};

export type CreatorWorldCharacterAuthoringDraftBatchInput = {
  skeletonId: string;
  candidates: CreatorWorldCharacterAuthoringDraftCandidateInput[];
  metadata?: JsonRecord;
};

export type CreatorWorldSummary = {
  id: string;
  name: string;
  type: 'CREATOR';
  status: string;
  creatorId: string;
  authorityReason: 'NIMI_MAINTAINER';
  tagline: string;
  description: string;
  overview: string;
  iconUrl: string | null;
  bannerUrl: string | null;
  characterCount: number;
  updatedAt: string;
  source: 'Realm WorldCoreController.listWorldCores';
};

export type CreatorWorldCharacterSummary = {
  id: string;
  displayName: string;
  handle: string;
  bio: string;
  avatarUrl: string | null;
  profileCoverUrl: string | null;
  worldId: string;
  state: string | null;
  friendCount: number | null;
  contentHash: string;
  contentRevision: number;
  origin: RealmCoreOriginDto;
  source: 'Realm WorldCoreController.listWorldCharacters';
};

export type CreatorWorldDetail = CreatorWorldSummary & {
  characters: CreatorWorldCharacterSummary[];
};

export type CreatorWorldCharacterDetail = Omit<CreatorWorldCharacterSummary, 'source'> & {
  settings: CreatorWorldCharacterSettingsDto;
  sourceSkeleton: CreatorWorldCharacterSourceSkeleton;
  authoringContext: CreatorWorldCharacterAuthoringGenerationContext;
  authoringDraftBatches: CreatorWorldCharacterAuthoringDraftBatch[];
  chatReadiness: CreatorWorldCharacterChatReadiness;
  source: 'Realm WorldCoreController.getWorldCharacter';
};

export type CreatorWorldCharacterDraft = {
  displayName: string;
  description: string;
  greeting: string;
  avatarUrl: string;
  profileCoverUrl: string;
  contentStyle: string;
  targetAudience: string;
  positioning: string;
  voiceId: string;
  voiceDescription: string;
  speechModelId: string;
  speechRoutePolicy: '' | 'local' | 'cloud';
};

export type CreatorWorldCharacterUpdateResult = {
  ok: true;
  character: CreatorWorldCharacterDetail;
};

export type CreatorWorldCharacterDetailLoadStage =
  | 'character-detail'
  | 'source-skeleton'
  | 'runtime-source-snapshot'
  | 'authoring-context';

export class CreatorWorldCharacterDetailLoadError extends Error {
  readonly stage: CreatorWorldCharacterDetailLoadStage;
  readonly originalMessage: string;

  constructor(stage: CreatorWorldCharacterDetailLoadStage, cause: unknown) {
    const originalMessage = describeUnknownError(cause);
    super(`WorldCharacterCore ${stage} request failed: ${originalMessage}`);
    this.name = 'CreatorWorldCharacterDetailLoadError';
    this.stage = stage;
    this.originalMessage = originalMessage;
  }
}

function readRecord(value: unknown): JsonRecord {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as JsonRecord : {};
}

function readCoreSection(core: JsonRecord, key: string): JsonRecord {
  return readRecord(core[key]);
}

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function readNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function readStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.map((item) => String(item || '').trim()).filter(Boolean)
    : [];
}

function stringifyFactValue(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function describeUnknownError(error: unknown): string {
  if (error instanceof Error && error.message.trim()) return error.message.trim();
  if (typeof error === 'string' && error.trim()) return error.trim();
  return 'Realm request failed without a typed message.';
}

function nonEmpty(value: string | null | undefined, fallback: string): string {
  return value && value.trim() ? value.trim() : fallback;
}

function externalAssetUrl(core: JsonRecord, kind: string): string | null {
  const externalRefs = readRecord(core.assets).externalRefs;
  if (!Array.isArray(externalRefs)) return null;
  for (const ref of externalRefs) {
    const record = readRecord(ref);
    if (readString(record.kind) === kind) {
      return readString(record.uri);
    }
  }
  return null;
}

function upsertExternalAssetUrl(assets: JsonRecord, kind: string, uri: string): JsonRecord {
  const externalRefs = Array.isArray(assets.externalRefs) ? assets.externalRefs.map(readRecord) : [];
  const nextRef = {
    refId: `${kind}-external-1`,
    kind,
    uri,
    purpose: `${kind}-display`,
  };
  const replaced = externalRefs.some((ref) => readString(ref.kind) === kind);
  return {
    ...assets,
    resourceRefs: Array.isArray(assets.resourceRefs) ? assets.resourceRefs : [],
    intents: Array.isArray(assets.intents) ? assets.intents : [],
    externalRefs: replaced
      ? externalRefs.map((ref) => readString(ref.kind) === kind ? { ...ref, ...nextRef } : ref)
      : [...externalRefs, nextRef],
  };
}

function readAuthoringExtensions(core: JsonRecord): JsonRecord {
  return readRecord(readCoreSection(core, 'authoring').extensions);
}

function readWorldStudioSettings(core: JsonRecord): JsonRecord {
  return readRecord(readAuthoringExtensions(core).worldStudioSettings);
}

function readWorldStudioVoice(core: JsonRecord): JsonRecord {
  return readRecord(readWorldStudioSettings(core).voice);
}

function writeAuthoringExtension(core: JsonRecord, key: string, value: JsonRecord): JsonRecord {
  const authoring = readCoreSection(core, 'authoring');
  const extensions = readRecord(authoring.extensions);
  return {
    ...core,
    authoring: {
      ...authoring,
      extensions: {
        ...extensions,
        [key]: value,
      },
    },
  };
}

function requireUpdateText(value: string, fallback: string | null, field: string): string {
  const trimmed = nullableString(value) ?? fallback;
  if (!trimmed) {
    throw new Error(`WorldCharacterCore update requires ${field}.`);
  }
  return trimmed;
}

function requireNimiMaintainedWorld(world: WorldCoreDto): void {
  if (readString(world.creatorId) !== NIMI_WORLD_STUDIO_MAINTAINER_ACCOUNT_ID) {
    throw new Error(
      `WorldCore ${world.id} is not maintained by ${NIMI_WORLD_STUDIO_MAINTAINER_EMAIL} (${NIMI_WORLD_STUDIO_MAINTAINER_ACCOUNT_ID}).`,
    );
  }
}

function normalizeWorld(world: WorldCoreDto, characterCount: number): CreatorWorldSummary {
  requireNimiMaintainedWorld(world);
  const core = readRecord(world.core);
  const identity = readCoreSection(core, 'identity');
  const presentation = readCoreSection(core, 'presentation');
  return {
    id: world.id,
    name: nonEmpty(
      readString(identity.name) || readString(presentation.displayName) || readString(presentation.title),
      world.id,
    ),
    type: 'CREATOR',
    status: world.visibility,
    creatorId: NIMI_WORLD_STUDIO_MAINTAINER_ACCOUNT_ID,
    authorityReason: 'NIMI_MAINTAINER',
    tagline: readString(presentation.tagline) || readString(identity.tagline) || '',
    description: readString(identity.summary) || '',
    overview: readString(identity.summary) || '',
    iconUrl: readString(presentation.iconResourceRef) || externalAssetUrl(core, 'icon'),
    bannerUrl: readString(presentation.bannerResourceRef) || externalAssetUrl(core, 'banner'),
    characterCount,
    updatedAt: world.updatedAt,
    source: 'Realm WorldCoreController.listWorldCores',
  };
}

function characterCore(character: WorldCharacterCoreDto): JsonRecord {
  return readRecord(character.core);
}

function normalizeWorldCharacter(character: WorldCharacterCoreDto): CreatorWorldCharacterSummary {
  const core = characterCore(character);
  const identity = readCoreSection(core, 'identity');
  const presentation = readCoreSection(core, 'presentation');
  return {
    id: character.id,
    displayName: nonEmpty(
      readString(presentation.displayName) || readString(identity.name),
      character.id,
    ),
    handle: character.id,
    bio: readString(identity.summary) || readString(presentation.shortBio) || '',
    avatarUrl: readString(presentation.avatarResourceRef) || externalAssetUrl(core, 'avatar'),
    profileCoverUrl: readString(presentation.profileCoverResourceRef) || externalAssetUrl(core, 'profileCover'),
    worldId: character.worldId,
    state: null,
    friendCount: null,
    contentHash: character.contentHash,
    contentRevision: character.contentRevision,
    origin: character.origin,
    source: 'Realm WorldCoreController.listWorldCharacters',
  };
}

function settingsFromCharacter(character: WorldCharacterCoreDto): CreatorWorldCharacterSettingsDto {
  const core = characterCore(character);
  const identity = readCoreSection(core, 'identity');
  const presentation = readCoreSection(core, 'presentation');
  const interactionProfile = readCoreSection(core, 'interactionProfile');
  const psychology = readCoreSection(core, 'psychology');
  const settings = readWorldStudioSettings(core);
  const communication = readRecord(settings.communication) as CreatorWorldCharacterSettingsDto['communication'];
  const positioning = readRecord(settings.positioning) as CreatorWorldCharacterSettingsDto['positioning'];
  return {
    characterId: character.id,
    worldId: character.worldId,
    displayName: readString(presentation.displayName) || readString(identity.name) || '',
    description: readString(identity.summary) || readString(presentation.shortBio) || '',
    greeting: readString(interactionProfile.greeting) || '',
    characterCoreRevision: character.contentRevision,
    updatedAt: character.updatedAt,
    boundaries: readRecord(settings.boundaries).items
      ? readRecord(settings.boundaries)
      : { items: readStringArray(psychology.boundaries) },
    communication,
    identity,
    personality: psychology,
    positioning,
  };
}

function missingTargets(character: WorldCharacterCoreDto): string[] {
  const core = characterCore(character);
  const presentation = readCoreSection(core, 'presentation');
  const interactionProfile = readCoreSection(core, 'interactionProfile');
  const settings = settingsFromCharacter(character);
  const voice = readWorldStudioVoice(core);
  const missing: string[] = [];
  if (!readString(presentation.avatarResourceRef) && !externalAssetUrl(core, 'avatar')) missing.push('avatar');
  if (!readString(presentation.profileCoverResourceRef) && !externalAssetUrl(core, 'profileCover')) missing.push('profileCover');
  if (!readString(voice.voiceId)) missing.push('voice');
  if (!settings.greeting) missing.push('greeting');
  if (readStringArray(interactionProfile.dialogueExemplars).length === 0) missing.push('dialogueExemplars');
  if (readStringArray(readCoreSection(core, 'psychology').drives).length === 0) missing.push('behaviorDna');
  if (!settings.description) missing.push('description');
  if (!readString(settings.communication.contentStyle)) missing.push('contentStyle');
  if (!readString(settings.positioning.positioning)) missing.push('publicPositioning');
  return missing;
}

function requireCharacterEntityId(character: WorldCharacterCoreDto): string {
  const entityId = readString(character.entityId);
  if (!entityId) {
    throw new Error(`WorldCharacterCore ${character.id} is missing required entityId.`);
  }
  const placementEntityId = readString(readCoreSection(characterCore(character), 'placement').entityId);
  if (placementEntityId && placementEntityId !== entityId) {
    throw new Error(`WorldCharacterCore ${character.id} entityId ${entityId} does not match placement.entityId ${placementEntityId}.`);
  }
  return entityId;
}

function sourceRefsFromEntity(entity: WorldEntityCoreDto): CreatorWorldSourceRef[] {
  const core = readRecord(entity.core);
  const evidence = readRecord(core.evidence);
  const facts = Array.isArray(core.facts) ? core.facts.map(readRecord) : [];
  const refs = new Map<string, CreatorWorldSourceRef>();
  const addRef = (sourceRef: string, factPath?: string) => {
    const trimmed = readString(sourceRef);
    if (!trimmed) return;
    refs.set(`${trimmed}:${factPath || ''}`, {
      sourceRef: trimmed,
      kind: 'sourceRecord',
      worldId: entity.worldId,
      sourceId: entity.id,
      sourceContentHash: entity.contentHash,
      sourceKind: entity.origin.kind,
      label: entity.id,
      ...(factPath ? { factPath } : {}),
    });
  };
  for (const sourceRef of readStringArray(evidence.sourceRefs)) addRef(sourceRef);
  facts.forEach((fact, index) => {
    for (const sourceRef of readStringArray(fact.sourceRefs)) addRef(sourceRef, `core.facts[${index}]`);
  });
  refs.set(`worldEntity:${entity.worldId}:${entity.id}:${entity.contentHash}`, {
    sourceRef: `worldEntity:${entity.worldId}:${entity.id}:${entity.contentHash}`,
    kind: 'worldEntity',
    worldId: entity.worldId,
    sourceId: entity.id,
    sourceContentHash: entity.contentHash,
    sourceKind: entity.kind,
    label: entity.id,
  });
  return [...refs.values()];
}

function relationshipFactsFromCharacter(character: WorldCharacterCoreDto): CreatorWorldCharacterSourceSkeleton['sourceFacts']['relationships'] {
  const relationships = characterCore(character).relationships;
  if (!Array.isArray(relationships)) return [];
  return relationships.map((relationship) => {
    const record = readRecord(relationship);
    return {
      targetEntityId: readString(record.targetRef) || undefined,
      targetName: readString(record.targetRef) || 'unresolved-target',
      relationType: readString(record.relationType) || 'relationship',
      context: readString(record.summary) || undefined,
    };
  });
}

function factsFromEntity(entity: WorldEntityCoreDto) {
  const facts = readRecord(entity.core).facts;
  return Array.isArray(facts) ? facts.map(readRecord) : [];
}

function factText(fact: JsonRecord): string {
  const label = readString(fact.label) || readString(fact.type) || readString(fact.factId) || 'fact';
  const value = stringifyFactValue(fact.value);
  return value ? `${label}: ${value}` : label;
}

function factYear(facts: readonly JsonRecord[], tokens: readonly string[]): number | null {
  for (const fact of facts) {
    const haystack = [
      readString(fact.type),
      readString(fact.label),
      readString(fact.factId),
    ].filter(Boolean).join(' ').toLowerCase();
    if (!tokens.some((token) => haystack.includes(token))) continue;
    const direct = readNumber(fact.value);
    if (direct != null) return direct;
    const parsed = Number.parseInt(stringifyFactValue(fact.value), 10);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function sourceSkeletonFromCharacter(
  character: WorldCharacterCoreDto,
  entity: WorldEntityCoreDto,
): CreatorWorldCharacterSourceSkeleton {
  const core = characterCore(character);
  const entityCore = readRecord(entity.core);
  const identity = readCoreSection(core, 'identity');
  const entityIdentity = readCoreSection(entityCore, 'identity');
  const entityFacts = factsFromEntity(entity);
  const displayName = nonEmpty(
    readString(entityIdentity.name) || readString(identity.name),
    entity.id,
  );
  const birthYear = factYear(entityFacts, ['birth', 'born', '生']);
  const deathYear = factYear(entityFacts, ['death', 'died', '卒', '死']);
  const representativeFacts = entityFacts.map(factText).filter(Boolean);
  const sourceRefs = sourceRefsFromEntity(entity);
  const missingFields = missingTargets(character);
  return {
    characterId: character.id,
    worldId: character.worldId,
    sourceKind: character.origin.kind,
    skeletonId: `world-character:${character.id}:${character.contentHash}`,
    sourceEntityId: entity.id,
    candidateId: readString(readAuthoringExtensions(core).candidateId) || '',
    sourceIdentityId: readString(readCoreSection(entityCore, 'authoring').source) || entity.kind,
    sourceRefs,
    canonicalName: displayName,
    aliases: readStringArray(entityIdentity.aliases).length > 0 ? readStringArray(entityIdentity.aliases) : readStringArray(identity.aliases),
    sourceFacts: {
      birthYear,
      deathYear,
      timelineFactCount: representativeFacts.length,
      representativeFacts,
      officeFacts: entityFacts
        .filter((fact) => {
          const type = [readString(fact.type), readString(fact.label)].filter(Boolean).join(' ').toLowerCase();
          return type.includes('office') || type.includes('官') || type.includes('post');
        })
        .map((fact) => ({ summary: factText(fact), officeName: readString(fact.label) || undefined })),
      relationships: relationshipFactsFromCharacter(character),
    },
    missingFields,
    completionBrief: {
      description: settingsFromCharacter(character).description || 'WorldCharacterCore description is empty.',
      contentStyle: readString(settingsFromCharacter(character).communication.contentStyle)
        || 'Define content style in WorldCharacterCore authoring.extensions.worldStudioSettings.communication.',
      positioning: readString(settingsFromCharacter(character).positioning.positioning)
        || 'Define public positioning in WorldCharacterCore authoring.extensions.worldStudioSettings.positioning.',
      avatarBrief: readString(readWorldStudioSettings(core).avatarBrief) || 'Avatar must be creator-reviewed before publication.',
      voiceBrief: readString(readWorldStudioSettings(core).voiceBrief) || 'Voice must be creator-reviewed before runtime use.',
      greetingBrief: readString(readWorldStudioSettings(core).greetingBrief) || 'Greeting must be creator-reviewed before runtime use.',
      dnaBrief: readString(readWorldStudioSettings(core).behaviorBrief) || `canonicalName=${displayName}`,
    },
    runtimeReadiness: {
      roleplayRuntime: missingFields.length === 0 ? 'ready' : 'blocked',
      reason: missingFields.length === 0
        ? 'WorldCharacterCore has all required World Studio authoring fields.'
        : 'WorldCharacterCore is missing required creator-reviewed fields.',
      requiredCreatorActions: missingFields.map((field) => `provide-${field}`),
    },
    packageId: readString(entity.origin.sourceId) || '',
    packageVersion: readString(entity.origin.sourceVersion) || '',
  };
}

function contextFromCharacter(
  character: WorldCharacterCoreDto,
  sourceSkeleton: CreatorWorldCharacterSourceSkeleton,
): CreatorWorldCharacterAuthoringGenerationContext {
  const core = characterCore(character);
  const settings = settingsFromCharacter(character);
  const presentation = readCoreSection(core, 'presentation');
  const worldStudioSettings = readWorldStudioSettings(core);
  return {
    sourceSkeleton,
    currentFinalState: {
      settings,
      media: {
        avatarResourceId: readString(presentation.avatarResourceRef) || '',
        avatarUrl: externalAssetUrl(core, 'avatar') || '',
        profileCoverResourceId: readString(presentation.profileCoverResourceRef) || '',
        profileCoverUrl: externalAssetUrl(core, 'profileCover') || '',
      },
      voice: {
        voice: Object.keys(readRecord(worldStudioSettings.voice)).length > 0 ? readRecord(worldStudioSettings.voice) : null,
      },
    },
    groundingRefs: sourceSkeleton.sourceRefs.map((sourceRef): CreatorWorldSourceRef => ({
      ...sourceRef,
      label: sourceSkeleton.canonicalName,
    })),
    requiredTargets: sourceSkeleton.missingFields,
    targetStatuses: sourceSkeleton.missingFields.map((targetKey) => ({ targetKey })),
  };
}

function chatReadinessFromCharacter(
  character: WorldCharacterCoreDto,
  skeleton: CreatorWorldCharacterSourceSkeleton,
  snapshot?: RuntimeSourceSnapshotDto | null,
  snapshotError?: string,
): CreatorWorldCharacterChatReadiness {
  const core = characterCore(character);
  const presentation = readCoreSection(core, 'presentation');
  const settings = settingsFromCharacter(character);
  const voice = readWorldStudioVoice(core);
  const avatarUrl = externalAssetUrl(core, 'avatar');
  const profileCoverUrl = externalAssetUrl(core, 'profileCover');
  const hasVoice = Boolean(readString(voice.voiceId));
  const hasProfileMedia = Boolean(readString(presentation.avatarResourceRef) || avatarUrl || readString(presentation.profileCoverResourceRef) || profileCoverUrl);
  return {
    characterId: character.id,
    worldId: character.worldId,
    ownerScope: 'creator-world',
    authorityReason: 'WORLD_CHARACTER_CORE',
    consumerSurface: 'RUNTIME_SOURCE_SNAPSHOT',
    selectedInputCount: snapshot ? 1 : 0,
    suppressedInputCount: 0,
    selectedOwnerSettingFields: [],
    runtimeProjectionChecksum: snapshot?.payloadHash || character.contentHash,
    ...(snapshotError ? { runtimeSourceSnapshotError: snapshotError } : {}),
    appliedAuthoringTargets: [],
    rawCoreTextExposed: false,
    worldCoreSectionCount: 0,
    characterCoreSectionCount: 0,
    gates: {
      authoringDraftReady: skeleton.missingFields.length === 0,
      behaviorDnaReady: !skeleton.missingFields.includes('behaviorDna'),
      dialogueExemplarsReady: !skeleton.missingFields.includes('dialogueExemplars'),
      greetingReady: Boolean(settings.greeting),
      runtimeSourceIdentityReady: Boolean(snapshot),
      ownerSettingsReady: Boolean(settings.displayName && settings.description),
      profileContextReady: true,
      profileCoverReady: Boolean(readString(presentation.profileCoverResourceRef) || profileCoverUrl),
      profileMediaReady: hasProfileMedia,
      speechRouteReady: Boolean(readString(voice.speechRoutePolicy)),
      voiceReferenceReady: hasVoice,
    },
    profile: {
      displayName: settings.displayName,
      handle: character.id,
      avatarResourceId: readString(presentation.avatarResourceRef) || '',
      avatarUrl: avatarUrl || '',
      profileCoverResourceId: readString(presentation.profileCoverResourceRef) || '',
      profileCoverUrl: profileCoverUrl || '',
      defaultVoiceReference: readString(voice.voiceId) || '',
      speechModelId: readString(voice.speechModelId) || '',
      speechRoutePolicy: readString(voice.speechRoutePolicy) === 'cloud'
        ? 'cloud'
        : readString(voice.speechRoutePolicy) === 'local'
          ? 'local'
          : '',
    },
  };
}

function normalizeWorldCharacterDetail(
  character: WorldCharacterCoreDto,
  entity: WorldEntityCoreDto,
  snapshot?: RuntimeSourceSnapshotDto | null,
  snapshotError?: string,
): CreatorWorldCharacterDetail {
  const skeleton = sourceSkeletonFromCharacter(character, entity);
  return {
    ...normalizeWorldCharacter(character),
    settings: settingsFromCharacter(character),
    sourceSkeleton: skeleton,
    authoringContext: contextFromCharacter(character, skeleton),
    authoringDraftBatches: [],
    chatReadiness: chatReadinessFromCharacter(character, skeleton, snapshot, snapshotError),
    source: 'Realm WorldCoreController.getWorldCharacter',
  };
}

function nullableString(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

export function draftFromCharacter(character: CreatorWorldCharacterDetail | undefined): CreatorWorldCharacterDraft {
  const defaultVoiceReference = readString(character?.chatReadiness.profile.defaultVoiceReference);
  const voiceId = defaultVoiceReference?.startsWith('preset_voice_id:')
    ? defaultVoiceReference.slice('preset_voice_id:'.length)
    : defaultVoiceReference || '';
  return {
    displayName: character?.settings.displayName || character?.displayName || '',
    description: character?.settings.description || character?.bio || '',
    greeting: character?.settings.greeting || '',
    avatarUrl: character?.avatarUrl || '',
    profileCoverUrl: character?.profileCoverUrl || '',
    contentStyle: character?.settings.communication.contentStyle || '',
    targetAudience: character?.settings.positioning.targetAudience || '',
    positioning: character?.settings.positioning.positioning || '',
    voiceId,
    voiceDescription: '',
    speechModelId: readString(character?.chatReadiness.profile.speechModelId) || '',
    speechRoutePolicy: character?.chatReadiness.profile.speechRoutePolicy || '',
  };
}

export async function listCreatorWorlds(
  realm: StudioRealmClient = createStudioRealmClient(),
): Promise<CreatorWorldSummary[]> {
  const worlds = await realm.worldCoreControllerListWorldCores({ path: {}, query: { take: 100 } });
  const maintainedWorlds = worlds.filter((world) => readString(world.creatorId) === NIMI_WORLD_STUDIO_MAINTAINER_ACCOUNT_ID);
  return Promise.all(maintainedWorlds.map(async (world) => {
    const characters = await realm.worldCoreControllerListWorldCharacters({ path: { worldId: world.id } });
    return normalizeWorld(world, characters.length);
  }));
}

export async function listCreatorWorldCharacters(
  worldId: string,
  realm: StudioRealmClient = createStudioRealmClient(),
): Promise<CreatorWorldCharacterSummary[]> {
  const characters = await realm.worldCoreControllerListWorldCharacters({ path: { worldId } });
  return characters.map(normalizeWorldCharacter);
}

export async function getCreatorWorldDetail(
  worldId: string,
  realm: StudioRealmClient = createStudioRealmClient(),
): Promise<CreatorWorldDetail> {
  const [world, characters] = await Promise.all([
    realm.worldCoreControllerGetWorldCore({ path: { worldId } }),
    listCreatorWorldCharacters(worldId, realm),
  ]);
  return { ...normalizeWorld(world, characters.length), characters };
}

function runtimeSourceSnapshotInput(character: WorldCharacterCoreDto): CreateRuntimeSourceSnapshotDto {
  if (!character.id.trim() || !character.worldId.trim() || !character.contentHash.trim()) {
    throw new Error('WorldCharacterCore RuntimeSourceSnapshot requires id, worldId, and contentHash.');
  }
  return {
    sourceRef: {
      kind: 'worldCharacter',
      worldId: character.worldId,
      sourceId: character.id,
      sourceContentHash: character.contentHash,
    },
  };
}

export async function getCreatorWorldCharacterDetail(
  worldId: string,
  characterId: string,
  realm: StudioRealmClient = createStudioRealmClient(),
): Promise<CreatorWorldCharacterDetail> {
  try {
    const character = await realm.worldCoreControllerGetWorldCharacter({ path: { characterId: characterId } });
    if (character.worldId !== worldId) {
      throw new Error(`WorldCharacterCore ${characterId} belongs to ${character.worldId}, not ${worldId}.`);
    }
    let entity: WorldEntityCoreDto;
    try {
      const entityId = requireCharacterEntityId(character);
      entity = await realm.worldCoreControllerGetWorldEntity({ path: { entityId } });
      if (entity.worldId !== worldId) {
        throw new Error(`WorldEntityCore ${entityId} belongs to ${entity.worldId}, not ${worldId}.`);
      }
    } catch (error) {
      throw new CreatorWorldCharacterDetailLoadError('source-skeleton', error);
    }
    try {
      const snapshot = await realm.worldCoreControllerCreateRuntimeSourceSnapshot({
        path: {},
        body: runtimeSourceSnapshotInput(character),
      });
      return normalizeWorldCharacterDetail(character, entity, snapshot);
    } catch (error) {
      return normalizeWorldCharacterDetail(character, entity, null, describeUnknownError(error));
    }
  } catch (error) {
    if (error instanceof CreatorWorldCharacterDetailLoadError) {
      throw error;
    }
    throw new CreatorWorldCharacterDetailLoadError('character-detail', error);
  }
}

export async function updateCreatorWorldCharacter(
  worldId: string,
  characterId: string,
  draft: CreatorWorldCharacterDraft,
  realm: StudioRealmClient = createStudioRealmClient(),
): Promise<CreatorWorldCharacterUpdateResult> {
  const current = await realm.worldCoreControllerGetWorldCharacter({ path: { characterId: characterId } });
  if (current.worldId !== worldId) {
    throw new Error(`WorldCharacterCore ${characterId} belongs to ${current.worldId}, not ${worldId}.`);
  }
  const entityId = requireCharacterEntityId(current);
  const entity = await realm.worldCoreControllerGetWorldEntity({ path: { entityId } });
  if (entity.worldId !== worldId) {
    throw new Error(`WorldEntityCore ${entityId} belongs to ${entity.worldId}, not ${worldId}.`);
  }

  const currentCore = characterCore(current);
  const identity = readCoreSection(currentCore, 'identity');
  const presentation = readCoreSection(currentCore, 'presentation');
  const interactionProfile = readCoreSection(currentCore, 'interactionProfile');
  const assets = readCoreSection(currentCore, 'assets');
  const worldStudioSettings = readWorldStudioSettings(currentCore);
  const nextDisplayName = requireUpdateText(
    draft.displayName,
    readString(presentation.displayName) || readString(identity.name),
    'displayName',
  );
  const nextDescription = requireUpdateText(
    draft.description,
    readString(identity.summary) || readString(presentation.shortBio),
    'description',
  );
  const nextVoiceId = nullableString(draft.voiceId);
  const nextVoiceDescription = nullableString(draft.voiceDescription);
  const nextSpeechModelId = nullableString(draft.speechModelId);
  const nextAvatarUrl = nullableString(draft.avatarUrl);
  const nextProfileCoverUrl = nullableString(draft.profileCoverUrl);
  const voice = {
    ...readRecord(worldStudioSettings.voice),
    ...(nextVoiceId ? { voiceId: nextVoiceId } : {}),
    ...(nextVoiceDescription ? { description: nextVoiceDescription } : {}),
    ...(nextSpeechModelId ? { speechModelId: nextSpeechModelId } : {}),
    ...(draft.speechRoutePolicy ? { speechRoutePolicy: draft.speechRoutePolicy } : {}),
  };
  const assetsWithAvatar = nextAvatarUrl
    ? upsertExternalAssetUrl(assets, 'avatar', nextAvatarUrl)
    : assets;
  const nextAssets = nextProfileCoverUrl
    ? upsertExternalAssetUrl(
      assetsWithAvatar,
      'profileCover',
      nextProfileCoverUrl,
    )
    : assetsWithAvatar;
  const nextCore = writeAuthoringExtension({
    ...currentCore,
    identity: {
      ...identity,
      name: nextDisplayName,
      summary: nextDescription,
    },
    presentation: {
      ...presentation,
      displayName: nextDisplayName,
      shortBio: nextDescription,
    },
    interactionProfile: {
      ...interactionProfile,
      ...(nullableString(draft.greeting) ? { greeting: nullableString(draft.greeting) } : {}),
    },
    assets: nextAssets,
  }, 'worldStudioSettings', {
    ...worldStudioSettings,
    communication: {
      ...readRecord(worldStudioSettings.communication),
      contentStyle: draft.contentStyle.trim(),
    },
    positioning: {
      ...readRecord(worldStudioSettings.positioning),
      targetAudience: draft.targetAudience.trim(),
      positioning: draft.positioning.trim(),
    },
    ...(Object.keys(voice).length > 0 ? { voice } : {}),
  });
  const body: ReplaceWorldCharacterCoreDto = {
    baseContentHash: current.contentHash,
    origin: current.origin,
    entityId,
    core: nextCore,
  };

  const replaced = await realm.worldCoreControllerReplaceWorldCharacter({
    path: { characterId: characterId },
    body,
  });
  if (!replaced || replaced.id !== characterId || replaced.worldId !== worldId || replaced.entityId !== entityId || !replaced.contentHash) {
    throw new Error('WorldCharacterCore replace returned an invalid canonical response.');
  }

  return {
    ok: true,
    character: await getCreatorWorldCharacterDetail(worldId, characterId, realm),
  };
}
