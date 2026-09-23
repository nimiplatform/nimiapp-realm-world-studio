import type { NimiAppActivityPutInput } from '@nimiplatform/sdk/app';
import i18next from 'i18next';
import type { WorldDraft, WorldProposal } from './world-draft.js';

// @nimi-authority: rule.realm-world-studio.runtime-ai.r015
// A generated coauthor candidate is creator review work. Studio publishes it
// as one App activity todo whose revision follows the candidate lifecycle:
// 1 while it awaits review, 2 once the creator finishes the review (completed)
// or the candidate is replaced or its draft deleted (cancelled).

export const COAUTHOR_ACTIVITY_TYPE = 'nimi.realm-world-studio.coauthor-candidate.v1';
const DRAFT_OBJECT = /^draft:([0-9A-Z]{26})$/u;

export type WorldActivityPublication = Omit<NimiAppActivityPutInput, 'occurredAt' | 'agentHandle'> & { occurredAt: string };
type Outcome = 'open' | 'completed' | 'cancelled';

export function draftObjectRef(draftId: string): string {
  return `draft:${draftId}`;
}

export function draftIdFromObjectRef(objectRef: string): string | null {
  return DRAFT_OBJECT.exec(objectRef)?.[1] ?? null;
}

function suggestionCount(proposal: WorldProposal): number {
  if (proposal.task === 'develop') {
    const content = proposal.content;
    return 2 + content.rules.length + content.places.length + content.characters.length;
  }
  return proposal.task === 'cast' ? proposal.characters.length : 0;
}

/** Builds the publication for one candidate state; the result is stored verbatim for retries. */
export function coauthorActivity(draft: WorldDraft, proposal: WorldProposal, outcome: Outcome, occurredAt: string): WorldActivityPublication {
  const worldName = (draft.name.trim() || i18next.t('studio.untitled')).replace(/\s+/gu, ' ').slice(0, 150);
  const suggestions = suggestionCount(proposal);
  const notes = proposal.notes.length;
  return {
    key: `coauthor:${draft.id}:${proposal.traceId}`.slice(0, 256),
    revision: outcome === 'open' ? 1 : 2,
    kind: 'todo',
    todoState: outcome,
    attention: outcome === 'open',
    title: i18next.t(`activity.coauthor.title.${proposal.task}`, { name: worldName }),
    summary: i18next.t('activity.coauthor.summary', { suggestions, notes }),
    objectRef: draftObjectRef(draft.id),
    type: COAUTHOR_ACTIVITY_TYPE,
    data: {
      worldName, task: proposal.task, suggestions, notes,
      ...(outcome === 'completed' ? { adopted: proposal.accepted.length } : {}),
    },
    occurredAt,
  };
}

/** The stored outbox admits only Studio's own bounded review publications. */
export function isStoredWorldActivity(value: unknown): value is WorldActivityPublication {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const entry = value as Record<string, unknown>;
  const data = entry.data as Record<string, unknown> | null;
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
  const draftId = typeof entry.objectRef === 'string' ? draftIdFromObjectRef(entry.objectRef) : null;
  const open = entry.todoState === 'open';
  const completed = entry.todoState === 'completed';
  return Object.keys(entry).every(key => ['key', 'revision', 'kind', 'todoState', 'attention', 'title', 'summary', 'objectRef', 'type', 'data', 'occurredAt'].includes(key))
    && draftId !== null && typeof entry.key === 'string' && entry.key.startsWith(`coauthor:${draftId}:`)
    && isLine(entry.key, 256) && entry.key.length > `coauthor:${draftId}:`.length
    && entry.kind === 'todo' && (open || completed || entry.todoState === 'cancelled')
    && entry.revision === (open ? 1 : 2) && entry.attention === open
    && entry.type === COAUTHOR_ACTIVITY_TYPE && isLine(entry.title, 512)
    && typeof entry.summary === 'string' && new TextEncoder().encode(entry.summary).length <= 4096
    && typeof entry.occurredAt === 'string' && Number.isFinite(Date.parse(entry.occurredAt))
    && typeof data.worldName === 'string' && ['develop', 'cast', 'review'].includes(String(data.task))
    && isCount(data.suggestions) && isCount(data.notes)
    && (completed ? isCount(data.adopted) : data.adopted === undefined)
    && Object.keys(data).every(key => ['worldName', 'task', 'suggestions', 'notes', ...(completed ? ['adopted'] : [])].includes(key));
}

function isLine(value: unknown, maxBytes: number): value is string {
  return typeof value === 'string' && value.trim().length > 0 && !/[\r\n]/u.test(value) && !value.includes('\0')
    && new TextEncoder().encode(value).length <= maxBytes;
}

function isCount(value: unknown): boolean {
  return Number.isSafeInteger(value) && (value as number) >= 0;
}

export function mergeWorldActivities(current: readonly WorldActivityPublication[], incoming: readonly WorldActivityPublication[]): WorldActivityPublication[] {
  const entries = new Map(current.map(entry => [entry.key, entry]));
  for (const entry of incoming) {
    if ((entries.get(entry.key)?.revision ?? 0) <= entry.revision) entries.set(entry.key, entry);
  }
  return [...entries.values()];
}
