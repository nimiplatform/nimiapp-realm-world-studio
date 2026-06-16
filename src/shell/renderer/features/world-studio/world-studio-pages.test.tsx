import '@testing-library/jest-dom/vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CreatorWorldAgentDetailPage } from './world-studio-pages.js';
import { generateCreatorWorldAgentAuthoringDraftBatch } from './agent-authoring-draft-generation.js';
import {
  CreatorWorldAgentDetailLoadError,
  applyCreatorWorldAgentAuthoringDraftBatch,
  getCreatorWorldAgentDetail,
  reviewCreatorWorldAgentAuthoringDraftCandidate,
  type CreatorWorldAgentDetail,
} from './world-studio-client.js';

vi.mock('./world-studio-client.js', async () => {
  const actual = await vi.importActual<typeof import('./world-studio-client.js')>(
    './world-studio-client.js',
  );
  return {
    ...actual,
    applyCreatorWorldAgentAuthoringDraftBatch: vi.fn(),
    getCreatorWorldAgentDetail: vi.fn(),
    reviewCreatorWorldAgentAuthoringDraftCandidate: vi.fn(),
    updateCreatorWorldAgent: vi.fn(),
  };
});

vi.mock('./agent-authoring-draft-generation.js', () => ({
  generateCreatorWorldAgentAuthoringDraftBatch: vi.fn(),
}));

vi.mock('@nimiplatform/kit/ui', async () => {
  const React = await vi.importActual<typeof import('react')>('react');
  type PrimitiveProps = Record<string, unknown> & { children?: React.ReactNode };
  const asNode = (value: unknown): React.ReactNode => value as React.ReactNode;
  const asString = (value: unknown): string | undefined =>
    typeof value === 'string' ? value : undefined;
  const cleanProps = (props: PrimitiveProps, extraKeys: string[] = []) => {
    const omitted = new Set([
      'as',
      'interactive',
      'leadingIcon',
      'loading',
      'padding',
      'tone',
      'viewportClassName',
      ...extraKeys,
    ]);
    return Object.fromEntries(Object.entries(props).filter(([key]) => !omitted.has(key)));
  };
  const Button = ({ children, leadingIcon, loading, tone, ...props }: PrimitiveProps) =>
    React.createElement('button', cleanProps(props), asNode(leadingIcon), loading ? 'Loading ' : null, children);
  const EmptyState = ({ title, description }: PrimitiveProps) =>
    React.createElement('div', null, React.createElement('h2', null, asNode(title)), React.createElement('p', null, asNode(description)));
  const FieldShell = ({ label, children }: PrimitiveProps) =>
    React.createElement('label', null, React.createElement('span', null, asNode(label)), children);
  const InlineAlert = ({ children }: PrimitiveProps) => React.createElement('div', null, children);
  const LoadingSkeleton = () => React.createElement('div', null, 'Loading');
  const ScrollArea = ({ children, className }: PrimitiveProps) =>
    React.createElement('div', { className: asString(className) }, children);
  const SearchField = (props: PrimitiveProps) =>
    React.createElement('input', cleanProps(props));
  const StatusBadge = ({ children }: PrimitiveProps) =>
    React.createElement('span', null, children);
  const Surface = ({ as, children, ...props }: PrimitiveProps) =>
    React.createElement((as || 'div') as React.ElementType, cleanProps(props), children);
  const TextareaField = (props: PrimitiveProps) =>
    React.createElement('textarea', cleanProps(props));
  const TextField = (props: PrimitiveProps) =>
    React.createElement('input', cleanProps(props));
  return {
    Button,
    EmptyState,
    FieldShell,
    InlineAlert,
    LoadingSkeleton,
    ScrollArea,
    SearchField,
    StatusBadge,
    Surface,
    TextareaField,
    TextField,
  };
});

const worldId = 'cbdb-song-slice-real-20260614-world';
const agentId = 'cbdb-song-slice-real-20260614-agent-255e4506ce';

function renderAgentPage() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[`/worlds/${worldId}/agents/${agentId}`]}>
        <Routes>
          <Route path="/worlds/:worldId/agents/:agentId" element={<CreatorWorldAgentDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function suShiAgentDetail(): CreatorWorldAgentDetail {
  const settings: CreatorWorldAgentDetail['settings'] = {
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
  };
  const sourceRefs = [
    {
      sourceRef: 'CBDB:255e4506ce',
      sourceKind: 'CBDB',
      label: 'CBDB Su Shi',
      factPath: 'sourceFacts.representativeFacts[0]',
    },
  ];
  const sourceSkeleton: CreatorWorldAgentDetail['sourceSkeleton'] = {
    agentId,
    worldId,
    sourceKind: 'CBDB',
    skeletonId: 'cbdb-song-slice-real-20260614-agent-skeleton-255e4506ce',
    sourceEntityId: 'cbdb:person:su-shi',
    candidateId: 'cbdb-song-slice-real-20260614-agent-candidate-255e4506ce',
    sourceProfile: 'cbdb-historical',
    sourceRefs: ['CBDB:255e4506ce'],
    canonicalName: '蘇軾',
    aliases: ['子瞻', '文忠', '東坡居士'],
    sourceFacts: {
      birthYear: 1036,
      deathYear: 1101,
      timelineFactCount: 28,
      representativeFacts: [
        '蘇軾 has CBDB birth year 1036.',
        '蘇軾 held office 朝奉郎 during 1085-0 in CBDB structured records.',
      ],
      officeFacts: [
        {
          eventId: 'cbdb-event-su-shi-1085',
          name: '朝奉郎',
          officeName: '朝奉郎',
          summary: '蘇軾 held office 朝奉郎 during 1085-0 in CBDB structured records.',
        },
      ],
      relationships: [
        {
          relationshipId: 'cbdb-rel-su-shi-su-zhe',
          targetEntityId: 'cbdb:person:su-zhe',
          targetName: '蘇轍',
          relationType: '10',
          context: 'ASSOC_DATA.10',
        },
      ],
    },
    missingFields: ['avatar', 'profileCover', 'voice', 'greeting', 'dialogueExemplars', 'behaviorDna'],
    completionBrief: {
      description: '蘇軾 is grounded in CBDB historical structured records.',
      contentStyle: 'Use reviewed historical exposition; do not invent dialogue.',
      positioning: '蘇軾 is an inspectable CBDB-derived historical authoring shell.',
      avatarBrief: 'Create or select a creator-reviewed historical portrait direction.',
      voiceBrief: 'Draft a voice profile only from creator-reviewed sources.',
      greetingBrief: 'Draft a first greeting after creator review.',
      dnaBrief: 'identity aliases=子瞻、文忠、東坡居士; birth=1036; death=1101; relationships=蘇轍',
    },
    runtimeReadiness: {
      roleplayRuntime: 'blocked',
      reason:
        'roleplay is blocked until creator accepts or completes avatar, profileCover, voice, greeting, dialogueExemplars, and behaviorDna runtime fields.',
      requiredCreatorActions: [
        'review-source-facts',
        'provide-avatar-direction',
        'provide-profile-cover-direction',
        'provide-voice-profile',
        'provide-greeting',
        'provide-dialogue-exemplars-and-behavior-dna',
      ],
    },
    packageId: 'cbdb-song-slice-real-20260614',
    packageVersion: '0.1.0',
  };
  const runtimeTrace = {
    runtimeAppId: 'nimi.realm-world-studio',
    surfaceId: 'realm-world-studio.agent-authoring.greeting',
    skeletonId: sourceSkeleton.skeletonId,
    scenarioId: 'realm-world-studio.agent-authoring.greeting.v1',
    promptTemplateId: 'cbdb-authoring-greeting-v1',
    sourceDigestSha256: '1111111111111111111111111111111111111111111111111111111111111111',
  };
  const greetingCandidateValue = {
    kind: 'text' as const,
    text: '吾乃蘇軾，願與君共觀文章與世事。',
    provenance: [
      {
        category: 'ai_authored_texture' as const,
        refs: ['CBDB:255e4506ce'],
        summary: 'Greeting texture grounded by reviewed CBDB identity facts.',
      },
    ],
  };
  return {
    id: agentId,
    displayName: '蘇軾',
    handle: 'cbdb-su-shi',
    bio: '',
    avatarUrl: null,
    profileCoverUrl: null,
    worldId,
    ownerWorldId: worldId,
    state: 'INCUBATING',
    friendCount: 0,
    source: 'Realm AgentService.getCreatorWorldAgent',
    settings,
    chatReadiness: {
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
    },
    sourceSkeleton,
    authoringContext: {
      sourceSkeleton,
      currentFinalState: {
        settings,
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
      requiredTargets: ['avatar', 'profileCover', 'voice', 'greeting', 'dialogueExemplars', 'behaviorDna'],
      groundingRefs: sourceRefs,
      targetStatuses: [
        {
          targetKey: 'greeting',
          latestReviewStatus: 'pending',
          latestBatchId: 'authoring-batch-su-shi-1',
          latestCandidateId: 'authoring-candidate-su-shi-greeting-1',
          appliedAt: '',
        },
      ],
    },
    authoringDraftBatches: [
      {
        id: 'authoring-batch-su-shi-1',
        worldId,
        agentId,
        skeletonId: sourceSkeleton.skeletonId,
        sourceKind: 'CBDB',
        status: 'ready_for_review',
        createdBy: 'creator-account-su-shi',
        createdAt: '2026-06-16T00:00:00.000Z',
        updatedAt: '2026-06-16T00:00:00.000Z',
        appliedAt: '',
        failureCode: '',
        failureMessage: '',
        metadata: {
          runtimeAppId: 'nimi.realm-world-studio',
          surfaceId: 'realm-world-studio.agent-authoring.greeting',
        },
        candidates: [
          {
            id: 'authoring-candidate-su-shi-greeting-1',
            targetKey: 'greeting',
            value: greetingCandidateValue,
            sourceRefs,
            modelId: 'gpt-5',
            routePolicy: 'cloud',
            promptDigestSha256: '2222222222222222222222222222222222222222222222222222222222222222',
            runtimeTraceId: 'runtime-trace-su-shi-greeting-1',
            provenance: runtimeTrace,
            generatedAt: '2026-06-16T00:00:00.000Z',
            reviewStatus: 'pending',
            reviewerId: '',
            reviewedAt: '',
            appliedAt: '',
          },
        ],
      },
    ],
  };
}

describe('CreatorWorldAgentDetailPage source skeleton acceptance', () => {
  beforeEach(() => {
    const detail = suShiAgentDetail();
    vi.mocked(applyCreatorWorldAgentAuthoringDraftBatch).mockReset();
    vi.mocked(generateCreatorWorldAgentAuthoringDraftBatch).mockReset();
    vi.mocked(getCreatorWorldAgentDetail).mockReset();
    vi.mocked(reviewCreatorWorldAgentAuthoringDraftCandidate).mockReset();
    vi.mocked(applyCreatorWorldAgentAuthoringDraftBatch).mockResolvedValue({
      appliedTargetKeys: ['greeting'],
      batch: detail.authoringDraftBatches[0]!,
    });
    vi.mocked(getCreatorWorldAgentDetail).mockResolvedValue(detail);
    vi.mocked(reviewCreatorWorldAgentAuthoringDraftCandidate).mockResolvedValue(
      detail.authoringDraftBatches[0]!.candidates[0]!,
    );
    vi.mocked(generateCreatorWorldAgentAuthoringDraftBatch).mockResolvedValue({
      batch: detail.authoringDraftBatches[0]!,
      runtimeTraceId: 'runtime-trace-su-shi-greeting-1',
      promptDigestSha256: '2222222222222222222222222222222222222222222222222222222222222222',
    });
  });

  it('renders Su Shi CBDB source facts, gaps, brief, and blocked runtime readiness', async () => {
    const { container } = renderAgentPage();

    await waitFor(() => expect(screen.getByRole('heading', { name: '蘇軾' })).toBeInTheDocument());

    expect(screen.getByRole('heading', { name: 'Source identity' })).toBeInTheDocument();
    expect(screen.getByText('CBDB historical')).toBeInTheDocument();
    expect(screen.getAllByText('蘇軾').length).toBeGreaterThan(0);
    expect(screen.getByText('子瞻 / 文忠 / 東坡居士')).toBeInTheDocument();
    expect(screen.getByText('1036 / 1101')).toBeInTheDocument();

    expect(screen.getByRole('heading', { name: 'World facts' })).toBeInTheDocument();
    expect(screen.getByText('28 timeline facts')).toBeInTheDocument();
    expect(screen.getByText('蘇軾 held office 朝奉郎 during 1085-0 in CBDB structured records.')).toBeInTheDocument();
    expect(screen.getByText('蘇轍: 10 (ASSOC_DATA.10)')).toBeInTheDocument();

    expect(screen.getByRole('heading', { name: 'Completion gaps' })).toBeInTheDocument();
    for (const field of ['avatar', 'profileCover', 'voice', 'greeting', 'dialogueExemplars', 'behaviorDna']) {
      expect(screen.getAllByText(field).length).toBeGreaterThan(0);
    }
    expect(screen.getByText(/roleplay is blocked until creator accepts or completes/)).toBeInTheDocument();

    expect(screen.getByRole('heading', { name: 'Authoring brief' })).toBeInTheDocument();
    expect(screen.getByText('Forge-derived brief')).toBeInTheDocument();
    for (const label of [
      'Description',
      'Content style',
      'Positioning',
      'Avatar brief',
      'Voice brief',
      'Greeting brief',
      'DNA brief',
    ]) {
      expect(screen.getAllByText(label).length).toBeGreaterThan(0);
    }

    expect(screen.getByRole('heading', { name: 'Generation targets' })).toBeInTheDocument();
    expect(screen.getByText('profileCover: missing')).toBeInTheDocument();
    expect(screen.getByText('greeting: pending')).toBeInTheDocument();

    expect(screen.getByRole('heading', { name: 'Draft candidates' })).toBeInTheDocument();
    expect(screen.getByText('authoring-batch-su-shi-1')).toBeInTheDocument();
    expect(screen.getByText('runtime-trace-su-shi-greeting-1')).toBeInTheDocument();
    expect(screen.getByDisplayValue(/吾乃蘇軾/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Apply accepted/ })).toBeDisabled();

    expect(container).not.toHaveTextContent('AI generated');
    expect(container.innerHTML).not.toContain('dicebear');
  });

  it('reviews pending authoring candidates through the draft API', async () => {
    renderAgentPage();

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Draft candidates' })).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /Accept/ }));

    await waitFor(() =>
      expect(reviewCreatorWorldAgentAuthoringDraftCandidate).toHaveBeenCalledWith(
        worldId,
        agentId,
        'authoring-batch-su-shi-1',
        'authoring-candidate-su-shi-greeting-1',
        'accepted',
      ),
    );
  });

  it('runs Runtime draft generation from the authoring workflow', async () => {
    const detail = suShiAgentDetail();
    renderAgentPage();

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Draft candidates' })).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /Generate candidates/ }));

    await waitFor(() =>
      expect(generateCreatorWorldAgentAuthoringDraftBatch).toHaveBeenCalledWith(
        worldId,
        agentId,
        detail.authoringContext,
      ),
    );
  });

  it('shows the failing creator-world detail stage instead of a generic unavailable message', async () => {
    vi.mocked(getCreatorWorldAgentDetail).mockRejectedValueOnce(
      new CreatorWorldAgentDetailLoadError(
        'authoring-context',
        new Error('realm method is not admitted for Runtime mediation'),
      ),
    );

    renderAgentPage();

    expect(await screen.findByText('World agent unavailable')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Realm authoring-context request failed: realm method is not admitted for Runtime mediation',
      ),
    ).toBeInTheDocument();
  });
});
