import { useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ArrowRight, BookOpen, Check, Copy, FileCheck2, FilePenLine, Globe2, MapPin, Plus, ScrollText, Trash2, Users } from 'lucide-react';
import { Button, EmptyState, InlineAlert, LoadingSkeleton, nimiToast } from '@nimiplatform/kit/ui';
import { createCreatorWorldCore, getCreatorWorld, replaceCreatorWorldCore, getWorldCreationEligibility, CREATION_ELIGIBILITY_KEY, worldRecordKey } from './world-core-client.js';
import { WORLD_RECORDS_KEY } from './world-library.js';
import { addWorldDraft, persistWorldDrafts, removeWorldDraft, updateWorldDraft } from './world-draft-store.js';
import { draftIssues, newDraftId, newDraftRule, notebookMarkdown, worldContentFromRecord, worldCreateInput, worldReplaceInput, WorldRevisionConflict, type WorldContent, type WorldDraft, type WorldRecord } from './world-draft.js';
import { WorldCharacterList } from './world-character-list.js';
import { WorldCoauthor } from './world-coauthor.js';
import { DraftStorageNotice, FailureNotice, Field, SaveStatus, WorldMark, useDraftLibrary } from './studio-ui.js';

const CHAPTERS = [
  { key: 'overview', icon: Globe2 }, { key: 'setting', icon: BookOpen }, { key: 'rules', icon: ScrollText },
  { key: 'places', icon: MapPin }, { key: 'characters', icon: Users }, { key: 'review', icon: FileCheck2 },
] as const;
type Chapter = typeof CHAPTERS[number]['key'];

export function NotebookReading({ content }: { content: WorldContent }) {
  const { t } = useTranslation();
  return <div className="studio-reading">
    <header><WorldMark name={content.name} /><div><h2>{content.name || t('studio.untitled')}</h2><p>{[content.genre, content.era].filter(Boolean).join(' · ')}</p></div></header>
    <p className="studio-reading__lead">{content.summary || t('studio.noDescription')}</p>
    <section><h3>{t('studio.setting')}</h3><p>{content.setting || t('studio.noSetting')}</p></section>
    <section><h3>{t('studio.rules')}</h3>{content.rules.length ? content.rules.map(rule => <div key={rule.id}><h4>{rule.name}</h4><p>{rule.statement}</p></div>) : <p className="studio-muted">{t('studio.noRules')}</p>}</section>
    <section><h3>{t('studio.places')}</h3>{content.places.length ? content.places.map(place => <div key={place.id}><h4>{place.name}</h4><p>{place.summary}</p></div>) : <p className="studio-muted">{t('studio.noPlaces')}</p>}</section>
    {content.characters.length > 0 && <section><h3>{t('studio.characters')}</h3><p className="studio-help">{t('studio.characterBoundary')}</p>{content.characters.map(character => <div key={character.id}><h4>{character.name} · {character.role}</h4><p>{character.summary}</p><dl className="studio-character-facts"><dt>{t('studio.desire')}</dt><dd>{character.desire}</dd><dt>{t('studio.flaw')}</dt><dd>{character.flaw}</dd><dt>{t('studio.voice')}</dt><dd>{character.voice}</dd></dl></div>)}</section>}
  </div>;
}

function EntryHeading({ title, remove }: { title: string; remove: () => void }) {
  const { t } = useTranslation();
  return <div className="studio-entry-heading"><h3>{title}</h3><Button tone="ghost" size="sm" aria-label={t('studio.removeItem', { name: title })} leadingIcon={<Trash2 size={15} />} onClick={remove} /></div>;
}

function DraftChapter({ draft, chapter, change }: { draft: WorldDraft; chapter: Chapter; change: (patch: Partial<WorldDraft>) => void }) {
  const { t } = useTranslation();
  if (chapter === 'overview') return <>
    <Field label={t('studio.brief')}><textarea rows={3} value={draft.brief} placeholder={t('studio.ideaPlaceholder')} onChange={event => change({ brief: event.target.value })} /></Field>
    <Field label={t('studio.name')}><input value={draft.name} maxLength={150} placeholder={t('studio.nameHint')} onChange={event => change({ name: event.target.value })} /></Field>
    <Field label={t('studio.summary')} hint={t('studio.summaryHint')}><textarea rows={4} value={draft.summary} onChange={event => change({ summary: event.target.value })} /></Field>
    <div className="studio-field-pair"><Field label={t('studio.genre')}><input value={draft.genre} placeholder={t('studio.genreHint')} onChange={event => change({ genre: event.target.value })} /></Field><Field label={t('studio.era')}><input value={draft.era} placeholder={t('studio.eraHint')} onChange={event => change({ era: event.target.value })} /></Field></div>
  </>;
  if (chapter === 'setting') return <Field label={t('studio.setting')} hint={t('studio.settingHelp')}><textarea className="studio-writing-area" rows={15} value={draft.setting} placeholder={t('studio.settingHint')} onChange={event => change({ setting: event.target.value })} /></Field>;
  if (chapter === 'rules') return <><p className="studio-chapter-intro">{t('studio.rulesHint')}</p>{draft.rules.map(rule => <section className="studio-entry" key={rule.id}><EntryHeading title={rule.name || t('studio.untitledRule')} remove={() => change({ rules: draft.rules.filter(item => item.id !== rule.id) })} />{rule.systemRef && <Field label={t('studio.ruleName')}><input value={rule.name} onChange={event => change({ rules: draft.rules.map(item => item.systemRef === rule.systemRef ? { ...item, name: event.target.value } : item) })} /></Field>}<Field label={t('studio.ruleStatement')}><textarea rows={4} value={rule.statement} onChange={event => change({ rules: draft.rules.map(item => item.id === rule.id ? { ...item, statement: event.target.value } : item) })} /></Field></section>)}<Button tone="secondary" leadingIcon={<Plus size={15} />} onClick={() => change({ rules: [...draft.rules, newDraftRule()] })}>{t('studio.addRule')}</Button></>;
  if (chapter === 'places') return <><p className="studio-chapter-intro">{t('studio.placesHint')}</p>{draft.places.map(place => <section className="studio-entry" key={place.id}><EntryHeading title={place.name || t('studio.untitledPlace')} remove={() => change({ places: draft.places.filter(item => item.id !== place.id) })} /><Field label={t('studio.placeName')}><input value={place.name} onChange={event => change({ places: draft.places.map(item => item.id === place.id ? { ...item, name: event.target.value } : item) })} /></Field><Field label={t('studio.placeSummary')}><textarea rows={4} value={place.summary} onChange={event => change({ places: draft.places.map(item => item.id === place.id ? { ...item, summary: event.target.value } : item) })} /></Field></section>)}<Button tone="secondary" leadingIcon={<Plus size={15} />} onClick={() => change({ places: [...draft.places, { id: newDraftId(), name: '', summary: '' }] })}>{t('studio.addPlace')}</Button></>;
  if (chapter === 'characters') return <><p className="studio-chapter-intro">{t('studio.charactersHint')}</p><p className="studio-capability-note">{t('studio.characterBoundary')}</p>{!draft.characters.length && <div className="studio-chapter-empty"><Users size={35} strokeWidth={1.2} /><h3>{t('studio.noCharacters')}</h3><p>{t('studio.noCharactersHint')}</p></div>}{draft.characters.map(character => <section className="studio-entry" key={character.id}><EntryHeading title={character.name || t('studio.untitledCharacter')} remove={() => change({ characters: draft.characters.filter(item => item.id !== character.id) })} />{(['name', 'role', 'summary', 'desire', 'flaw', 'voice'] as const).map(key => <Field key={key} label={t(`studio.${key === 'name' ? 'characterName' : key === 'summary' ? 'characterSummary' : key}`)}>{key === 'name' || key === 'role' ? <input value={character[key]} onChange={event => change({ characters: draft.characters.map(item => item.id === character.id ? { ...item, [key]: event.target.value } : item) })} /> : <textarea rows={key === 'summary' ? 3 : 2} value={character[key]} onChange={event => change({ characters: draft.characters.map(item => item.id === character.id ? { ...item, [key]: event.target.value } : item) })} />}</Field>)}</section>)}<Button tone="secondary" leadingIcon={<Plus size={15} />} onClick={() => change({ characters: [...draft.characters, { id: newDraftId(), name: '', role: '', summary: '', desire: '', flaw: '', voice: '' }] })}>{t('studio.addCharacter')}</Button></>;
  return null;
}

function DraftReview({ draft, change, busy }: { draft: WorldDraft; change: (patch: Partial<WorldDraft>) => void; busy: (value: boolean) => void }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [reviewedAt, setReviewedAt] = useState<string | null>(null);
  const [conflict, setConflict] = useState<WorldRecord | null>(null);
  const eligibility = useQuery({ queryKey: CREATION_ELIGIBILITY_KEY, queryFn: getWorldCreationEligibility, enabled: !draft.source && !draft.savedWorld, retry: false, staleTime: 0 });
  const issues = draftIssues(draft);
  const mutation = useMutation({
    mutationFn: async () => {
      busy(true);
      await persistWorldDrafts();
      if (draft.source) {
        const latest = await getCreatorWorld(draft.source.id);
        return replaceCreatorWorldCore(latest.id, worldReplaceInput(draft, latest));
      }
      if (!(await getWorldCreationEligibility()).canCreateWorld) throw new Error('WORLD_CREATION_NOT_AUTHORIZED');
      return createCreatorWorldCore(worldCreateInput(draft));
    },
    onSuccess: world => {
      updateWorldDraft(draft.id, { savedWorld: world });
      queryClient.setQueryData<readonly typeof world[]>(WORLD_RECORDS_KEY, old => [world, ...(old ?? []).filter(item => item.id !== world.id)]);
      queryClient.setQueryData(worldRecordKey(world.id), world);
      nimiToast.success(t(draft.source ? 'studio.updateSuccess' : 'studio.createSuccess'));
    },
    onError: async error => {
      if (error instanceof WorldRevisionConflict) setConflict(error.latest);
      else if (draft.source && (error as {reasonCode?: string}).reasonCode === 'content-conflict') {
        try { setConflict(await getCreatorWorld(draft.source.id)); } catch { /* Keep the write failure and draft visible. */ }
      }
    },
    onSettled: () => busy(false),
  });
  return <>
    <h2>{t(draft.source ? 'studio.maintenanceTitle' : 'studio.reviewTitle')}</h2><p className="studio-chapter-intro">{t(draft.source ? 'studio.maintenanceHint' : 'studio.reviewHint')}</p>
    {draft.savedWorld ? <InlineAlert tone="success" icon={<Check size={18} />}><strong>{t(draft.source ? 'studio.updateSuccess' : 'studio.createSuccess')}</strong><p>{t('studio.createSuccessHint')}</p><Link className="studio-text-link" to={`/worlds/${encodeURIComponent(draft.savedWorld.id)}`}>{t('studio.open')}<ArrowRight size={14} /></Link><Button tone="ghost" size="sm" onClick={() => { const next = addWorldDraft('', draft.savedWorld); updateWorldDraft(next.id, { characters: draft.characters }); navigate(`/drafts/${next.id}`); }}>{t('studio.editDraft')}</Button>{draft.characters.map(character => <Link key={character.id} className="studio-text-link" to={`/worlds/${draft.savedWorld!.id}/characters/new?draftId=${draft.id}&conceptId=${character.id}`}>{t('studio.createNamedCharacter', { name: character.name })}<ArrowRight size={14} /></Link>)}</InlineAlert> : issues.length > 0 ? <div className="studio-required"><h3>{t('studio.required')}</h3><ul>{issues.map(issue => <li key={issue}>{t(`studio.missing.${issue}`)}</li>)}</ul></div> : <p className="studio-ready"><Check size={16} />{t(draft.source ? 'studio.revisionReady' : 'studio.ready')}</p>}
    <NotebookReading content={draft} />
    {!draft.savedWorld && <div className="studio-submit-area">
      {!draft.source && eligibility.isLoading && <p role="status">{t('studio.checkingEligibility')}</p>}
      {!draft.source && eligibility.isError && <FailureNotice message={t('studio.eligibilityFailed')} error={eligibility.error} retry={() => void eligibility.refetch()} />}
      {!draft.source && eligibility.data?.canCreateWorld === false && <InlineAlert tone="warning">{t('studio.creationDenied')}</InlineAlert>}
      {conflict && <section className="studio-conflict" role="alert"><h3>{t('studio.conflictTitle')}</h3><p>{t('studio.conflictHint')}</p><details open><summary>{t('studio.latestRealm')}</summary><NotebookReading content={worldContentFromRecord(conflict)} /></details><Button tone="secondary" onClick={() => { change({ source: { id: conflict.id, name: conflict.core.identity.name, contentHash: conflict.contentHash, contentRevision: conflict.contentRevision } }); setConflict(null); setReviewedAt(null); mutation.reset(); }}>{t('studio.rebase')}</Button></section>}
      <Field label={t('studio.visibility')}><select disabled={mutation.isPending} value={draft.visibility} onChange={event => change({ visibility: event.target.value as WorldDraft['visibility'] })}>{(['private', 'unlisted', 'public'] as const).map(value => <option key={value} value={value}>{t(`studio.visibility.${value}`)}</option>)}</select></Field>
      <label className="studio-review-consent"><input type="checkbox" disabled={mutation.isPending} checked={reviewedAt === draft.updatedAt} onChange={event => setReviewedAt(event.target.checked ? draft.updatedAt : null)} /><span>{t('studio.consent')}</span></label>
      {mutation.isError && !conflict && <FailureNotice message={t(draft.source ? 'studio.updateFailed' : 'studio.createFailed')} error={mutation.error} />}
      <Button tone="primary" leadingIcon={<Globe2 size={16} />} loading={mutation.isPending} disabled={issues.length > 0 || reviewedAt !== draft.updatedAt || Boolean(conflict) || (!draft.source && eligibility.data?.canCreateWorld !== true)} onClick={() => mutation.mutate()}>{t(mutation.isPending ? 'studio.savingRealm' : draft.source ? 'studio.saveRevision' : 'studio.createRealm')}</Button>
    </div>}
  </>;
}

export function WorldDraftPage() {
  const { t } = useTranslation();
  const { draftId } = useParams();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const { drafts, loaded, error } = useDraftLibrary();
  const draft = drafts.find(item => item.id === draftId);
  const current = CHAPTERS.findIndex(item => item.key === params.get('chapter'));
  const chapterIndex = current < 0 ? 0 : current;
  const chapter = CHAPTERS[chapterIndex]!.key;
  if (!loaded) return <div className="studio-page"><DraftStorageNotice />{!error && <LoadingSkeleton lines={5} />}</div>;
  if (!draft) return <NotebookState title={t('studio.notFoundDraft')} />;
  const change = (patch: Partial<WorldDraft>) => updateWorldDraft(draft.id, patch);
  const go = (index: number) => setParams({ chapter: CHAPTERS[index]!.key });
  async function copyNotebook() { try { await navigator.clipboard.writeText(notebookMarkdown(draft!)); nimiToast.success(t('studio.copied')); } catch { nimiToast.danger(t('studio.copyFailed')); } }
  const locked = busy || Boolean(draft.savedWorld);
  return <div className="studio-notebook">
    <header className="studio-notebook__top"><Link className="studio-back" to="/worlds?tab=drafts"><ArrowLeft size={16} />{t('studio.drafts')}</Link><div className="studio-notebook__identity"><h1>{draft.name || t('studio.untitled')}</h1><span className="studio-badge">{t(draft.savedWorld ? 'studio.savedRealm' : draft.source ? 'studio.revisionDraft' : 'studio.draft')}</span></div><SaveStatus /><Button tone="ghost" size="sm" leadingIcon={<Copy size={15} />} onClick={() => void copyNotebook()}>{t('studio.export')}</Button></header>
    <DraftStorageNotice />
    <div className="studio-notebook__layout">
      <div className="studio-notebook__work">
        <nav className="studio-chapters" aria-label={t('studio.notebook')}>{CHAPTERS.map(({ key, icon: Icon }, index) => <button type="button" key={key} className={chapter === key ? 'is-current' : ''} aria-current={chapter === key ? 'step' : undefined} disabled={busy} onClick={() => go(index)}><Icon size={16} /><span>{t(`studio.${key}`)}</span></button>)}</nav>
        <div className="studio-manuscript" key={chapter}>
          {chapter !== 'review' && <header className="studio-chapter-title"><span>{t('studio.chapterOf', { current: chapterIndex + 1, total: CHAPTERS.length })}</span><h2>{t(`studio.${chapter}`)}</h2></header>}
          {draft.source && chapter === 'overview' && <p className="studio-capability-note">{t('studio.maintenanceHint')}</p>}
          {draft.savedWorld && chapter !== 'review' && <p className="studio-capability-note">{t('studio.createSuccessHint')}</p>}
          {chapter === 'review' ? <div className="studio-editor-fields"><DraftReview draft={draft} change={change} busy={setBusy} /></div> : <fieldset disabled={locked} className="studio-editor-fields"><DraftChapter draft={draft} chapter={chapter} change={change} /></fieldset>}
          <footer className="studio-chapter-footer"><Button tone="ghost" disabled={chapterIndex === 0 || busy} leadingIcon={<ArrowLeft size={15} />} onClick={() => go(chapterIndex - 1)}>{t('studio.previous')}</Button>{chapterIndex < CHAPTERS.length - 1 && <Button tone="secondary" disabled={busy} trailingIcon={<ArrowRight size={15} />} onClick={() => go(chapterIndex + 1)}>{t(chapterIndex === 4 ? 'studio.review' : 'studio.continue')}</Button>}</footer>
          <div className="studio-draft-delete">{confirmDelete ? <><p>{t('studio.deleteConfirm')}</p><Button size="sm" tone="secondary" onClick={() => { void removeWorldDraft(draft.id).then(() => navigate('/worlds?tab=drafts')).catch(() => setConfirmDelete(false)); }}>{t('studio.deleteDraft')}</Button><Button tone="ghost" size="sm" onClick={() => setConfirmDelete(false)}>{t('studio.keepDraft')}</Button></> : <Button tone="ghost" size="sm" disabled={busy} leadingIcon={<Trash2 size={14} />} onClick={() => setConfirmDelete(true)}>{t('studio.deleteDraft')}</Button>}</div>
        </div>
      </div>
      <WorldCoauthor key={draft.id} draft={draft} disabled={locked} />
    </div>
  </div>;
}

function NotebookState({ title, children }: { title: string; children?: ReactNode }) {
  const { t } = useTranslation();
  return <div className="studio-page"><Link className="studio-back" to="/worlds"><ArrowLeft size={16} />{t('studio.back')}</Link><EmptyState icon={<BookOpen />} title={title} description={children} /></div>;
}

// @nimi-authority: rule.realm-world-studio.scope.r014
export function CreatorWorldDetailPage() {
  const { t } = useTranslation();
  const { worldId } = useParams();
  const navigate = useNavigate();
  const { loaded, drafts } = useDraftLibrary();
  const query = useQuery({ queryKey: worldRecordKey(worldId ?? ''), queryFn: () => getCreatorWorld(worldId!), enabled: Boolean(worldId), retry: false });
  const world = query.data;
  if (query.isLoading) return <div className="studio-page"><LoadingSkeleton lines={7} /></div>;
  if (query.isError) return <div className="studio-page"><FailureNotice message={t('studio.realmLoadError')} error={query.error} retry={() => void query.refetch()} /></div>;
  if (!world) return <NotebookState title={t('studio.sourceMissing')}>{t('studio.sourceMissingHint')}</NotebookState>;
  const content = worldContentFromRecord(world);
  const relatedDrafts = drafts.filter(draft => draft.source?.id === world.id || draft.savedWorld?.id === world.id);
  function draftImprovements() {
    const existing = relatedDrafts.find(draft => draft.source?.contentHash === world!.contentHash);
    if (existing) { navigate(`/drafts/${existing.id}`); return; }
    const draft = addWorldDraft('', world);
    const previous = relatedDrafts.find(item => item.characters.length);
    if (previous) updateWorldDraft(draft.id, { characters: previous.characters });
    navigate(`/drafts/${draft.id}`);
  }
  return <div className="studio-page studio-world-detail"><Link className="studio-back" to="/worlds"><ArrowLeft size={16} />{t('studio.back')}</Link><header className="studio-page-title"><div><h1>{world.core.identity.name}</h1><p>{t('studio.realmViewHint')}</p></div><Button tone="primary" leadingIcon={<FilePenLine size={16} />} disabled={!loaded || world.visibility === 'system'} onClick={draftImprovements}>{t('studio.editDraft')}</Button></header><DraftStorageNotice /><div className="studio-detail-status"><span className="studio-badge studio-badge--success">{t('studio.realmView')}</span><span className="studio-badge">{t(`studio.${world.visibility}`)}</span>{world.visibility === 'system' && <span>{t('studio.systemHint')}</span>}</div><NotebookReading content={content} />
    {relatedDrafts.length > 0 && <section className="studio-related-drafts"><h3>{t('studio.relatedDrafts')}</h3>{relatedDrafts.map(draft => <Link className="studio-text-link" key={draft.id} to={`/drafts/${draft.id}`}><FilePenLine size={14} />{draft.name || t('studio.untitled')} · {t(draft.source ? 'studio.revisionDraft' : 'studio.characters')}<ArrowRight size={14} /></Link>)}</section>}
    <WorldCharacterList world={world} />
    <details className="studio-source-details"><summary>{t('studio.sourceDetails')}</summary><pre>{JSON.stringify({ id: world.id, contentRevision: world.contentRevision, schemaVersion: world.schemaVersion, contentHash: world.contentHash, creatorId: world.creatorId, origin: world.origin }, null, 2)}</pre></details>
  </div>;
}

export function CreatorWorldEditPage() { return <CreatorWorldDetailPage />; }
