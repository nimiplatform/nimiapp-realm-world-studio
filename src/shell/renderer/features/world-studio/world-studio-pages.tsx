import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
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
  draftFromCharacter,
  CreatorWorldCharacterDetailLoadError,
  getCreatorWorldCharacterDetail,
  getCreatorWorldDetail,
  updateCreatorWorldCharacter,
  type CreatorWorldCharacterAuthoringDraftBatch,
  type CreatorWorldCharacterAuthoringDraftCandidate,
  type CreatorWorldCharacterAuthoringGenerationContext,
  type CreatorWorldCharacterDetail,
  type CreatorWorldCharacterDraft,
  type CreatorWorldCharacterSummary,
  type CreatorWorldCharacterSourceSkeleton,
  type CreatorWorldDetail,
} from './world-studio-client.js';
import {
  listRealmCoreCockpitWorlds,
  searchRealmCoreCockpitWorlds,
  type CoreHealthIssue,
  type RealmCoreCockpitResult,
  type RealmCoreCockpitWorld,
  type SourceBackedCount,
} from './world-core-cockpit.js';
import { generateCreatorWorldCharacterAuthoringDraftBatch } from './character-authoring-draft-generation.js';
import type { TFunction } from 'i18next';

const WORLD_LIST_QUERY_KEY = ['realm-world-studio', 'realm-core-cockpit-worlds'] as const;

function worldDetailQueryKey(worldId: string) {
  return ['realm-world-studio', 'creator-world-detail', worldId] as const;
}

function worldCharacterDetailQueryKey(worldId: string, characterId: string) {
  return ['realm-world-studio', 'creator-world-character-detail', worldId, characterId] as const;
}

function FailureState({
  title,
  detail,
  diagnostic,
  loading,
  onRetry,
}: {
  title: string;
  detail: string;
  diagnostic?: string | null;
  loading: boolean;
  onRetry: () => void;
}) {
  const { t } = useTranslation();

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
          {diagnostic ? (
            <details className="mt-3 text-[length:var(--nimi-type-caption-size)] leading-5 text-[var(--nimi-text-muted)]">
              <summary className="cursor-pointer font-semibold text-[var(--nimi-text-secondary)]">
                {t('worldStudio.list.failureDiagnosticSummary')}
              </summary>
              <p className="m-0 mt-1 break-words font-mono">{diagnostic}</p>
            </details>
          ) : null}
        </div>
        <Button tone="primary" loading={loading} onClick={onRetry}>
          {t('common.retry')}
        </Button>
      </div>
    </section>
  );
}

function describeWorldListError(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message.trim();
  }
  if (typeof error === 'string' && error.trim()) {
    return error.trim();
  }
  return 'Realm WorldCore list request failed without a typed message.';
}

function PageLoadingState() {
  return (
    <div className="ras-character-grid">
      {Array.from({ length: 6 }).map((_, index) => (
        <section key={index} className="ras-card ras-card--quiet">
          <LoadingSkeleton lines={3} />
        </section>
      ))}
    </div>
  );
}

function creatorWorldCharacterFailureDetail(error: unknown, t: TFunction): string {
  if (error instanceof CreatorWorldCharacterDetailLoadError) {
    return t('worldStudio.characterDetail.stageFailureDetail', {
      stage: error.stage,
      message: error.originalMessage,
    });
  }
  if (error instanceof Error && error.message.trim()) {
    return error.message.trim();
  }
  return t('worldStudio.characterDetail.defaultUnavailableDetail');
}

function updateCachedCharacter(
  queryClient: QueryClient,
  worldId: string,
  characterId: string,
  updater: (current: CreatorWorldCharacterDetail) => CreatorWorldCharacterDetail,
) {
  queryClient.setQueryData<CreatorWorldCharacterDetail>(
    worldCharacterDetailQueryKey(worldId, characterId),
    (current) => current ? updater(current) : current,
  );
}

export function CreatorWorldListPage() {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [selectedWorldId, setSelectedWorldId] = useState<string | null>(null);
  const cockpitQuery = useQuery({
    queryKey: WORLD_LIST_QUERY_KEY,
    queryFn: () => listRealmCoreCockpitWorlds(),
  });

  const worlds = useMemo(
    () => searchRealmCoreCockpitWorlds(cockpitQuery.data?.worlds || [], query),
    [query, cockpitQuery.data],
  );
  const selectedWorld = worlds.find((world) => world.id === selectedWorldId)
    || worlds[0]
    || cockpitQuery.data?.worlds.find((world) => world.id === selectedWorldId)
    || null;

  return (
    <ScrollArea className="flex-1" viewportClassName="bg-transparent">
      <div className="ras-page">
        <header className="ras-page-header">
          <div className="min-w-0">
            <p className="ras-page-header__eyebrow">{t('worldStudio.eyebrow')}</p>
            <h1 className="ras-page-header__title">{t('worldStudio.list.title')}</h1>
            <p className="ras-page-header__description">
              {t('worldStudio.list.description')}
            </p>
          </div>
          <Button
            tone="secondary"
            loading={cockpitQuery.isFetching}
            leadingIcon={<RefreshCw size={15} strokeWidth={1.8} />}
            onClick={() => void cockpitQuery.refetch()}
          >
            {t('common.refresh')}
          </Button>
        </header>

        <section className="ras-card">
          <SearchField
            value={query}
            placeholder={t('worldStudio.list.searchPlaceholder')}
            aria-label={t('worldStudio.list.searchAria')}
            onChange={(event) => setQuery(event.currentTarget.value)}
          />
        </section>

        {cockpitQuery.isLoading ? (
          <PageLoadingState />
        ) : cockpitQuery.isError ? (
          <FailureState
            title={t('worldStudio.list.dataUnavailableTitle')}
            detail={t('worldStudio.list.dataUnavailableDetail')}
            diagnostic={t('worldStudio.list.failureDiagnostic', {
              reason: describeWorldListError(cockpitQuery.error),
            })}
            loading={cockpitQuery.isFetching}
            onRetry={() => void cockpitQuery.refetch()}
          />
        ) : worlds.length === 0 ? (
          <section className="ras-card">
            <EmptyState
              title={t('worldStudio.list.emptyTitle')}
              description={t('worldStudio.list.emptyDescription')}
            />
          </section>
        ) : (
          <CreatorWorldWorkbench
            result={cockpitQuery.data}
            worlds={worlds}
            selectedWorld={selectedWorld}
            onSelectWorld={setSelectedWorldId}
          />
        )}
      </div>
    </ScrollArea>
  );
}

type WorkbenchCountKind = 'world' | 'character' | 'event' | 'assetRef' | 'entityType' | 'system' | 'scene' | 'entity' | 'relationship';
type InventoryStatus = 'readyToInspect' | 'needsCreatorReview' | 'platformLimited';

function formatWorkbenchCount(t: TFunction, count: number, kind: WorkbenchCountKind): string {
  const suffix = count === 1 ? 'One' : 'Other';
  return t(`worldStudio.workbench.count.${kind}${suffix}`, { count });
}

function countLabel(t: TFunction, count: SourceBackedCount, kind: WorkbenchCountKind): string {
  return count.state === 'available'
    ? formatWorkbenchCount(t, count.value, kind)
    : t(`worldStudio.workbench.sourcePending.${kind}`);
}

function joinOrUnavailable(t: TFunction, values: readonly string[]): string {
  return values.length > 0 ? values.join(' / ') : t('worldStudio.workbench.sourceUnavailable');
}

function timeModeLabel(t: TFunction, mode: string | null): string | null {
  switch (mode) {
    case 'static':
      return t('worldStudio.workbench.timeMode.static');
    case 'wallClockAnchored':
      return t('worldStudio.workbench.timeMode.wallClockAnchored');
    case 'flowing':
      return t('worldStudio.workbench.timeMode.flowing');
    case null:
    case '':
      return null;
    default:
      return t('worldStudio.workbench.timeMode.custom');
  }
}

function authoringReviewLabel(t: TFunction, status: string | null): string | null {
  switch (status) {
    case 'needs-review':
      return t('worldStudio.workbench.authoringReview.needsReview');
    case 'approved':
    case 'reviewed':
      return t('worldStudio.workbench.authoringReview.reviewed');
    case null:
    case '':
      return null;
    default:
      return t('worldStudio.workbench.authoringReview.pending');
  }
}

function isPlatformIssue(issue: CoreHealthIssue): boolean {
  return issue.family === 'ExternalContract' || issue.ruleId.startsWith('graph.');
}

function creatorActionIssues(world: RealmCoreCockpitWorld): CoreHealthIssue[] {
  return world.healthIssues.filter((issueItem) => !isPlatformIssue(issueItem));
}

function platformIssues(world: RealmCoreCockpitWorld): CoreHealthIssue[] {
  return world.healthIssues.filter(isPlatformIssue);
}

function graphPlatformIssues(world: RealmCoreCockpitWorld): CoreHealthIssue[] {
  return world.healthIssues.filter((issueItem) =>
    issueItem.ruleId === 'graph.entities.unavailable' || issueItem.ruleId === 'graph.relationships.unavailable');
}

function nonGraphActionIssues(world: RealmCoreCockpitWorld): CoreHealthIssue[] {
  return world.healthIssues.filter((issueItem) =>
    issueItem.ruleId !== 'graph.entities.unavailable' && issueItem.ruleId !== 'graph.relationships.unavailable');
}

function inspectableWorldCount(worlds: readonly RealmCoreCockpitWorld[]): number {
  return worlds.filter((world) => Boolean(world.summary) && world.counts.characters.state === 'available').length;
}

function visibleEditableCharacterCount(worlds: readonly RealmCoreCockpitWorld[]): number | null {
  let count = 0;
  let hasAvailableSource = false;
  for (const world of worlds) {
    if (world.counts.characters.state === 'available') {
      hasAvailableSource = true;
      count += world.counts.characters.value;
    }
  }
  return hasAvailableSource ? count : null;
}

function worldInventoryStatus(world: RealmCoreCockpitWorld): InventoryStatus {
  if (creatorActionIssues(world).length > 0) return 'needsCreatorReview';
  if (platformIssues(world).length > 0) return 'platformLimited';
  return 'readyToInspect';
}

function statusTone(status: InventoryStatus): 'success' | 'warning' | 'info' {
  if (status === 'readyToInspect') return 'success';
  if (status === 'needsCreatorReview') return 'warning';
  return 'info';
}

function worldInventoryStatusLabel(t: TFunction, status: InventoryStatus): string {
  return t(`worldStudio.workbench.status.${status}`);
}

function actionStatus(t: TFunction, issueItem: CoreHealthIssue): string {
  if (isPlatformIssue(issueItem)) return t('worldStudio.workbench.actionStatus.platformLimit');
  if (issueItem.severity === 'info') return t('worldStudio.workbench.actionStatus.characterDetail');
  return t('worldStudio.workbench.actionStatus.creatorAction');
}

function actionTone(issueItem: CoreHealthIssue): 'danger' | 'warning' | 'info' {
  if (isPlatformIssue(issueItem)) return issueItem.severity === 'error' ? 'warning' : 'info';
  if (issueItem.severity === 'error') return 'danger';
  if (issueItem.severity === 'warning') return 'warning';
  return 'info';
}

function actionTitle(t: TFunction, issueItem: CoreHealthIssue): string {
  switch (issueItem.ruleId) {
    case 'graph.entities.unavailable':
      return t('worldStudio.workbench.action.graphEntitiesTitle');
    case 'graph.relationships.unavailable':
      return t('worldStudio.workbench.action.graphRelationshipsTitle');
    case 'assets.resolver.unavailable':
      return t('worldStudio.workbench.action.assetsResolverTitle');
    case 'runtime.summary.unavailable':
      return t('worldStudio.workbench.action.runtimeSummaryTitle');
    case 'ontology.relationshipTypes.empty':
      return t('worldStudio.workbench.action.relationshipTypesTitle');
    case 'ontology.entityKinds.empty':
      return t('worldStudio.workbench.action.entityKindsTitle');
    case 'identity.summary.missing':
      return t('worldStudio.workbench.action.summaryMissingTitle');
    case 'contentHash.missing':
      return t('worldStudio.workbench.action.contentHashTitle');
    case 'characters.empty':
      return t('worldStudio.workbench.action.charactersEmptyTitle');
    default:
      return t('worldStudio.workbench.action.defaultTitle');
  }
}

function actionDetail(t: TFunction, issueItem: CoreHealthIssue): string {
  switch (issueItem.ruleId) {
    case 'graph.entities.unavailable':
      return t('worldStudio.workbench.action.graphEntitiesDetail');
    case 'graph.relationships.unavailable':
      return t('worldStudio.workbench.action.graphRelationshipsDetail');
    case 'assets.resolver.unavailable':
      return t('worldStudio.workbench.action.assetsResolverDetail');
    case 'runtime.summary.unavailable':
      return t('worldStudio.workbench.action.runtimeSummaryDetail');
    case 'ontology.relationshipTypes.empty':
      return t('worldStudio.workbench.action.relationshipTypesDetail');
    case 'ontology.entityKinds.empty':
      return t('worldStudio.workbench.action.entityKindsDetail');
    case 'identity.summary.missing':
      return t('worldStudio.workbench.action.summaryMissingDetail');
    case 'contentHash.missing':
      return t('worldStudio.workbench.action.contentHashDetail');
    case 'characters.empty':
      return t('worldStudio.workbench.action.charactersEmptyDetail');
    default:
      return t('worldStudio.workbench.action.defaultDetail');
  }
}

function CommandScopeBar({
  worldCount,
  editableCharacters,
  reviewableWorlds,
}: {
  worldCount: number | null;
  editableCharacters: number | null;
  reviewableWorlds: number;
}) {
  const { t } = useTranslation();
  const worldLabelKey = worldCount === 1 ? 'worldOne' : 'worldOther';
  const characterLabelKey = editableCharacters === 1 ? 'characterOne' : 'characterOther';
  const reviewableLabelKey = reviewableWorlds === 1 ? 'reviewableOne' : 'reviewableOther';
  return (
    <section className="ras-command-scope" aria-label={t('worldStudio.command.scope.aria')}>
      <span className="ras-command-scope__item">
        {worldCount === null ? t('worldStudio.workbench.syncNeeded') : t(`worldStudio.command.scope.${worldLabelKey}`, { count: worldCount })}
      </span>
      <span className="ras-command-scope__item">
        {editableCharacters === null ? t('worldStudio.workbench.syncNeeded') : t(`worldStudio.command.scope.${characterLabelKey}`, { count: editableCharacters })}
      </span>
      <span className="ras-command-scope__item">
        {t(`worldStudio.command.scope.${reviewableLabelKey}`, { count: reviewableWorlds })}
      </span>
    </section>
  );
}

function CreatorWorldWorkbench({
  result,
  worlds,
  selectedWorld,
  onSelectWorld,
}: {
  result: RealmCoreCockpitResult | undefined;
  worlds: RealmCoreCockpitWorld[];
  selectedWorld: RealmCoreCockpitWorld | null;
  onSelectWorld: (worldId: string) => void;
}) {
  if (!result || !selectedWorld) return null;
  return (
    <div className="ras-command-center">
      <CommandScopeBar
        worldCount={worlds.length}
        editableCharacters={visibleEditableCharacterCount(worlds)}
        reviewableWorlds={inspectableWorldCount(worlds)}
      />

      <div className="ras-command-grid">
        <WorldInventory worlds={worlds} selectedWorldId={selectedWorld.id} onSelectWorld={onSelectWorld} />
        <WorldCommandMain world={selectedWorld} />
        <ActionQueue world={selectedWorld} />
      </div>
    </div>
  );
}

function WorldInventory({
  worlds,
  selectedWorldId,
  onSelectWorld,
}: {
  worlds: RealmCoreCockpitWorld[];
  selectedWorldId: string;
  onSelectWorld: (worldId: string) => void;
}) {
  const { t } = useTranslation();
  return (
    <section className="ras-card ras-command-panel ras-command-worlds">
      <div className="ras-command-panel__header">
        <div>
          <h2 className="ras-section-title">{t('worldStudio.command.worlds.title')}</h2>
          <p className="ras-command-panel__copy">{t('worldStudio.command.worlds.description')}</p>
        </div>
        <StatusBadge tone="info">{t('worldStudio.command.worlds.total', { count: worlds.length })}</StatusBadge>
      </div>
      <div className="ras-command-worlds__rows">
        {worlds.map((world) => {
          const status = worldInventoryStatus(world);
          return (
            <button
              key={world.id}
              type="button"
              aria-pressed={world.id === selectedWorldId}
              className={`ras-command-world-row${world.id === selectedWorldId ? ' ras-command-world-row--selected' : ''}`}
              onClick={() => onSelectWorld(world.id)}
            >
              <span className="ras-command-world-row__title">{world.title}</span>
              <span className="ras-command-world-row__summary">{world.worldType || t('worldStudio.workbench.worldTypePending')}</span>
              <span className="ras-command-world-row__meta">
                <StatusBadge tone="neutral">{world.visibility}</StatusBadge>
                <StatusBadge tone={world.counts.characters.state === 'available' ? 'info' : 'warning'}>
                  {countLabel(t, world.counts.characters, 'character')}
                </StatusBadge>
                <StatusBadge tone={statusTone(status)}>{worldInventoryStatusLabel(t, status)}</StatusBadge>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function FactLine({ label, value }: { label: string; value: string | number | null }) {
  const { t } = useTranslation();
  return (
    <div className="ras-command-fact">
      <span className="ras-command-fact__label">{label}</span>
      <span className="ras-command-fact__value ras-break-anywhere">{value ?? t('worldStudio.workbench.sourceUnavailable')}</span>
    </div>
  );
}

function CountFactLine({
  label,
  count,
  kind,
  unavailableLabel,
}: {
  label: string;
  count: SourceBackedCount;
  kind: WorkbenchCountKind;
  unavailableLabel?: string;
}) {
  const { t } = useTranslation();
  return <FactLine label={label} value={count.state === 'available' ? formatWorkbenchCount(t, count.value, kind) : unavailableLabel ?? t('worldStudio.workbench.platformAccessPending')} />;
}

function worldTokenLabel(world: RealmCoreCockpitWorld): string {
  return [...world.title].slice(0, 2).join('') || 'W';
}

function WorkSurface({ world }: { world: RealmCoreCockpitWorld }) {
  const { t } = useTranslation();
  return (
    <section className="ras-command-surface">
      <h2 className="ras-section-title">{t('worldStudio.command.workSurface.title')}</h2>
      <div className="ras-command-surface-grid">
        <section className="ras-command-surface-block">
          <h3>{t('worldStudio.command.surface.identity')}</h3>
          <div className="ras-command-facts">
            <FactLine label={t('worldStudio.workbench.field.genre')} value={world.genre || null} />
            <FactLine label={t('worldStudio.workbench.field.worldType')} value={world.worldType || null} />
            <FactLine label={t('worldStudio.workbench.field.themes')} value={joinOrUnavailable(t, world.themes)} />
            <FactLine label={t('worldStudio.workbench.field.visibility')} value={world.visibility} />
          </div>
        </section>
        <section className="ras-command-surface-block">
          <h3>{t('worldStudio.command.surface.structure')}</h3>
          <p className="ras-command-surface-block__copy ras-break-anywhere">{joinOrUnavailable(t, world.ontology.entityKinds)}</p>
          <p className="ras-command-surface-block__muted ras-break-anywhere">
            {t('worldStudio.workbench.relationshipTypes', { value: joinOrUnavailable(t, world.ontology.relationshipTypes) })}
          </p>
        </section>
        <section className="ras-command-surface-block">
          <h3>{t('worldStudio.command.surface.timeline')}</h3>
          <div className="ras-command-facts">
            <CountFactLine label={t('worldStudio.workbench.field.timelineEvents')} count={world.structure.timelineEventCount} kind="event" unavailableLabel={t('worldStudio.workbench.timelineSourcePending')} />
            <FactLine label={t('worldStudio.workbench.field.worldStart')} value={world.timeModel.worldStartedAtDisplay} />
            <FactLine label={t('worldStudio.workbench.field.mode')} value={timeModeLabel(t, world.timeModel.mode)} />
            <FactLine label={t('worldStudio.workbench.field.calendar')} value={world.timeModel.calendar} />
          </div>
        </section>
        <section className="ras-command-surface-block">
          <h3>{t('worldStudio.command.surface.assets')}</h3>
          <div className="ras-command-facts">
            <CountFactLine label={t('worldStudio.workbench.field.systems')} count={world.structure.systemCount} kind="system" />
            <CountFactLine label={t('worldStudio.workbench.field.scenes')} count={world.structure.sceneCount} kind="scene" />
            <CountFactLine label={t('worldStudio.workbench.field.declaredAssetRefs')} count={world.structure.declaredAssetRefCount} kind="assetRef" unavailableLabel={t('worldStudio.workbench.assetSourcePending')} />
            <FactLine label={t('worldStudio.workbench.field.authoringReview')} value={authoringReviewLabel(t, world.structure.authoringReviewStatus)} />
          </div>
        </section>
      </div>
    </section>
  );
}

function WorldCommandMain({ world }: { world: RealmCoreCockpitWorld }) {
  const { t } = useTranslation();
  return (
    <section className="ras-card ras-command-main">
      <section className="ras-command-brief">
        <div className="ras-command-token" aria-hidden="true">{worldTokenLabel(world)}</div>
        <div className="min-w-0">
          <h2 className="ras-section-title">{t('worldStudio.command.brief.title')}</h2>
          <p className="ras-command-brief__title ras-break-anywhere">{world.title}</p>
          <p className="ras-command-brief__summary ras-break-anywhere">
            {world.summary || t('worldStudio.workbench.summaryUnavailable')}
          </p>
        </div>
        <Link className="ras-command-open-link" to={`/worlds/${world.id}`}>
          <BookOpen size={15} aria-hidden="true" />
          <span>{t('worldStudio.workbench.openCharacters')}</span>
        </Link>
      </section>

      <section className="ras-command-counters" aria-label={t('worldStudio.command.countersAria')}>
        <div><span>{t('worldStudio.workbench.section.cast')}</span><strong>{countLabel(t, world.counts.characters, 'character')}</strong></div>
        <div><span>{t('worldStudio.command.counter.structure')}</span><strong>{formatWorkbenchCount(t, world.ontology.entityKinds.length, 'entityType')}</strong></div>
        <div><span>{t('worldStudio.workbench.section.timeline')}</span><strong>{countLabel(t, world.structure.timelineEventCount, 'event')}</strong></div>
        <div><span>{t('worldStudio.workbench.section.assets')}</span><strong>{countLabel(t, world.structure.declaredAssetRefCount, 'assetRef')}</strong></div>
      </section>

      <WorkSurface world={world} />
      <DiagnosticsDetails world={world} />
    </section>
  );
}

function DiagnosticsDetails({ world }: { world: RealmCoreCockpitWorld }) {
  const { t } = useTranslation();
  return (
    <details className="ras-command-diagnostics">
      <summary>{t('worldStudio.command.sourceDiagnostics')}</summary>
      <div className="ras-command-facts">
        <CountFactLine label={t('worldStudio.workbench.field.entityNetwork')} count={world.counts.entities} kind="entity" />
        <CountFactLine label={t('worldStudio.workbench.field.relationshipNetwork')} count={world.counts.relationships} kind="relationship" />
        <FactLine label={t('worldStudio.workbench.field.schema')} value={world.schemaVersion} />
        <FactLine label={t('worldStudio.workbench.field.revision')} value={world.contentRevision} />
        <FactLine label={t('worldStudio.workbench.field.contentHash')} value={world.contentHash} />
        <FactLine label={t('worldStudio.workbench.field.origin')} value={world.origin.sourceId || world.origin.kind} />
        <FactLine label={t('worldStudio.workbench.field.creator')} value={`${world.creatorEmail} / ${world.creatorId}`} />
        <FactLine label={t('worldStudio.workbench.field.updated')} value={world.updatedAt} />
        <FactLine label={t('worldStudio.workbench.field.displayFormat')} value={world.timeModel.displayFormat} />
      </div>
      {world.healthIssues.length > 0 ? (
        <div className="ras-command-diagnostics__issues">
          <div className="ras-command-diagnostics__issues-title">{t('worldStudio.workbench.diagnostics.sourceChecks')}</div>
          {world.healthIssues.map((issueItem) => (
            <div key={`${issueItem.ruleId}:${issueItem.jsonPath}`} className="ras-command-diagnostics__issue ras-break-anywhere">
              <strong>{issueItem.ruleId}</strong>
              <span>{issueItem.message}</span>
              <span>{issueItem.source}</span>
            </div>
          ))}
        </div>
      ) : null}
    </details>
  );
}

type NextActionItem = {
  id: string;
  status: string;
  tone: 'danger' | 'warning' | 'info';
  title: string;
  detail: string;
  meta: string;
};

function commandActionTitle(t: TFunction, issueItem: CoreHealthIssue): string {
  switch (issueItem.ruleId) {
    case 'ontology.relationshipTypes.empty':
      return t('worldStudio.command.action.relationshipTypesTitle');
    case 'ontology.entityKinds.empty':
      return t('worldStudio.command.action.entityKindsTitle');
    default:
      return actionTitle(t, issueItem);
  }
}

function creatorNextActionItems(t: TFunction, world: RealmCoreCockpitWorld): NextActionItem[] {
  return nonGraphActionIssues(world)
    .filter((issueItem) => !isPlatformIssue(issueItem))
    .map((issueItem) => ({
      id: issueItem.ruleId,
      status: actionStatus(t, issueItem),
      tone: actionTone(issueItem),
      title: commandActionTitle(t, issueItem),
      detail: actionDetail(t, issueItem),
      meta: issueItem.severity,
    }));
}

function platformWatchItems(t: TFunction, world: RealmCoreCockpitWorld): NextActionItem[] {
  const graphIssues = graphPlatformIssues(world);
  const actions: NextActionItem[] = [];
  if (graphIssues.length > 0) {
    actions.push({
      id: 'graph-platform-pending',
      status: t('worldStudio.workbench.actionStatus.platformLimit'),
      tone: 'info',
      title: t('worldStudio.command.platformWatch.graphTitle'),
      detail: t('worldStudio.command.platformWatch.graphDetail'),
      meta: t('worldStudio.workbench.action.graphLimits', { count: graphIssues.length }),
    });
  }
  for (const issueItem of nonGraphActionIssues(world)) {
    if (isPlatformIssue(issueItem)) {
      const isRuntime = issueItem.ruleId === 'runtime.summary.unavailable';
      actions.push({
        id: issueItem.ruleId,
        status: actionStatus(t, issueItem),
        tone: actionTone(issueItem),
        title: t(isRuntime ? 'worldStudio.command.platformWatch.runtimeTitle' : 'worldStudio.command.platformWatch.assetTitle'),
        detail: t(isRuntime ? 'worldStudio.command.platformWatch.runtimeDetail' : 'worldStudio.command.platformWatch.assetDetail'),
        meta: issueItem.severity,
      });
    }
  }
  return actions;
}

function ActionQueue({ world }: { world: RealmCoreCockpitWorld }) {
  const { t } = useTranslation();
  const creatorActions = creatorNextActionItems(t, world);
  const watchItems = platformWatchItems(t, world);
  return (
    <aside className="ras-card ras-command-actions" aria-label={t('worldStudio.command.actionQueue.aria')}>
      <div className="ras-command-panel__header">
        <div>
          <h2 className="ras-section-title">{t('worldStudio.command.actionQueue.title')}</h2>
          <p className="ras-command-panel__copy">{t('worldStudio.command.actionQueue.description')}</p>
        </div>
      </div>
      {creatorActions.length === 0 ? (
        <div className="ras-command-empty">
          <EmptyState title={t('worldStudio.command.actionQueue.emptyTitle')} description={t('worldStudio.command.actionQueue.emptyDescription')} />
        </div>
      ) : (
        <div className="ras-command-actions__items">
          {creatorActions.map((action) => (
            <article key={action.id} className="ras-command-action-item">
              <div className="flex items-start justify-between gap-2">
                <StatusBadge tone={action.tone}>{action.status}</StatusBadge>
                <span className="ras-command-actions__scope">{action.meta}</span>
              </div>
              <div className="ras-break-anywhere mt-2 text-sm font-semibold text-[var(--nimi-text-primary)]">{action.title}</div>
              <div className="ras-break-anywhere mt-1 text-[length:var(--nimi-type-body-sm-size)] text-[var(--nimi-text-muted)]">
                {action.detail}
              </div>
            </article>
          ))}
        </div>
      )}
      {watchItems.length > 0 ? (
        <section className="ras-command-platform-watch">
          <h3>{t('worldStudio.command.platformWatch.title')}</h3>
          <div className="ras-command-actions__items">
            {watchItems.map((action) => (
              <article key={action.id} className="ras-command-action-item ras-command-action-item--watch">
                <div className="flex items-start justify-between gap-2">
                  <StatusBadge tone={action.tone}>{action.status}</StatusBadge>
                  <span className="ras-command-actions__scope">{action.meta}</span>
                </div>
                <div className="ras-break-anywhere mt-2 text-sm font-semibold text-[var(--nimi-text-primary)]">{action.title}</div>
                <div className="ras-break-anywhere mt-1 text-[length:var(--nimi-type-body-sm-size)] text-[var(--nimi-text-muted)]">
                  {action.detail}
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </aside>
  );
}

function WorldCharacterTile({ worldId, character }: { worldId: string; character: CreatorWorldCharacterSummary }) {
  const { t } = useTranslation();

  return (
    <Surface
      as={Link}
      to={`/worlds/${worldId}/characters/${character.id}`}
      padding="md"
      tone="card"
      interactive
      className="grid min-w-0 grid-cols-[48px_1fr] gap-3"
    >
      <div className="h-12 w-12 overflow-hidden rounded-[var(--nimi-radius-md)] bg-[var(--nimi-surface-active)]">
        {character.avatarUrl ? <img src={character.avatarUrl} alt="" className="h-full w-full object-cover" /> : null}
      </div>
      <div className="min-w-0">
        <div className="ras-break-anywhere truncate font-medium">{character.displayName}</div>
        <div className="ras-break-anywhere mt-1 text-[length:var(--nimi-type-body-sm-size)] text-[var(--nimi-text-muted)]">
          @{character.handle}
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          <StatusBadge tone="info">WORLD_OWNED</StatusBadge>
          <StatusBadge tone="neutral">{character.state || t('worldStudio.character.stateUnavailable')}</StatusBadge>
        </div>
      </div>
    </Surface>
  );
}

export function CreatorWorldDetailPage() {
  const { t } = useTranslation();
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
              {t('worldStudio.worldDetail.back')}
            </Button>
            <h1 className="ras-page-header__title">{world?.name || t('worldStudio.worldDetail.fallbackTitle')}</h1>
            <p className="ras-page-header__description">
              {world?.tagline || world?.description || t('worldStudio.worldDetail.fallbackDescription')}
            </p>
          </div>
          <Button tone="secondary" loading={worldQuery.isFetching} leadingIcon={<RefreshCw size={15} />} onClick={() => void worldQuery.refetch()}>
            {t('common.refresh')}
          </Button>
        </header>

        {worldQuery.isLoading ? (
          <PageLoadingState />
        ) : worldQuery.isError || !world ? (
          <FailureState
            title={t('worldStudio.worldDetail.unavailableTitle')}
            detail={t('worldStudio.worldDetail.unavailableDetail')}
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
  const { t } = useTranslation();

  return (
    <div className="ras-stack">
      <section className="ras-card ras-stack">
        <div className="ras-fact-grid">
          <div className="ras-fact"><div className="ras-fact__label">{t('worldStudio.worldDetail.typeLabel')}</div><div className="ras-fact__value">{world.type}</div></div>
          <div className="ras-fact"><div className="ras-fact__label">{t('worldStudio.worldDetail.statusLabel')}</div><div className="ras-fact__value">{world.status}</div></div>
          <div className="ras-fact"><div className="ras-fact__label">{t('worldStudio.worldDetail.creatorLabel')}</div><div className="ras-fact__value">{world.creatorId}</div></div>
          <div className="ras-fact"><div className="ras-fact__label">{t('worldStudio.worldDetail.authorityLabel')}</div><div className="ras-fact__value">{world.authorityReason}</div></div>
        </div>
        <p className="ras-break-anywhere text-[var(--nimi-text-secondary)]">
          {world.overview || world.description || t('worldStudio.worldDetail.overviewUnavailable')}
        </p>
      </section>
      <section className="ras-card ras-stack">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="ras-section-title">{t('worldStudio.worldDetail.charactersTitle')}</h2>
            <p className="ras-section-copy">
              {t('worldStudio.worldDetail.worldOwnedCharacterCount', { count: world.characters.length })}
            </p>
          </div>
          <Bot size={20} strokeWidth={1.8} />
        </div>
        {world.characters.length === 0 ? (
          <EmptyState
            title={t('worldStudio.worldDetail.noCharactersTitle')}
            description={t('worldStudio.worldDetail.noCharactersDescription')}
          />
        ) : (
          <div className="ras-character-grid">
            {world.characters.map((character) => (
              <WorldCharacterTile key={character.id} worldId={world.id} character={character} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export function CreatorWorldCharacterDetailPage() {
  const { t } = useTranslation();
  const { worldId = '', characterId = '' } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const characterQuery = useQuery({
    queryKey: worldCharacterDetailQueryKey(worldId, characterId),
    queryFn: () => getCreatorWorldCharacterDetail(worldId, characterId),
    enabled: Boolean(worldId && characterId),
  });
  const [draft, setDraft] = useState<CreatorWorldCharacterDraft>(() => draftFromCharacter(characterQuery.data));

  useEffect(() => {
    if (characterQuery.data) setDraft(draftFromCharacter(characterQuery.data));
  }, [characterQuery.data]);

  const updateMutation = useMutation({
    mutationFn: () => updateCreatorWorldCharacter(worldId, characterId, draft),
    onSuccess: (result) => {
      queryClient.setQueryData(worldCharacterDetailQueryKey(worldId, characterId), result.character);
      void queryClient.invalidateQueries({ queryKey: worldDetailQueryKey(worldId) });
    },
  });
  const reviewCandidateMutation = useMutation({
    mutationFn: (input: {
      batchId: string;
      candidateId: string;
      status: 'accepted' | 'rejected';
    }) => {
      void input;
      throw new Error(t('worldStudio.draftBatches.actionFailed'));
    },
  });
  const applyBatchMutation = useMutation({
    mutationFn: (batchId: string) => {
      void batchId;
      throw new Error(t('worldStudio.draftBatches.actionFailed'));
    },
  });
  const generateDraftMutation = useMutation({
    mutationFn: () => {
      if (!characterQuery.data) {
        throw new Error(t('worldStudio.characterDetail.contextUnavailable'));
      }
      return generateCreatorWorldCharacterAuthoringDraftBatch(worldId, characterId, characterQuery.data.authoringContext);
    },
    onSuccess: (result) => {
      updateCachedCharacter(queryClient, worldId, characterId, (character) => ({
        ...character,
        authoringDraftBatches: [result.batch, ...character.authoringDraftBatches],
      }));
    },
  });

  const currentDraft = draftFromCharacter(characterQuery.data);
  const dirty = JSON.stringify(draft) !== JSON.stringify(currentDraft);

  return (
    <ScrollArea className="flex-1" viewportClassName="bg-transparent">
      <div className="ras-page">
        <header className="ras-page-header">
          <div className="min-w-0">
            <Button tone="ghost" leadingIcon={<ArrowLeft size={15} />} onClick={() => navigate(`/worlds/${worldId}`)}>
              {t('worldStudio.characterDetail.back')}
            </Button>
            <h1 className="ras-page-header__title">
              {characterQuery.data?.displayName || t('worldStudio.characterDetail.fallbackTitle')}
            </h1>
            <p className="ras-page-header__description">{t('worldStudio.characterDetail.description')}</p>
          </div>
          <Button
            tone="secondary"
            loading={updateMutation.isPending}
            disabled={!characterQuery.data || !dirty || !draft.displayName.trim()}
            leadingIcon={<Save size={15} />}
            onClick={() => void updateMutation.mutate()}
          >
            {t('worldStudio.characterDetail.saveFinalSettings')}
          </Button>
        </header>

        {characterQuery.isLoading ? (
          <PageLoadingState />
        ) : characterQuery.isError || !characterQuery.data ? (
          <FailureState
            title={t('worldStudio.characterDetail.unavailableTitle')}
            detail={creatorWorldCharacterFailureDetail(characterQuery.error, t)}
            loading={characterQuery.isFetching}
            onRetry={() => void characterQuery.refetch()}
          />
        ) : (
          <WorldCharacterEditor
            character={characterQuery.data}
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

function yearRange(skeleton: CreatorWorldCharacterSourceSkeleton, t: TFunction): string {
  const birth = skeleton.sourceFacts.birthYear;
  const death = skeleton.sourceFacts.deathYear;
  if (birth != null && death != null) return `${birth} / ${death}`;
  if (birth != null) return `${birth} / ${t('worldStudio.yearRange.unknown')}`;
  if (death != null) return `${t('worldStudio.yearRange.unknown')} / ${death}`;
  return t('common.sourceUnavailable');
}

function FactCell({ label, value }: { label: string; value: string | number | null }) {
  const { t } = useTranslation();

  return (
    <div className="ras-fact">
      <div className="ras-fact__label">{label}</div>
      <div className="ras-fact__value ras-break-anywhere">{value ?? t('common.sourceUnavailable')}</div>
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

const AUTHORING_TARGET_LABEL_KEYS = {
  avatar: 'worldStudio.target.avatar',
  profileCover: 'worldStudio.target.profileCover',
  voice: 'worldStudio.target.voice',
  greeting: 'worldStudio.target.greeting',
  dialogueExemplars: 'worldStudio.target.dialogueExemplars',
  behaviorDna: 'worldStudio.target.behaviorDna',
  description: 'worldStudio.target.description',
  contentStyle: 'worldStudio.target.contentStyle',
  publicPositioning: 'worldStudio.target.publicPositioning',
} as const;

const CREATOR_ACTION_LABEL_KEYS = {
  'review-source-facts': 'worldStudio.creatorAction.reviewSourceFacts',
  'accept-or-edit-description': 'worldStudio.creatorAction.acceptOrEditDescription',
  'provide-avatar-direction': 'worldStudio.creatorAction.provideAvatarDirection',
  'provide-profile-cover-direction': 'worldStudio.creatorAction.provideProfileCoverDirection',
  'provide-voice-profile': 'worldStudio.creatorAction.provideVoiceProfile',
  'provide-greeting': 'worldStudio.creatorAction.provideGreeting',
  'provide-dialogue-exemplars': 'worldStudio.creatorAction.provideDialogueExemplars',
  'provide-behavior-dna': 'worldStudio.creatorAction.provideBehaviorDna',
  'provide-dialogue-exemplars-and-behavior-dna': 'worldStudio.creatorAction.provideDialogueAndBehavior',
} as const;

function targetLabel(target: string, t: TFunction): string {
  const key = AUTHORING_TARGET_LABEL_KEYS[target as keyof typeof AUTHORING_TARGET_LABEL_KEYS];
  return key ? t(key) : target;
}

function reviewStatusLabel(status: CandidateReviewStatus | 'missing', t: TFunction): string {
  return t(`worldStudio.reviewStatus.${status}`);
}

function creatorActionLabel(action: string, t: TFunction): string {
  const key = CREATOR_ACTION_LABEL_KEYS[action as keyof typeof CREATOR_ACTION_LABEL_KEYS];
  return key ? t(key) : action;
}

function sourceIdentityIdLabel(skeleton: CreatorWorldCharacterSourceSkeleton, t: TFunction): string {
  if (skeleton.sourceIdentityId === 'cbdb-historical') return t('worldStudio.sourceIdentity.cbdbHistorical');
  return skeleton.sourceIdentityId || skeleton.sourceKind;
}

function SourceIdentitySection({
  character,
  skeleton,
}: {
  character: CreatorWorldCharacterDetail;
  skeleton: CreatorWorldCharacterSourceSkeleton;
}) {
  const { t } = useTranslation();

  return (
    <section className="ras-card ras-stack">
      <SectionHeading
        icon={<FileText size={17} strokeWidth={1.8} />}
        title={t('worldStudio.sourceIdentity.title')}
        badge={<StatusBadge tone="info">{sourceIdentityIdLabel(skeleton, t)}</StatusBadge>}
      />
      <div className="ras-fact-grid">
        <FactCell label={t('worldStudio.sourceIdentity.canonicalName')} value={skeleton.canonicalName} />
        <FactCell label={t('worldStudio.sourceIdentity.aliases')} value={skeleton.aliases.join(' / ') || null} />
        <FactCell label={t('worldStudio.sourceIdentity.birthDeath')} value={yearRange(skeleton, t)} />
        <FactCell label={t('worldStudio.sourceIdentity.sourceEntity')} value={skeleton.sourceEntityId} />
        <FactCell label={t('worldStudio.sourceIdentity.characterId')} value={character.id} />
        <FactCell label={t('worldStudio.sourceIdentity.state')} value={character.state || null} />
      </div>
    </section>
  );
}

type EvidenceFacet = {
  key: string;
  title: string;
  description: string;
  count: number;
  items: readonly string[];
  empty: string;
};

function buildEvidenceFacets(skeleton: CreatorWorldCharacterSourceSkeleton, t: TFunction): EvidenceFacet[] {
  const facets: EvidenceFacet[] = [
    {
      key: 'timeline',
      title: t('worldStudio.sourceEvidence.timelineTitle'),
      description: t('worldStudio.sourceEvidence.timelineDescription'),
      count: skeleton.sourceFacts.timelineFactCount,
      items: skeleton.sourceFacts.representativeFacts.slice(0, 5),
      empty: t('worldStudio.sourceEvidence.noTimelineFacts'),
    },
  ];
  if (skeleton.sourceFacts.officeFacts.length > 0) {
    facets.push({
      key: 'office-records',
      title: t('worldStudio.sourceEvidence.officeRecordsTitle'),
      description: t('worldStudio.sourceEvidence.officeRecordsDescription'),
      count: skeleton.sourceFacts.officeFacts.length,
      items: skeleton.sourceFacts.officeFacts.slice(0, 5).map((fact) =>
        fact.officeName ? `${fact.officeName}: ${fact.summary}` : fact.summary,
      ),
      empty: t('worldStudio.sourceEvidence.noOfficeRecords'),
    });
  }
  if (skeleton.sourceFacts.relationships.length > 0) {
    facets.push({
      key: 'relationships',
      title: t('worldStudio.sourceEvidence.relationshipRecordsTitle'),
      description: t('worldStudio.sourceEvidence.relationshipRecordsDescription'),
      count: skeleton.sourceFacts.relationships.length,
      items: skeleton.sourceFacts.relationships.map((relationship) =>
        `${relationship.targetName}: ${relationship.relationType}${
          relationship.context ? ` (${relationship.context})` : ''
        }`,
      ),
      empty: t('worldStudio.sourceEvidence.noRelationshipRecords'),
    });
  }
  if (skeleton.sourceRefs.length > 0) {
    facets.push({
      key: 'source-refs',
      title: t('worldStudio.sourceEvidence.sourceRefsTitle'),
      description: t('worldStudio.sourceEvidence.sourceRefsDescription'),
      count: skeleton.sourceRefs.length,
      items: skeleton.sourceRefs.map((ref) => sourceRefLabel(ref)),
      empty: t('worldStudio.sourceEvidence.noSourceRefs'),
    });
  }
  return facets;
}

function SourceEvidenceSection({ skeleton }: { skeleton: CreatorWorldCharacterSourceSkeleton }) {
  const { t } = useTranslation();
  const facets = buildEvidenceFacets(skeleton, t);

  return (
    <section className="ras-card ras-stack">
      <SectionHeading
        icon={<BookOpen size={17} strokeWidth={1.8} />}
        title={t('worldStudio.sourceEvidence.title')}
        badge={
          <StatusBadge tone="neutral">
            {t('worldStudio.sourceEvidence.factBadge', { count: skeleton.sourceFacts.timelineFactCount })}
          </StatusBadge>
        }
      />
      <div className="ras-fact-grid">
        <FactCell label={t('worldStudio.sourceEvidence.sourceKind')} value={skeleton.sourceKind} />
        <FactCell label={t('worldStudio.sourceEvidence.timelineFacts')} value={skeleton.sourceFacts.timelineFactCount} />
        <FactCell label={t('worldStudio.sourceEvidence.relationships')} value={skeleton.sourceFacts.relationships.length} />
        <FactCell label={t('worldStudio.sourceEvidence.package')} value={skeleton.packageId || null} />
      </div>
      <div className="ras-evidence-facets">
        {facets.map((facet) => (
          <div key={facet.key} className="ras-evidence-facet">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="m-0 text-sm font-semibold text-[var(--nimi-text-primary)]">{facet.title}</h3>
                <p className="m-0 mt-1 text-[length:var(--nimi-type-body-sm-size)] leading-5 text-[var(--nimi-text-muted)]">
                  {facet.description}
                </p>
              </div>
              <StatusBadge tone="neutral">{facet.count}</StatusBadge>
            </div>
            <TextList items={facet.items} empty={facet.empty} />
          </div>
        ))}
      </div>
    </section>
  );
}

function ReadinessBlockersSection({ skeleton }: { skeleton: CreatorWorldCharacterSourceSkeleton }) {
  const { t } = useTranslation();

  return (
    <section className="ras-card ras-stack">
      <SectionHeading
        icon={<ShieldAlert size={17} strokeWidth={1.8} />}
        title={t('worldStudio.readinessBlockers.title')}
        badge={<StatusBadge tone="warning">{skeleton.runtimeReadiness.roleplayRuntime}</StatusBadge>}
      />
      <InlineAlert tone="warning">{t('worldStudio.readinessBlockers.summary')}</InlineAlert>
      <div className="flex flex-wrap gap-2">
        {skeleton.missingFields.map((field) => (
          <StatusBadge key={field} tone="warning">{targetLabel(field, t)}</StatusBadge>
        ))}
      </div>
      <TextList
        items={skeleton.runtimeReadiness.requiredCreatorActions.map((action) => creatorActionLabel(action, t))}
        empty={t('worldStudio.readinessBlockers.noCreatorActions')}
      />
      <details className="ras-technical-details">
        <summary>{t('worldStudio.readinessBlockers.realmReason')}</summary>
        <p className="ras-break-anywhere m-0 mt-2 text-[length:var(--nimi-type-body-sm-size)] leading-5 text-[var(--nimi-text-secondary)]">
          {skeleton.runtimeReadiness.reason}
        </p>
      </details>
    </section>
  );
}

type GenerationDirective = {
  target: string;
  sourceBasis: string;
  mustNotClaim: string;
  creatorDecision: string;
  draftDirection: string;
};

function generationDirectiveForTarget(
  target: string,
  skeleton: CreatorWorldCharacterSourceSkeleton,
  t: TFunction,
): GenerationDirective {
  const brief = skeleton.completionBrief;
  const directives: Record<string, GenerationDirective> = {
    avatar: {
      target,
      sourceBasis: t('worldStudio.generationDirectives.avatar.sourceBasis'),
      mustNotClaim: t('worldStudio.generationDirectives.avatar.mustNotClaim'),
      creatorDecision: t('worldStudio.generationDirectives.avatar.creatorDecision'),
      draftDirection: brief.avatarBrief,
    },
    profileCover: {
      target,
      sourceBasis: t('worldStudio.generationDirectives.profileCover.sourceBasis'),
      mustNotClaim: t('worldStudio.generationDirectives.profileCover.mustNotClaim'),
      creatorDecision: t('worldStudio.generationDirectives.profileCover.creatorDecision'),
      draftDirection: t('worldStudio.generationDirectives.profileCover.draftDirection'),
    },
    voice: {
      target,
      sourceBasis: t('worldStudio.generationDirectives.voice.sourceBasis'),
      mustNotClaim: t('worldStudio.generationDirectives.voice.mustNotClaim'),
      creatorDecision: t('worldStudio.generationDirectives.voice.creatorDecision'),
      draftDirection: brief.voiceBrief,
    },
    greeting: {
      target,
      sourceBasis: t('worldStudio.generationDirectives.greeting.sourceBasis'),
      mustNotClaim: t('worldStudio.generationDirectives.greeting.mustNotClaim'),
      creatorDecision: t('worldStudio.generationDirectives.greeting.creatorDecision'),
      draftDirection: brief.greetingBrief,
    },
    dialogueExemplars: {
      target,
      sourceBasis: t('worldStudio.generationDirectives.dialogueExemplars.sourceBasis'),
      mustNotClaim: t('worldStudio.generationDirectives.dialogueExemplars.mustNotClaim'),
      creatorDecision: t('worldStudio.generationDirectives.dialogueExemplars.creatorDecision'),
      draftDirection: brief.contentStyle,
    },
    behaviorDna: {
      target,
      sourceBasis: t('worldStudio.generationDirectives.behaviorDna.sourceBasis'),
      mustNotClaim: t('worldStudio.generationDirectives.behaviorDna.mustNotClaim'),
      creatorDecision: t('worldStudio.generationDirectives.behaviorDna.creatorDecision'),
      draftDirection: brief.dnaBrief,
    },
  };
  return directives[target] || {
    target,
    sourceBasis: brief.description,
    mustNotClaim: t('worldStudio.generationDirectives.generic.mustNotClaim'),
    creatorDecision: t('worldStudio.generationDirectives.generic.creatorDecision'),
    draftDirection: brief.positioning,
  };
}

function GenerationDirectivesSection({
  skeleton,
  context,
}: {
  skeleton: CreatorWorldCharacterSourceSkeleton;
  context: CreatorWorldCharacterAuthoringGenerationContext;
}) {
  const { t } = useTranslation();
  const directives = context.requiredTargets.map((target) => generationDirectiveForTarget(target, skeleton, t));

  return (
    <section className="ras-card ras-stack">
      <SectionHeading
        icon={<ClipboardList size={17} strokeWidth={1.8} />}
        title={t('worldStudio.generationDirectives.title')}
        badge={<StatusBadge tone="neutral">{t('worldStudio.generationDirectives.badge')}</StatusBadge>}
      />
      <div className="ras-directive-grid">
        {directives.map((directive) => (
          <div key={directive.target} className="ras-directive">
            <div className="flex items-center justify-between gap-2">
              <h3 className="m-0 text-sm font-semibold text-[var(--nimi-text-primary)]">
                {targetLabel(directive.target, t)}
              </h3>
              <StatusBadge tone="neutral">{directive.target}</StatusBadge>
            </div>
            <div className="ras-directive__body">
              <FactCell label={t('worldStudio.generationDirectives.sourceBasis')} value={directive.sourceBasis} />
              <FactCell label={t('worldStudio.generationDirectives.mustNotClaim')} value={directive.mustNotClaim} />
              <FactCell label={t('worldStudio.generationDirectives.creatorDecision')} value={directive.creatorDecision} />
              <FactCell label={t('worldStudio.generationDirectives.draftDirection')} value={directive.draftDirection} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

type StatusTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';
type CandidateReviewStatus = CreatorWorldCharacterAuthoringDraftCandidate['reviewStatus'];
type CandidateValue = CreatorWorldCharacterAuthoringDraftCandidate['value'];

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

function batchStatusTone(status: CreatorWorldCharacterAuthoringDraftBatch['status']): StatusTone {
  if (status === 'applied') return 'success';
  if (status === 'failed') return 'danger';
  if (status === 'partially_applied') return 'warning';
  return 'info';
}

function appliedTargetCount(context: CreatorWorldCharacterAuthoringGenerationContext): number {
  return context.targetStatuses.filter((status) => status.latestReviewStatus === 'applied' || Boolean(status.appliedAt)).length;
}

function candidateCount(batches: readonly CreatorWorldCharacterAuthoringDraftBatch[]): number {
  return batches.reduce((count, batch) => count + batch.candidates.length, 0);
}

function isCandidateValue(value: unknown): value is CandidateValue {
  return Boolean(value && typeof value === 'object' && 'kind' in value);
}

function effectiveCandidateValue(candidate: CreatorWorldCharacterAuthoringDraftCandidate): CandidateValue {
  if (candidate.reviewStatus === 'edited' && isCandidateValue(candidate.editedValue)) {
    return candidate.editedValue;
  }
  return candidate.value;
}

function compactTimestamp(value: string | null | undefined, t: TFunction): string {
  return value?.trim() || t('common.notSet');
}

function recordPreview(record: unknown, t: TFunction): string {
  if (!record || typeof record !== 'object' || Array.isArray(record)) {
    return t('common.notSet');
  }
  const entries = Object.entries(record)
    .filter(([, value]) => value != null && value !== '')
    .slice(0, 4)
    .map(([key, value]) => `${key}: ${String(value)}`);
  return entries.length > 0 ? entries.join(' / ') : t('common.notSet');
}

function candidateValuePreview(candidate: CreatorWorldCharacterAuthoringDraftCandidate, t: TFunction): string {
  const value = effectiveCandidateValue(candidate);
  if (value.kind === 'text') return value.text?.trim() || t('worldStudio.candidate.textMissing');
  if (value.kind === 'media') {
    const media = value.media;
    if (!media) return t('worldStudio.candidate.mediaMissing');
    return [
      t('worldStudio.candidate.media.resource', { value: media.resourceId }),
      t('worldStudio.candidate.media.url', { value: media.url }),
      t('worldStudio.candidate.media.model', { value: media.model }),
      t('worldStudio.candidate.media.size', { width: media.width, height: media.height }),
      t('worldStudio.candidate.media.mime', { value: media.mime }),
      t('worldStudio.candidate.media.moderation', {
        value: `${media.moderation.status}${media.moderation.reason ? ` / ${media.moderation.reason}` : ''}`,
      }),
      t('worldStudio.candidate.media.prompt', { value: media.prompt }),
    ].join('\n');
  }
  if (value.kind === 'voice') {
    const voice = value.voice;
    if (!voice) return t('worldStudio.candidate.voiceMissing');
    return [
      t('worldStudio.candidate.voice.historicalClaim', { value: voice.historicalClaim }),
      t('worldStudio.candidate.voice.narrationDirection', { value: voice.narrationDirection }),
      t('worldStudio.candidate.voice.providerVoice', { value: voice.providerVoiceRef || t('common.notSet') }),
      t('worldStudio.candidate.voice.voiceAsset', { value: voice.voiceAssetResourceId || t('common.notSet') }),
      t('worldStudio.candidate.voice.speechModel', { value: voice.speechModelId || t('common.notSet') }),
      t('worldStudio.candidate.voice.routePolicy', { value: voice.speechRoutePolicy || t('common.notSet') }),
    ].join('\n');
  }
  if (value.kind === 'dialogue') {
    return value.dialogue?.exemplars.join('\n') || t('worldStudio.candidate.dialogueMissing');
  }
  if (value.kind === 'behavior') {
    return value.behavior?.directives.join('\n') || t('worldStudio.candidate.behaviorMissing');
  }
  return t('worldStudio.candidate.valueMissing');
}

function sourceRefLabel(ref: CreatorWorldCharacterAuthoringDraftCandidate['sourceRefs'][number]): string {
  return [ref.label, ref.sourceRef, ref.factPath].filter(Boolean).join(' / ');
}

function SourceRefsList({
  refs,
  empty,
  limit,
}: {
  refs: readonly CreatorWorldCharacterAuthoringDraftCandidate['sourceRefs'][number][];
  empty: string;
  limit?: number;
}) {
  const { t } = useTranslation();
  if (refs.length === 0) {
    return <p className="m-0 text-[length:var(--nimi-type-body-sm-size)] text-[var(--nimi-text-muted)]">{empty}</p>;
  }
  const visibleRefs = limit ? refs.slice(0, limit) : refs;
  const remainingCount = Math.max(refs.length - visibleRefs.length, 0);
  return (
    <div className="flex flex-wrap gap-2">
      {visibleRefs.map((ref, index) => (
        <StatusBadge
          key={`${ref.sourceRef}:${ref.factPath || index}`}
          tone="neutral"
          className="max-w-full whitespace-normal text-left"
        >
          {sourceRefLabel(ref)}
        </StatusBadge>
      ))}
      {remainingCount > 0 ? (
        <StatusBadge tone="neutral">{t('worldStudio.sourceRefs.more', { count: remainingCount })}</StatusBadge>
      ) : null}
    </div>
  );
}

function CharacterAuthoringOverview({
  character,
  generatingDraft,
  onGenerateDraft,
}: {
  character: CreatorWorldCharacterDetail;
  generatingDraft: boolean;
  onGenerateDraft: () => void;
}) {
  const { t } = useTranslation();
  const applied = appliedTargetCount(character.authoringContext);
  const required = character.authoringContext.requiredTargets.length;
  const missing = Math.max(required - applied, 0);

  return (
    <section className="ras-card ras-card--hero ras-authoring-overview">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge tone={character.sourceSkeleton.runtimeReadiness.roleplayRuntime === 'blocked' ? 'warning' : 'success'}>
            {character.sourceSkeleton.runtimeReadiness.roleplayRuntime}
          </StatusBadge>
          <StatusBadge tone="neutral">{sourceIdentityIdLabel(character.sourceSkeleton, t)}</StatusBadge>
        </div>
        <h2 className="m-0 mt-3 text-xl font-bold text-[var(--nimi-text-primary)]">
          {t('worldStudio.authoringOverview.title')}
        </h2>
        <p className="m-0 mt-1 max-w-[72ch] text-[length:var(--nimi-type-body-sm-size)] leading-6 text-[var(--nimi-text-secondary)]">
          {t('worldStudio.authoringOverview.description')}
        </p>
      </div>
      <div className="ras-authoring-overview__metrics">
        <FactCell label={t('worldStudio.authoringOverview.appliedTargets')} value={`${applied}/${required}`} />
        <FactCell label={t('worldStudio.authoringOverview.blockers')} value={missing} />
        <FactCell label={t('worldStudio.authoringOverview.draftBatches')} value={character.authoringDraftBatches.length} />
        <FactCell label={t('worldStudio.authoringOverview.candidates')} value={candidateCount(character.authoringDraftBatches)} />
      </div>
      <div className="flex flex-wrap justify-end gap-2">
        <Button
          tone="primary"
          loading={generatingDraft}
          leadingIcon={<RefreshCw size={15} />}
          onClick={onGenerateDraft}
        >
          {t('worldStudio.draftBatches.generate')}
        </Button>
      </div>
    </section>
  );
}

function finalStateSummaryForTarget(
  target: string,
  context: CreatorWorldCharacterAuthoringGenerationContext,
  t: TFunction,
): string {
  const settings = context.currentFinalState.settings;
  if (target === 'avatar') {
    return context.currentFinalState.media.avatarResourceId || context.currentFinalState.media.avatarUrl || t('common.notSet');
  }
  if (target === 'profileCover') {
    return context.currentFinalState.media.profileCoverResourceId || context.currentFinalState.media.profileCoverUrl || t('common.notSet');
  }
  if (target === 'voice') return recordPreview(context.currentFinalState.voice.voice, t);
  if (target === 'greeting') return settings.greeting?.trim() || t('common.notSet');
  if (target === 'description') return settings.description?.trim() || t('common.notSet');
  if (target === 'contentStyle') return settings.communication.contentStyle?.trim() || t('common.notSet');
  if (target === 'publicPositioning') return settings.positioning.positioning?.trim() || t('common.notSet');
  return t('worldStudio.authoringTargets.finalStateRequiresAppliedRules');
}

function AuthoringTargetsSection({
  context,
}: {
  context: CreatorWorldCharacterAuthoringGenerationContext;
}) {
  const { t } = useTranslation();
  const statusByTarget = new Map(context.targetStatuses.map((status) => [status.targetKey, status]));
  return (
    <section className="ras-card ras-stack">
      <SectionHeading
        icon={<Bot size={17} strokeWidth={1.8} />}
        title={t('worldStudio.authoringTargets.title')}
        badge={
          <StatusBadge tone="neutral">
            {t('worldStudio.authoringTargets.requiredBadge', { count: context.requiredTargets.length })}
          </StatusBadge>
        }
      />
      <div className="ras-target-list">
        {context.requiredTargets.map((target) => {
          const status = statusByTarget.get(target);
          const reviewStatus = status?.latestReviewStatus || 'missing';
          return (
            <div key={target} className="ras-target-row">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="m-0 text-sm font-semibold text-[var(--nimi-text-primary)]">
                    {targetLabel(target, t)}
                  </h3>
                  <StatusBadge tone={targetStatusTone(reviewStatus)}>{reviewStatusLabel(reviewStatus, t)}</StatusBadge>
                </div>
                <div className="ras-target-row__meta">
                  {status?.latestCandidateId
                    ? t('worldStudio.authoringTargets.latestCandidate', { candidateId: status.latestCandidateId })
                    : t('worldStudio.authoringTargets.noCandidate')}
                </div>
              </div>
              <div className="ras-target-row__final">
                <div className="ras-fact__label">{t('worldStudio.authoringTargets.finalState')}</div>
                <div className="ras-break-anywhere text-sm font-semibold text-[var(--nimi-text-primary)]">
                  {finalStateSummaryForTarget(target, context, t)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="ras-fact-grid">
        <FactCell label={t('worldStudio.authoringTargets.avatarResource')} value={context.currentFinalState.media.avatarResourceId || null} />
        <FactCell label={t('worldStudio.authoringTargets.profileCoverResource')} value={context.currentFinalState.media.profileCoverResourceId || null} />
        <FactCell label={t('worldStudio.authoringTargets.voiceState')} value={recordPreview(context.currentFinalState.voice.voice, t)} />
      </div>
      <div className="ras-stack-tight">
        <h3 className="m-0 text-sm font-semibold text-[var(--nimi-text-primary)]">
          {t('worldStudio.authoringTargets.groundingRefs')}
        </h3>
        <SourceRefsList refs={context.groundingRefs} empty={t('worldStudio.authoringTargets.noGroundingRefs')} limit={12} />
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
  candidate: CreatorWorldCharacterAuthoringDraftCandidate;
  reviewingCandidateId: string | null;
  reviewingStatus: 'accepted' | 'rejected' | null;
  onReviewCandidate: (batchId: string, candidateId: string, status: 'accepted' | 'rejected') => void;
}) {
  const { t } = useTranslation();
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
        <FactCell label={t('worldStudio.candidate.promptDigest')} value={candidate.promptDigestSha256} />
        <FactCell label={t('worldStudio.candidate.runtimeTrace')} value={candidate.runtimeTraceId} />
        <FactCell label={t('worldStudio.candidate.generated')} value={compactTimestamp(candidate.generatedAt, t)} />
        <FactCell label={t('worldStudio.candidate.reviewed')} value={compactTimestamp(candidate.reviewedAt, t)} />
        <FactCell label={t('worldStudio.candidate.reviewer')} value={candidate.reviewerId || null} />
        <FactCell label={t('worldStudio.candidate.applied')} value={compactTimestamp(candidate.appliedAt, t)} />
      </div>
      <FieldShell label={t('worldStudio.candidate.valueLabel')}>
        <TextareaField value={candidateValuePreview(candidate, t)} readOnly />
      </FieldShell>
      <div className="ras-stack-tight">
        <h3 className="m-0 text-sm font-semibold text-[var(--nimi-text-primary)]">
          {t('worldStudio.sourceRefs.title')}
        </h3>
        <SourceRefsList refs={candidate.sourceRefs} empty={t('worldStudio.sourceRefs.empty')} />
      </div>
      <div className="ras-stack-tight">
        <h3 className="m-0 text-sm font-semibold text-[var(--nimi-text-primary)]">
          {t('worldStudio.provenance.title')}
        </h3>
        <TextList
          items={value.provenance.map((item) => `${item.category}: ${item.summary} (${item.refs.join(', ')})`)}
          empty={t('worldStudio.provenance.empty')}
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
          {t('worldStudio.candidate.accept')}
        </Button>
        <Button
          tone="danger"
          disabled={reviewLocked}
          loading={isRejecting}
          leadingIcon={<X size={15} />}
          onClick={() => onReviewCandidate(batchId, candidate.id, 'rejected')}
        >
          {t('worldStudio.candidate.reject')}
        </Button>
      </div>
    </div>
  );
}

function DraftBatchesSection({
  batches,
  draftActionError,
  draftGenerationError,
  reviewingCandidateId,
  reviewingStatus,
  applyingBatchId,
  onReviewCandidate,
  onApplyBatch,
}: {
  batches: readonly CreatorWorldCharacterAuthoringDraftBatch[];
  draftActionError: boolean;
  draftGenerationError: boolean;
  reviewingCandidateId: string | null;
  reviewingStatus: 'accepted' | 'rejected' | null;
  applyingBatchId: string | null;
  onReviewCandidate: (batchId: string, candidateId: string, status: 'accepted' | 'rejected') => void;
  onApplyBatch: (batchId: string) => void;
}) {
  const { t } = useTranslation();

  return (
    <section className="ras-card ras-stack">
      {draftActionError ? <InlineAlert tone="danger">{t('worldStudio.draftBatches.actionFailed')}</InlineAlert> : null}
      {draftGenerationError ? <InlineAlert tone="danger">{t('worldStudio.draftBatches.generationFailed')}</InlineAlert> : null}
      <SectionHeading
        icon={<ClipboardList size={17} strokeWidth={1.8} />}
        title={t('worldStudio.draftBatches.title')}
        badge={
          <StatusBadge tone="neutral">
            {t('worldStudio.draftBatches.countBadge', { count: batches.length })}
          </StatusBadge>
        }
      />
      {batches.length === 0 ? (
        <EmptyState
          title={t('worldStudio.draftBatches.emptyTitle')}
          description={t('worldStudio.draftBatches.emptyDescription')}
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
                      {t('worldStudio.draftBatches.skeletonByCreator', {
                        skeletonId: batch.skeletonId,
                        createdBy: batch.createdBy,
                      })}
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
                      {t('worldStudio.draftBatches.applyAccepted')}
                    </Button>
                  </div>
                </div>
                <div className="ras-fact-grid">
                  <FactCell label={t('worldStudio.draftBatches.created')} value={compactTimestamp(batch.createdAt, t)} />
                  <FactCell label={t('worldStudio.draftBatches.updated')} value={compactTimestamp(batch.updatedAt, t)} />
                  <FactCell label={t('worldStudio.draftBatches.applied')} value={compactTimestamp(batch.appliedAt, t)} />
                  <FactCell label={t('worldStudio.draftBatches.candidates')} value={batch.candidates.length} />
                  <FactCell label={t('worldStudio.draftBatches.runtimeApp')} value={String(batch.metadata?.runtimeAppId || t('common.notSet'))} />
                  <FactCell label={t('worldStudio.draftBatches.surface')} value={String(batch.metadata?.surfaceId || t('common.notSet'))} />
                </div>
                {hasPending ? <InlineAlert tone="warning">{t('worldStudio.draftBatches.pendingBlocksApply')}</InlineAlert> : null}
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
  character,
  draft,
  setDraft,
  saveError,
  saveSuccess,
}: {
  character: CreatorWorldCharacterDetail;
  draft: CreatorWorldCharacterDraft;
  setDraft: (updater: (current: CreatorWorldCharacterDraft) => CreatorWorldCharacterDraft) => void;
  saveError: boolean;
  saveSuccess: boolean;
}) {
  const { t } = useTranslation();
  const readinessLabel = (ready: boolean) =>
    ready ? t('worldStudio.settings.ready') : t('worldStudio.settings.missing');

  return (
    <section className="ras-card ras-stack">
      {saveError ? <InlineAlert tone="danger">{t('worldStudio.settings.saveFailed')}</InlineAlert> : null}
      {saveSuccess ? <InlineAlert tone="success">{t('worldStudio.settings.saveSucceeded')}</InlineAlert> : null}
      <SectionHeading
        icon={<Bot size={17} strokeWidth={1.8} />}
        title={t('worldStudio.settings.title')}
        badge={
          <StatusBadge tone="neutral">
            {character.chatReadiness.profile.defaultVoiceReference || t('worldStudio.settings.voiceNotSet')}
          </StatusBadge>
        }
      />
      <div className="ras-fact-grid">
        <FactCell label={t('worldStudio.settings.handle')} value={`@${character.handle}`} />
        <FactCell label={t('worldStudio.settings.world')} value={character.worldId} />
        <FactCell label={t('worldStudio.settings.profileMediaReady')} value={readinessLabel(character.chatReadiness.gates.profileMediaReady)} />
        <FactCell label={t('worldStudio.settings.voiceReady')} value={readinessLabel(character.chatReadiness.gates.voiceReferenceReady)} />
      </div>
      <FieldShell label={t('worldStudio.settings.displayName')}>
        <TextField value={draft.displayName} onChange={(event) => setDraft((current) => ({ ...current, displayName: event.currentTarget.value }))} />
      </FieldShell>
      <FieldShell label={t('worldStudio.settings.description')}>
        <TextareaField value={draft.description} onChange={(event) => setDraft((current) => ({ ...current, description: event.currentTarget.value }))} />
      </FieldShell>
      <FieldShell label={t('worldStudio.settings.greeting')}>
        <TextareaField value={draft.greeting} onChange={(event) => setDraft((current) => ({ ...current, greeting: event.currentTarget.value }))} />
      </FieldShell>
      <div className="grid gap-4 lg:grid-cols-2">
        <FieldShell label={t('worldStudio.settings.contentStyle')}>
          <TextField value={draft.contentStyle} onChange={(event) => setDraft((current) => ({ ...current, contentStyle: event.currentTarget.value }))} />
        </FieldShell>
        <FieldShell label={t('worldStudio.settings.targetAudience')}>
          <TextField value={draft.targetAudience} onChange={(event) => setDraft((current) => ({ ...current, targetAudience: event.currentTarget.value }))} />
        </FieldShell>
      </div>
      <FieldShell label={t('worldStudio.settings.publicPositioning')}>
        <TextareaField value={draft.positioning} onChange={(event) => setDraft((current) => ({ ...current, positioning: event.currentTarget.value }))} />
      </FieldShell>
      <div className="grid gap-4 lg:grid-cols-2">
        <FieldShell label={t('worldStudio.settings.avatarUrl')}>
          <TextField value={draft.avatarUrl} onChange={(event) => setDraft((current) => ({ ...current, avatarUrl: event.currentTarget.value }))} />
        </FieldShell>
        <FieldShell label={t('worldStudio.settings.profileCoverUrl')}>
          <TextField value={draft.profileCoverUrl} onChange={(event) => setDraft((current) => ({ ...current, profileCoverUrl: event.currentTarget.value }))} />
        </FieldShell>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <FieldShell label={t('worldStudio.settings.voiceId')}>
          <TextField value={draft.voiceId} onChange={(event) => setDraft((current) => ({ ...current, voiceId: event.currentTarget.value }))} />
        </FieldShell>
        <FieldShell label={t('worldStudio.settings.speechModelId')}>
          <TextField value={draft.speechModelId} onChange={(event) => setDraft((current) => ({ ...current, speechModelId: event.currentTarget.value }))} />
        </FieldShell>
        <FieldShell label={t('worldStudio.settings.speechRoutePolicy')}>
          <TextField
            value={draft.speechRoutePolicy}
            placeholder={t('worldStudio.settings.speechRoutePlaceholder')}
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
      <FieldShell label={t('worldStudio.settings.voiceDescription')}>
        <TextareaField value={draft.voiceDescription} onChange={(event) => setDraft((current) => ({ ...current, voiceDescription: event.currentTarget.value }))} />
      </FieldShell>
    </section>
  );
}

function WorldCharacterEditor({
  character,
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
  character: CreatorWorldCharacterDetail;
  draft: CreatorWorldCharacterDraft;
  setDraft: (updater: (current: CreatorWorldCharacterDraft) => CreatorWorldCharacterDraft) => void;
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
      <CharacterAuthoringOverview
        character={character}
        generatingDraft={generatingDraft}
        onGenerateDraft={onGenerateDraft}
      />
      <div className="ras-character-workbench">
        <div className="ras-character-workbench__main">
          <AuthoringTargetsSection context={character.authoringContext} />
          <DraftBatchesSection
            batches={character.authoringDraftBatches}
            draftActionError={draftActionError}
            draftGenerationError={draftGenerationError}
            reviewingCandidateId={reviewingCandidateId}
            reviewingStatus={reviewingStatus}
            applyingBatchId={applyingBatchId}
            onReviewCandidate={onReviewCandidate}
            onApplyBatch={onApplyBatch}
          />
          <GenerationDirectivesSection skeleton={character.sourceSkeleton} context={character.authoringContext} />
          <SettingsEditorSection
            character={character}
            draft={draft}
            setDraft={setDraft}
            saveError={saveError}
            saveSuccess={saveSuccess}
          />
        </div>
        <aside className="ras-character-workbench__side">
          <SourceIdentitySection character={character} skeleton={character.sourceSkeleton} />
          <SourceEvidenceSection skeleton={character.sourceSkeleton} />
          <ReadinessBlockersSection skeleton={character.sourceSkeleton} />
        </aside>
      </div>
    </div>
  );
}
