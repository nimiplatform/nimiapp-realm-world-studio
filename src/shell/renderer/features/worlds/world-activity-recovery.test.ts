import { beforeEach, expect, it, vi } from 'vitest';
import { createWorldDraft } from './world-draft.js';
import { coauthorActivity } from './world-activity-model.js';
import type { WorldDraftDocument } from './world-draft-storage.js';

vi.mock('../../app-shell/studio-platform.js', () => ({ getStudioLocalAppClient: vi.fn() }));
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
  vi.mocked(platform.getStudioLocalAppClient).mockReturnValue(client as never);
  const store = await import('./world-draft-store.js');
  const activity = await import('./world-activity.js');
  activity.beginWorldActivitySession();
  await store.loadWorldDrafts();
  if (outcome === 'completed') {
    store.updateWorldDraft(draft.id, { proposal: null });
    store.publishAfterDraftSave([terminal]);
    await store.persistWorldDrafts();
  } else {
    await store.removeWorldDraft(draft.id);
  }
  await activity.flushWorldActivity();
  expect(document.activityOutbox).toEqual([expect.objectContaining({ todoState: outcome, revision: 2 })]);
  activity.endWorldActivitySession();
  store.endWorldDraftSession();
  vi.resetModules();
  available = true;
  client.activity.put.mockClear();
  const reopenedPlatform = await import('../../app-shell/studio-platform.js');
  vi.mocked(reopenedPlatform.getStudioLocalAppClient).mockReturnValue(client as never);
  const reopenedStore = await import('./world-draft-store.js');
  const reopenedActivity = await import('./world-activity.js');
  reopenedActivity.beginWorldActivitySession();
  await reopenedStore.loadWorldDrafts();
  await reopenedActivity.reconcileWorldActivity(reopenedStore.useWorldDrafts.getState().drafts);
  expect(client.activity.put).toHaveBeenCalledWith(expect.objectContaining({ key: terminal.key, revision: 2, todoState: outcome }));
  expect(document.activityOutbox).toEqual([]);
  reopenedActivity.endWorldActivitySession();
});
