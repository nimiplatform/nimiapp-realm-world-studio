import type {
  RealmApplyCreatorWorldAgentAuthoringDraftBatchOperationResponse,
  RealmCreateCreatorWorldAgentAuthoringDraftBatchOperationRequest,
  RealmCreateCreatorWorldAgentAuthoringDraftBatchOperationResponse,
  RealmGetCreatorWorldAgentAuthoringGenerationContextOperationResponse,
  RealmGetCreatorWorldAgentChatReadinessOperationResponse,
  RealmGetCreatorWorldAgentOperationResponse,
  RealmGetCreatorWorldAgentSettingsOperationResponse,
  RealmGetCreatorWorldAgentSourceSkeletonOperationResponse,
  RealmListCreatorWorldAgentAuthoringDraftBatchesOperationResponse,
  RealmListCreatorWorldAgentsOperationResponse,
  RealmListMyCreatorWorldsOperationResponse,
  RealmReviewCreatorWorldAgentAuthoringDraftCandidateOperationRequest,
  RealmReviewCreatorWorldAgentAuthoringDraftCandidateOperationResponse,
  RealmUpdateCreatorWorldAgentProfileMediaOperationRequest,
  RealmUpdateCreatorWorldAgentSettingsOperationRequest,
  RealmUpdateCreatorWorldAgentVoiceOperationRequest,
} from '@nimiplatform/sdk/realm/generated';
import { createStudioRealmClient, type StudioRealmSurface } from '@renderer/data/realm-client.js';

type StudioRealmClient = StudioRealmSurface;
type CreatorWorldDto = RealmListMyCreatorWorldsOperationResponse['items'][number];
type CreatorWorldAgentDto = RealmListCreatorWorldAgentsOperationResponse[number];
type CreatorWorldAgentSettingsDto = RealmGetCreatorWorldAgentSettingsOperationResponse;
export type CreatorWorldAgentSourceSkeleton =
  RealmGetCreatorWorldAgentSourceSkeletonOperationResponse;
export type CreatorWorldAgentChatReadiness =
  RealmGetCreatorWorldAgentChatReadinessOperationResponse;
export type CreatorWorldAgentAuthoringGenerationContext =
  RealmGetCreatorWorldAgentAuthoringGenerationContextOperationResponse;
export type CreatorWorldAgentAuthoringDraftBatch =
  RealmListCreatorWorldAgentAuthoringDraftBatchesOperationResponse['items'][number];
export type CreatorWorldAgentAuthoringDraftCandidate =
  CreatorWorldAgentAuthoringDraftBatch['candidates'][number];
export type CreatorWorldAgentAuthoringReviewStatus =
  RealmReviewCreatorWorldAgentAuthoringDraftCandidateOperationRequest['body']['status'];
export type CreateCreatorWorldAgentAuthoringDraftBatchInput =
  RealmCreateCreatorWorldAgentAuthoringDraftBatchOperationRequest['body'];
type CreatorWorldAgentSettingsPatch = RealmUpdateCreatorWorldAgentSettingsOperationRequest['body'];
type CreatorWorldAgentProfileMediaPatch = RealmUpdateCreatorWorldAgentProfileMediaOperationRequest['body'];
type CreatorWorldAgentVoicePatch = RealmUpdateCreatorWorldAgentVoiceOperationRequest['body'];

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
  agentCount: number;
  updatedAt: string;
  source: 'Realm WorldControlService.listMyCreatorWorlds';
};

export type CreatorWorldAgentSummary = {
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
  source: 'Realm AgentService.listCreatorWorldAgents';
};

export type CreatorWorldDetail = CreatorWorldSummary & {
  agents: CreatorWorldAgentSummary[];
};

export type CreatorWorldAgentDetail = Omit<CreatorWorldAgentSummary, 'source'> & {
  settings: CreatorWorldAgentSettingsDto;
  sourceSkeleton: CreatorWorldAgentSourceSkeleton;
  authoringContext: CreatorWorldAgentAuthoringGenerationContext;
  authoringDraftBatches: CreatorWorldAgentAuthoringDraftBatch[];
  chatReadiness: CreatorWorldAgentChatReadiness;
  source: 'Realm AgentService.getCreatorWorldAgent';
};

export type CreatorWorldAgentDraft = {
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

export type CreatorWorldAgentUpdateResult = {
  ok: true;
  agent: CreatorWorldAgentDetail;
};

export type CreatorWorldAgentDetailLoadStage =
  | 'agent-detail'
  | 'settings'
  | 'source-skeleton'
  | 'authoring-context'
  | 'authoring-draft-batches'
  | 'chat-readiness';

export class CreatorWorldAgentDetailLoadError extends Error {
  readonly stage: CreatorWorldAgentDetailLoadStage;
  readonly originalMessage: string;

  constructor(stage: CreatorWorldAgentDetailLoadStage, cause: unknown) {
    const originalMessage = describeUnknownError(cause);
    super(`Creator-world agent ${stage} request failed: ${originalMessage}`);
    this.name = 'CreatorWorldAgentDetailLoadError';
    this.stage = stage;
    this.originalMessage = originalMessage;
  }
}

function readRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? value as Record<string, unknown> : null;
}

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function readNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function describeUnknownError(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message.trim();
  }
  if (typeof error === 'string' && error.trim()) {
    return error.trim();
  }
  return 'Realm request failed without a typed message.';
}

function normalizeWorld(world: CreatorWorldDto): CreatorWorldSummary {
  return {
    id: world.id,
    name: world.name,
    type: 'CREATOR',
    status: world.status,
    creatorId: world.creatorId,
    authorityReason: world.authorityReason,
    tagline: readString(world.tagline) || readString(world.motto) || '',
    description: readString(world.description) || '',
    overview: readString(world.overview) || '',
    iconUrl: readString(world.iconUrl),
    bannerUrl: readString(world.bannerUrl),
    agentCount: world.agentCount,
    updatedAt: world.updatedAt,
    source: 'Realm WorldControlService.listMyCreatorWorlds',
  };
}

function normalizeWorldAgent(agent: CreatorWorldAgentDto): CreatorWorldAgentSummary {
  const profile = readRecord(agent.agentProfile);
  return {
    id: agent.id,
    displayName: agent.displayName,
    handle: agent.handle,
    bio: readString(agent.bio) || '',
    avatarUrl: readString(agent.avatarUrl),
    profileCoverUrl: readString(agent.profileCoverUrl),
    worldId: readString(profile?.worldId) || '',
    ownerWorldId: readString(profile?.ownerWorldId),
    state: readString(profile?.state),
    friendCount: readNumber(agent.friendCount),
    source: 'Realm AgentService.listCreatorWorldAgents',
  };
}

function normalizeWorldAgentDetail(
  agent: RealmGetCreatorWorldAgentOperationResponse,
  settings: CreatorWorldAgentSettingsDto,
  sourceSkeleton: CreatorWorldAgentSourceSkeleton,
  authoringContext: CreatorWorldAgentAuthoringGenerationContext,
  authoringDraftBatches: CreatorWorldAgentAuthoringDraftBatch[],
  chatReadiness: CreatorWorldAgentChatReadiness,
): CreatorWorldAgentDetail {
  if (
    authoringContext.sourceSkeleton.skeletonId !== sourceSkeleton.skeletonId
    || authoringContext.sourceSkeleton.agentId !== sourceSkeleton.agentId
    || authoringContext.sourceSkeleton.worldId !== sourceSkeleton.worldId
  ) {
    throw new Error('Creator-world agent source skeleton authority mismatch between source-skeleton and authoring context.');
  }
  return {
    ...normalizeWorldAgent(agent),
    settings,
    sourceSkeleton,
    authoringContext: {
      ...authoringContext,
      sourceSkeleton,
    },
    authoringDraftBatches,
    chatReadiness,
    source: 'Realm AgentService.getCreatorWorldAgent',
  };
}

function nullableString(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

export function draftFromAgent(agent: CreatorWorldAgentDetail | undefined): CreatorWorldAgentDraft {
  const defaultVoiceReference = readString(agent?.chatReadiness.profile.defaultVoiceReference);
  const voiceId = defaultVoiceReference?.startsWith('preset_voice_id:')
    ? defaultVoiceReference.slice('preset_voice_id:'.length)
    : '';
  return {
    displayName: agent?.settings.displayName || agent?.displayName || '',
    description: agent?.settings.description || agent?.bio || '',
    greeting: agent?.settings.greeting || '',
    avatarUrl: agent?.avatarUrl || '',
    profileCoverUrl: agent?.profileCoverUrl || '',
    contentStyle: agent?.settings.communication.contentStyle || '',
    targetAudience: agent?.settings.positioning.targetAudience || '',
    positioning: agent?.settings.positioning.positioning || '',
    voiceId,
    voiceDescription: '',
    speechModelId: readString(agent?.chatReadiness.profile.speechModelId) || '',
    speechRoutePolicy: agent?.chatReadiness.profile.speechRoutePolicy || '',
  };
}

export async function listCreatorWorlds(
  realm: StudioRealmClient = createStudioRealmClient(),
): Promise<CreatorWorldSummary[]> {
  const worlds = await realm.listMyCreatorWorlds({ path: {} });
  return worlds.items.map(normalizeWorld);
}

export async function listCreatorWorldAgents(
  worldId: string,
  realm: StudioRealmClient = createStudioRealmClient(),
): Promise<CreatorWorldAgentSummary[]> {
  const agents = await realm.listCreatorWorldAgents({ path: { worldId } });
  return agents.map(normalizeWorldAgent);
}

export async function getCreatorWorldDetail(
  worldId: string,
  realm: StudioRealmClient = createStudioRealmClient(),
): Promise<CreatorWorldDetail> {
  const [worlds, agents] = await Promise.all([
    listCreatorWorlds(realm),
    listCreatorWorldAgents(worldId, realm),
  ]);
  const world = worlds.find((item) => item.id === worldId);
  if (!world) {
    throw new Error('CREATOR_WORLD_NOT_IN_AUTHORITY_LIST');
  }
  return { ...world, agents };
}

export async function getCreatorWorldAgentDetail(
  worldId: string,
  agentId: string,
  realm: StudioRealmClient = createStudioRealmClient(),
): Promise<CreatorWorldAgentDetail> {
  const [
    agentResult,
    settingsResult,
    sourceSkeletonResult,
    authoringContextResult,
    draftBatchesResult,
    chatReadinessResult,
  ] =
    await Promise.allSettled([
    realm.getCreatorWorldAgent({ path: { worldId, agentId } }),
    realm.getCreatorWorldAgentSettings({ path: { worldId, agentId } }),
    realm.getCreatorWorldAgentSourceSkeleton({ path: { worldId, agentId } }),
    realm.getCreatorWorldAgentAuthoringGenerationContext({ path: { worldId, agentId } }),
    realm.listCreatorWorldAgentAuthoringDraftBatches({ path: { worldId, agentId } }),
    realm.getCreatorWorldAgentChatReadiness({ path: { worldId, agentId } }),
  ]);
  if (agentResult.status === 'rejected') {
    throw new CreatorWorldAgentDetailLoadError('agent-detail', agentResult.reason);
  }
  if (settingsResult.status === 'rejected') {
    throw new CreatorWorldAgentDetailLoadError('settings', settingsResult.reason);
  }
  if (sourceSkeletonResult.status === 'rejected') {
    throw new CreatorWorldAgentDetailLoadError('source-skeleton', sourceSkeletonResult.reason);
  }
  if (authoringContextResult.status === 'rejected') {
    throw new CreatorWorldAgentDetailLoadError('authoring-context', authoringContextResult.reason);
  }
  if (draftBatchesResult.status === 'rejected') {
    throw new CreatorWorldAgentDetailLoadError('authoring-draft-batches', draftBatchesResult.reason);
  }
  if (chatReadinessResult.status === 'rejected') {
    throw new CreatorWorldAgentDetailLoadError('chat-readiness', chatReadinessResult.reason);
  }
  return normalizeWorldAgentDetail(
    agentResult.value,
    settingsResult.value,
    sourceSkeletonResult.value,
    authoringContextResult.value,
    [...draftBatchesResult.value.items],
    chatReadinessResult.value,
  );
}

export async function reviewCreatorWorldAgentAuthoringDraftCandidate(
  worldId: string,
  agentId: string,
  batchId: string,
  candidateId: string,
  status: CreatorWorldAgentAuthoringReviewStatus,
  realm: StudioRealmClient = createStudioRealmClient(),
): Promise<RealmReviewCreatorWorldAgentAuthoringDraftCandidateOperationResponse> {
  return realm.reviewCreatorWorldAgentAuthoringDraftCandidate({
    path: { worldId, agentId, batchId, candidateId },
    body: { status },
  });
}

export async function createCreatorWorldAgentAuthoringDraftBatch(
  worldId: string,
  agentId: string,
  body: CreateCreatorWorldAgentAuthoringDraftBatchInput,
  realm: StudioRealmClient = createStudioRealmClient(),
): Promise<RealmCreateCreatorWorldAgentAuthoringDraftBatchOperationResponse> {
  return realm.createCreatorWorldAgentAuthoringDraftBatch({
    path: { worldId, agentId },
    body,
  });
}

export async function applyCreatorWorldAgentAuthoringDraftBatch(
  worldId: string,
  agentId: string,
  batchId: string,
  realm: StudioRealmClient = createStudioRealmClient(),
): Promise<RealmApplyCreatorWorldAgentAuthoringDraftBatchOperationResponse> {
  return realm.applyCreatorWorldAgentAuthoringDraftBatch({
    path: { worldId, agentId, batchId },
  });
}

export async function updateCreatorWorldAgent(
  worldId: string,
  agentId: string,
  draft: CreatorWorldAgentDraft,
  realm: StudioRealmClient = createStudioRealmClient(),
): Promise<CreatorWorldAgentUpdateResult> {
  const settingsBody: CreatorWorldAgentSettingsPatch = {
    displayName: draft.displayName.trim(),
    description: draft.description.trim(),
    greeting: draft.greeting.trim(),
    communication: {
      contentStyle: draft.contentStyle.trim(),
    },
    positioning: {
      targetAudience: draft.targetAudience.trim(),
      positioning: draft.positioning.trim(),
    },
  };
  await realm.updateCreatorWorldAgentSettings({
    path: { worldId, agentId },
    body: settingsBody,
  });

  const mediaBody: CreatorWorldAgentProfileMediaPatch = {
    ...(nullableString(draft.avatarUrl) ? { avatarUrl: nullableString(draft.avatarUrl) } : {}),
    ...(nullableString(draft.profileCoverUrl)
      ? { profileCoverUrl: nullableString(draft.profileCoverUrl) }
      : {}),
  };
  if (Object.keys(mediaBody).length > 0) {
    await realm.updateCreatorWorldAgentProfileMedia({
      path: { worldId, agentId },
      body: mediaBody,
    });
  }

  const voiceBody: CreatorWorldAgentVoicePatch = {
    ...(nullableString(draft.voiceId) ? { voiceId: nullableString(draft.voiceId) } : {}),
    ...(nullableString(draft.voiceDescription)
      ? { description: nullableString(draft.voiceDescription) }
      : {}),
    ...(nullableString(draft.speechModelId)
      ? { speechModelId: nullableString(draft.speechModelId) }
      : {}),
    ...(draft.speechRoutePolicy ? { speechRoutePolicy: draft.speechRoutePolicy } : {}),
  };
  if (Object.keys(voiceBody).length > 0) {
    await realm.updateCreatorWorldAgentVoice({
      path: { worldId, agentId },
      body: voiceBody,
    });
  }

  return {
    ok: true,
    agent: await getCreatorWorldAgentDetail(worldId, agentId, realm),
  };
}
