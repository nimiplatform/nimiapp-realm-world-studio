import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Check, Plus, Sparkles, Undo2 } from 'lucide-react';
import { Button, LoadingSkeleton } from '@nimiplatform/kit/ui';
import { generateWorldProposal, type CoauthorTask } from './world-ai.js';
import { updateWorldDraft, useWorldDrafts } from './world-draft-store.js';
import { type WorldDraft } from './world-draft.js';
import { FailureNotice, Field } from './studio-ui.js';

export function WorldCoauthor({ draft, disabled = false }: { draft: WorldDraft; disabled?: boolean }) {
  const { t, i18n } = useTranslation();
  const [instruction, setInstruction] = useState('');
  const [pending, setPending] = useState(false);
  const [repairing, setRepairing] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [lastTask, setLastTask] = useState<CoauthorTask>('develop');
  const [undo, setUndo] = useState<{ before: WorldDraft; after: string } | null>(null);
  const proposal = draft.proposal;
  const characterSuggestions = proposal?.task === 'develop' ? proposal.content.characters : proposal?.task === 'cast' ? proposal.characters : [];
  const hasIdea = Boolean(draft.brief.trim() || draft.summary.trim() || draft.setting.trim() || instruction.trim());

  async function generate(task: CoauthorTask, repairText?: string) {
    if (pending || !hasIdea) return;
    setPending(true); setRepairing(Boolean(repairText)); setError(null); setLastTask(task);
    try {
      const generated = await generateWorldProposal(draft, task, instruction, i18n.language, repairText);
      const latest = useWorldDrafts.getState().drafts.find(item => item.id === draft.id);
      if (latest) updateWorldDraft(draft.id, { proposal: generated });
      setUndo(null);
    } catch (failure) { setError(failure); }
    finally { setPending(false); }
  }

  function accept(key: string, patch: Partial<WorldDraft>) {
    if (!proposal || disabled) return;
    updateWorldDraft(draft.id, { ...patch, proposal: { ...proposal, accepted: [...proposal.accepted, key] } });
    setUndo({ before: draft, after: useWorldDrafts.getState().drafts.find(item => item.id === draft.id)!.updatedAt });
  }

  function acceptButton(key: string, patch: Partial<WorldDraft>, label = 'studio.adopt') {
    const accepted = proposal?.accepted.includes(key);
    return <Button size="sm" tone="secondary" disabled={disabled || accepted} leadingIcon={accepted ? <Check size={13} /> : <Plus size={13} />} onClick={() => accept(key, patch)}>{t(accepted ? 'studio.adopted' : label)}</Button>;
  }

  const errorKey = error instanceof Error ? ({ AI_OUTPUT_INVALID: 'studio.aiInvalid', AI_OUTPUT_TRUNCATED: 'studio.aiTruncated', AI_OUTPUT_FILTERED: 'studio.aiFiltered' }[error.message]) : undefined;
  return <aside className="studio-coauthor" aria-label={t('studio.coauthor')}>
    <header className="studio-coauthor__header"><Sparkles size={19} /><div><h2>{t('studio.coauthor')}</h2><p>{t('studio.coauthorHint')}</p></div></header>
    <div className="studio-coauthor__body">
      <Field label={t('studio.aiInstruction')}><textarea value={instruction} onChange={event => setInstruction(event.target.value)} rows={3} placeholder={t('studio.aiPlaceholder')} disabled={disabled} /></Field>
      <div className="studio-ai-actions">
        <Button fullWidth tone="primary" leadingIcon={<Sparkles size={15} />} loading={pending && lastTask === 'develop'} disabled={pending || disabled || !hasIdea} onClick={() => void generate('develop')}>{t('studio.develop')}</Button>
        <Button size="sm" tone="secondary" disabled={pending || disabled || !hasIdea} onClick={() => void generate('cast')}>{t('studio.cast')}</Button>
        <Button size="sm" tone="secondary" disabled={pending || disabled || !hasIdea} onClick={() => void generate('review')}>{t('studio.check')}</Button>
      </div>
      {!hasIdea && <p className="studio-help">{t('studio.aiNeedsIdea')}</p>}
      <Link className="studio-text-link studio-model-link" to="/settings/ai">{t('studio.modelSettings')}</Link>
      {Boolean(error) && <FailureNotice message={t(errorKey ?? 'studio.aiError')} error={error} retry={() => void generate(lastTask)} />}
      {error instanceof Error && typeof error.cause === 'string' && <Button tone="secondary" size="sm" disabled={pending || disabled} onClick={() => void generate(lastTask, error.cause as string)}>{t('studio.repairCandidate')}</Button>}
      {pending && <div role="status" className="studio-generating"><h3>{t(repairing ? 'studio.repairing' : 'studio.generating')}</h3><p>{t('studio.generatingHint')}</p><LoadingSkeleton lines={5} /></div>}
      {!proposal && !pending && <div className="studio-ai-empty"><Sparkles size={28} strokeWidth={1.3} /><h3>{t('studio.aiIdle')}</h3><p>{t('studio.aiIdleHint')}</p></div>}
      {proposal && <div className="studio-proposal">
        <h3>{t(proposal.task === 'review' ? 'studio.aiNotes' : 'studio.proposal')}</h3><p>{t(proposal.task === 'review' ? 'studio.reviewNotesHint' : 'studio.proposalHint')}</p>
        {proposal.task === 'review' && proposal.notes.length === 0 && <p role="status">{t('studio.reviewNoFindings')}</p>}
        {proposal.sourceUpdatedAt !== draft.updatedAt && proposal.accepted.length === 0 && <p className="studio-help">{t('studio.changedSince')}</p>}
        {undo && undo.after === draft.updatedAt && <Button size="sm" tone="ghost" disabled={disabled} leadingIcon={<Undo2 size={14} />} onClick={() => { if (disabled) return; updateWorldDraft(draft.id, undo.before); setUndo(null); }}>{t('studio.undo')}</Button>}
        {proposal.task === 'develop' && <>
        <section className="studio-suggestion"><h4>{proposal.content.name}</h4><p>{proposal.content.summary}</p>{acceptButton('identity', { name: proposal.content.name, summary: proposal.content.summary, genre: proposal.content.genre, era: proposal.content.era }, 'studio.replaceIdentity')}</section>
        <section className="studio-suggestion"><h4>{t('studio.setting')}</h4><p>{proposal.content.setting}</p>{acceptButton('setting', { setting: proposal.content.setting }, 'studio.replaceSetting')}</section>
        {proposal.content.rules.map(rule => <section className="studio-suggestion" key={rule.id}><h4>{rule.name}</h4><span className="studio-suggestion__type">{t('studio.rules')}</span><p>{rule.statement}</p>{acceptButton(rule.id, { rules: [...draft.rules, rule] })}</section>)}
        {proposal.content.places.map(place => <section className="studio-suggestion" key={place.id}><h4>{place.name}</h4><span className="studio-suggestion__type">{t('studio.places')}</span><p>{place.summary}</p>{acceptButton(place.id, { places: [...draft.places, place] })}</section>)}
        </>}
        {characterSuggestions.map(character => <section className="studio-suggestion" key={character.id}><h4>{character.name} · {character.role}</h4><span className="studio-suggestion__type">{t('studio.characters')}</span><p>{character.summary}</p><dl><dt>{t('studio.desire')}</dt><dd>{character.desire}</dd><dt>{t('studio.flaw')}</dt><dd>{character.flaw}</dd><dt>{t('studio.voice')}</dt><dd>{character.voice}</dd></dl>{acceptButton(character.id, { characters: [...draft.characters, character] })}</section>)}
        {proposal.notes.length > 0 && <section className="studio-review-notes">{proposal.task !== 'review' && <h4>{t('studio.aiNotes')}</h4>}{proposal.notes.map((note, index) => <div key={index}><strong>{note.title}</strong><p>{note.detail}</p><p>{note.suggestion}</p></div>)}</section>}
      </div>}
    </div>
  </aside>;
}
