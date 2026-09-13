import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ArrowRight, Check, FilePenLine, ShieldCheck, Sparkles, UserRound } from 'lucide-react';
import { Button, InlineAlert, LoadingSkeleton, nimiToast } from '@nimiplatform/kit/ui';
import { getCreatorWorld, getCreatorWorldCharacterCore, worldCharacterKey, worldCharactersKey, worldRecordKey } from './world-core-client.js';
import { CHARACTER_FIELDS, characterMatchesWorld, CharacterRevisionConflict, characterIssues, characterForm, generateCharacterProposal, newCharacterDraft, saveWorldCharacter, type CharacterForm } from './world-character-model.js';
import { changeCharacterDraft, loadCharacterDrafts, persistCharacterDrafts, putCharacterDraft, useCharacterDrafts } from './character-draft-store.js';
import { newDraftId } from './world-draft.js';
import { loadWorldDrafts } from './world-draft-store.js';
import { FailureNotice, Field, useDraftLibrary } from './studio-ui.js';

const PROFILE_FIELDS = ['name', 'summary', 'role', 'drives', 'traits', 'tone', 'greeting'] as const;
const DECLARATION_FIELDS = ['identityStatement', 'behavior', 'speaking', 'boundaries'] as const;
const CHAPTER_ICONS = { profile: UserRound, declaration: ShieldCheck, review: Check };

function CharacterReading({ form }: { form: CharacterForm }) {
  const { t } = useTranslation();
  return <div className="studio-character-reading">{CHARACTER_FIELDS.filter(key => form[key].trim()).map(key => <section key={key}><h3>{t(`ops.field.${key}`)}</h3><p>{form[key]}</p></section>)}</div>;
}

// @nimi-authority: rule.realm-world-studio.runtime-ai.r012
export function WorldCharacterDetailPage() {
  const { worldId = '', characterId = '' } = useParams();
  const { t } = useTranslation();
  const world = useQuery({ queryKey: worldRecordKey(worldId), queryFn: () => getCreatorWorld(worldId), retry: false });
  const query = useQuery({ queryKey: worldCharacterKey(worldId, characterId), queryFn: () => getCreatorWorldCharacterCore(worldId, characterId), enabled: Boolean(world.data), retry: false });
  if (world.isError || query.isError) return <div className="studio-page"><FailureNotice message={t('ops.characterLoadError')} error={world.error ?? query.error} retry={() => { void world.refetch(); void query.refetch(); }} /></div>;
  if (world.data && query.data && (world.data.id !== worldId || !characterMatchesWorld(query.data, worldId, characterId))) return <div className="studio-page"><FailureNotice message={t('ops.characterLoadError')} error={new Error('CHARACTER_SOURCE_MISMATCH')} /></div>;
  if (!world.data || !query.data) return <div className="studio-page"><LoadingSkeleton lines={8} /></div>;
  const record = query.data;
  return <div className="studio-page studio-character-detail">
    <Link className="studio-back" to={`/worlds/${worldId}`}><ArrowLeft size={16} />{world.data?.core.identity.name}</Link>
    <header className="studio-page-title"><div><h1>{record.profile.presentation.displayName}</h1><p>{record.profile.narrative.archetype}</p></div><Link className="studio-primary-link" to={`/worlds/${worldId}/characters/${characterId}/edit`}><FilePenLine size={16} />{t('ops.editCharacter')}</Link></header>
    <div className="studio-detail-status"><span className="studio-badge studio-badge--success">{t('ops.savedCharacter')}</span><span>{t('ops.savedVersion', { version: record.contentRevision })}</span><span className="studio-badge">{t(`studio.${record.visibility}`)}</span></div>
    <CharacterReading form={characterForm(record)} />
    <details className="studio-source-details"><summary>{t('studio.sourceDetails')}</summary><pre>{JSON.stringify({ id: record.id, worldId: record.worldId, worldEntityRef: record.worldEntityRef, contentRevision: record.contentRevision, contentHash: record.contentHash, validity: record.validity }, null, 2)}</pre></details>
  </div>;
}

// @nimi-authority: rule.realm-world-studio.scope.r016
export function WorldCharacterEditorPage() {
  const { worldId = '', characterId } = useParams();
  const [params, setParams] = useSearchParams();
  const [newId] = useState(newDraftId);
  const id = characterId ?? params.get('characterDraftId') ?? params.get('conceptId') ?? newId;
  const [chapter, setChapter] = useState<'profile' | 'declaration' | 'review'>('profile');
  const [reviewedAt, setReviewedAt] = useState<string | null>(null);
  const [conflict, setConflict] = useState<CharacterRevisionConflict | null>(null);
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const store = useCharacterDrafts();
  const worldDrafts = useDraftLibrary();
  const draft = store.drafts.find(item => item.id === id && item.worldId === worldId);
  const world = useQuery({ queryKey: worldRecordKey(worldId), queryFn: () => getCreatorWorld(worldId), retry: false });
  const source = useQuery({ queryKey: worldCharacterKey(worldId, id), queryFn: () => getCreatorWorldCharacterCore(worldId, id), enabled: Boolean(world.data && (characterId || draft?.saved)), retry: false });
  const concept = worldDrafts.drafts.find(item => item.id === params.get('draftId'))?.characters.find(item => item.id === params.get('conceptId'));

  useEffect(() => { void loadCharacterDrafts(); }, []);
  useEffect(() => {
    if (!characterId && !params.get('characterDraftId')) { const next = new URLSearchParams(params); next.set('characterDraftId', id); setParams(next, { replace: true }); }
  }, [characterId, id, params, setParams]);
  useEffect(() => {
    if (!store.loaded || draft || !world.data || (characterId && !source.data) || (params.get('conceptId') && !concept)) return;
    if (world.data.id !== worldId || (source.data && !characterMatchesWorld(source.data, worldId, id))) return;
    void putCharacterDraft(newCharacterDraft(worldId, id, source.data ?? null, concept)).catch(() => {});
  }, [store.loaded, draft, world.data, characterId, source.data, params, concept, worldId, id]);
  useEffect(() => {
    const listener = (event: BeforeUnloadEvent) => { const state = useCharacterDrafts.getState(); if (state.saving || state.error) event.preventDefault(); };
    window.addEventListener('beforeunload', listener);
    return () => window.removeEventListener('beforeunload', listener);
  }, []);

  const generation = useMutation({ mutationFn: () => generateCharacterProposal(draft!.form, world.data!, i18n.language), onSuccess: proposal => { const current = useCharacterDrafts.getState().drafts.find(item => item.id === id)!; void putCharacterDraft({ ...current, proposal }).catch(() => {}); } });
  const save = useMutation({
    mutationFn: async () => {
      await persistCharacterDrafts();
      return saveWorldCharacter(draft!, async () => { const current = useCharacterDrafts.getState().drafts.find(item => item.id === id)!; await putCharacterDraft({ ...current, entityCreated: true }); });
    },
    onSuccess: async record => {
      const current = useCharacterDrafts.getState().drafts.find(item => item.id === id)!;
      await putCharacterDraft({ ...current, source: record, saved: true, proposal: null }).catch(() => {});
      queryClient.setQueryData(worldCharacterKey(worldId, id), record);
      await queryClient.invalidateQueries({ queryKey: worldCharactersKey(worldId) });
      nimiToast.success(t('ops.savedCharacter'));
      navigate(`/worlds/${worldId}/characters/${id}`);
    },
    onError: async error => {
      if (error instanceof CharacterRevisionConflict) setConflict(error);
      else if ((error as { reasonCode?: string }).reasonCode === 'content-conflict') {
        try { setConflict(new CharacterRevisionConflict(await getCreatorWorldCharacterCore(worldId, id))); } catch { /* Preserve the original failure and draft. */ }
      }
    },
  });

  if (world.isError || source.isError || (!store.loaded && store.error) || (params.get('conceptId') && (worldDrafts.error || (worldDrafts.loaded && !concept && !draft)))) return <div className="studio-page"><Link className="studio-back" to={`/worlds/${worldId}`}>{t('studio.back')}</Link><FailureNotice message={t('ops.characterLoadError')} error={world.error ?? source.error ?? store.error ?? worldDrafts.error} retry={() => { void world.refetch(); if (characterId) void source.refetch(); void loadCharacterDrafts(); void loadWorldDrafts(); }} /></div>;
  if (world.data && source.data && (world.data.id !== worldId || !characterMatchesWorld(source.data, worldId, id))) return <div className="studio-page"><FailureNotice message={t('ops.characterLoadError')} error={new Error('CHARACTER_SOURCE_MISMATCH')} /></div>;
  if (!draft || !world.data) return <div className="studio-page"><LoadingSkeleton lines={8} /></div>;
  if (draft.saved && !characterId) return <div className="studio-page"><InlineAlert tone="success">{t('ops.savedCharacter')}<Link className="studio-text-link" to={`/worlds/${worldId}/characters/${id}`}>{t('ops.openCharacter')}<ArrowRight size={15} /></Link></InlineAlert></div>;

  const change = (patch: Partial<CharacterForm>) => { changeCharacterDraft({ ...draft, form: { ...draft.form, ...patch }, saved: false, updatedAt: new Date().toISOString() }); setReviewedAt(null); };
  const issues = characterIssues(draft.form);
  const fields = chapter === 'profile' ? PROFILE_FIELDS : DECLARATION_FIELDS;
  return <div className="studio-notebook studio-character-editor">
    <header className="studio-notebook__top"><Link className="studio-back" to={`/worlds/${worldId}`}><ArrowLeft size={16} />{world.data.core.identity.name}</Link><div className="studio-notebook__identity"><h1>{draft.form.name || t('ops.newCharacter')}</h1><span className="studio-badge">{t('studio.draft')}</span></div><span className="studio-save-status" role="status">{t(store.error ? 'studio.unsaved' : store.saving ? 'studio.saving' : 'studio.savedDraft')}</span></header>
    {store.error && <FailureNotice message={t('studio.storageError')} error={store.error} retry={() => void persistCharacterDrafts().catch(() => {})} />}
    <div className="studio-notebook__layout"><div className="studio-notebook__work">
      <nav className="studio-chapters" aria-label={t('ops.characterEditor')}>{(['profile', 'declaration', 'review'] as const).map(key => { const Icon = CHAPTER_ICONS[key]; return <button key={key} type="button" className={chapter === key ? 'is-current' : ''} aria-current={chapter === key ? 'step' : undefined} disabled={save.isPending} onClick={() => setChapter(key)}><Icon size={16} />{t(`ops.chapter.${key}`)}</button>; })}</nav>
      <div className="studio-manuscript"><div className="studio-editor-fields"><header className="studio-chapter-title"><h2>{t(`ops.chapter.${chapter}`)}</h2><p>{t(`ops.hint.${chapter}`)}</p></header>
        {chapter !== 'review' ? <fieldset className="studio-editor-fields" disabled={save.isPending}>{fields.map(key => <Field key={key} label={t(`ops.field.${key}`)} hint={key === 'identityStatement' ? t('ops.identityHint') : DECLARATION_FIELDS.includes(key as typeof DECLARATION_FIELDS[number]) ? t('ops.linesHint') : undefined}>{key === 'name' || key === 'role' ? <input value={draft.form[key]} maxLength={150} onChange={event => change({ [key]: event.target.value })} /> : <textarea rows={key === 'summary' ? 4 : 3} value={draft.form[key]} onChange={event => change({ [key]: event.target.value })} />}</Field>)}</fieldset> : <>
          <CharacterReading form={draft.form} />
          {issues.length > 0 && <div className="studio-required"><h3>{t('ops.required')}</h3><ul>{issues.map(key => <li key={key}>{t(`ops.field.${key}`)}</li>)}</ul></div>}
          {conflict && <section className="studio-conflict" role="alert"><h3>{t('studio.conflictTitle')}</h3><p>{t('studio.conflictHint')}</p><details open><summary>{t('studio.latestRealm')}</summary><CharacterReading form={characterForm(conflict.latest)} /></details><Button tone="secondary" onClick={() => { changeCharacterDraft({ ...draft, source: conflict.latest, saved: false, updatedAt: new Date().toISOString() }); setConflict(null); setReviewedAt(null); save.reset(); }}>{t('studio.rebase')}</Button></section>}
          {save.isError && !conflict && <FailureNotice message={t('ops.characterSaveFailed')} error={save.error} />}
          {draft.entityCreated && !draft.source && <p className="studio-help">{t('ops.entityRetained')}</p>}
          <label className="studio-review-consent"><input type="checkbox" checked={reviewedAt === draft.updatedAt} disabled={save.isPending} onChange={event => setReviewedAt(event.target.checked ? draft.updatedAt : null)} /><span>{t('ops.consent')}</span></label>
          <Button tone="primary" loading={save.isPending} disabled={issues.length > 0 || reviewedAt !== draft.updatedAt || Boolean(conflict)} onClick={() => save.mutate()}>{t(save.isPending ? 'studio.savingRealm' : draft.source ? 'ops.saveCharacter' : 'ops.createCharacter')}</Button>
        </>}
        {chapter !== 'review' && <footer className="studio-chapter-footer"><Button tone="secondary" trailingIcon={<ArrowRight size={16} />} onClick={() => setChapter(chapter === 'profile' ? 'declaration' : 'review')}>{t('studio.continue')}</Button></footer>}
      </div></div>
    </div><aside className="studio-coauthor"><header className="studio-coauthor__header"><Sparkles size={20} /><div><h2>{t('studio.coauthor')}</h2><p>{t('ops.aiHint')}</p></div></header><div className="studio-coauthor__body">
      <Button fullWidth tone="primary" leadingIcon={<Sparkles size={15} />} loading={generation.isPending} disabled={save.isPending || !draft.form.name.trim()} onClick={() => generation.mutate()}>{t('ops.developCharacter')}</Button><Link className="studio-text-link studio-model-link" to="/settings/ai">{t('studio.modelSettings')}</Link>
      {generation.isError && <FailureNotice message={t('studio.aiError')} error={generation.error} retry={() => generation.mutate()} />}
      {generation.isPending && <div className="studio-generating" role="status"><p>{t('ops.generating')}</p><LoadingSkeleton lines={5} /></div>}
      {draft.proposal && <div className="studio-proposal"><p>{t('studio.proposalHint')}</p><CharacterReading form={draft.proposal} /><Button tone="secondary" disabled={save.isPending} onClick={() => { change(draft.proposal!); }}>{t('ops.adoptCharacter')}</Button></div>}
      {!draft.proposal && !generation.isPending && <p className="studio-ai-empty">{t('ops.aiEmpty')}</p>}
    </div></aside></div>
  </div>;
}
