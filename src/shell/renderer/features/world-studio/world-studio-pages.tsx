import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { AlertTriangle, ArrowLeft, Bot, RefreshCw, Save } from 'lucide-react';
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
  getCreatorWorldAgentDetail,
  getCreatorWorldDetail,
  listCreatorWorlds,
  updateCreatorWorldAgent,
  type CreatorWorldAgentDetail,
  type CreatorWorldAgentDraft,
  type CreatorWorldAgentSummary,
  type CreatorWorldDetail,
  type CreatorWorldSummary,
} from './world-studio-client.js';
import { studioQueryClient } from '@renderer/infra/query-client.js';

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
            detail="Realm did not return this WORLD_OWNED agent under creator-world authority."
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
          />
        )}
      </div>
    </ScrollArea>
  );
}

function WorldAgentEditor({
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
      <div className="ras-fact-grid">
        <div className="ras-fact"><div className="ras-fact__label">Agent id</div><div className="ras-fact__value">{agent.id}</div></div>
        <div className="ras-fact"><div className="ras-fact__label">Handle</div><div className="ras-fact__value">@{agent.handle}</div></div>
        <div className="ras-fact"><div className="ras-fact__label">World</div><div className="ras-fact__value">{agent.ownerWorldId || agent.worldId}</div></div>
        <div className="ras-fact"><div className="ras-fact__label">State</div><div className="ras-fact__value">{agent.state || 'source unavailable'}</div></div>
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
      <FieldShell label="Content style">
        <TextField value={draft.contentStyle} onChange={(event) => setDraft((current) => ({ ...current, contentStyle: event.currentTarget.value }))} />
      </FieldShell>
      <FieldShell label="Target audience">
        <TextField value={draft.targetAudience} onChange={(event) => setDraft((current) => ({ ...current, targetAudience: event.currentTarget.value }))} />
      </FieldShell>
      <FieldShell label="Public positioning">
        <TextareaField value={draft.positioning} onChange={(event) => setDraft((current) => ({ ...current, positioning: event.currentTarget.value }))} />
      </FieldShell>
      <FieldShell label="Avatar URL">
        <TextField value={draft.avatarUrl} onChange={(event) => setDraft((current) => ({ ...current, avatarUrl: event.currentTarget.value }))} />
      </FieldShell>
      <FieldShell label="Profile cover URL">
        <TextField value={draft.profileCoverUrl} onChange={(event) => setDraft((current) => ({ ...current, profileCoverUrl: event.currentTarget.value }))} />
      </FieldShell>
      <FieldShell label="Voice ID">
        <TextField value={draft.voiceId} onChange={(event) => setDraft((current) => ({ ...current, voiceId: event.currentTarget.value }))} />
      </FieldShell>
      <FieldShell label="Voice description">
        <TextareaField value={draft.voiceDescription} onChange={(event) => setDraft((current) => ({ ...current, voiceDescription: event.currentTarget.value }))} />
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
    </section>
  );
}
