import type {
  CreateRuntimeSourceSnapshotDto,
  RealmCoreOriginDto,
  ReplaceWorldCharacterCoreDto,
  RuntimeSourceSnapshotDto,
  WorldCharacterCoreDto,
  WorldCoreDto,
} from '@nimiplatform/sdk/realm/generated';
import { createStudioRealmClient, type StudioRealmSurface } from '@renderer/data/realm-client.js';

type StudioRealmClient = StudioRealmSurface;
type JsonRecord = Record<string, unknown>;

export type CreatorWorldSourceRef = {
  sourceRef: string;
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
  sourceProfile: string;
  sourceRefs: string[];
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

export type CreateCreatorWorldCharacterAuthoringDraftBatchInput = {
  skeletonId: string;
  candidates: CreatorWorldCharacterAuthoringDraftCandidateInput[];
  metadata?: JsonRecord;
};

export type ReviewCreatorWorldCharacterAuthoringDraftCandidateResult = CreatorWorldCharacterAuthoringDraftCandidate;

export type ApplyCreatorWorldCharacterAuthoringDraftBatchResult = {
  appliedTargetKeys: string[];
  batch: CreatorWorldCharacterAuthoringDraftBatch;
};

export type CreatorWorldSummary = {
  id: string;
  name: string;
  type: 'CREATOR';
  status: string;
  creatorId: string;
  authorityReason: 'CREATOR_OWNER' | 'MAINTAIN_ACCESS';
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
  ownerWorldId: string | null;
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

function describeUnknownError(error: unknown): string {
  if (error instanceof Error && error.message.trim()) return error.message.trim();
  if (typeof error === 'string' && error.trim()) return error.trim();
  return 'Realm request failed without a typed message.';
}

function nonEmpty(value: string | null | undefined, fallback: string): string {
  return value && value.trim() ? value.trim() : fallback;
}

function normalizeWorld(world: WorldCoreDto): CreatorWorldSummary {
  const core = readRecord(world.core);
  return {
    id: world.id,
    name: nonEmpty(readString(core.name) || readString(core.displayName), world.id),
    type: 'CREATOR',
    status: readString(core.status) || world.visibility,
    creatorId: readString(world.creatorId) || 'system',
    authorityReason: world.creatorId ? 'CREATOR_OWNER' : 'MAINTAIN_ACCESS',
    tagline: readString(core.tagline) || readString(core.motto) || '',
    description: readString(core.description) || '',
    overview: readString(core.overview) || '',
    iconUrl: readString(core.iconUrl),
    bannerUrl: readString(core.bannerUrl),
    characterCount: readNumber(core.characterCount) || 0,
    updatedAt: world.updatedAt,
    source: 'Realm WorldCoreController.listWorldCores',
  };
}

function characterCore(character: WorldCharacterCoreDto): JsonRecord {
  return readRecord(character.core);
}

function normalizeWorldCharacter(character: WorldCharacterCoreDto): CreatorWorldCharacterSummary {
  const core = characterCore(character);
  return {
    id: character.id,
    displayName: nonEmpty(
      readString(core.displayName) || readString(core.name) || readString(core.canonicalName),
      character.id,
    ),
    handle: nonEmpty(readString(core.handle) || readString(core.slug), character.id),
    bio: readString(core.description) || readString(core.concept) || '',
    avatarUrl: readString(core.avatarUrl) || readString(core.referenceImageUrl),
    profileCoverUrl: readString(core.profileCoverUrl),
    worldId: character.worldId,
    ownerWorldId: character.worldId,
    state: readString(core.state) || readString(core.status),
    friendCount: null,
    contentHash: character.contentHash,
    contentRevision: character.contentRevision,
    origin: character.origin,
    source: 'Realm WorldCoreController.listWorldCharacters',
  };
}

function settingsFromCharacter(character: WorldCharacterCoreDto): CreatorWorldCharacterSettingsDto {
  const core = characterCore(character);
  const communication = readRecord(core.communication) as CreatorWorldCharacterSettingsDto['communication'];
  const positioning = readRecord(core.positioning) as CreatorWorldCharacterSettingsDto['positioning'];
  return {
    characterId: character.id,
    worldId: character.worldId,
    displayName: readString(core.displayName) || readString(core.name) || '',
    description: readString(core.description) || readString(core.concept) || '',
    greeting: readString(core.greeting) || '',
    characterCoreRevision: character.contentRevision,
    updatedAt: character.updatedAt,
    boundaries: readRecord(core.boundaries),
    communication,
    identity: readRecord(core.identity),
    personality: readRecord(core.personality),
    positioning,
  };
}

function missingTargets(character: WorldCharacterCoreDto): string[] {
  const core = characterCore(character);
  const settings = settingsFromCharacter(character);
  const missing: string[] = [];
  if (!readString(core.avatarUrl)) missing.push('avatar');
  if (!readString(core.profileCoverUrl)) missing.push('profileCover');
  if (!readString(core.voiceId) && !readString(readRecord(core.voice).voiceId)) missing.push('voice');
  if (!settings.greeting) missing.push('greeting');
  if (!readString(core.dialogueExemplars)) missing.push('dialogueExemplars');
  if (!readString(core.behaviorDna)) missing.push('behaviorDna');
  if (!settings.description) missing.push('description');
  if (!readString(settings.communication.contentStyle)) missing.push('contentStyle');
  if (!readString(settings.positioning.positioning)) missing.push('publicPositioning');
  return missing;
}

function sourceRefsFromCharacter(character: WorldCharacterCoreDto): string[] {
  const core = characterCore(character);
  const explicit = readStringArray(core.sourceRefs);
  if (explicit.length > 0) return explicit;
  const sourceId = readString(character.origin.sourceId);
  return sourceId ? [sourceId] : [`world-character:${character.id}`];
}

function sourceSkeletonFromCharacter(character: WorldCharacterCoreDto): CreatorWorldCharacterSourceSkeleton {
  const core = characterCore(character);
  const displayName = nonEmpty(
    readString(core.canonicalName) || readString(core.displayName) || readString(core.name),
    character.id,
  );
  const birthYear = readNumber(core.birthYear);
  const deathYear = readNumber(core.deathYear);
  const representativeFacts = readStringArray(core.representativeFacts);
  const sourceRefs = sourceRefsFromCharacter(character);
  const missingFields = missingTargets(character);
  return {
    characterId: character.id,
    worldId: character.worldId,
    sourceKind: readString(core.sourceKind) || character.origin.kind,
    skeletonId: `world-character:${character.id}:${character.contentHash}`,
    sourceEntityId: readString(character.entityId) || readString(character.origin.sourceId) || character.id,
    candidateId: readString(core.candidateId) || '',
    sourceProfile: readString(core.sourceProfile) || 'world-character-core',
    sourceRefs,
    canonicalName: displayName,
    aliases: readStringArray(core.aliases),
    sourceFacts: {
      birthYear,
      deathYear,
      timelineFactCount: readNumber(core.timelineFactCount) || representativeFacts.length,
      representativeFacts,
      officeFacts: [],
      relationships: [],
    },
    missingFields,
    completionBrief: {
      description: readString(core.description) || 'WorldCharacterCore description is empty.',
      contentStyle: readString(readRecord(core.communication).contentStyle) || 'Define content style in WorldCharacterCore.communication.',
      positioning: readString(readRecord(core.positioning).positioning) || 'Define public positioning in WorldCharacterCore.positioning.',
      avatarBrief: readString(core.avatarBrief) || 'Avatar must be creator-reviewed before publication.',
      voiceBrief: readString(core.voiceBrief) || 'Voice must be creator-reviewed before runtime use.',
      greetingBrief: readString(core.greetingBrief) || 'Greeting must be creator-reviewed before runtime use.',
      dnaBrief: readString(core.dnaBrief) || `canonicalName=${displayName}`,
    },
    runtimeReadiness: {
      roleplayRuntime: missingFields.length === 0 ? 'ready' : 'blocked',
      reason: missingFields.length === 0
        ? 'WorldCharacterCore has all required World Studio authoring fields.'
        : 'WorldCharacterCore is missing required creator-reviewed fields.',
      requiredCreatorActions: missingFields.map((field) => `provide-${field}`),
    },
    packageId: readString(core.packageId) || '',
    packageVersion: readString(core.packageVersion) || '',
  };
}

function contextFromCharacter(
  character: WorldCharacterCoreDto,
  sourceSkeleton: CreatorWorldCharacterSourceSkeleton,
): CreatorWorldCharacterAuthoringGenerationContext {
  const core = characterCore(character);
  const settings = settingsFromCharacter(character);
  return {
    sourceSkeleton,
    currentFinalState: {
      settings,
      media: {
        avatarResourceId: readString(core.avatarResourceId) || '',
        avatarUrl: readString(core.avatarUrl) || '',
        profileCoverResourceId: readString(core.profileCoverResourceId) || '',
        profileCoverUrl: readString(core.profileCoverUrl) || '',
      },
      voice: {
        voice: Object.keys(readRecord(core.voice)).length > 0 ? readRecord(core.voice) : null,
      },
    },
    groundingRefs: sourceSkeleton.sourceRefs.map((sourceRef): CreatorWorldSourceRef => ({
      sourceRef,
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
): CreatorWorldCharacterChatReadiness {
  const core = characterCore(character);
  const settings = settingsFromCharacter(character);
  const voice = readRecord(core.voice);
  const hasVoice = Boolean(readString(core.voiceId) || readString(voice.voiceId));
  const hasProfileMedia = Boolean(readString(core.avatarUrl) || readString(core.profileCoverUrl));
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
    appliedAuthoringTargets: [],
    rawCoreTextExposed: false,
    worldCoreSectionCount: 0,
    characterCoreSectionCount: 0,
    gates: {
      authoringDraftReady: skeleton.missingFields.length === 0,
      behaviorDnaReady: !skeleton.missingFields.includes('behaviorDna'),
      dialogueExemplarsReady: !skeleton.missingFields.includes('dialogueExemplars'),
      greetingReady: Boolean(settings.greeting),
      runtimeSourceIdentityReady: true,
      ownerSettingsReady: Boolean(settings.displayName && settings.description),
      profileContextReady: true,
      profileCoverReady: Boolean(readString(core.profileCoverUrl)),
      profileMediaReady: hasProfileMedia,
      speechRouteReady: Boolean(readString(voice.speechRoutePolicy)),
      voiceReferenceReady: hasVoice,
    },
    profile: {
      displayName: settings.displayName,
      handle: nonEmpty(readString(core.handle) || readString(core.slug), character.id),
      avatarResourceId: readString(core.avatarResourceId) || '',
      avatarUrl: readString(core.avatarUrl) || '',
      profileCoverResourceId: readString(core.profileCoverResourceId) || '',
      profileCoverUrl: readString(core.profileCoverUrl) || '',
      defaultVoiceReference: readString(core.voiceId) || readString(voice.voiceId) || '',
      speechModelId: readString(core.speechModelId) || readString(voice.speechModelId) || '',
      speechRoutePolicy: readString(core.speechRoutePolicy) === 'cloud' || readString(voice.speechRoutePolicy) === 'cloud'
        ? 'cloud'
        : readString(core.speechRoutePolicy) === 'local' || readString(voice.speechRoutePolicy) === 'local'
          ? 'local'
          : '',
    },
  };
}

function normalizeWorldCharacterDetail(
  character: WorldCharacterCoreDto,
  snapshot?: RuntimeSourceSnapshotDto | null,
): CreatorWorldCharacterDetail {
  const skeleton = sourceSkeletonFromCharacter(character);
  return {
    ...normalizeWorldCharacter(character),
    settings: settingsFromCharacter(character),
    sourceSkeleton: skeleton,
    authoringContext: contextFromCharacter(character, skeleton),
    authoringDraftBatches: [],
    chatReadiness: chatReadinessFromCharacter(character, skeleton, snapshot),
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
  return worlds
    .map(normalizeWorld)
    .filter((world) => world.type === 'CREATOR' || world.creatorId !== 'system');
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
    realm.worldCoreControllerGetWorldCore({ path: { worldId } }).then(normalizeWorld),
    listCreatorWorldCharacters(worldId, realm),
  ]);
  return { ...world, characters };
}

function runtimeSourceSnapshotInput(character: WorldCharacterCoreDto): CreateRuntimeSourceSnapshotDto {
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
    let snapshot: RuntimeSourceSnapshotDto | null = null;
    try {
      snapshot = await realm.worldCoreControllerCreateRuntimeSourceSnapshot({
        path: {},
        body: runtimeSourceSnapshotInput(character),
      });
    } catch {
      snapshot = null;
    }
    return normalizeWorldCharacterDetail(character, snapshot);
  } catch (error) {
    throw new CreatorWorldCharacterDetailLoadError('character-detail', error);
  }
}

export async function reviewCreatorWorldCharacterAuthoringDraftCandidate(
  _worldId: string,
  _characterId: string,
  _batchId: string,
  _candidateId: string,
  _status: CreatorWorldCharacterAuthoringReviewStatus,
  _realm: StudioRealmClient = createStudioRealmClient(),
): Promise<ReviewCreatorWorldCharacterAuthoringDraftCandidateResult> {
  throw new Error('WorldCharacterCore does not admit Realm authoring draft candidate review mutations.');
}

export async function createCreatorWorldCharacterAuthoringDraftBatch(
  _worldId: string,
  _characterId: string,
  _body: CreateCreatorWorldCharacterAuthoringDraftBatchInput,
  _realm: StudioRealmClient = createStudioRealmClient(),
): Promise<CreatorWorldCharacterAuthoringDraftBatch> {
  throw new Error('WorldCharacterCore does not admit Realm authoring draft batch creation mutations.');
}

export async function applyCreatorWorldCharacterAuthoringDraftBatch(
  _worldId: string,
  _characterId: string,
  _batchId: string,
  _realm: StudioRealmClient = createStudioRealmClient(),
): Promise<ApplyCreatorWorldCharacterAuthoringDraftBatchResult> {
  throw new Error('WorldCharacterCore does not admit Realm authoring draft batch apply mutations.');
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

  const currentCore = characterCore(current);
  const voice = {
    ...readRecord(currentCore.voice),
    ...(nullableString(draft.voiceId) ? { voiceId: nullableString(draft.voiceId) } : {}),
    ...(nullableString(draft.voiceDescription) ? { description: nullableString(draft.voiceDescription) } : {}),
    ...(nullableString(draft.speechModelId) ? { speechModelId: nullableString(draft.speechModelId) } : {}),
    ...(draft.speechRoutePolicy ? { speechRoutePolicy: draft.speechRoutePolicy } : {}),
  };
  const body: ReplaceWorldCharacterCoreDto = {
    baseContentHash: current.contentHash,
    origin: current.origin,
    ...(current.entityId ? { entityId: current.entityId } : {}),
    core: {
      ...currentCore,
      displayName: draft.displayName.trim(),
      description: draft.description.trim(),
      greeting: draft.greeting.trim(),
      ...(nullableString(draft.avatarUrl) ? { avatarUrl: nullableString(draft.avatarUrl) } : {}),
      ...(nullableString(draft.profileCoverUrl) ? { profileCoverUrl: nullableString(draft.profileCoverUrl) } : {}),
      communication: {
        ...readRecord(currentCore.communication),
        contentStyle: draft.contentStyle.trim(),
      },
      positioning: {
        ...readRecord(currentCore.positioning),
        targetAudience: draft.targetAudience.trim(),
        positioning: draft.positioning.trim(),
      },
      ...(Object.keys(voice).length > 0 ? { voice } : {}),
    },
  };

  await realm.worldCoreControllerReplaceWorldCharacter({
    path: { characterId: characterId },
    body,
  });

  return {
    ok: true,
    character: await getCreatorWorldCharacterDetail(worldId, characterId, realm),
  };
}
