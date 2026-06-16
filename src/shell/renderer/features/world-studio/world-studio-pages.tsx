import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  Bot,
  Check,
  ClipboardList,
  FileText,
  RefreshCw,
  Save,
  ShieldAlert,
  Upload,
  X,
} from 'lucide-react';
import {
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
} from '@nimiplatform/kit/ui';
import {
  draftFromAgent,
  CreatorWorldAgentDetailLoadError,
  applyCreatorWorldAgentAuthoringDraftBatch,
  getCreatorWorldAgentDetail,
  getCreatorWorldDetail,
  listCreatorWorlds,
  reviewCreatorWorldAgentAuthoringDraftCandidate,
  updateCreatorWorldAgent,
  type CreatorWorldAgentAuthoringDraftBatch,
  type CreatorWorldAgentAuthoringDraftCandidate,
  type CreatorWorldAgentAuthoringGenerationContext,
  type CreatorWorldAgentDetail,
  type CreatorWorldAgentDraft,
  type CreatorWorldAgentSummary,
  type CreatorWorldAgentSourceSkeleton,
  type CreatorWorldDetail,
  type CreatorWorldSummary,
} from './world-studio-client.js';
import { studioQueryClient } from '@renderer/infra/query-client.js';
import { generateCreatorWorldAgentAuthoringDraftBatch } from './agent-authoring-draft-generation.js';

const WORLD_LIST_QUERY_KEY = ['realm-world-studio', 'creator-worlds'] as const;

function worldDetailQueryKey(worldId: string) {
  return ['realm-world-studio', 'creator-world-detail', worldId] as const;
}

function worldAgentDetailQueryKey(worldId: string, agentId: string) {
  return ['realm-world-studio', 'creator-world-agent-detail', worldId, agentId] as const;
}

function FailureState({
  title,
  detail,
  loading,
  onRetry,
}: {
  title: string;
  detail: string;
  loading: boolean;
  onRetry: () => void;
}) {
  return (
    <section className="ras-card">
      <div className="grid grid-cols-[64px_1fr_auto] items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-[var(--nimi-radius-md)] bg-[color-mix(in_srgb,var(--nimi-status-danger)_12%,transparent)] text-[var(--nimi-status-danger)]">
          <AlertTriangle size={28} strokeWidth={1.8} />
        </div>
        <div className="min-w-0">
          <h2 className="m-0 text-lg font-bold text-[var(--nimi-text-primary)]">{title}</h2>
          <p className="m-0 mt-1 text-[length:var(--nimi-type-body-sm-size)] leading-6 text-[var(--nimi-text-muted)]">
            {detail}
          </p>
        </div>
        <Button tone="primary" loading={loading} onClick={onRetry}>
          Retry
        </Button>
      </div>
    </section>
  );
}

function PageLoadingState() {
  return (
    <div className="ras-agent-grid">
      {Array.from({ length: 6 }).map((_, index) => (
        <section key={index} className="ras-card ras-card--quiet">
          <LoadingSkeleton lines={3} />
        </section>
      ))}
    </div>
  );
}

function matchesQuery(values: readonly (string | null | undefined)[], query: string): boolean {
  const normalized = query.trim().toLocaleLowerCase();
  if (!normalized) return true;
  return values.some((value) => String(value || '').toLocaleLowerCase().includes(normalized));
}

function creatorWorldAgentFailureDetail(error: unknown): string {
  if (error instanceof CreatorWorldAgentDetailLoadError) {
    return `Realm ${error.stage} request failed: ${error.originalMessage}`;
  }
  if (error instanceof Error && error.message.trim()) {
    return error.message.trim();
  }
  return 'Realm did not return this WORLD_OWNED agent under creator-world authority.';
}

function WorldCard({ world }: { world: CreatorWorldSummary }) {
  return (
    <Surface
      as={Link}
      to={`/worlds/${world.id}`}
      padding="md"
      tone="card"
      interactive
      className="block min-w-0"
    >
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="ras-break-anywhere text-[length:var(--nimi-type-label-size)] font-[var(--nimi-type-label-weight)]">
            {world.name}
          </div>
          <div className="ras-break-anywhere mt-1 text-[length:var(--nimi-type-body-sm-size)] text-[var(--nimi-text-muted)]">
            {world.tagline || world.description || 'World summary unavailable'}
          </div>
        </div>
        <StatusBadge tone="success">{world.authorityReason}</StatusBadge>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <StatusBadge tone="info">{world.status}</StatusBadge>
        <StatusBadge tone="neutral">{world.agentCount} agents</StatusBadge>
        <StatusBadge tone="neutral">{world.creatorId}</StatusBadge>
      </div>
    </Surface>
  );
}

export function CreatorWorldListPage() {
  const [query, setQuery] = useState('');
  const worldsQuery = useQuery({
    queryKey: WORLD_LIST_QUERY_KEY,
    queryFn: () => listCreatorWorlds(),
  });

  const worlds = useMemo(
    () =>
      (worldsQuery.data || []).filter((world) =>
        matchesQuery([world.id, world.name, world.creatorId, world.status, world.authorityReason], query),
      ),
    [query, worldsQuery.data],
  );

  return (
    <ScrollArea className="flex-1" viewportClassName="bg-transparent">
      <div className="ras-page">
        <header className="ras-page-header">
          <div className="min-w-0">
            <p className="ras-page-header__eyebrow">REALM WORLD STUDIO</p>
            <h1 className="ras-page-header__title">Creator worlds</h1>
            <p className="ras-page-header__description">
              Creator worlds maintainable by the current Runtime account.
            </p>
          </div>
          <Button
            tone="secondary"
            loading={worldsQuery.isFetching}
            leadingIcon={<RefreshCw size={15} strokeWidth={1.8} />}
            onClick={() => void worldsQuery.refetch()}
          >
            Refresh
          </Button>
        </header>

        <section className="ras-card">
          <SearchField
            value={query}
            placeholder="Search worlds"
            aria-label="Search creator worlds"
            onChange={(event) => setQuery(event.currentTarget.value)}
          />
        </section>

        {worldsQuery.isLoading ? (
          <PageLoadingState />
        ) : worldsQuery.isError ? (
          <FailureState
            title="World authority unavailable"
            detail="Realm did not return creator-world maintain authority for this Runtime account."
            loading={worldsQuery.isFetching}
            onRetry={() => void worldsQuery.refetch()}
          />
        ) : worlds.length === 0 ? (
          <section className="ras-card">
            <EmptyState title="No creator worlds" description="Realm returned no maintainable creator worlds for this account." />
          </section>
        ) : (
          <div className="ras-agent-grid">
            {worlds.map((world) => <WorldCard key={world.id} world={world} />)}
          </div>
        )}
      </div>
    </ScrollArea>
  );
}

function WorldAgentCard({ worldId, agent }: { worldId: string; agent: CreatorWorldAgentSummary }) {
  return (
    <Surface
      as={Link}
      to={`/worlds/${worldId}/agents/${agent.id}`}
      padding="md"
      tone="card"
      interactive
      className="grid min-w-0 grid-cols-[48px_1fr] gap-3"
    >
      <div className="h-12 w-12 overflow-hidden rounded-[var(--nimi-radius-md)] bg-[var(--nimi-surface-active)]">
        {agent.avatarUrl ? <img src={agent.avatarUrl} alt="" className="h-full w-full object-cover" /> : null}
      </div>
      <div className="min-w-0">
        <div className="ras-break-anywhere truncate font-medium">{agent.displayName}</div>
        <div className="ras-break-anywhere mt-1 text-[length:var(--nimi-type-body-sm-size)] text-[var(--nimi-text-muted)]">
          @{agent.handle}
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          <StatusBadge tone="info">WORLD_OWNED</StatusBadge>
          <StatusBadge tone="neutral">{agent.state || 'state unavailable'}</StatusBadge>
        </div>
      </div>
    </Surface>
  );
}

export function CreatorWorldDetailPage() {
  const { worldId = '' } = useParams();
  const navigate = useNavigate();
  const worldQuery = useQuery({
    queryKey: worldDetailQueryKey(worldId),
    queryFn: () => getCreatorWorldDetail(worldId),
    enabled: Boolean(worldId),
  });
  const world = worldQuery.data;

  return (
    <ScrollArea className="flex-1" viewportClassName="bg-transparent">
      <div className="ras-page">
        <header className="ras-page-header">
          <div className="min-w-0">
            <Button tone="ghost" leadingIcon={<ArrowLeft size={15} />} onClick={() => navigate('/worlds')}>
              Worlds
            </Button>
            <h1 className="ras-page-header__title">{world?.name || 'World detail'}</h1>
            <p className="ras-page-header__description">{world?.tagline || world?.description || 'Creator-world authority detail.'}</p>
          </div>
          <Button tone="secondary" loading={worldQuery.isFetching} leadingIcon={<RefreshCw size={15} />} onClick={() => void worldQuery.refetch()}>
            Refresh
          </Button>
        </header>

        {worldQuery.isLoading ? (
          <PageLoadingState />
        ) : worldQuery.isError || !world ? (
          <FailureState
            title="World detail unavailable"
            detail="Realm did not return this creator world for the current Runtime account."
            loading={worldQuery.isFetching}
            onRetry={() => void worldQuery.refetch()}
          />
        ) : (
          <WorldDetailContent world={world} />
        )}
      </div>
    </ScrollArea>
  );
}

function WorldDetailContent({ world }: { world: CreatorWorldDetail }) {
  return (
    <div className="ras-stack">
      <section className="ras-card ras-stack">
        <div className="ras-fact-grid">
          <div className="ras-fact"><div className="ras-fact__label">Type</div><div className="ras-fact__value">{world.type}</div></div>
          <div className="ras-fact"><div className="ras-fact__label">Status</div><div className="ras-fact__value">{world.status}</div></div>
          <div className="ras-fact"><div className="ras-fact__label">Creator</div><div className="ras-fact__value">{world.creatorId}</div></div>
          <div className="ras-fact"><div className="ras-fact__label">Authority</div><div className="ras-fact__value">{world.authorityReason}</div></div>
        </div>
        <p className="ras-break-anywhere text-[var(--nimi-text-secondary)]">{world.overview || world.description || 'World overview unavailable.'}</p>
      </section>
      <section className="ras-card ras-stack">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="ras-section-title">World agents</h2>
            <p className="ras-section-copy">{world.agents.length} world-owned agents</p>
          </div>
          <Bot size={20} strokeWidth={1.8} />
        </div>
        {world.agents.length === 0 ? (
          <EmptyState title="No world agents" description="Realm returned no WORLD_OWNED agents for this creator world." />
        ) : (
          <div className="ras-agent-grid">
            {world.agents.map((agent) => <WorldAgentCard key={agent.id} worldId={world.id} agent={agent} />)}
          </div>
        )}
      </section>
    </div>
  );
}

export function CreatorWorldAgentDetailPage() {
  const { worldId = '', agentId = '' } = useParams();
  const navigate = useNavigate();
  const agentQuery = useQuery({
    queryKey: worldAgentDetailQueryKey(worldId, agentId),
    queryFn: () => getCreatorWorldAgentDetail(worldId, agentId),
    enabled: Boolean(worldId && agentId),
  });
  const [draft, setDraft] = useState<CreatorWorldAgentDraft>(() => draftFromAgent(agentQuery.data));

  useEffect(() => {
    if (agentQuery.data) setDraft(draftFromAgent(agentQuery.data));
  }, [agentQuery.data]);

  const updateMutation = useMutation({
    mutationFn: () => updateCreatorWorldAgent(worldId, agentId, draft),
    onSuccess: (result) => {
      studioQueryClient.setQueryData(worldAgentDetailQueryKey(worldId, agentId), result.agent);
      void studioQueryClient.invalidateQueries({ queryKey: worldDetailQueryKey(worldId) });
    },
  });
  const reviewCandidateMutation = useMutation({
    mutationFn: (input: {
      batchId: string;
      candidateId: string;
      status: 'accepted' | 'rejected';
    }) =>
      reviewCreatorWorldAgentAuthoringDraftCandidate(
        worldId,
        agentId,
        input.batchId,
        input.candidateId,
        input.status,
      ),
    onSuccess: () => {
      void studioQueryClient.invalidateQueries({ queryKey: worldAgentDetailQueryKey(worldId, agentId) });
    },
  });
  const applyBatchMutation = useMutation({
    mutationFn: (batchId: string) => applyCreatorWorldAgentAuthoringDraftBatch(worldId, agentId, batchId),
    onSuccess: () => {
      void studioQueryClient.invalidateQueries({ queryKey: worldAgentDetailQueryKey(worldId, agentId) });
      void studioQueryClient.invalidateQueries({ queryKey: worldDetailQueryKey(worldId) });
    },
  });
  const generateDraftMutation = useMutation({
    mutationFn: () => {
      if (!agentQuery.data) {
        throw new Error('Creator-world agent authoring context is unavailable.');
      }
      return generateCreatorWorldAgentAuthoringDraftBatch(worldId, agentId, agentQuery.data.authoringContext);
    },
    onSuccess: () => {
      void studioQueryClient.invalidateQueries({ queryKey: worldAgentDetailQueryKey(worldId, agentId) });
    },
  });

  const currentDraft = draftFromAgent(agentQuery.data);
  const dirty = JSON.stringify(draft) !== JSON.stringify(currentDraft);

  return (
    <ScrollArea className="flex-1" viewportClassName="bg-transparent">
      <div className="ras-page">
        <header className="ras-page-header">
          <div className="min-w-0">
            <Button tone="ghost" leadingIcon={<ArrowLeft size={15} />} onClick={() => navigate(`/worlds/${worldId}`)}>
              World
            </Button>
            <h1 className="ras-page-header__title">{agentQuery.data?.displayName || 'World agent'}</h1>
            <p className="ras-page-header__description">Creator-world RealmAgent maintenance.</p>
          </div>
          <Button
            tone="primary"
            loading={updateMutation.isPending}
            disabled={!agentQuery.data || !dirty || !draft.displayName.trim()}
            leadingIcon={<Save size={15} />}
            onClick={() => void updateMutation.mutate()}
          >
            Save
          </Button>
        </header>

        {agentQuery.isLoading ? (
          <PageLoadingState />
        ) : agentQuery.isError || !agentQuery.data ? (
          <FailureState
            title="World agent unavailable"
            detail={creatorWorldAgentFailureDetail(agentQuery.error)}
            loading={agentQuery.isFetching}
            onRetry={() => void agentQuery.refetch()}
          />
        ) : (
          <WorldAgentEditor
            agent={agentQuery.data}
            draft={draft}
            setDraft={setDraft}
            saveError={updateMutation.isError}
            saveSuccess={updateMutation.isSuccess}
            draftActionError={reviewCandidateMutation.isError || applyBatchMutation.isError}
            draftGenerationError={generateDraftMutation.isError}
            generatingDraft={generateDraftMutation.isPending}
            reviewingCandidateId={reviewCandidateMutation.variables?.candidateId || null}
            reviewingStatus={reviewCandidateMutation.variables?.status || null}
            applyingBatchId={applyBatchMutation.variables || null}
            onGenerateDraft={() => generateDraftMutation.mutate()}
            onReviewCandidate={(batchId, candidateId, status) =>
              reviewCandidateMutation.mutate({ batchId, candidateId, status })
            }
            onApplyBatch={(batchId) => applyBatchMutation.mutate(batchId)}
          />
        )}
      </div>
    </ScrollArea>
  );
}

function yearRange(skeleton: CreatorWorldAgentSourceSkeleton): string {
  const birth = skeleton.sourceFacts.birthYear;
  const death = skeleton.sourceFacts.deathYear;
  if (birth != null && death != null) return `${birth} / ${death}`;
  if (birth != null) return `${birth} / unknown`;
  if (death != null) return `unknown / ${death}`;
  return 'source unavailable';
}

function FactCell({ label, value }: { label: string; value: string | number | null }) {
  return (
    <div className="ras-fact">
      <div className="ras-fact__label">{label}</div>
      <div className="ras-fact__value ras-break-anywhere">{value ?? 'source unavailable'}</div>
    </div>
  );
}

function SectionHeading({
  icon,
  title,
  badge,
}: {
  icon: ReactNode;
  title: string;
  badge?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--nimi-radius-md)] bg-[var(--nimi-surface-active)] text-[var(--nimi-text-secondary)]">
          {icon}
        </span>
        <h2 className="ras-section-title">{title}</h2>
      </div>
      {badge}
    </div>
  );
}

function TextList({ items, empty }: { items: readonly string[]; empty: string }) {
  if (items.length === 0) {
    return <p className="m-0 text-[length:var(--nimi-type-body-sm-size)] text-[var(--nimi-text-muted)]">{empty}</p>;
  }
  return (
    <ul className="m-0 grid gap-2 p-0">
      {items.map((item) => (
        <li
          key={item}
          className="ras-break-anywhere list-none rounded-[var(--nimi-radius-md)] border border-[var(--nimi-border-subtle)] bg-[var(--nimi-surface-panel)] px-3 py-2 text-[length:var(--nimi-type-body-sm-size)] text-[var(--nimi-text-secondary)]"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

function SourceIdentitySection({
  agent,
  skeleton,
}: {
  agent: CreatorWorldAgentDetail;
  skeleton: CreatorWorldAgentSourceSkeleton;
}) {
  return (
    <section className="ras-card ras-stack">
      <SectionHeading
        icon={<FileText size={17} strokeWidth={1.8} />}
        title="Source identity"
        badge={<StatusBadge tone="info">CBDB historical</StatusBadge>}
      />
      <div className="ras-fact-grid">
        <FactCell label="Canonical name" value={skeleton.canonicalName} />
        <FactCell label="Aliases" value={skeleton.aliases.join(' / ') || null} />
        <FactCell label="Birth / death" value={yearRange(skeleton)} />
        <FactCell label="Source entity" value={skeleton.sourceEntityId} />
        <FactCell label="Agent id" value={agent.id} />
        <FactCell label="State" value={agent.state || 'source unavailable'} />
      </div>
    </section>
  );
}

function WorldFactsSection({ skeleton }: { skeleton: CreatorWorldAgentSourceSkeleton }) {
  const officeFacts = skeleton.sourceFacts.officeFacts.slice(0, 4).map((fact) =>
    fact.officeName ? `${fact.officeName}: ${fact.summary}` : fact.summary,
  );
  const relationshipFacts = skeleton.sourceFacts.relationships.map((relationship) =>
    `${relationship.targetName}: ${relationship.relationType}${
      relationship.context ? ` (${relationship.context})` : ''
    }`,
  );
  return (
    <section className="ras-card ras-stack">
      <SectionHeading
        icon={<BookOpen size={17} strokeWidth={1.8} />}
        title="World facts"
        badge={<StatusBadge tone="neutral">{skeleton.sourceFacts.timelineFactCount} timeline facts</StatusBadge>}
      />
      <div className="ras-fact-grid">
        <FactCell label="Timeline / office facts" value={skeleton.sourceFacts.timelineFactCount} />
        <FactCell label="Office facts shown" value={skeleton.sourceFacts.officeFacts.length} />
        <FactCell label="Relationships" value={skeleton.sourceFacts.relationships.length} />
        <FactCell label="Package" value={skeleton.packageId || null} />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="ras-stack-tight">
          <h3 className="m-0 text-sm font-semibold text-[var(--nimi-text-primary)]">Representative timeline</h3>
          <TextList items={skeleton.sourceFacts.representativeFacts.slice(0, 5)} empty="No timeline facts returned." />
        </div>
        <div className="ras-stack-tight">
          <h3 className="m-0 text-sm font-semibold text-[var(--nimi-text-primary)]">Representative offices</h3>
          <TextList items={officeFacts} empty="No office facts returned." />
        </div>
        <div className="ras-stack-tight">
          <h3 className="m-0 text-sm font-semibold text-[var(--nimi-text-primary)]">Relationships</h3>
          <TextList items={relationshipFacts} empty="No relationships returned." />
        </div>
      </div>
    </section>
  );
}

function CompletionGapsSection({ skeleton }: { skeleton: CreatorWorldAgentSourceSkeleton }) {
  return (
    <section className="ras-card ras-stack">
      <SectionHeading
        icon={<ShieldAlert size={17} strokeWidth={1.8} />}
        title="Completion gaps"
        badge={<StatusBadge tone="warning">{skeleton.runtimeReadiness.roleplayRuntime}</StatusBadge>}
      />
      <InlineAlert tone="warning">{skeleton.runtimeReadiness.reason}</InlineAlert>
      <div className="flex flex-wrap gap-2">
        {skeleton.missingFields.map((field) => (
          <StatusBadge key={field} tone="warning">{field}</StatusBadge>
        ))}
      </div>
      <TextList
        items={skeleton.runtimeReadiness.requiredCreatorActions}
        empty="No creator actions returned."
      />
    </section>
  );
}

function AuthoringBriefSection({ skeleton }: { skeleton: CreatorWorldAgentSourceSkeleton }) {
  const brief = skeleton.completionBrief;
  return (
    <section className="ras-card ras-stack">
      <SectionHeading
        icon={<ClipboardList size={17} strokeWidth={1.8} />}
        title="Authoring brief"
        badge={<StatusBadge tone="neutral">Forge-derived brief</StatusBadge>}
      />
      <div className="ras-fact-grid">
        <FactCell label="Description" value={brief.description} />
        <FactCell label="Content style" value={brief.contentStyle} />
        <FactCell label="Positioning" value={brief.positioning} />
        <FactCell label="Avatar brief" value={brief.avatarBrief} />
        <FactCell label="Voice brief" value={brief.voiceBrief} />
        <FactCell label="Greeting brief" value={brief.greetingBrief} />
      </div>
      <FieldShell label="DNA brief">
        <TextareaField value={brief.dnaBrief} readOnly />
      </FieldShell>
    </section>
  );
}

type StatusTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';
type CandidateReviewStatus = CreatorWorldAgentAuthoringDraftCandidate['reviewStatus'];
type CandidateValue = CreatorWorldAgentAuthoringDraftCandidate['value'];

function reviewStatusTone(status: CandidateReviewStatus): StatusTone {
  if (status === 'applied') return 'success';
  if (status === 'accepted' || status === 'edited') return 'info';
  if (status === 'rejected') return 'danger';
  return 'warning';
}

function targetStatusTone(status: CandidateReviewStatus | 'missing'): StatusTone {
  if (status === 'applied') return 'success';
  if (status === 'accepted' || status === 'edited') return 'info';
  if (status === 'rejected') return 'danger';
  if (status === 'pending') return 'warning';
  return 'neutral';
}

function batchStatusTone(status: CreatorWorldAgentAuthoringDraftBatch['status']): StatusTone {
  if (status === 'applied') return 'success';
  if (status === 'failed') return 'danger';
  if (status === 'partially_applied') return 'warning';
  return 'info';
}

function isCandidateValue(value: unknown): value is CandidateValue {
  return Boolean(value && typeof value === 'object' && 'kind' in value);
}

function effectiveCandidateValue(candidate: CreatorWorldAgentAuthoringDraftCandidate): CandidateValue {
  if (candidate.reviewStatus === 'edited' && isCandidateValue(candidate.editedValue)) {
    return candidate.editedValue;
  }
  return candidate.value;
}

function compactTimestamp(value: string | null | undefined): string {
  return value?.trim() || 'not set';
}

function recordPreview(record: unknown): string {
  if (!record || typeof record !== 'object' || Array.isArray(record)) {
    return 'not set';
  }
  const entries = Object.entries(record)
    .filter(([, value]) => value != null && value !== '')
    .slice(0, 4)
    .map(([key, value]) => `${key}: ${String(value)}`);
  return entries.length > 0 ? entries.join(' / ') : 'not set';
}

function candidateValuePreview(candidate: CreatorWorldAgentAuthoringDraftCandidate): string {
  const value = effectiveCandidateValue(candidate);
  if (value.kind === 'text') return value.text?.trim() || 'text value missing';
  if (value.kind === 'media') {
    const media = value.media;
    if (!media) return 'media value missing';
    return [
      `resource: ${media.resourceId}`,
      `url: ${media.url}`,
      `model: ${media.model}`,
      `size: ${media.width}x${media.height}`,
      `mime: ${media.mime}`,
      `moderation: ${media.moderation.status}${media.moderation.reason ? ` / ${media.moderation.reason}` : ''}`,
      `prompt: ${media.prompt}`,
    ].join('\n');
  }
  if (value.kind === 'voice') {
    const voice = value.voice;
    if (!voice) return 'voice value missing';
    return [
      `historical claim: ${voice.historicalClaim}`,
      `narration direction: ${voice.narrationDirection}`,
      `provider voice: ${voice.providerVoiceRef || 'not set'}`,
      `voice asset: ${voice.voiceAssetResourceId || 'not set'}`,
      `speech model: ${voice.speechModelId || 'not set'}`,
      `route policy: ${voice.speechRoutePolicy || 'not set'}`,
    ].join('\n');
  }
  if (value.kind === 'dialogue') {
    return value.dialogue?.exemplars.join('\n') || 'dialogue exemplars missing';
  }
  if (value.kind === 'behavior') {
    return value.behavior?.directives.join('\n') || 'behavior directives missing';
  }
  return 'candidate value missing';
}

function sourceRefLabel(ref: CreatorWorldAgentAuthoringDraftCandidate['sourceRefs'][number]): string {
  return [ref.label, ref.sourceRef, ref.factPath].filter(Boolean).join(' / ');
}

function SourceRefsList({
  refs,
  empty,
}: {
  refs: readonly CreatorWorldAgentAuthoringDraftCandidate['sourceRefs'][number][];
  empty: string;
}) {
  if (refs.length === 0) {
    return <p className="m-0 text-[length:var(--nimi-type-body-sm-size)] text-[var(--nimi-text-muted)]">{empty}</p>;
  }
  return (
    <div className="flex flex-wrap gap-2">
      {refs.map((ref, index) => (
        <StatusBadge
          key={`${ref.sourceRef}:${ref.factPath || index}`}
          tone="neutral"
          className="max-w-full whitespace-normal text-left"
        >
          {sourceRefLabel(ref)}
        </StatusBadge>
      ))}
    </div>
  );
}

function GenerationTargetsSection({
  context,
}: {
  context: CreatorWorldAgentAuthoringGenerationContext;
}) {
  const statusByTarget = new Map(context.targetStatuses.map((status) => [status.targetKey, status]));
  return (
    <section className="ras-card ras-stack">
      <SectionHeading
        icon={<Bot size={17} strokeWidth={1.8} />}
        title="Generation targets"
        badge={<StatusBadge tone="neutral">{context.requiredTargets.length} required</StatusBadge>}
      />
      <div className="flex flex-wrap gap-2">
        {context.requiredTargets.map((target) => {
          const status = statusByTarget.get(target);
          const reviewStatus = status?.latestReviewStatus || 'missing';
          return (
            <StatusBadge key={target} tone={targetStatusTone(reviewStatus)}>
              {target}: {reviewStatus}
            </StatusBadge>
          );
        })}
      </div>
      <div className="ras-fact-grid">
        <FactCell label="Avatar resource" value={context.currentFinalState.media.avatarResourceId || null} />
        <FactCell label="Profile cover resource" value={context.currentFinalState.media.profileCoverResourceId || null} />
        <FactCell label="Avatar cache" value={context.currentFinalState.media.avatarUrl || null} />
        <FactCell label="Profile cover cache" value={context.currentFinalState.media.profileCoverUrl || null} />
        <FactCell label="Voice state" value={recordPreview(context.currentFinalState.voice.voice)} />
      </div>
      <div className="ras-stack-tight">
        <h3 className="m-0 text-sm font-semibold text-[var(--nimi-text-primary)]">Grounding refs</h3>
        <SourceRefsList refs={context.groundingRefs} empty="No grounding refs returned." />
      </div>
    </section>
  );
}

function CandidateCard({
  batchId,
  candidate,
  reviewingCandidateId,
  reviewingStatus,
  onReviewCandidate,
}: {
  batchId: string;
  candidate: CreatorWorldAgentAuthoringDraftCandidate;
  reviewingCandidateId: string | null;
  reviewingStatus: 'accepted' | 'rejected' | null;
  onReviewCandidate: (batchId: string, candidateId: string, status: 'accepted' | 'rejected') => void;
}) {
  const value = effectiveCandidateValue(candidate);
  const media = value.kind === 'media' ? value.media : undefined;
  const reviewLocked = candidate.reviewStatus === 'applied';
  const isAccepting = reviewingCandidateId === candidate.id && reviewingStatus === 'accepted';
  const isRejecting = reviewingCandidateId === candidate.id && reviewingStatus === 'rejected';
  return (
    <div className="grid gap-3 rounded-[var(--nimi-radius-md)] border border-[var(--nimi-border-subtle)] bg-[var(--nimi-surface-panel)] p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="ras-break-anywhere text-sm font-semibold text-[var(--nimi-text-primary)]">{candidate.targetKey}</div>
          <div className="ras-break-anywhere mt-1 text-[length:var(--nimi-type-body-sm-size)] text-[var(--nimi-text-muted)]">
            {candidate.modelId} / {candidate.routePolicy}
          </div>
        </div>
        <StatusBadge tone={reviewStatusTone(candidate.reviewStatus)}>{candidate.reviewStatus}</StatusBadge>
      </div>
      {media?.url ? (
        <div className="h-36 overflow-hidden rounded-[var(--nimi-radius-md)] border border-[var(--nimi-border-subtle)] bg-[var(--nimi-surface-card)]">
          <img src={media.url} alt="" className="h-full w-full object-cover" />
        </div>
      ) : null}
      <div className="ras-fact-grid">
        <FactCell label="Prompt digest" value={candidate.promptDigestSha256} />
        <FactCell label="Runtime trace" value={candidate.runtimeTraceId} />
        <FactCell label="Generated" value={compactTimestamp(candidate.generatedAt)} />
        <FactCell label="Reviewed" value={compactTimestamp(candidate.reviewedAt)} />
        <FactCell label="Reviewer" value={candidate.reviewerId || null} />
        <FactCell label="Applied" value={compactTimestamp(candidate.appliedAt)} />
      </div>
      <FieldShell label="Candidate value">
        <TextareaField value={candidateValuePreview(candidate)} readOnly />
      </FieldShell>
      <div className="ras-stack-tight">
        <h3 className="m-0 text-sm font-semibold text-[var(--nimi-text-primary)]">Source refs</h3>
        <SourceRefsList refs={candidate.sourceRefs} empty="No source refs returned." />
      </div>
      <div className="ras-stack-tight">
        <h3 className="m-0 text-sm font-semibold text-[var(--nimi-text-primary)]">Value provenance</h3>
        <TextList
          items={value.provenance.map((item) => `${item.category}: ${item.summary} (${item.refs.join(', ')})`)}
          empty="No value provenance returned."
        />
      </div>
      <div className="flex flex-wrap justify-end gap-2">
        <Button
          tone="secondary"
          disabled={reviewLocked}
          loading={isAccepting}
          leadingIcon={<Check size={15} />}
          onClick={() => onReviewCandidate(batchId, candidate.id, 'accepted')}
        >
          Accept
        </Button>
        <Button
          tone="danger"
          disabled={reviewLocked}
          loading={isRejecting}
          leadingIcon={<X size={15} />}
          onClick={() => onReviewCandidate(batchId, candidate.id, 'rejected')}
        >
          Reject
        </Button>
      </div>
    </div>
  );
}

function DraftBatchesSection({
  batches,
  draftActionError,
  draftGenerationError,
  generatingDraft,
  reviewingCandidateId,
  reviewingStatus,
  applyingBatchId,
  onGenerateDraft,
  onReviewCandidate,
  onApplyBatch,
}: {
  batches: readonly CreatorWorldAgentAuthoringDraftBatch[];
  draftActionError: boolean;
  draftGenerationError: boolean;
  generatingDraft: boolean;
  reviewingCandidateId: string | null;
  reviewingStatus: 'accepted' | 'rejected' | null;
  applyingBatchId: string | null;
  onGenerateDraft: () => void;
  onReviewCandidate: (batchId: string, candidateId: string, status: 'accepted' | 'rejected') => void;
  onApplyBatch: (batchId: string) => void;
}) {
  return (
    <section className="ras-card ras-stack">
      {draftActionError ? <InlineAlert tone="danger">Authoring draft review/apply failed.</InlineAlert> : null}
      {draftGenerationError ? <InlineAlert tone="danger">Runtime draft generation failed closed.</InlineAlert> : null}
      <SectionHeading
        icon={<ClipboardList size={17} strokeWidth={1.8} />}
        title="Draft candidates"
        badge={<StatusBadge tone="neutral">{batches.length} batches</StatusBadge>}
      />
      <div className="flex flex-wrap justify-end gap-2">
        <Button
          tone="secondary"
          loading={generatingDraft}
          leadingIcon={<RefreshCw size={15} />}
          onClick={onGenerateDraft}
        >
          Generate candidates
        </Button>
      </div>
      {batches.length === 0 ? (
        <EmptyState
          title="No draft candidates"
          description="Runtime has not persisted an authoring draft batch for this skeleton."
        />
      ) : (
        <div className="grid gap-4">
          {batches.map((batch) => {
            const hasPending = batch.candidates.some((candidate) => candidate.reviewStatus === 'pending');
            const hasAcceptedOrEdited = batch.candidates.some(
              (candidate) => candidate.reviewStatus === 'accepted' || candidate.reviewStatus === 'edited',
            );
            const canApply = hasAcceptedOrEdited && !hasPending && batch.status !== 'applied';
            return (
              <div
                key={batch.id}
                className="grid gap-3 rounded-[var(--nimi-radius-md)] border border-[var(--nimi-border-subtle)] bg-[color-mix(in_srgb,var(--nimi-surface-panel)_74%,transparent)] p-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="ras-break-anywhere text-sm font-semibold text-[var(--nimi-text-primary)]">{batch.id}</div>
                    <div className="ras-break-anywhere mt-1 text-[length:var(--nimi-type-body-sm-size)] text-[var(--nimi-text-muted)]">
                      skeleton {batch.skeletonId} / {batch.createdBy}
                    </div>
                  </div>
                  <div className="flex flex-wrap justify-end gap-2">
                    <StatusBadge tone={batchStatusTone(batch.status)}>{batch.status}</StatusBadge>
                    <Button
                      tone="primary"
                      disabled={!canApply}
                      loading={applyingBatchId === batch.id}
                      leadingIcon={<Upload size={15} />}
                      onClick={() => onApplyBatch(batch.id)}
                    >
                      Apply accepted
                    </Button>
                  </div>
                </div>
                <div className="ras-fact-grid">
                  <FactCell label="Created" value={compactTimestamp(batch.createdAt)} />
                  <FactCell label="Updated" value={compactTimestamp(batch.updatedAt)} />
                  <FactCell label="Applied" value={compactTimestamp(batch.appliedAt)} />
                  <FactCell label="Candidates" value={batch.candidates.length} />
                  <FactCell label="Runtime app" value={String(batch.metadata?.runtimeAppId || 'not set')} />
                  <FactCell label="Surface" value={String(batch.metadata?.surfaceId || 'not set')} />
                </div>
                {hasPending ? <InlineAlert tone="warning">Pending candidates block batch apply.</InlineAlert> : null}
                <div className="grid gap-3 lg:grid-cols-2">
                  {batch.candidates.map((candidate) => (
                    <CandidateCard
                      key={candidate.id}
                      batchId={batch.id}
                      candidate={candidate}
                      reviewingCandidateId={reviewingCandidateId}
                      reviewingStatus={reviewingStatus}
                      onReviewCandidate={onReviewCandidate}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function SettingsEditorSection({
  agent,
  draft,
  setDraft,
  saveError,
  saveSuccess,
}: {
  agent: CreatorWorldAgentDetail;
  draft: CreatorWorldAgentDraft;
  setDraft: (updater: (current: CreatorWorldAgentDraft) => CreatorWorldAgentDraft) => void;
  saveError: boolean;
  saveSuccess: boolean;
}) {
  return (
    <section className="ras-card ras-stack">
      {saveError ? <InlineAlert tone="danger">Creator-world agent update failed.</InlineAlert> : null}
      {saveSuccess ? <InlineAlert tone="success">Creator-world agent saved.</InlineAlert> : null}
      <SectionHeading
        icon={<Bot size={17} strokeWidth={1.8} />}
        title="Reviewed settings"
        badge={<StatusBadge tone="neutral">{agent.chatReadiness.profile.defaultVoiceReference || 'voice not set'}</StatusBadge>}
      />
      <div className="ras-fact-grid">
        <FactCell label="Handle" value={`@${agent.handle}`} />
        <FactCell label="World" value={agent.ownerWorldId || agent.worldId} />
        <FactCell label="Profile media ready" value={agent.chatReadiness.gates.profileMediaReady ? 'ready' : 'missing'} />
        <FactCell label="Voice ready" value={agent.chatReadiness.gates.voiceReferenceReady ? 'ready' : 'missing'} />
      </div>
      <FieldShell label="Display name">
        <TextField value={draft.displayName} onChange={(event) => setDraft((current) => ({ ...current, displayName: event.currentTarget.value }))} />
      </FieldShell>
      <FieldShell label="Description">
        <TextareaField value={draft.description} onChange={(event) => setDraft((current) => ({ ...current, description: event.currentTarget.value }))} />
      </FieldShell>
      <FieldShell label="Greeting">
        <TextareaField value={draft.greeting} onChange={(event) => setDraft((current) => ({ ...current, greeting: event.currentTarget.value }))} />
      </FieldShell>
      <div className="grid gap-4 lg:grid-cols-2">
        <FieldShell label="Content style">
          <TextField value={draft.contentStyle} onChange={(event) => setDraft((current) => ({ ...current, contentStyle: event.currentTarget.value }))} />
        </FieldShell>
        <FieldShell label="Target audience">
          <TextField value={draft.targetAudience} onChange={(event) => setDraft((current) => ({ ...current, targetAudience: event.currentTarget.value }))} />
        </FieldShell>
      </div>
      <FieldShell label="Public positioning">
        <TextareaField value={draft.positioning} onChange={(event) => setDraft((current) => ({ ...current, positioning: event.currentTarget.value }))} />
      </FieldShell>
      <div className="grid gap-4 lg:grid-cols-2">
        <FieldShell label="Avatar URL">
          <TextField value={draft.avatarUrl} onChange={(event) => setDraft((current) => ({ ...current, avatarUrl: event.currentTarget.value }))} />
        </FieldShell>
        <FieldShell label="Profile cover URL">
          <TextField value={draft.profileCoverUrl} onChange={(event) => setDraft((current) => ({ ...current, profileCoverUrl: event.currentTarget.value }))} />
        </FieldShell>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <FieldShell label="Voice ID">
          <TextField value={draft.voiceId} onChange={(event) => setDraft((current) => ({ ...current, voiceId: event.currentTarget.value }))} />
        </FieldShell>
        <FieldShell label="Speech model ID">
          <TextField value={draft.speechModelId} onChange={(event) => setDraft((current) => ({ ...current, speechModelId: event.currentTarget.value }))} />
        </FieldShell>
        <FieldShell label="Speech route policy">
          <TextField
            value={draft.speechRoutePolicy}
            placeholder="local or cloud"
            onChange={(event) => {
              const value = event.currentTarget.value.trim();
              setDraft((current) => ({
                ...current,
                speechRoutePolicy: value === 'local' || value === 'cloud' ? value : '',
              }));
            }}
          />
        </FieldShell>
      </div>
      <FieldShell label="Voice description">
        <TextareaField value={draft.voiceDescription} onChange={(event) => setDraft((current) => ({ ...current, voiceDescription: event.currentTarget.value }))} />
      </FieldShell>
    </section>
  );
}

function WorldAgentEditor({
  agent,
  draft,
  setDraft,
  saveError,
  saveSuccess,
  draftActionError,
  draftGenerationError,
  generatingDraft,
  reviewingCandidateId,
  reviewingStatus,
  applyingBatchId,
  onGenerateDraft,
  onReviewCandidate,
  onApplyBatch,
}: {
  agent: CreatorWorldAgentDetail;
  draft: CreatorWorldAgentDraft;
  setDraft: (updater: (current: CreatorWorldAgentDraft) => CreatorWorldAgentDraft) => void;
  saveError: boolean;
  saveSuccess: boolean;
  draftActionError: boolean;
  draftGenerationError: boolean;
  generatingDraft: boolean;
  reviewingCandidateId: string | null;
  reviewingStatus: 'accepted' | 'rejected' | null;
  applyingBatchId: string | null;
  onGenerateDraft: () => void;
  onReviewCandidate: (batchId: string, candidateId: string, status: 'accepted' | 'rejected') => void;
  onApplyBatch: (batchId: string) => void;
}) {
  return (
    <div className="ras-stack">
      <SourceIdentitySection agent={agent} skeleton={agent.sourceSkeleton} />
      <WorldFactsSection skeleton={agent.sourceSkeleton} />
      <CompletionGapsSection skeleton={agent.sourceSkeleton} />
      <AuthoringBriefSection skeleton={agent.sourceSkeleton} />
      <GenerationTargetsSection context={agent.authoringContext} />
      <DraftBatchesSection
        batches={agent.authoringDraftBatches}
        draftActionError={draftActionError}
        draftGenerationError={draftGenerationError}
        generatingDraft={generatingDraft}
        reviewingCandidateId={reviewingCandidateId}
        reviewingStatus={reviewingStatus}
        applyingBatchId={applyingBatchId}
        onGenerateDraft={onGenerateDraft}
        onReviewCandidate={onReviewCandidate}
        onApplyBatch={onApplyBatch}
      />
      <SettingsEditorSection
        agent={agent}
        draft={draft}
        setDraft={setDraft}
        saveError={saveError}
        saveSuccess={saveSuccess}
      />
    </div>
  );
}
