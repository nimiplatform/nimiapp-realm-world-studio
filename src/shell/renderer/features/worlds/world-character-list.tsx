import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Plus, UserRound } from 'lucide-react';
import { Button, EmptyState, LoadingSkeleton } from '@nimiplatform/kit/ui';
import { listCreatorWorldCharacters, worldCharactersKey } from './world-core-client.js';
import { loadCharacterDrafts, useCharacterDrafts } from './character-draft-store.js';
import { FailureNotice } from './studio-ui.js';
import { newDraftId, type WorldRecord } from './world-draft.js';

export function WorldCharacterList({ world }: { world: WorldRecord }) {
  const { t } = useTranslation();
  const draftState = useCharacterDrafts();
  useEffect(() => { void loadCharacterDrafts(); }, []);
  const query = useInfiniteQuery({
    queryKey: worldCharactersKey(world.id), initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) => listCreatorWorldCharacters(world.id, pageParam),
    getNextPageParam: rows => rows.length === 100 ? rows.at(-1)?.id : undefined, retry: false,
  });
  const characters = query.data?.pages.flat() ?? [];
  const drafts = draftState.drafts.filter(draft => draft.worldId === world.id && !draft.saved);
  return <section className="studio-cast">
    <header><div><h2>{t('ops.characters')}</h2><p>{t('ops.castHint')}</p></div>{world.visibility !== 'system' && <Link className="studio-primary-link" to={`/worlds/${world.id}/characters/new?characterDraftId=${newDraftId()}`}><Plus size={16} />{t('ops.newCharacter')}</Link>}</header>
    {query.isLoading && <LoadingSkeleton lines={4} />}
    {query.isError && <FailureNotice message={t('ops.characterListError')} error={query.error} retry={() => void query.refetch()} />}
    {draftState.error && <FailureNotice message={t('ops.characterDraftLoadError')} error={draftState.error} retry={() => void loadCharacterDrafts()} />}
    {characters.map(character => <Link className="studio-world-row studio-character-row" key={character.id} to={`/worlds/${world.id}/characters/${character.id}`}><span className="studio-draft-mark"><UserRound size={23} /></span><div className="studio-world-row__copy"><h3>{character.profile.presentation.displayName}</h3><p>{character.profile.identity.summary}</p><span className="studio-row-genre">{character.profile.narrative.archetype}</span></div><span className="studio-badge">{t(`studio.${character.visibility}`)}</span><ArrowRight size={16} /></Link>)}
    {query.isSuccess && !characters.length && <EmptyState icon={<UserRound />} title={t('ops.emptyCharacters')} description={t('ops.emptyCharactersHint')} />}
    {query.hasNextPage && <Button tone="secondary" loading={query.isFetchingNextPage} onClick={() => void query.fetchNextPage()}>{t('ops.moreCharacters')}</Button>}
    {drafts.length > 0 && <div className="studio-character-drafts"><h3>{t('ops.characterDrafts')}</h3>{drafts.map(draft => <Link key={draft.id} className="studio-text-link" to={draft.source ? `/worlds/${world.id}/characters/${draft.id}/edit` : `/worlds/${world.id}/characters/new?characterDraftId=${draft.id}`}>{draft.form.name || t('studio.untitledCharacter')} · {t('ops.resumeDraft')}<ArrowRight size={14} /></Link>)}</div>}
  </section>;
}
