import '@testing-library/jest-dom/vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CreatorWorldCharacterDetailPage, CreatorWorldListPage } from './world-studio-pages.js';
import { generateCreatorWorldCharacterAuthoringDraftBatch } from './character-authoring-draft-generation.js';
import {
  CreatorWorldCharacterDetailLoadError,
  getCreatorWorldCharacterDetail,
  type CreatorWorldCharacterDetail,
} from './world-studio-client.js';
import {
  listRealmCoreCockpitWorlds,
  type RealmCoreCockpitResult,
} from './world-core-cockpit.js';

vi.mock('./world-studio-client.js', async () => {
  const actual = await vi.importActual<typeof import('./world-studio-client.js')>(
    './world-studio-client.js',
  );
  return {
    ...actual,
    getCreatorWorldCharacterDetail: vi.fn(),
    updateCreatorWorldCharacter: vi.fn(),
  };
});

vi.mock('./character-authoring-draft-generation.js', () => ({
  generateCreatorWorldCharacterAuthoringDraftBatch: vi.fn(),
}));

vi.mock('./world-core-cockpit.js', () => ({
  listRealmCoreCockpitWorlds: vi.fn(),
  searchRealmCoreCockpitWorlds: vi.fn((worlds: RealmCoreCockpitResult['worlds'], query: string) => {
    const normalized = query.trim().toLocaleLowerCase();
    if (!normalized) return worlds;
    return worlds.filter((world) =>
      [
        world.id,
        world.title,
        world.summary,
        world.worldType,
        world.genre,
        ...world.themes,
        ...world.healthIssues.map((issue) => issue.message),
      ].join(' ').toLocaleLowerCase().includes(normalized));
  }),
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
      'asChild',
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
  const Button = ({ children, leadingIcon, loading, trailingIcon, asChild, tone, ...props }: PrimitiveProps) => {
    const buttonChildren = [
      leadingIcon ? React.createElement('span', { key: 'leading' }, asNode(leadingIcon)) : null,
      loading ? React.createElement('span', { key: 'loading' }, 'Loading ') : null,
      React.createElement('span', { key: 'content' }, children),
      trailingIcon ? React.createElement('span', { key: 'trailing' }, asNode(trailingIcon)) : null,
    ].filter(Boolean);
    if (asChild) {
      return React.Children.only(buttonChildren.length === 1 ? buttonChildren[0] : buttonChildren);
    }
    return React.createElement('button', cleanProps(props, ['trailingIcon']), buttonChildren);
  };
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
const characterId = 'cbdb-song-slice-real-20260614-character-255e4506ce';

function renderCharacterPage() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[`/worlds/${worldId}/characters/${characterId}`]}>
        <Routes>
          <Route path="/worlds/:worldId/characters/:characterId" element={<CreatorWorldCharacterDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function renderWorldListPage() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/worlds']}>
        <Routes>
          <Route path="/worlds" element={<CreatorWorldListPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function availableCount(value: number, source: string) {
  return { state: 'available' as const, value, source };
}

function unavailableCount(source: string, reason: string) {
  return { state: 'unavailable' as const, value: null, source, reason };
}

function cockpitResult(): RealmCoreCockpitResult {
  const entityNetworkUnavailable = unavailableCount(
    'Realm WorldCoreController.listWorldEntities',
    'realm method is not admitted for Runtime mediation',
  );
  const relationshipNetworkUnavailable = unavailableCount(
    'Realm WorldCoreController.listWorldRelationships',
    'realm method is not admitted for Runtime mediation',
  );
  return {
    metrics: {
      worldCount: availableCount(2, 'Realm WorldCoreController.listWorldCores'),
      entities: unavailableCount(
        'Realm WorldCoreController.listWorldEntities',
        'realm method is not admitted for Runtime mediation',
      ),
      relationships: unavailableCount(
        'Realm WorldCoreController.listWorldRelationships',
        'realm method is not admitted for Runtime mediation',
      ),
      characters: availableCount(4, 'Realm WorldCoreController.listWorldCharacters'),
      schemaIssueCount: 3,
      unavailableContractCount: 2,
    },
    worlds: [
      {
        id: 'world-scifi',
        title: '星舰边境',
        summary: 'A frontier world for interstellar factions and exploration.',
        tagline: 'Deep-space governance and crew drama.',
        worldType: 'simulation',
        genre: 'science fiction',
        themes: ['frontier', 'factions', 'exploration'],
        schemaVersion: 'realm.world-core/v1',
        contentRevision: 3,
        contentHash: 'hash-world-scifi',
        creatorId: '01J00000000000000000000000',
        creatorEmail: 'halliday@nimi.ai',
        visibility: 'public',
        origin: {
          kind: 'forge',
          sourceId: 'source:world-scifi',
          sourceVersion: '2026.06.22',
          sourceContentHash: 'source-hash-world-scifi',
        },
        updatedAt: '2026-06-22T01:00:00.000Z',
        ontology: {
          entityKinds: ['starship', 'planet', 'faction', 'crew'],
          relationshipTypes: ['commands', 'allied-with', 'located-at'],
          concepts: [{ conceptId: 'jump-lane', name: 'Jump lane', summary: 'Stable route.' }],
        },
        timeModel: {
          mode: 'static',
          flowRatio: 1,
          isPaused: true,
          calendar: 'frontier-standard',
          displayFormat: 'YYYY.MM.DD',
          worldStartedAtDisplay: '2351.01.01',
        },
        structure: {
          timelineEventCount: availableCount(1, 'WorldCore.core.timeline.events'),
          systemCount: availableCount(1, 'WorldCore.core.systems'),
          sceneCount: availableCount(1, 'WorldCore.core.scenes'),
          declaredAssetRefCount: availableCount(1, 'WorldCore.core.assets'),
          authoringSource: 'forge-import',
          authoringReviewStatus: 'needs-review',
        },
        counts: {
          entities: entityNetworkUnavailable,
          relationships: relationshipNetworkUnavailable,
          characters: availableCount(4, 'Realm WorldCoreController.listWorldCharacters'),
        },
        healthIssues: [
          {
            ruleId: 'graph.entities.unavailable',
            severity: 'error',
            family: 'WorldEntityCore',
            objectId: 'world-scifi',
            jsonPath: 'graph.entities',
            message: 'entities exact count is unavailable: realm method is not admitted for Runtime mediation',
            source: 'Realm WorldCoreController.listWorldEntities',
          },
          {
            ruleId: 'graph.relationships.unavailable',
            severity: 'error',
            family: 'WorldRelationshipCore',
            objectId: 'world-scifi',
            jsonPath: 'graph.relationships',
            message: 'relationships exact count is unavailable: realm method is not admitted for Runtime mediation',
            source: 'Realm WorldCoreController.listWorldRelationships',
          },
          {
            ruleId: 'assets.resolver.unavailable',
            severity: 'info',
            family: 'ExternalContract',
            objectId: 'world-scifi',
            jsonPath: 'core.assets',
            message: 'Asset resolver contract is unavailable; Studio can count declared refs but cannot claim resource readiness.',
            source: 'WorldCore.core.assets',
          },
          {
            ruleId: 'runtime.summary.unavailable',
            severity: 'info',
            family: 'ExternalContract',
            objectId: 'world-scifi',
            jsonPath: 'runtime.materializationSummary',
            message: 'Runtime materialization summary is unavailable on the Realm Core Cockpit.',
            source: 'Runtime-owned contract unavailable',
          },
        ],
        unavailableContracts: ['asset-resolution-summary', 'runtime-materialization-summary'],
      },
      {
        id: 'world-mirror-fiction',
        title: '镜城叙事宇宙',
        summary: 'A fiction world for branching city stories.',
        tagline: '',
        worldType: 'fiction',
        genre: 'mirror fiction',
        themes: ['city', 'narrative'],
        schemaVersion: 'realm.world-core/v1',
        contentRevision: 1,
        contentHash: 'hash-world-mirror',
        creatorId: '01J00000000000000000000000',
        creatorEmail: 'halliday@nimi.ai',
        visibility: 'private',
        origin: { kind: 'forge', sourceId: 'source:mirror', sourceVersion: '2026.06.22' },
        updatedAt: '2026-06-22T02:00:00.000Z',
        ontology: {
          entityKinds: ['district', 'witness'],
          relationshipTypes: [],
          concepts: [],
        },
        timeModel: {
          mode: 'wallClockAnchored',
          flowRatio: 1,
          isPaused: false,
          calendar: null,
          displayFormat: null,
          worldStartedAtDisplay: 'Day 1',
        },
        structure: {
          timelineEventCount: availableCount(0, 'WorldCore.core.timeline.events'),
          systemCount: availableCount(0, 'WorldCore.core.systems'),
          sceneCount: availableCount(0, 'WorldCore.core.scenes'),
          declaredAssetRefCount: availableCount(0, 'WorldCore.core.assets'),
          authoringSource: 'forge-import',
          authoringReviewStatus: null,
        },
        counts: {
          entities: availableCount(1, 'Realm WorldCoreController.listWorldEntities'),
          relationships: availableCount(0, 'Realm WorldCoreController.listWorldRelationships'),
          characters: availableCount(0, 'Realm WorldCoreController.listWorldCharacters'),
        },
        healthIssues: [
          {
            ruleId: 'ontology.relationshipTypes.empty',
            severity: 'warning',
            family: 'WorldCore',
            objectId: 'world-mirror-fiction',
            jsonPath: 'core.ontology.relationshipTypes',
            message: 'WorldCore ontology has no relationship types.',
            source: 'WorldCore.core.ontology.relationshipTypes',
          },
        ],
        unavailableContracts: [],
      },
    ],
  };
}

function suShiCharacterDetail(): CreatorWorldCharacterDetail {
  const settings: CreatorWorldCharacterDetail['settings'] = {
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
  };
  const sourceRefs = [
    {
      sourceRef: 'CBDB:255e4506ce',
      sourceKind: 'CBDB',
      label: 'CBDB Su Shi',
      factPath: 'sourceFacts.representativeFacts[0]',
    },
  ];
  const sourceSkeleton: CreatorWorldCharacterDetail['sourceSkeleton'] = {
    characterId,
    worldId,
    sourceKind: 'CBDB',
    skeletonId: 'cbdb-song-slice-real-20260614-character-skeleton-255e4506ce',
    sourceEntityId: 'cbdb:person:su-shi',
    candidateId: 'cbdb-song-slice-real-20260614-character-candidate-255e4506ce',
    sourceIdentityId: 'cbdb-historical',
    sourceRefs,
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
    surfaceId: 'realm-world-studio.character-authoring.greeting',
    skeletonId: sourceSkeleton.skeletonId,
    scenarioId: 'realm-world-studio.character-authoring.greeting.v1',
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
    id: characterId,
    displayName: '蘇軾',
    handle: 'cbdb-su-shi',
    bio: '',
    avatarUrl: null,
    profileCoverUrl: null,
    worldId,
    state: 'INCUBATING',
    friendCount: 0,
    contentHash: 'hash-character-su-shi',
    contentRevision: 1,
    origin: { kind: 'forge', sourceId: 'cbdb:person:su-shi', sourceVersion: '0.1.0' },
    source: 'Realm WorldCoreController.getWorldCharacter',
    settings,
    chatReadiness: {
      characterId,
      worldId,
      ownerScope: 'creator-world',
      authorityReason: 'WORLD_CHARACTER_CORE',
      consumerSurface: 'RUNTIME_SOURCE_SNAPSHOT',
      selectedInputCount: 0,
      suppressedInputCount: 0,
      selectedOwnerSettingFields: [],
      runtimeProjectionChecksum: 'hash-character-su-shi',
      appliedAuthoringTargets: [],
      rawCoreTextExposed: false,
      worldCoreSectionCount: 0,
      characterCoreSectionCount: 0,
      gates: {
        authoringDraftReady: false,
        behaviorDnaReady: false,
        dialogueExemplarsReady: false,
        greetingReady: false,
        runtimeSourceIdentityReady: false,
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
        characterId,
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
          surfaceId: 'realm-world-studio.character-authoring.greeting',
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

describe('CreatorWorldListPage creator workbench', () => {
  beforeEach(() => {
    vi.mocked(listRealmCoreCockpitWorlds).mockReset();
    vi.mocked(listRealmCoreCockpitWorlds).mockResolvedValue(cockpitResult());
  });

  it('renders a creator command center instead of a schema inspector surface', async () => {
    renderWorldListPage();

    expect(await screen.findByRole('heading', { name: 'Creator Worlds' })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'Worlds' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'World brief' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Work surface' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Action queue' })).toBeInTheDocument();

    expect(screen.getByText('2 worlds in scope')).toBeInTheDocument();
    expect(screen.getByText('4 editable characters')).toBeInTheDocument();
    expect(screen.getByText('2 reviewable worlds')).toBeInTheDocument();
    expect(screen.queryByText('Connection map pending')).not.toBeInTheDocument();
    expect(screen.queryByText('4 platform blockers')).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'World Registry' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'WorldCore Inspector' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Core Health Queue' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'World Inventory' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'World Blueprint' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Next Actions' })).not.toBeInTheDocument();
    expect(screen.queryByText('503 EntityCore')).not.toBeInTheDocument();
    expect(screen.queryByText('3 RelationshipCore')).not.toBeInTheDocument();

    expect(screen.getByText('science fiction')).toBeInTheDocument();
    expect(screen.getByText('starship / planet / faction / crew')).toBeInTheDocument();
    expect(screen.getByText('2351.01.01')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open characters' })).toHaveAttribute('href', '/worlds/world-scifi');
    expect(screen.getByText('Read-only here')).toBeInTheDocument();
    expect(screen.getByText('Needs creator review')).toBeInTheDocument();
    expect(screen.queryByText('0 actions')).not.toBeInTheDocument();
    expect(screen.queryByText('Platform setup needed')).not.toBeInTheDocument();
    expect(screen.getByText('No creator action needed')).toBeInTheDocument();
    expect(screen.getByText('Readiness watch')).toBeInTheDocument();
    const nextActions = within(screen.getByRole('complementary', { name: 'Action queue panel' }));
    expect(nextActions.queryByText(/Realm|RuntimeSourceSnapshot|contract|resolver|materialization/i)).not.toBeInTheDocument();
    expect(screen.queryByText('Entity network is not editable yet')).not.toBeInTheDocument();
    expect(screen.queryByText('Relationship network is not editable yet')).not.toBeInTheDocument();
    expect(screen.getByText('Source diagnostics')).toBeInTheDocument();
    expect(nextActions.queryByText('Asset resolver contract is unavailable; Studio can count declared refs but cannot claim resource readiness.')).not.toBeInTheDocument();
    expect(nextActions.queryByText('Runtime materialization summary is unavailable on the Realm Core Cockpit.')).not.toBeInTheDocument();
    expect(screen.queryByText('Runtime ready')).not.toBeInTheDocument();
  });

  it('selects a world and filters by product-facing world fields', async () => {
    renderWorldListPage();

    await screen.findByRole('heading', { name: 'Worlds' });

    fireEvent.click(await screen.findByRole('button', { name: /镜城叙事宇宙/ }));

    expect(screen.getByText('mirror fiction')).toBeInTheDocument();
    expect(screen.getByText('district / witness')).toBeInTheDocument();
    expect(screen.getByText('Add relationship types')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Search creator worlds'), {
      target: { value: 'science fiction' },
    });

    expect(screen.getByRole('button', { name: /星舰边境/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /镜城叙事宇宙/ })).not.toBeInTheDocument();
    expect(screen.getByText('1 world in scope')).toBeInTheDocument();
    expect(screen.getByText('4 editable characters')).toBeInTheDocument();
    expect(screen.getByText('1 reviewable world')).toBeInTheDocument();
  });

  it('surfaces the exact Realm list failure instead of claiming creator authority is missing', async () => {
    vi.mocked(listRealmCoreCockpitWorlds).mockRejectedValueOnce(
      new Error('realm request failed: connect ECONNREFUSED 127.0.0.1:3002'),
    );

    renderWorldListPage();

    expect(await screen.findByRole('heading', { name: 'World data unavailable' })).toBeInTheDocument();
    expect(screen.getByText('Realm request: realm request failed: connect ECONNREFUSED 127.0.0.1:3002')).toBeInTheDocument();
    expect(screen.queryByText('Realm did not return creator-world maintain authority for this Runtime account.')).not.toBeInTheDocument();
  });

  it('keeps the command center three-column layout viable on desktop widths', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/shell/renderer/styles.css'), 'utf8');

    expect(css).toContain('max-width: 1180px');
    expect(css).toContain('grid-template-columns: minmax(200px, 0.65fr) minmax(460px, 1.5fr) minmax(252px, 0.85fr)');
    expect(css).toContain('@media (max-width: 980px)');
  });
});

describe('CreatorWorldCharacterDetailPage source skeleton acceptance', () => {
  beforeEach(() => {
    const detail = suShiCharacterDetail();
    vi.mocked(generateCreatorWorldCharacterAuthoringDraftBatch).mockReset();
    vi.mocked(getCreatorWorldCharacterDetail).mockReset();
    vi.mocked(getCreatorWorldCharacterDetail).mockResolvedValue(detail);
    vi.mocked(generateCreatorWorldCharacterAuthoringDraftBatch).mockResolvedValue({
      batch: detail.authoringDraftBatches[0]!,
      runtimeTraceId: 'runtime-trace-su-shi-greeting-1',
      promptDigestSha256: '2222222222222222222222222222222222222222222222222222222222222222',
    });
  });

  it('renders Su Shi source evidence, readiness blockers, directives, and draft review', async () => {
    const { container } = renderCharacterPage();

    await waitFor(() => expect(screen.getByRole('heading', { name: '蘇軾' })).toBeInTheDocument());

    expect(screen.getByRole('heading', { name: 'Character authoring status' })).toBeInTheDocument();
    expect(screen.getByText('Generate auditable candidates from the source skeleton, review each target, then apply accepted values into final runtime fields.')).toBeInTheDocument();
    expect(screen.getByText('Applied targets')).toBeInTheDocument();
    expect(screen.getByText('Remaining blockers')).toBeInTheDocument();

    expect(screen.getByRole('heading', { name: 'Source identity' })).toBeInTheDocument();
    expect(screen.getAllByText('CBDB historical').length).toBeGreaterThan(0);
    expect(screen.getAllByText('蘇軾').length).toBeGreaterThan(0);
    expect(screen.getByText('子瞻 / 文忠 / 東坡居士')).toBeInTheDocument();
    expect(screen.getByText('1036 / 1101')).toBeInTheDocument();

    expect(screen.getByRole('heading', { name: 'Source evidence' })).toBeInTheDocument();
    expect(screen.getByText('28 timeline facts')).toBeInTheDocument();
    expect(screen.getAllByText('Office records').length).toBeGreaterThan(0);
    expect(screen.getByText('蘇軾 held office 朝奉郎 during 1085-0 in CBDB structured records.')).toBeInTheDocument();
    expect(screen.getByText('蘇轍: 10 (ASSOC_DATA.10)')).toBeInTheDocument();
    expect(screen.queryByText('Representative offices')).not.toBeInTheDocument();

    expect(screen.getByRole('heading', { name: 'Readiness blockers' })).toBeInTheDocument();
    for (const field of ['Avatar', 'Profile cover', 'Voice direction', 'Greeting', 'Dialogue examples', 'Behavior DNA']) {
      expect(screen.getAllByText(field).length).toBeGreaterThan(0);
    }
    expect(screen.getByText('Runtime roleplay stays blocked until every required authoring target is reviewed and applied.')).toBeInTheDocument();
    expect(screen.getByText('Review source evidence')).toBeInTheDocument();
    expect(screen.getByText('Provide dialogue examples and behavior DNA')).toBeInTheDocument();
    expect(screen.getByText(/roleplay is blocked until creator accepts or completes/)).toBeInTheDocument();

    expect(screen.getByRole('heading', { name: 'Generation directives' })).toBeInTheDocument();
    expect(screen.getByText('Forge advisory, not final output')).toBeInTheDocument();
    for (const label of [
      'Allowed source basis',
      'Must not claim',
      'Creator decision needed',
      'Drafting direction',
    ]) {
      expect(screen.getAllByText(label).length).toBeGreaterThan(0);
    }
    expect(screen.getByText('Never claim this is the authentic historical voice.')).toBeInTheDocument();
    expect(screen.getByText('Do not treat AI-authored lines as historical quotations.')).toBeInTheDocument();

    expect(screen.getByRole('heading', { name: 'Authoring targets' })).toBeInTheDocument();
    expect(screen.getByText('Latest candidate: authoring-candidate-su-shi-greeting-1')).toBeInTheDocument();
    expect(screen.getAllByText('Missing').length).toBeGreaterThan(0);
    expect(screen.getByText('Pending review')).toBeInTheDocument();
    expect(screen.getAllByText('No candidate persisted yet').length).toBeGreaterThan(0);

    expect(screen.getByRole('heading', { name: 'AI draft review' })).toBeInTheDocument();
    expect(screen.getByText('authoring-batch-su-shi-1')).toBeInTheDocument();
    expect(screen.getByText('runtime-trace-su-shi-greeting-1')).toBeInTheDocument();
    expect(screen.getByDisplayValue(/吾乃蘇軾/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Apply accepted/ })).toBeDisabled();

    expect(container).not.toHaveTextContent('AI generated');
    expect(container.innerHTML).not.toContain('dicebear');
  });

  it('fails closed when authoring candidate review has no Realm write contract', async () => {
    renderCharacterPage();

    await waitFor(() => expect(screen.getByRole('heading', { name: 'AI draft review' })).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /^Accept$/ }));

    await waitFor(() => expect(screen.getByText('Authoring draft review/apply requires a Realm write contract.')).toBeInTheDocument());
    expect(screen.queryByText('accepted')).not.toBeInTheDocument();
  });

  it('runs Runtime draft generation from the authoring workflow', async () => {
    const detail = suShiCharacterDetail();
    renderCharacterPage();

    await waitFor(() => expect(screen.getByRole('heading', { name: 'AI draft review' })).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /Generate candidates/ }));

    await waitFor(() =>
      expect(generateCreatorWorldCharacterAuthoringDraftBatch).toHaveBeenCalledWith(
        worldId,
        characterId,
        detail.authoringContext,
      ),
    );
  });

  it('shows the failing creator-world detail stage instead of a generic unavailable message', async () => {
    vi.mocked(getCreatorWorldCharacterDetail).mockRejectedValueOnce(
      new CreatorWorldCharacterDetailLoadError(
        'authoring-context',
        new Error('realm method is not admitted for Runtime mediation'),
      ),
    );

    renderCharacterPage();

    expect(await screen.findByText('World character unavailable')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Realm authoring-context request failed: realm method is not admitted for Runtime mediation',
      ),
    ).toBeInTheDocument();
  });
});
