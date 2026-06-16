import { describe, expect, it, vi } from 'vitest';
import type { StudioRealmSurface } from '@renderer/data/realm-client.js';
import {
  getCreatorWorldAgentDetail,
  type CreatorWorldAgentDetailLoadError,
  type CreatorWorldAgentAuthoringGenerationContext,
  type CreatorWorldAgentChatReadiness,
  type CreatorWorldAgentSourceSkeleton,
} from './world-studio-client.js';

const worldId = 'world-cbdb';
const agentId = 'agent-su-shi';

function sourceSkeleton(
  overrides: Partial<CreatorWorldAgentSourceSkeleton> = {},
): CreatorWorldAgentSourceSkeleton {
  return {
    agentId,
    worldId,
    sourceKind: 'CBDB',
    skeletonId: 'skeleton-su-shi',
    sourceEntityId: 'cbdb:person:su-shi',
    candidateId: 'candidate-su-shi',
    sourceProfile: 'cbdb-historical',
    sourceRefs: ['CBDB:255e4506ce'],
    canonicalName: '蘇軾',
    aliases: ['子瞻'],
    sourceFacts: {
      birthYear: 1036,
      deathYear: 1101,
      timelineFactCount: 1,
      representativeFacts: ['蘇軾 has CBDB birth year 1036.'],
      officeFacts: [],
      relationships: [],
    },
    missingFields: ['avatar', 'profileCover', 'voice', 'greeting', 'dialogueExemplars', 'behaviorDna'],
    completionBrief: {
      description: 'CBDB historical structured records.',
      contentStyle: 'Reviewed historical exposition.',
      positioning: 'Inspectable CBDB shell.',
      avatarBrief: 'Creator-reviewed portrait direction.',
      voiceBrief: 'Narration direction only.',
      greetingBrief: 'Creator-reviewed greeting.',
      dnaBrief: 'aliases=子瞻; birth=1036; death=1101',
    },
    runtimeReadiness: {
      roleplayRuntime: 'blocked',
      reason: 'authoring targets missing',
      requiredCreatorActions: ['provide-greeting'],
    },
    packageId: 'cbdb-package',
    packageVersion: '0.1.0',
    ...overrides,
  };
}

function authoringContext(
  skeleton: CreatorWorldAgentSourceSkeleton,
): CreatorWorldAgentAuthoringGenerationContext {
  return {
    sourceSkeleton: skeleton,
    currentFinalState: {
      settings: {
        agentId,
        worldId,
        displayName: '蘇軾',
        description: '',
        greeting: '',
        agentRuleVersion: 1,
        updatedAt: '2026-06-16T00:00:00.000Z',
        boundaries: {},
        communication: {},
        identity: {},
        personality: {},
        positioning: {},
      },
      media: {
        avatarResourceId: '',
        avatarUrl: '',
        profileCoverResourceId: '',
        profileCoverUrl: '',
      },
      voice: {
        voice: null,
      },
    },
    groundingRefs: [],
    requiredTargets: ['avatar', 'profileCover', 'voice', 'greeting', 'dialogueExemplars', 'behaviorDna'],
    targetStatuses: [],
  };
}

function chatReadiness(): CreatorWorldAgentChatReadiness {
  return {
    agentId,
    worldId,
    ownerScope: 'creator-world',
    authorityReason: 'CREATOR_OWNER',
    consumerSurface: 'AGENT_CHAT_READINESS',
    selectedInputCount: 0,
    suppressedInputCount: 0,
    selectedOwnerSettingFields: [],
    runtimeProjectionChecksum: 'checksum:sushi',
    appliedAuthoringTargets: [],
    rawRuleContentExposed: false,
    worldRuleCount: 0,
    agentRuleCount: 0,
    gates: {
      authoringDraftReady: false,
      behaviorDnaReady: false,
      dialogueExemplarsReady: false,
      greetingReady: false,
      localAgentIdentityReady: true,
      ownerSettingsReady: false,
      profileContextReady: true,
      profileCoverReady: false,
      profileMediaReady: false,
      speechRouteReady: false,
      voiceReferenceReady: false,
    },
    profile: {
      displayName: '蘇軾',
      handle: 'cbdb-su-shi',
      avatarResourceId: '',
      avatarUrl: '',
      profileCoverResourceId: '',
      profileCoverUrl: '',
      defaultVoiceReference: '',
      speechModelId: '',
      speechRoutePolicy: 'local',
    },
  };
}

function realmSurface(input: {
  sourceSkeleton?: CreatorWorldAgentSourceSkeleton;
  contextSkeleton?: CreatorWorldAgentSourceSkeleton;
  sourceSkeletonError?: Error;
} = {}): StudioRealmSurface {
  const directSkeleton = input.sourceSkeleton || sourceSkeleton();
  const contextSkeleton = input.contextSkeleton || directSkeleton;
  return {
    getCreatorWorldAgent: vi.fn(async () => ({
      id: agentId,
      displayName: '蘇軾',
      handle: 'cbdb-su-shi',
      bio: '',
      avatarUrl: null,
      profileCoverUrl: null,
      friendCount: 0,
      agentProfile: {
        worldId,
        ownerWorldId: worldId,
        state: 'INCUBATING',
      },
    })),
    getCreatorWorldAgentSettings: vi.fn(async () => authoringContext(directSkeleton).currentFinalState.settings),
    getCreatorWorldAgentSourceSkeleton: vi.fn(async () => {
      if (input.sourceSkeletonError) throw input.sourceSkeletonError;
      return directSkeleton;
    }),
    getCreatorWorldAgentAuthoringGenerationContext: vi.fn(async () => authoringContext(contextSkeleton)),
    listCreatorWorldAgentAuthoringDraftBatches: vi.fn(async () => ({ items: [] })),
    getCreatorWorldAgentChatReadiness: vi.fn(async () => chatReadiness()),
  } as unknown as StudioRealmSurface;
}

describe('world-studio creator-world agent client', () => {
  it('reads source-skeleton authority directly and uses it for detail state', async () => {
    const directSkeleton = sourceSkeleton({ aliases: ['子瞻', '文忠', '東坡居士'] });
    const staleContextSkeleton = sourceSkeleton({ aliases: ['stale-context-alias'] });
    const realm = realmSurface({
      sourceSkeleton: directSkeleton,
      contextSkeleton: staleContextSkeleton,
    });

    const detail = await getCreatorWorldAgentDetail(worldId, agentId, realm);

    expect(realm.getCreatorWorldAgentSourceSkeleton).toHaveBeenCalledWith({
      path: { worldId, agentId },
    });
    expect(detail.sourceSkeleton).toBe(directSkeleton);
    expect(detail.authoringContext.sourceSkeleton).toBe(directSkeleton);
    expect(detail.sourceSkeleton.aliases).toEqual(['子瞻', '文忠', '東坡居士']);
  });

  it('reports source-skeleton as the failing detail load stage', async () => {
    const realm = realmSurface({
      sourceSkeletonError: new Error('source skeleton endpoint unavailable'),
    });

    await expect(getCreatorWorldAgentDetail(worldId, agentId, realm)).rejects.toMatchObject({
      stage: 'source-skeleton',
      originalMessage: 'source skeleton endpoint unavailable',
    } satisfies Partial<CreatorWorldAgentDetailLoadError>);
  });

  it('fails closed when source-skeleton and authoring context point at different skeletons', async () => {
    const realm = realmSurface({
      sourceSkeleton: sourceSkeleton({ skeletonId: 'source-skeleton-authority' }),
      contextSkeleton: sourceSkeleton({ skeletonId: 'authoring-context-stale-skeleton' }),
    });

    await expect(getCreatorWorldAgentDetail(worldId, agentId, realm)).rejects.toThrow(
      'source skeleton authority mismatch',
    );
  });
});
