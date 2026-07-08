import { useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Boxes, ChevronLeft, RefreshCw, Users } from 'lucide-react';
import {
  Button,
  EmptyState,
  InlineAlert,
  LoadingSkeleton,
  Statistic,
  StatisticGroup,
  StatusBadge,
  Surface,
} from '@nimiplatform/kit/ui';
import {
  createCreatorWorldCore,
  getCreatorWorld,
  getCreatorWorldCharacterCore,
  getCreatorWorldCharacterDetail,
  getCreatorWorldWorkbench,
  listCreatorWorlds,
  replaceCreatorWorldCharacterCore,
  replaceCreatorWorldCore,
} from './world-core-client.js';
import type { CreatorWorldCharacterSummary, CreatorWorldSummary } from './world-core-read-model.js';

function worldListQueryKey() {
  return ['realm-world-studio', 'world-core', 'list'] as const;
}
function worldWorkbenchQueryKey(worldId: string) {
  return ['realm-world-studio', 'world-core', 'detail', worldId] as const;
}

function worldCharacterQueryKey(worldId: string, characterId: string) {
  return ['realm-world-studio', 'world-character-core', worldId, characterId] as const;
}

const WRITABLE_WORLD_VISIBILITIES = ['private', 'unlisted', 'public'] as const;
const CREATE_WORLD_ORIGIN_KINDS = ['manual'] as const;
const CREATE_WORLD_CORE_TEMPLATE = JSON.stringify({
  identity: {
    name: '',
    summary: '',
  },
  profile: {
    tags: [],
  },
  ontology: {
    entityKinds: [],
    relationshipTypes: [],
  },
}, null, 2);

type WorldVisibility = typeof WRITABLE_WORLD_VISIBILITIES[number];
type OriginKind = typeof CREATE_WORLD_ORIGIN_KINDS[number];

function PageState({
  title,
  detail,
  action,
}: {
  title: string;
  detail: string;
  action?: ReactNode;
}) {
  return (
    <div className="rws-page rws-page--state">
      <EmptyState
        icon={<AlertTriangle size={20} strokeWidth={1.9} />}
        title={title}
        description={detail}
        action={action}
      />
    </div>
  );
}

function PageHeader({
  eyebrow,
  title,
  detail,
  actions,
}: {
  eyebrow: string;
  title: string;
  detail: string;
  actions?: ReactNode;
}) {
  return (
    <div className="rws-page-header">
      <div className="rws-page-header__copy">
        <span>{eyebrow}</span>
        <h1>{title}</h1>
        <p>{detail}</p>
      </div>
      {actions ? <div className="rws-page-header__actions">{actions}</div> : null}
    </div>
  );
}

function FormField({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="rws-form-field">
      <span>{label}</span>
      {children}
      {hint ? <small>{hint}</small> : null}
    </label>
  );
}

function FieldValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="rws-form-readonly">
      <span>{label}</span>
      <code>{value}</code>
    </div>
  );
}

function getFormText(form: FormData, key: string): string {
  const value = form.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

function parseCoreJson(value: string, invalidJsonMessage: string, objectRequiredMessage: string): Record<string, unknown> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new Error(invalidJsonMessage);
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(objectRequiredMessage);
  }
  return parsed as Record<string, unknown>;
}

function readVisibility(value: string, invalidMessage: string): WorldVisibility {
  if (!WRITABLE_WORLD_VISIBILITIES.includes(value as WorldVisibility)) {
    throw new Error(invalidMessage);
  }
  return value as WorldVisibility;
}

function readOriginKind(value: string, invalidMessage: string): OriginKind {
  if (!CREATE_WORLD_ORIGIN_KINDS.includes(value as OriginKind)) {
    throw new Error(invalidMessage);
  }
  return value as OriginKind;
}

function mutationErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function visibilityTone(visibility: CreatorWorldSummary['visibility']): 'neutral' | 'success' | 'warning' | 'info' {
  switch (visibility) {
    case 'public':
      return 'success';
    case 'unlisted':
      return 'warning';
    case 'system':
      return 'info';
    case 'private':
    default:
      return 'neutral';
  }
}

function WorldCard({ world }: { world: CreatorWorldSummary }) {
  const { t } = useTranslation();
  return (
    <Surface as="article" tone="card" material="glass-thin" padding="lg" className="rws-world-card">
      <div className="rws-world-card__top">
        <div className="rws-world-card__title">
          <h2>{world.name ?? t('worlds.worldNameUnavailable')}</h2>
          <p>{world.summary ?? t('worlds.incompleteSummary')}</p>
        </div>
        <StatusBadge tone={visibilityTone(world.visibility)}>{world.visibility}</StatusBadge>
      </div>
      <div className="rws-chip-row">
        <span>{t('worlds.revision', { revision: world.contentRevision })}</span>
        <span>{t('worlds.schema', { schema: world.schemaVersion })}</span>
        <span>{world.originKind}</span>
      </div>
      <div className="rws-world-card__meta">
        <span>{t('worlds.worldIdValue', { id: world.id })}</span>
        <span>{t('worlds.charactersExact', { count: world.characterCountExact ?? t('common.unavailable') })}</span>
        <span>{t('worlds.updatedAt', { date: world.updatedAt })}</span>
      </div>
      <div className="rws-world-card__actions">
        <Link className="rws-link-button rws-link-button--primary" to={`/worlds/${world.id}`}>
          {t('worlds.openWorkbench')}
        </Link>
        <Link className="rws-link-button" to={`/worlds/${world.id}/edit`}>
          {t('worlds.editWorld')}
        </Link>
      </div>
    </Surface>
  );
}

export function CreatorWorldListPage() {
  const { t } = useTranslation();
  const query = useQuery({
    queryKey: worldListQueryKey(),
    queryFn: listCreatorWorlds,
  });

  if (query.isLoading) {
    return (
      <div className="rws-page">
        <PageHeader
          eyebrow={t('worlds.eyebrow')}
          title={t('worlds.title')}
          detail={t('worlds.description')}
        />
        <Surface tone="card" padding="lg"><LoadingSkeleton lines={4} /></Surface>
      </div>
    );
  }

  if (query.isError) {
    const message = query.error instanceof Error ? query.error.message : t('worlds.loadFailedDetail');
    return (
      <PageState
        title={t('worlds.loadFailedTitle')}
        detail={message}
        action={<Button tone="primary" onClick={() => void query.refetch()}>{t('common.retry')}</Button>}
      />
    );
  }

  const worlds = query.data ?? [];

  return (
    <div className="rws-page">
      <PageHeader
        eyebrow={t('worlds.eyebrow')}
        title={t('worlds.title')}
        detail={t('worlds.description')}
        actions={
          <>
            <Button tone="secondary" leadingIcon={<RefreshCw size={16} />} onClick={() => void query.refetch()}>
              {t('common.refresh')}
            </Button>
            <Link className="rws-link-button rws-link-button--primary" to="/worlds/new">
              {t('worlds.newWorld')}
            </Link>
          </>
        }
      />
      {worlds.length === 0 ? (
        <EmptyState
          icon={<Boxes size={20} />}
          title={t('worlds.emptyTitle')}
          description={t('worlds.emptyDetail')}
        />
      ) : (
        <div className="rws-world-grid">
          {worlds.map((world) => <WorldCard key={world.id} world={world} />)}
        </div>
      )}
    </div>
  );
}

function CharacterList({ worldId, characters }: {
  worldId: string;
  characters: readonly CreatorWorldCharacterSummary[];
}) {
  const { t } = useTranslation();
  if (characters.length === 0) {
    return (
      <EmptyState
        icon={<Users size={20} />}
        title={t('worlds.charactersEmptyTitle')}
        description={t('worlds.charactersEmptyDetail')}
      />
    );
  }
  return (
    <div className="rws-character-list">
      {characters.map((character) => (
        <Surface key={character.id} as="article" tone="card" padding="md" className="rws-character-row">
          <div>
            <h3>{character.name ?? t('worlds.characterNameUnavailable')}</h3>
            <p>{character.summary ?? character.role ?? t('worlds.incompleteCharacter')}</p>
            <div className="rws-chip-row">
              <span>{character.originKind}</span>
              <span>{t('worlds.revision', { revision: character.contentRevision })}</span>
            </div>
          </div>
          <Link className="rws-link-button" to={`/worlds/${worldId}/characters/${character.id}`}>
            {t('worlds.openCharacter')}
          </Link>
        </Surface>
      ))}
    </div>
  );
}

export function CreatorWorldDetailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { worldId = '' } = useParams();
  const normalizedWorldId = worldId.trim();
  const query = useQuery({
    queryKey: worldWorkbenchQueryKey(normalizedWorldId),
    queryFn: () => getCreatorWorldWorkbench(normalizedWorldId),
    enabled: Boolean(normalizedWorldId),
  });

  if (!normalizedWorldId) {
    return <PageState title={t('worlds.noWorldTitle')} detail={t('worlds.noWorldDetail')} />;
  }

  if (query.isLoading) {
    return <PageState title={t('worlds.loadingTitle')} detail={t('worlds.loadingDetail')} />;
  }

  if (query.isError) {
    const message = query.error instanceof Error ? query.error.message : t('worlds.loadFailedDetail');
    return (
      <PageState
        title={t('worlds.detailFailedTitle')}
        detail={message}
        action={<Button tone="primary" onClick={() => void query.refetch()}>{t('common.retry')}</Button>}
      />
    );
  }

  if (!query.data) {
    return <PageState title={t('worlds.detailFailedTitle')} detail={t('worlds.noDataDetail')} />;
  }

  const { world, characters } = query.data;
  const entityCount = world.entityKinds.length > 0 ? String(world.entityKinds.length) : t('common.unavailable');
  const relationshipTypeCount = world.relationshipTypes.length > 0 ? String(world.relationshipTypes.length) : t('common.unavailable');

  return (
    <div className="rws-page">
      <button type="button" className="rws-back-link" onClick={() => navigate('/worlds')}>
        <ChevronLeft size={16} />
        {t('worlds.backToWorlds')}
      </button>
      <PageHeader
        eyebrow={t('worlds.workbenchEyebrow')}
        title={world.name ?? t('worlds.worldNameUnavailable')}
        detail={world.summary ?? t('worlds.incompleteSummary')}
        actions={
          <Link className="rws-link-button" to={`/worlds/${world.id}/edit`}>
            {t('worlds.editWorld')}
          </Link>
        }
      />
      <StatisticGroup>
        <Statistic label={t('worlds.statCharacters')} value={characters.length} tone="brand" />
        <Statistic label={t('worlds.statEntityKinds')} value={entityCount} tone="neutral" />
        <Statistic label={t('worlds.statRelationshipTypes')} value={relationshipTypeCount} tone="neutral" />
        <Statistic label={t('worlds.statRevision')} value={world.contentRevision} tone="info" />
      </StatisticGroup>
      <InlineAlert tone="info">
        {t('worlds.authorityNote')}
      </InlineAlert>
      <Surface tone="panel" padding="lg" className="rws-section">
        <div className="rws-section__heading">
          <div>
            <span>{t('worlds.worldCore')}</span>
            <h2>{t('worlds.sourceMetadata')}</h2>
          </div>
          <StatusBadge tone={visibilityTone(world.visibility)}>{world.visibility}</StatusBadge>
        </div>
        <dl className="rws-definition-grid">
          <div><dt>{t('worlds.worldId')}</dt><dd>{world.id}</dd></div>
          <div><dt>{t('worlds.contentHash')}</dt><dd>{world.contentHash}</dd></div>
          <div><dt>{t('worlds.schemaVersion')}</dt><dd>{world.schemaVersion}</dd></div>
          <div><dt>{t('worlds.origin')}</dt><dd>{world.originKind}</dd></div>
          <div><dt>{t('worlds.creatorId')}</dt><dd>{world.creatorId ?? t('common.unavailable')}</dd></div>
          <div><dt>{t('worlds.updatedAtLabel')}</dt><dd>{world.updatedAt}</dd></div>
        </dl>
      </Surface>
      <Surface tone="panel" padding="lg" className="rws-section">
        <div className="rws-section__heading">
          <div>
            <span>{t('worlds.worldCharacterCore')}</span>
            <h2>{t('worlds.worldCharactersTitle')}</h2>
          </div>
        </div>
        <CharacterList worldId={world.id} characters={characters} />
      </Surface>
    </div>
  );
}

export function CreatorWorldCharacterDetailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { worldId = '', characterId = '' } = useParams();
  const normalizedWorldId = worldId.trim();
  const normalizedCharacterId = characterId.trim();
  const query = useQuery({
    queryKey: worldCharacterQueryKey(normalizedWorldId, normalizedCharacterId),
    queryFn: () => getCreatorWorldCharacterDetail(normalizedWorldId, normalizedCharacterId),
    enabled: Boolean(normalizedWorldId && normalizedCharacterId),
  });

  if (!normalizedWorldId || !normalizedCharacterId) {
    return <PageState title={t('worlds.noCharacterTitle')} detail={t('worlds.noCharacterDetail')} />;
  }
  if (query.isLoading) {
    return <PageState title={t('worlds.characterLoadingTitle')} detail={t('worlds.characterLoadingDetail')} />;
  }
  if (query.isError) {
    const message = query.error instanceof Error ? query.error.message : t('worlds.loadFailedDetail');
    return <PageState title={t('worlds.characterFailedTitle')} detail={message} />;
  }
  if (!query.data) {
    return <PageState title={t('worlds.characterFailedTitle')} detail={t('worlds.noDataDetail')} />;
  }

  const character = query.data.character;
  const rawCorePreview = JSON.stringify(query.data.rawCore, null, 2);

  return (
    <div className="rws-page">
      <button type="button" className="rws-back-link" onClick={() => navigate(`/worlds/${normalizedWorldId}`)}>
        <ChevronLeft size={16} />
        {t('worlds.backToWorkbench')}
      </button>
      <PageHeader
        eyebrow={t('worlds.characterEyebrow')}
        title={character.name ?? t('worlds.characterNameUnavailable')}
        detail={character.summary ?? character.role ?? t('worlds.incompleteCharacter')}
      />
      <Surface tone="panel" padding="lg" className="rws-section">
        <div className="rws-section__heading">
          <div>
            <span>{t('worlds.worldCharacterCore')}</span>
            <h2>{t('worlds.sourceMetadata')}</h2>
          </div>
          <Link className="rws-link-button" to={`/worlds/${normalizedWorldId}/characters/${character.id}/edit`}>
            {t('worlds.editCharacter')}
          </Link>
        </div>
        <dl className="rws-definition-grid">
          <div><dt>{t('worlds.characterId')}</dt><dd>{character.id}</dd></div>
          <div><dt>{t('worlds.entityId')}</dt><dd>{character.entityId}</dd></div>
          <div><dt>{t('worlds.worldId')}</dt><dd>{character.worldId}</dd></div>
          <div><dt>{t('worlds.contentHash')}</dt><dd>{character.contentHash}</dd></div>
          <div><dt>{t('worlds.schemaVersion')}</dt><dd>{character.schemaVersion}</dd></div>
          <div><dt>{t('worlds.origin')}</dt><dd>{character.originKind}</dd></div>
        </dl>
        <details className="rws-technical-details">
          <summary>{t('worlds.rawCorePreview')}</summary>
          <pre>{rawCorePreview}</pre>
        </details>
      </Surface>
    </div>
  );
}

export function CreatorWorldCreatePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [draftError, setDraftError] = useState<string | null>(null);
  const mutation = useMutation({
    mutationFn: (input: Parameters<typeof createCreatorWorldCore>[0]) => createCreatorWorldCore(input),
    onSuccess: (world) => {
      void queryClient.invalidateQueries({ queryKey: worldListQueryKey() });
      navigate(`/worlds/${world.id}`);
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setDraftError(null);
    const form = new FormData(event.currentTarget);
    try {
      const core = parseCoreJson(
        getFormText(form, 'core'),
        t('worlds.coreJsonInvalid'),
        t('worlds.coreJsonObjectRequired'),
      );
      mutation.mutate({
        id: getFormText(form, 'worldId') || undefined,
        core,
        origin: { kind: readOriginKind(getFormText(form, 'originKind'), t('worlds.originKindInvalid')) },
        visibility: readVisibility(getFormText(form, 'visibility'), t('worlds.visibilityInvalid')),
      });
    } catch (error) {
      setDraftError(mutationErrorMessage(error, t('worlds.coreJsonInvalid')));
    }
  }

  const error = draftError ?? (mutation.isError ? mutationErrorMessage(mutation.error, t('worlds.writeRejectedDetail')) : null);

  return (
    <div className="rws-page">
      <button type="button" className="rws-back-link" onClick={() => navigate('/worlds')}>
        <ChevronLeft size={16} />
        {t('worlds.backToWorlds')}
      </button>
      <PageHeader
        eyebrow={t('worlds.writeEyebrow')}
        title={t('worlds.createTitle')}
        detail={t('worlds.createDetail')}
      />
      <InlineAlert tone="info">{t('worlds.writeAuthorityNote')}</InlineAlert>
      <Surface tone="panel" padding="lg" className="rws-section">
        <form className="rws-form" onSubmit={handleSubmit}>
          {error ? <InlineAlert tone="danger">{error}</InlineAlert> : null}
          <FormField label={t('worlds.formWorldId')} hint={t('worlds.formWorldIdHint')}>
            <input name="worldId" autoComplete="off" />
          </FormField>
          <div className="rws-form-grid">
            <FormField label={t('worlds.formVisibility')}>
              <select name="visibility" defaultValue="private">
                {WRITABLE_WORLD_VISIBILITIES.map((visibility) => (
                  <option key={visibility} value={visibility}>{visibility}</option>
                ))}
              </select>
            </FormField>
            <FormField label={t('worlds.formOriginKind')}>
              <select name="originKind" defaultValue="manual">
                {CREATE_WORLD_ORIGIN_KINDS.map((kind) => (
                  <option key={kind} value={kind}>{kind}</option>
                ))}
              </select>
            </FormField>
          </div>
          <FormField label={t('worlds.formCoreJson')} hint={t('worlds.formCoreJsonHint')}>
            <textarea name="core" rows={16} spellCheck={false} defaultValue={CREATE_WORLD_CORE_TEMPLATE} />
          </FormField>
          <div className="rws-form-actions">
            <Button tone="ghost" onClick={() => navigate('/worlds')}>{t('common.cancel')}</Button>
            <Button type="submit" tone="primary" loading={mutation.isPending}>
              {t('worlds.submitCreateWorld')}
            </Button>
          </div>
        </form>
      </Surface>
    </div>
  );
}

export function CreatorWorldEditPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { worldId = '' } = useParams();
  const normalizedWorldId = worldId.trim();
  const [draftError, setDraftError] = useState<string | null>(null);
  const query = useQuery({
    queryKey: ['realm-world-studio', 'world-core', 'edit', normalizedWorldId] as const,
    queryFn: () => getCreatorWorld(normalizedWorldId),
    enabled: Boolean(normalizedWorldId),
  });
  const mutation = useMutation({
    mutationFn: (input: Parameters<typeof replaceCreatorWorldCore>[1]) => replaceCreatorWorldCore(normalizedWorldId, input),
    onSuccess: (world) => {
      void queryClient.invalidateQueries({ queryKey: worldListQueryKey() });
      void queryClient.invalidateQueries({ queryKey: worldWorkbenchQueryKey(world.id) });
      navigate(`/worlds/${world.id}`);
    },
  });

  if (!normalizedWorldId) {
    return <PageState title={t('worlds.noWorldTitle')} detail={t('worlds.noWorldDetail')} />;
  }
  if (query.isLoading) {
    return <PageState title={t('worlds.loadingTitle')} detail={t('worlds.loadingDetail')} />;
  }
  if (query.isError) {
    const message = query.error instanceof Error ? query.error.message : t('worlds.loadFailedDetail');
    return <PageState title={t('worlds.editFailedTitle')} detail={message} />;
  }
  if (!query.data) {
    return <PageState title={t('worlds.editFailedTitle')} detail={t('worlds.noDataDetail')} />;
  }

  const world = query.data;
  const worldWriteBlocked = world.visibility === 'system';

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setDraftError(null);
    if (worldWriteBlocked) {
      setDraftError(t('worlds.systemWorldWriteBlocked'));
      return;
    }
    const form = new FormData(event.currentTarget);
    try {
      const core = parseCoreJson(
        getFormText(form, 'core'),
        t('worlds.coreJsonInvalid'),
        t('worlds.coreJsonObjectRequired'),
      );
      mutation.mutate({
        id: world.id,
        baseContentHash: world.contentHash,
        core,
        origin: world.origin,
        visibility: readVisibility(getFormText(form, 'visibility'), t('worlds.visibilityInvalid')),
      });
    } catch (error) {
      setDraftError(mutationErrorMessage(error, t('worlds.coreJsonInvalid')));
    }
  }

  const error = draftError ?? (mutation.isError ? mutationErrorMessage(mutation.error, t('worlds.writeRejectedDetail')) : null);

  return (
    <div className="rws-page">
      <button type="button" className="rws-back-link" onClick={() => navigate(`/worlds/${world.id}`)}>
        <ChevronLeft size={16} />
        {t('worlds.backToWorkbench')}
      </button>
      <PageHeader
        eyebrow={t('worlds.writeEyebrow')}
        title={t('worlds.editTitle')}
        detail={t('worlds.editDetail')}
      />
      <InlineAlert tone="warning">{t('worlds.baseHashWriteNote')}</InlineAlert>
      <Surface tone="panel" padding="lg" className="rws-section">
        <form key={world.contentHash} className="rws-form" onSubmit={handleSubmit}>
          {worldWriteBlocked ? <InlineAlert tone="danger">{t('worlds.systemWorldWriteBlocked')}</InlineAlert> : null}
          {error ? <InlineAlert tone="danger">{error}</InlineAlert> : null}
          <div className="rws-form-grid">
            <FieldValue label={t('worlds.worldId')} value={world.id} />
            <FieldValue label={t('worlds.baseContentHash')} value={world.contentHash} />
          </div>
          <div className="rws-form-grid">
            <FormField label={t('worlds.formVisibility')}>
              <select name="visibility" defaultValue={world.visibility}>
                {world.visibility === 'system' ? (
                  <option value="system">{t('worlds.systemVisibilityReadOnly')}</option>
                ) : null}
                {WRITABLE_WORLD_VISIBILITIES.map((visibility) => (
                  <option key={visibility} value={visibility}>{visibility}</option>
                ))}
              </select>
            </FormField>
            <FieldValue label={t('worlds.formOriginKind')} value={world.origin.kind} />
          </div>
          <FormField label={t('worlds.formCoreJson')} hint={t('worlds.formCoreJsonHint')}>
            <textarea name="core" rows={18} spellCheck={false} defaultValue={JSON.stringify(world.core, null, 2)} />
          </FormField>
          <div className="rws-form-actions">
            <Button tone="ghost" onClick={() => navigate(`/worlds/${world.id}`)}>{t('common.cancel')}</Button>
            <Button type="submit" tone="primary" loading={mutation.isPending} disabled={worldWriteBlocked}>
              {t('worlds.submitReplaceWorld')}
            </Button>
          </div>
        </form>
      </Surface>
    </div>
  );
}

export function CreatorWorldCharacterEditPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { worldId = '', characterId = '' } = useParams();
  const normalizedWorldId = worldId.trim();
  const normalizedCharacterId = characterId.trim();
  const [draftError, setDraftError] = useState<string | null>(null);
  const query = useQuery({
    queryKey: ['realm-world-studio', 'world-character-core', 'edit', normalizedWorldId, normalizedCharacterId] as const,
    queryFn: async () => {
      const [world, character] = await Promise.all([
        getCreatorWorld(normalizedWorldId),
        getCreatorWorldCharacterCore(normalizedWorldId, normalizedCharacterId),
      ]);
      return { world, character };
    },
    enabled: Boolean(normalizedWorldId && normalizedCharacterId),
  });
  const mutation = useMutation({
    mutationFn: (input: Parameters<typeof replaceCreatorWorldCharacterCore>[2]) =>
      replaceCreatorWorldCharacterCore(normalizedWorldId, normalizedCharacterId, input),
    onSuccess: (character) => {
      void queryClient.invalidateQueries({ queryKey: worldWorkbenchQueryKey(character.worldId) });
      void queryClient.invalidateQueries({ queryKey: worldCharacterQueryKey(character.worldId, character.id) });
      navigate(`/worlds/${character.worldId}/characters/${character.id}`);
    },
  });

  if (!normalizedWorldId || !normalizedCharacterId) {
    return <PageState title={t('worlds.noCharacterTitle')} detail={t('worlds.noCharacterDetail')} />;
  }
  if (query.isLoading) {
    return <PageState title={t('worlds.characterLoadingTitle')} detail={t('worlds.characterLoadingDetail')} />;
  }
  if (query.isError) {
    const message = query.error instanceof Error ? query.error.message : t('worlds.loadFailedDetail');
    return <PageState title={t('worlds.characterEditFailedTitle')} detail={message} />;
  }
  if (!query.data) {
    return <PageState title={t('worlds.characterEditFailedTitle')} detail={t('worlds.noDataDetail')} />;
  }

  const { world, character } = query.data;
  const worldWriteBlocked = world.visibility === 'system';

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setDraftError(null);
    if (worldWriteBlocked) {
      setDraftError(t('worlds.systemWorldWriteBlocked'));
      return;
    }
    const form = new FormData(event.currentTarget);
    try {
      const core = parseCoreJson(
        getFormText(form, 'core'),
        t('worlds.coreJsonInvalid'),
        t('worlds.coreJsonObjectRequired'),
      );
      mutation.mutate({
        id: character.id,
        baseContentHash: character.contentHash,
        core,
        entityId: getFormText(form, 'entityId'),
        origin: character.origin,
      });
    } catch (error) {
      setDraftError(mutationErrorMessage(error, t('worlds.coreJsonInvalid')));
    }
  }

  const error = draftError ?? (mutation.isError ? mutationErrorMessage(mutation.error, t('worlds.writeRejectedDetail')) : null);

  return (
    <div className="rws-page">
      <button type="button" className="rws-back-link" onClick={() => navigate(`/worlds/${normalizedWorldId}/characters/${character.id}`)}>
        <ChevronLeft size={16} />
        {t('worlds.backToCharacter')}
      </button>
      <PageHeader
        eyebrow={t('worlds.writeEyebrow')}
        title={t('worlds.characterEditTitle')}
        detail={t('worlds.characterEditDetail')}
      />
      <InlineAlert tone="warning">{t('worlds.baseHashWriteNote')}</InlineAlert>
      <Surface tone="panel" padding="lg" className="rws-section">
        <form key={character.contentHash} className="rws-form" onSubmit={handleSubmit}>
          {worldWriteBlocked ? <InlineAlert tone="danger">{t('worlds.systemWorldWriteBlocked')}</InlineAlert> : null}
          {error ? <InlineAlert tone="danger">{error}</InlineAlert> : null}
          <div className="rws-form-grid">
            <FieldValue label={t('worlds.worldId')} value={world.id} />
            <FieldValue label={t('worlds.characterId')} value={character.id} />
            <FieldValue label={t('worlds.baseContentHash')} value={character.contentHash} />
          </div>
          <div className="rws-form-grid">
            <FormField label={t('worlds.formEntityId')} hint={t('worlds.formEntityIdHint')}>
              <input name="entityId" autoComplete="off" defaultValue={character.entityId} required />
            </FormField>
            <FieldValue label={t('worlds.formOriginKind')} value={character.origin.kind} />
          </div>
          <FormField label={t('worlds.formCoreJson')} hint={t('worlds.formCoreJsonHint')}>
            <textarea name="core" rows={18} spellCheck={false} defaultValue={JSON.stringify(character.core, null, 2)} />
          </FormField>
          <div className="rws-form-actions">
            <Button tone="ghost" onClick={() => navigate(`/worlds/${normalizedWorldId}/characters/${character.id}`)}>{t('common.cancel')}</Button>
            <Button type="submit" tone="primary" loading={mutation.isPending} disabled={worldWriteBlocked}>
              {t('worlds.submitReplaceCharacter')}
            </Button>
          </div>
        </form>
      </Surface>
    </div>
  );
}
