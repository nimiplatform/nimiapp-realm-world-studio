import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ArrowRight, BookOpen, ChevronRight, FilePenLine, Plus, RefreshCw, Search, Sparkles } from 'lucide-react';
import { Button, EmptyState, LoadingSkeleton } from '@nimiplatform/kit/ui';
import { listCreatorWorldRecords } from './world-core-client.js';
import { addWorldDraft } from './world-draft-store.js';
import { DraftStorageNotice, FailureNotice, WorldMark, dateLabel, useDraftLibrary } from './studio-ui.js';

export const WORLD_RECORDS_KEY = ['world-studio', 'realm-world-records'] as const;

export function WorldIdeaComposer({ disabled = false, spacious = false }: { disabled?: boolean; spacious?: boolean }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [idea, setIdea] = useState('');
  function start(event?: FormEvent) {
    event?.preventDefault();
    if (disabled) return;
    const draft = addWorldDraft(idea.trim());
    navigate(`/drafts/${draft.id}`);
  }
  return <section className={`studio-idea${spacious ? ' studio-idea--spacious' : ''}`}>
    <div className="studio-idea__intro"><span className="studio-idea__symbol" aria-hidden="true"><Sparkles size={25} strokeWidth={1.4} /></span><div><h2>{t('studio.ideaTitle')}</h2><p>{t('studio.ideaHint')}</p></div></div>
    <form onSubmit={start}>
      <textarea aria-label={t('studio.brief')} placeholder={t('studio.ideaPlaceholder')} value={idea} onChange={event => setIdea(event.target.value)} rows={spacious ? 5 : 2} />
      <div className="studio-idea__footer"><Button tone="ghost" onClick={() => { const draft = addWorldDraft(); navigate(`/drafts/${draft.id}`); }} disabled={disabled}>{t('studio.blank')}</Button><Button type="submit" tone="primary" disabled={disabled || !idea.trim()} trailingIcon={<ArrowRight size={16} />}>{t('studio.start')}</Button></div>
    </form>
    <div className="studio-seeds"><span>{t('studio.inspiration')}</span>{(['seed1', 'seed2', 'seed3'] as const).map(key => <button type="button" key={key} onClick={() => setIdea(t(`studio.${key}`))}>{t(`studio.${key}`)}</button>)}</div>
  </section>;
}

export function CreatorWorldListPage() {
  const { t, i18n } = useTranslation();
  const [params, setParams] = useSearchParams();
  const draftsTab = params.get('tab') === 'drafts';
  const [search, setSearch] = useState('');
  const [visibility, setVisibility] = useState('all');
  const { drafts, loaded, error: storageError } = useDraftLibrary();
  const query = useQuery({ queryKey: WORLD_RECORDS_KEY, queryFn: listCreatorWorldRecords, retry: false });
  const normalizedSearch = search.toLocaleLowerCase();
  const worlds = (query.data ?? []).filter(world => (visibility === 'all' || world.visibility === visibility) && `${world.core.identity.name} ${world.core.identity.summary}`.toLocaleLowerCase().includes(normalizedSearch));
  const filteredDrafts = drafts.filter(draft => `${draft.name} ${draft.summary} ${draft.brief}`.toLocaleLowerCase().includes(normalizedSearch));
  return <div className="studio-page studio-library">
    <header className="studio-page-title"><div><h1>{t('studio.tagline')}</h1><p>{t('studio.libraryHint')}</p></div><Link className="studio-primary-link" to="/worlds/new"><Plus size={16} />{t('studio.new')}</Link></header>
    <DraftStorageNotice />
    <WorldIdeaComposer disabled={!loaded} />
    <section className="studio-collection">
      <div className="studio-collection__toolbar"><div className="studio-library-tabs" role="tablist" aria-label={t('studio.library')}>
        <button role="tab" type="button" aria-selected={!draftsTab} onClick={() => setParams({})}>{t('studio.library')}{query.data && <span>{query.data.length}</span>}</button>
        <button role="tab" type="button" aria-selected={draftsTab} onClick={() => setParams({ tab: 'drafts' })}>{t('studio.drafts')}{loaded && <span>{drafts.length}</span>}</button>
      </div><div className="studio-collection__tools"><label className="studio-search"><Search size={16} /><input aria-label={t('studio.search')} placeholder={t('studio.search')} value={search} onChange={event => setSearch(event.target.value)} /></label>
        {!draftsTab && <Button size="sm" tone="ghost" aria-label={t('studio.refresh')} loading={query.isFetching} onClick={() => void query.refetch()} leadingIcon={<RefreshCw size={16} />} />}
      </div></div>
      {!draftsTab && <div className="studio-filter-row">{['all', 'private', 'public'].map(value => <button type="button" key={value} aria-pressed={visibility === value} onClick={() => setVisibility(value)}>{t(`studio.${value}`)}</button>)}</div>}
      {draftsTab ? <div role="tabpanel">
        {!loaded && !storageError ? <LoadingSkeleton lines={5} /> : null}
        {loaded && filteredDrafts.map(draft => <Link className="studio-world-row" to={`/drafts/${draft.id}`} key={draft.id}><span className="studio-draft-mark"><FilePenLine size={23} strokeWidth={1.5} /></span><div className="studio-world-row__copy"><h3>{draft.name || t('studio.untitled')}</h3><p>{draft.summary || draft.brief || t('studio.noDescription')}</p></div><div className="studio-world-row__meta"><span className={`studio-badge${draft.savedWorld ? ' studio-badge--success' : ''}`}>{t(draft.savedWorld ? 'studio.savedRealm' : draft.source ? 'studio.revisionDraft' : 'studio.draft')}</span><time dateTime={draft.updatedAt}>{dateLabel(draft.updatedAt, i18n.language)}</time></div><ChevronRight size={18} /></Link>)}
        {loaded && !filteredDrafts.length && <EmptyState icon={<FilePenLine />} title={t(search ? 'studio.noMatch' : 'studio.emptyDrafts')} description={t('studio.emptyDraftsHint')} action={<Link className="studio-text-link" to="/worlds/new">{t('studio.new')}<ArrowRight size={15} /></Link>} />}
      </div> : <div role="tabpanel">
        {query.isLoading && <LoadingSkeleton lines={6} />}
        {query.isError && <FailureNotice message={t('studio.realmLoadError')} error={query.error} retry={() => void query.refetch()} />}
        {worlds.map(world => <Link className="studio-world-row" to={`/worlds/${encodeURIComponent(world.id)}`} key={world.id}><WorldMark name={world.core.identity.name} /><div className="studio-world-row__copy"><h3>{world.core.identity.name}</h3><p>{world.core.identity.summary || t('studio.noDescription')}</p>{world.core.identity.genre && <span className="studio-row-genre">{world.core.identity.genre}</span>}</div><div className="studio-world-row__meta"><span className="studio-badge">{t(`studio.${world.visibility}`)}</span><time dateTime={world.updatedAt}>{dateLabel(world.updatedAt, i18n.language)}</time></div><ChevronRight size={18} /></Link>)}
        {query.isSuccess && !worlds.length && <EmptyState icon={<BookOpen />} title={t(search || visibility !== 'all' ? 'studio.noMatch' : 'studio.emptyWorlds')} description={t('studio.emptyHint')} action={search || visibility !== 'all' ? <Button tone="secondary" onClick={() => { setSearch(''); setVisibility('all'); }}>{t('studio.clearSearch')}</Button> : <Link className="studio-text-link" to="/worlds/new">{t('studio.new')}</Link>} />}
        {query.isSuccess && <p className="studio-inventory-limit">{t('studio.limit')}</p>}
      </div>}
    </section>
  </div>;
}

export function CreatorWorldCreatePage() {
  const { t } = useTranslation();
  const { loaded } = useDraftLibrary();
  return <div className="studio-page studio-new-world"><Link className="studio-back" to="/worlds">{t('studio.back')}</Link><header className="studio-page-title"><h1>{t('studio.new')}</h1></header><DraftStorageNotice /><WorldIdeaComposer disabled={!loaded} spacious /></div>;
}
