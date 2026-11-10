import { studioTestScope } from '../../../../test/studio-scope.js';
import { beforeEach, expect, it, vi } from 'vitest';
import { createWorldDraft } from './world-draft.js';
import { coauthorActivity } from './world-activity-model.js';
import type { WorldDraftDocument } from './world-draft-storage.js';

vi.mock('../../app-shell/studio-platform.js', () => ({ getStudioClient: vi.fn() }));
vi.mock('../../infra/telemetry/renderer-log.js', () => ({ logRendererEvent: vi.fn(), describeError: String }));

beforeEach(() => { vi.resetModules(); vi.clearAllMocks(); });

it.each(['completed', 'cancelled'] as const)('publishes a saved %s review after a full renderer restart', async (outcome) => {
  const draft = createWorldDraft('A drowned archive');
  draft.proposal = { task: 'review', notes: [], traceId: 'trace-restart', sourceUpdatedAt: draft.updatedAt, generatedAt: draft.updatedAt, accepted: [] };
  const terminal = coauthorActivity(draft, draft.proposal, outcome, draft.updatedAt);
  let document: WorldDraftDocument = { drafts: [draft], activityOutbox: [] };
  let available = false;
  const client = {
    storage: {
      readJson: vi.fn(async () => ({ value: structuredClone(document) })),
      writeJson: vi.fn(async (_path: string, value: WorldDraftDocument) => { document = structuredClone(value); }),
    },
    activity: { put: vi.fn(async () => { if (!available) throw new Error('Runtime unavailable'); return { changed: true }; }) },
  };
  const platform = await import('../../app-shell/studio-platform.js');
  vi.mocked(platform.getStudioClient).mockReturnValue(client as never);
  const store = await import('./world-draft-store.js');
  const activity = await import('./world-activity.js');
  activity.beginWorldActivitySession(studioTestScope);
  await store.loadWorldDrafts(studioTestScope);
  if (outcome === 'completed') {
    store.updateWorldDraft(studioTestScope, draft.id, { proposal: null });
    store.publishAfterDraftSave(studioTestScope, [terminal]);
    await store.persistWorldDrafts(studioTestScope);
  } else {
    await store.removeWorldDraft(studioTestScope, draft.id);
  }
  await activity.flushWorldActivity(studioTestScope);
  expect(document.activityOutbox).toEqual([expect.objectContaining({ todoState: outcome, revision: 2 })]);
  activity.endWorldActivitySession(studioTestScope);
  store.endWorldDraftSession(studioTestScope);
  vi.resetModules();
  available = true;
  client.activity.put.mockClear();
  const reopenedPlatform = await import('../../app-shell/studio-platform.js');
  vi.mocked(reopenedPlatform.getStudioClient).mockReturnValue(client as never);
  const reopenedStore = await import('./world-draft-store.js');
  const reopenedActivity = await import('./world-activity.js');
  reopenedActivity.beginWorldActivitySession(studioTestScope);
  await reopenedStore.loadWorldDrafts(studioTestScope);
  await reopenedActivity.reconcileWorldActivity(studioTestScope, reopenedStore.getWorldDraftState(studioTestScope).store.getState().drafts);
  expect(client.activity.put).toHaveBeenCalledWith(expect.objectContaining({ key: terminal.key, revision: 2, todoState: outcome }));
  expect(document.activityOutbox).toEqual([]);
  reopenedActivity.endWorldActivitySession(studioTestScope);
});
