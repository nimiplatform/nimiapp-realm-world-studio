import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { getStudioLocalAppClient } from '../../app-shell/studio-platform.js';
import {
  beginWorldActivitySession,
  endWorldActivitySession,
  queueWorldActivity,
  reconcileWorldActivity,
  registerWorldActivityOpenHandler,
  retryWorldActivity,
  subscribeWorldActivitySync,
} from './world-activity.js';
import { coauthorActivity, COAUTHOR_ACTIVITY_TYPE } from './world-activity-model.js';
import { readWorldDraftDocument, updateWorldDraftDocument } from './world-draft-storage.js';
import { createWorldDraft, type WorldDraft, type WorldProposal } from './world-draft.js';

vi.mock('../../app-shell/studio-platform.js', () => ({ getStudioLocalAppClient: vi.fn() }));
vi.mock('../../infra/telemetry/renderer-log.js', () => ({ logRendererEvent: vi.fn(), describeError: (error: unknown) => String(error) }));

type Entry = { key: string; revision: number; todoState: string };
type OpenRequest = { activityId: string; objectRef: string; type: string };

const DOCUMENT = 'world-studio/drafts.json';

function fakeClient(put: (input: Entry) => Promise<unknown>) {
  const storage = new Map<string, unknown>([[DOCUMENT, { drafts: [], activityOutbox: [] }]]);
  const attempts: Array<{ key: string; revision: number }> = [];
  let handler: ((request: OpenRequest) => Promise<string>) | undefined;
  const client = {
    storage: {
      readJson: vi.fn(async (path: string) => {
        if (!storage.has(path)) throw Object.assign(new Error('missing'), { reasonCode: 'not-found' });
        return { value: structuredClone(storage.get(path)) };
      }),
      writeJson: vi.fn(async (path: string, value: unknown) => {
        storage.set(path, structuredClone(value));
        return { sizeBytes: 1 };
      }),
    },
    activity: {
      put: vi.fn(async (input: Entry) => {
        attempts.push({ key: input.key, revision: input.revision });
        return put(input);
      }),
      onOpenRequest: vi.fn((next: typeof handler) => { handler = next; return { stop: async () => undefined }; }),
    },
  };
  vi.mocked(getStudioLocalAppClient).mockReturnValue(client as never);
  return {
    client,
    attempts,
    storage,
    outbox: () => (storage.get(DOCUMENT) as { activityOutbox: Entry[] }).activityOutbox,
    open: (request: OpenRequest) => handler!(request),
  };
}

function draftWithProposal(traceId = 'trace-1'): WorldDraft {
  const draft = createWorldDraft('A drowned archive');
  draft.name = 'Tidewater';
  const proposal: WorldProposal = {
    task: 'review', notes: [{ title: 'Gap', detail: 'The tides are unexplained.', suggestion: 'Tie them to the archive.' }],
    traceId, sourceUpdatedAt: draft.updatedAt, generatedAt: '2026-09-23T01:00:00.000Z', accepted: [],
  };
  return { ...draft, proposal };
}

function openEntry(draft: WorldDraft) {
  return coauthorActivity(draft, draft.proposal!, 'open', draft.proposal!.generatedAt!);
}

function syncReports() {
  const reports: (number | null)[] = [];
  const unsubscribe = subscribeWorldActivitySync((count) => reports.push(count));
  return { reports, unsubscribe };
}

beforeEach(() => {
  vi.clearAllMocks();
  beginWorldActivitySession();
});

afterEach(() => {
  endWorldActivitySession();
});

it('publishes a candidate as a todo whose revision follows its review lifecycle', () => {
  const draft = draftWithProposal();
  const open = openEntry(draft);
  expect(open).toMatchObject({
    key: `coauthor:${draft.id}:trace-1`, revision: 1, kind: 'todo', todoState: 'open', attention: true,
    objectRef: `draft:${draft.id}`, type: COAUTHOR_ACTIVITY_TYPE,
    data: { worldName: 'Tidewater', task: 'review', suggestions: 0, notes: 1 }, occurredAt: '2026-09-23T01:00:00.000Z',
  });
  const completed = coauthorActivity(draft, { ...draft.proposal!, accepted: ['identity'] }, 'completed', '2026-09-23T02:00:00.000Z');
  expect(completed).toMatchObject({ revision: 2, todoState: 'completed', attention: false, data: { adopted: 1 } });
  expect(JSON.stringify(open)).not.toContain('The tides are unexplained');
});

it('keeps a failed publication, reports it as not synced, and publishes it on an explicit retry', async () => {
  let available = false;
  const { client, outbox } = fakeClient(async () => {
    if (!available) throw Object.assign(new Error('down'), { reasonCode: 'runtime-service-unavailable' });
    return { changed: true };
  });
  const sync = syncReports();
  const draft = draftWithProposal();
  await queueWorldActivity([openEntry(draft)]);
  expect(outbox()).toHaveLength(1);
  // A later state of the same record replaces the pending one.
  await queueWorldActivity([coauthorActivity(draft, draft.proposal!, 'completed', '2026-09-23T02:00:00.000Z')]);
  expect(outbox()!.map((entry) => [entry.revision, entry.todoState])).toEqual([[2, 'completed']]);
  expect(sync.reports.at(-1)).toBe(1);
  available = true;
  await expect(retryWorldActivity()).resolves.toBe(0);
  expect(outbox()).toEqual([]);
  expect(sync.reports.at(-1)).toBe(0);
  expect(client.activity.put).toHaveBeenLastCalledWith(expect.objectContaining({ revision: 2, todoState: 'completed' }));
  sync.unsubscribe();
});

it('never drops a publication Runtime rejects; it stays not synced until a retry succeeds', async () => {
  const { outbox } = fakeClient(async () => { throw Object.assign(new Error('rejected'), { reasonCode: 'local-app-operation-unavailable' }); });
  const sync = syncReports();
  await queueWorldActivity([openEntry(draftWithProposal())]);
  expect(outbox()).toHaveLength(1);
  expect(sync.reports.at(-1)).toBe(1);
  await expect(retryWorldActivity()).resolves.toBe(1);
  expect(outbox()).toHaveLength(1);
  sync.unsubscribe();
});

it.each(['readJson', 'writeJson'] as const)('retains and reports a publication when the first %s fails', async (operation) => {
  const { client, outbox } = fakeClient(async () => ({ changed: true }));
  client.storage[operation].mockRejectedValueOnce(new Error('storage unavailable'));
  const sync = syncReports();
  const draft = draftWithProposal();
  const completed = coauthorActivity(draft, draft.proposal!, 'completed', draft.updatedAt);
  await queueWorldActivity([completed]);
  expect(client.activity.put).not.toHaveBeenCalled();
  expect(sync.reports.at(-1)).toBeNull();
  await expect(retryWorldActivity()).resolves.toBe(0);
  expect(client.activity.put).toHaveBeenCalledWith(completed);
  expect(outbox()).toEqual([]);
  sync.unsubscribe();
});

it.each([
  { invalid: 'document' },
  { drafts: [], activityOutbox: { invalid: 'outbox' } },
  { drafts: [], activityOutbox: [null] },
  { drafts: [], activityOutbox: [{ key: 'incomplete' }] },
])('preserves unreadable storage and reports that its pending count is unknown: %j', async (unreadable) => {
  const { client, storage } = fakeClient(async () => ({ changed: true }));
  storage.set(DOCUMENT, unreadable);
  const sync = syncReports();
  await queueWorldActivity([openEntry(draftWithProposal())]);
  expect(sync.reports.at(-1)).toBeNull();
  await expect(retryWorldActivity()).resolves.toBeNull();
  expect(client.storage.writeJson).not.toHaveBeenCalled();
  expect(client.activity.put).not.toHaveBeenCalled();
  expect(storage.get(DOCUMENT)).toEqual(unreadable);
  sync.unsubscribe();
});

it('retries a publication when cleanup failed without dropping the stored record', async () => {
  const { client, outbox } = fakeClient(async () => ({ changed: true }));
  const originalWrite = client.storage.writeJson.getMockImplementation()!;
  client.storage.writeJson.mockImplementationOnce(originalWrite).mockRejectedValueOnce(new Error('cleanup failed'));
  await queueWorldActivity([openEntry(draftWithProposal())]);
  expect(outbox()).toHaveLength(1);
  await expect(retryWorldActivity()).resolves.toBe(0);
  expect(outbox()).toEqual([]);
  expect(client.activity.put).toHaveBeenCalledTimes(2);
});

it('preserves a newer draft and publication when acknowledging an older in-flight revision', async () => {
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  const { client, outbox } = fakeClient(async () => { await gate; return { changed: true }; });
  const draft = draftWithProposal();
  const pending = queueWorldActivity([openEntry(draft)]);
  await vi.waitFor(() => expect(client.activity.put).toHaveBeenCalledTimes(1));
  const completed = coauthorActivity(draft, draft.proposal!, 'completed', draft.updatedAt);
  const newerDraft = { ...draft, name: 'Updated during publication', proposal: null };
  await updateWorldDraftDocument(() => ({ drafts: [newerDraft], activityOutbox: [completed] }));
  release();
  await pending;
  expect(outbox()).toEqual([completed]);
  expect((await readWorldDraftDocument()).drafts).toEqual([newerDraft]);
  await retryWorldActivity();
  expect(client.activity.put).toHaveBeenLastCalledWith(completed);
});

it('does not carry a failed outbox write into another activity session', async () => {
  const first = fakeClient(async () => ({ changed: true }));
  first.client.storage.writeJson.mockRejectedValueOnce(new Error('storage unavailable'));
  await queueWorldActivity([openEntry(draftWithProposal())]);
  endWorldActivitySession();
  const next = fakeClient(async () => ({ changed: true }));
  beginWorldActivitySession();
  await retryWorldActivity();
  expect(next.client.activity.put).not.toHaveBeenCalled();
  expect(next.client.storage.writeJson).not.toHaveBeenCalled();
});

it('does not write an outbox read that finished after the activity session ended', async () => {
  const { client } = fakeClient(async () => ({ changed: true }));
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  client.storage.readJson.mockImplementationOnce(async () => {
    await gate;
    return { value: { drafts: [], activityOutbox: [] } };
  });
  const pending = queueWorldActivity([openEntry(draftWithProposal())]);
  await vi.waitFor(() => expect(client.storage.readJson).toHaveBeenCalledTimes(1));
  endWorldActivitySession();
  release();
  await pending;
  expect(client.storage.writeJson).not.toHaveBeenCalled();
  expect(client.activity.put).not.toHaveBeenCalled();
});

it('treats an existing revision as settled and republishes stored candidates on session start', async () => {
  const { outbox, client } = fakeClient(async () => { throw Object.assign(new Error('conflict'), { reasonCode: 'content-conflict' }); });
  await reconcileWorldActivity([draftWithProposal(), createWorldDraft('no candidate')]);
  expect(client.activity.put).toHaveBeenCalledTimes(1);
  expect(outbox()).toEqual([]);
});

it('stops an in-flight flush when the session ends, before its next publication or outbox write', async () => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => { release = resolve; });
  const first = draftWithProposal('trace-first');
  const second = draftWithProposal('trace-second');
  const { client, attempts, outbox } = fakeClient(async (input) => {
    if (input.key.endsWith(':trace-first')) await gate;
    return { changed: true };
  });
  const pending = queueWorldActivity([openEntry(first), openEntry(second)]);
  await vi.waitFor(() => expect(attempts).toHaveLength(1));
  const writesBefore = client.storage.writeJson.mock.calls.length;
  // The Host reports the session invalidated while the first publication runs.
  endWorldActivitySession();
  release();
  await pending;
  expect(attempts).toEqual([{ key: openEntry(first).key, revision: 1 }]);
  expect(client.storage.writeJson.mock.calls.length).toBe(writesBefore);
  expect(outbox()).toHaveLength(2);
  // Work requested after the session ended never reaches storage or Runtime.
  await queueWorldActivity([openEntry(draftWithProposal('trace-late'))]);
  expect(attempts).toHaveLength(1);
  expect(client.storage.writeJson.mock.calls.length).toBe(writesBefore);
});

it('confirms opened only after navigating into an existing draft of this account', async () => {
  const { open } = fakeClient(async () => ({ changed: true }));
  const draft = draftWithProposal();
  const navigate = vi.fn();
  registerWorldActivityOpenHandler({
    findDraft: async (id) => (id === draft.id ? draft : undefined),
    navigate,
    focus: async () => undefined,
  });
  await expect(open({ activityId: 'act_1', objectRef: `draft:${draft.id}`, type: COAUTHOR_ACTIVITY_TYPE })).resolves.toBe('opened');
  expect(navigate).toHaveBeenCalledWith(`/drafts/${draft.id}`);
  await expect(open({ activityId: 'act_2', objectRef: 'draft:01ZZZZZZZZZZZZZZZZZZZZZZZZ', type: COAUTHOR_ACTIVITY_TYPE })).resolves.toBe('object-unavailable');
  await expect(open({ activityId: 'act_3', objectRef: '/etc/passwd', type: COAUTHOR_ACTIVITY_TYPE })).resolves.toBe('object-unavailable');
  expect(navigate).toHaveBeenCalledTimes(1);
});
