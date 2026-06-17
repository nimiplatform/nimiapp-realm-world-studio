import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FallbackPolicy, FinishReason, RoutePolicy } from '@nimiplatform/sdk/runtime/generated';
import {
  WORLD_STUDIO_AUTHORING_SURFACE_ID,
  generateCreatorWorldCharacterAuthoringDraftBatch,
} from './character-authoring-draft-generation.js';
import type { CreatorWorldCharacterAuthoringGenerationContext } from './world-studio-client.js';

const mocks = vi.hoisted(() => ({
  createRuntimeClient: vi.fn(),
  ensureRuntimeReady: vi.fn(),
  readSelectedParams: vi.fn(),
  readTargetRef: vi.fn(),
  createRouteDeps: vi.fn(() => ({ host: 'deps' })),
  listRouteOptions: vi.fn(),
  createBatch: vi.fn(),
}));

vi.mock('@renderer/data/runtime-client.js', () => ({
  createStudioRuntimeClient: mocks.createRuntimeClient,
}));

vi.mock('@renderer/infra/studio-bootstrap.js', () => ({
  ensureStudioRuntimeClientReady: mocks.ensureRuntimeReady,
}));

vi.mock('@renderer/features/ai-config/studio-ai-config-store.js', () => ({
  readStudioAIConfigSelectedParams: mocks.readSelectedParams,
  readStudioAIConfigTargetRef: mocks.readTargetRef,
}));

vi.mock('@nimiplatform/sdk/runtime', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@nimiplatform/sdk/runtime')>();
  return {
    ...actual,
    createNimiRuntimeRouteOptionsHostDeps: mocks.createRouteDeps,
    listNimiRuntimeRouteOptionsWithHost: mocks.listRouteOptions,
  };
});

vi.mock('./world-studio-client.js', () => ({
  createCreatorWorldCharacterAuthoringDraftBatch: mocks.createBatch,
}));

const worldId = 'world-cbdb';
const characterId = 'character-su-shi';

function authoringContext(): CreatorWorldCharacterAuthoringGenerationContext {
  return {
    sourceSkeleton: {
      characterId,
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
    },
    currentFinalState: {
      settings: {
        characterId,
        worldId,
        displayName: '蘇軾',
        description: '',
        greeting: '',
        characterCoreRevision: 1,
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
    groundingRefs: [
      {
        sourceRef: 'CBDB:255e4506ce',
        sourceKind: 'CBDB',
        label: 'CBDB Su Shi',
        factPath: 'sourceFacts.representativeFacts[0]',
      },
    ],
    requiredTargets: ['avatar', 'profileCover', 'voice', 'greeting', 'dialogueExemplars', 'behaviorDna'],
    targetStatuses: [],
  };
}

function routeSnapshot() {
  return {
    local: {
      defaultEndpoint: '',
      models: [
        {
          model: 'runtime-text-model',
          modelId: 'runtime-text-model',
          provider: 'local',
          engine: 'llama.cpp',
          localModelId: 'runtime-text-model',
          status: 'active',
        },
      ],
    },
    connectors: [],
  };
}

function runtimeResponse(candidates: readonly unknown[]) {
  return {
    output: {
      output: {
        oneofKind: 'textGenerate',
        textGenerate: {
          text: JSON.stringify({ candidates }),
          artifacts: [],
        },
      },
    },
    finishReason: FinishReason.STOP,
    routeDecision: RoutePolicy.LOCAL,
    modelResolved: 'runtime-text-model',
    traceId: 'runtime-trace-1',
    ignoredExtensions: [],
  };
}

describe('character authoring draft Runtime generation', () => {
  beforeEach(() => {
    for (const mock of Object.values(mocks)) {
      mock.mockReset();
    }
    mocks.ensureRuntimeReady.mockResolvedValue(undefined);
    mocks.createRuntimeClient.mockResolvedValue({
      ai: {
        executeScenario: vi.fn(),
      },
    });
    mocks.readSelectedParams.mockReturnValue({});
    mocks.readTargetRef.mockReturnValue({
      kind: 'local-runtime',
      profileId: 'runtime-text-model',
    });
    mocks.listRouteOptions.mockResolvedValue(routeSnapshot());
    mocks.createBatch.mockResolvedValue({
      id: 'batch-1',
      candidates: [],
    });
  });

  it('fails closed before route catalog lookup when AIConfig targetRef is missing', async () => {
    mocks.readTargetRef.mockReturnValue(null);

    await expect(generateCreatorWorldCharacterAuthoringDraftBatch(worldId, characterId, authoringContext()))
      .rejects.toThrow('NimiAIConfig targetRef missing for text.generate');

    expect(mocks.listRouteOptions).not.toHaveBeenCalled();
    expect(mocks.createBatch).not.toHaveBeenCalled();
  });

  it('rejects Runtime text output with no candidates', async () => {
    const executeScenario = vi.fn(async () => runtimeResponse([]));
    mocks.createRuntimeClient.mockResolvedValue({ ai: { executeScenario } });

    await expect(generateCreatorWorldCharacterAuthoringDraftBatch(worldId, characterId, authoringContext()))
      .rejects.toThrow('non-empty candidates');

    expect(executeScenario).toHaveBeenCalled();
    expect(mocks.createBatch).not.toHaveBeenCalled();
  });

  it('rejects Runtime output that did not stop cleanly', async () => {
    const executeScenario = vi.fn(async () => ({
      ...runtimeResponse([
        {
          targetKey: 'greeting',
          value: {
            kind: 'text',
            text: '吾乃蘇軾。',
            provenance: [
              {
                category: 'ai_authored_texture',
                refs: ['CBDB:255e4506ce'],
                summary: 'Greeting texture grounded by CBDB identity facts.',
              },
            ],
          },
          sourceRefs: [
            {
              sourceRef: 'CBDB:255e4506ce',
              sourceKind: 'CBDB',
              label: 'CBDB Su Shi',
            },
          ],
        },
      ]),
      finishReason: FinishReason.LENGTH,
    }));
    mocks.createRuntimeClient.mockResolvedValue({ ai: { executeScenario } });

    await expect(generateCreatorWorldCharacterAuthoringDraftBatch(worldId, characterId, authoringContext()))
      .rejects.toThrow('did not finish cleanly');

    expect(executeScenario).toHaveBeenCalled();
    expect(mocks.createBatch).not.toHaveBeenCalled();
  });

  it('persists only validated Runtime candidates with real trace metadata', async () => {
    const executeScenario = vi.fn(async () => runtimeResponse([
      {
        targetKey: 'greeting',
        value: {
          kind: 'text',
          text: '吾乃蘇軾，願與君共觀文章與世事。',
          unexpectedModelField: 'must-not-be-persisted',
          provenance: [
            {
              category: 'ai_authored_texture',
              refs: ['CBDB:255e4506ce'],
              summary: 'Greeting texture grounded by CBDB identity facts.',
            },
          ],
        },
        sourceRefs: [
          {
            sourceRef: 'CBDB:255e4506ce',
            sourceKind: 'CBDB',
            label: 'CBDB Su Shi',
          },
        ],
      },
    ]));
    mocks.createRuntimeClient.mockResolvedValue({ ai: { executeScenario } });

    await generateCreatorWorldCharacterAuthoringDraftBatch(worldId, characterId, authoringContext());

    expect(executeScenario).toHaveBeenCalledWith(
      expect.objectContaining({
        head: expect.objectContaining({
          appId: 'nimi.realm-world-studio',
          fallback: FallbackPolicy.DENY,
          modelId: 'runtime-text-model',
          routePolicy: RoutePolicy.LOCAL,
        }),
      }),
      expect.objectContaining({
        metadata: expect.objectContaining({
          surfaceId: WORLD_STUDIO_AUTHORING_SURFACE_ID,
        }),
      }),
    );
    expect(mocks.createBatch).toHaveBeenCalledTimes(1);
    const body = mocks.createBatch.mock.calls[0]?.[2];
    expect(body).toMatchObject({
      skeletonId: 'skeleton-su-shi',
      candidates: [
        {
          targetKey: 'greeting',
          modelId: 'runtime-text-model',
          routePolicy: 'local',
          runtimeTraceId: 'runtime-trace-1',
          provenance: {
            runtimeAppId: 'nimi.realm-world-studio',
            surfaceId: WORLD_STUDIO_AUTHORING_SURFACE_ID,
            skeletonId: 'skeleton-su-shi',
          },
        },
      ],
    });
    expect(body?.candidates[0]?.value).not.toHaveProperty('unexpectedModelField');
    expect(body?.candidates[0]?.promptDigestSha256).toMatch(/^[a-f0-9]{64}$/);
  });
});
