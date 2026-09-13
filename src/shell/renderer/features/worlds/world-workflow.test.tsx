import '@testing-library/jest-dom/vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { setStudioLocale } from '../../i18n/index.js';
import { createWorldDraft, worldCreateInput, draftIssues } from './world-draft.js';
import { parseWorldProposal, generateWorldProposal } from './world-ai.js';
import { WorldDraftPage } from './world-notebook.js';
import { useWorldDrafts, loadWorldDrafts, persistWorldDrafts, removeWorldDraft } from './world-draft-store.js';
import { getStudioLocalAppClient } from '../../app-shell/studio-platform.js';
import { createCreatorWorldCore } from './world-core-client.js';
import { TEST_WORLD_CORE } from './world-core-test-fixtures.js';

vi.mock('../../app-shell/studio-platform.js', () => ({ getStudioLocalAppClient: vi.fn() }));
vi.mock('./world-core-client.js', async importOriginal => ({ ...await importOriginal<typeof import('./world-core-client.js')>(), createCreatorWorldCore: vi.fn(), listCreatorWorldRecords: vi.fn(), getWorldCreationEligibility: vi.fn(async () => ({ canCreateWorld: true })) }));

const proposal = {
  name: 'The Glass Tide', summary: 'A coastal city pays for its sea walls with memories.', genre: 'Fantasy', era: 'After the tide',
  setting: 'Only memories freely given can hold back the sea.',
  rules: [{ name: 'The price', statement: 'A memory can only be spent once.' }],
  places: [{ name: 'The exchange', summary: 'A market for remembered lives.' }],
  characters: [{ name: 'Ira', role: 'Wall keeper', summary: 'Keeps the tide away.', desire: 'Recover a lost name.', flaw: 'Afraid to remember.', voice: 'Short, guarded sentences.' }],
  notes: [{ title: 'A limit', detail: 'Memories run out.', suggestion: 'Decide what happens when nobody can pay.' }],
};
const storage = { readJson: vi.fn(), writeJson: vi.fn() };
const generate = vi.fn();

beforeEach(async () => {
  vi.clearAllMocks();
  await setStudioLocale('en');
  vi.mocked(getStudioLocalAppClient).mockReturnValue({ storage, ai: { text: { generateCandidate: generate } } } as unknown as ReturnType<typeof getStudioLocalAppClient>);
  storage.writeJson.mockImplementation(async (_path, value) => ({ value, sizeBytes: JSON.stringify(value).length }));
  useWorldDrafts.setState({ drafts: [], loaded: true, loading: false, saving: false, error: null });
});

describe('World creation and proposal contracts', () => {
  it('maps reviewed setting, rules and places to typed world fields without creating character sources', () => {
    const draft = { ...createWorldDraft(), ...parseWorldProposal(JSON.stringify(proposal)).content };
    const input = worldCreateInput(draft);
    expect(input.id).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/);
    expect(input.visibility).toBe('private');
    expect(input.lorebookDeclaration.identityBaseSetting).toBe(proposal.setting);
    expect(input.core.systems[0]?.systemId).toBe(input.lorebookDeclaration.worldRules[0]?.systemRef);
    expect(input.core.scenes[0]?.name).toBe('The exchange');
    expect(input.core.entities).toEqual([]);
    expect(input.lorebookDeclaration.rolePlacements).toEqual([]);
    expect(input.core.authoring.maintainers).toBeUndefined();
  });

  it('rejects incomplete, revision and already-created drafts before a Realm create', () => {
    const draft = createWorldDraft();
    expect(draftIssues(draft)).toEqual(['name', 'summary', 'setting']);
    expect(() => worldCreateInput(draft)).toThrow();
    expect(() => worldCreateInput(createWorldDraft('', TEST_WORLD_CORE))).toThrow();
    expect(() => worldCreateInput({ ...draft, savedWorld: TEST_WORLD_CORE })).toThrow();
  });

  it('rejects malformed and truncated AI output without changing the draft', async () => {
    expect(() => parseWorldProposal('{"name":"Incomplete"}')).toThrow('AI_OUTPUT_INVALID');
    expect(() => parseWorldProposal(JSON.stringify({ ...proposal, characters: [{ name: 'No purpose' }] }))).toThrow();
    const draft = createWorldDraft('A city of memories');
    generate.mockResolvedValue({ text: JSON.stringify(proposal), finishReason: 'length', traceId: 'trace' });
    await expect(generateWorldProposal(draft, 'develop', '', 'en')).rejects.toThrow('AI_OUTPUT_TRUNCATED');
    expect(draft.name).toBe('');
    expect(draft.proposal).toBeNull();
  });

  it('carries the creator context through the protected AI client and preserves trace provenance', async () => {
    const draft = createWorldDraft('A city of memories');
    generate.mockResolvedValue({ text: JSON.stringify(proposal), finishReason: 'stop', traceId: 'real-trace-contract' });
    const result = await generateWorldProposal(draft, 'develop', 'Give them conflicting goals', 'en');
    expect(generate.mock.calls[0]?.[0].messages[1].text).toContain('A city of memories');
    expect(generate.mock.calls[0]?.[0].messages[0].text).toContain('at most 320 Unicode characters');
    expect(generate.mock.calls[0]?.[0].messages[0].text).toContain('at most 8 world rules');
    expect(generate.mock.calls[0]?.[0].messages[0].text).not.toContain('800');
    expect(result.traceId).toBe('real-trace-contract');
    expect(result.accepted).toEqual([]);
    expect(result.task === 'develop' && result.content.characters[0]?.desire).toBe(proposal.characters[0]?.desire);
  });

  it('rejects a world AI candidate above the source declaration limits', () => {
    expect(() => parseWorldProposal(JSON.stringify({ ...proposal, setting: '界'.repeat(321) }))).toThrow('AI_OUTPUT_INVALID');
    expect(() => parseWorldProposal(JSON.stringify({ ...proposal, setting: 'A'.repeat(318) + '\r\nB' }))).toThrow('AI_OUTPUT_INVALID');
    expect(() => parseWorldProposal(JSON.stringify({ ...proposal, setting: '界'.repeat(320) }))).not.toThrow();
  });

  it('reviews only notes and proposes a cast without requiring regenerated world fields', async () => {
    const draft = { ...createWorldDraft(), ...parseWorldProposal(JSON.stringify(proposal)).content };
    generate.mockResolvedValueOnce({ text: JSON.stringify({ notes: proposal.notes }), finishReason: 'stop', traceId: 'review-trace' });
    const review = await generateWorldProposal(draft, 'review', '', 'en');
    expect(review.task).toBe('review');
    expect(review).not.toHaveProperty('content');
    generate.mockResolvedValueOnce({ text: JSON.stringify({ characters: proposal.characters, notes: [] }), finishReason: 'stop', traceId: 'cast-trace' });
    const cast = await generateWorldProposal(draft, 'cast', '', 'en');
    expect(cast.task === 'cast' && cast.characters[0]?.name).toBe('Ira');
    expect(cast).not.toHaveProperty('content');
  });

  it('formats an existing candidate only through a separate real AI request contract', async () => {
    const draft = createWorldDraft('A world');
    generate.mockResolvedValueOnce({ text: JSON.stringify({ characters: proposal.characters, notes: [] }), finishReason: 'stop', traceId: 'format-trace' });
    const candidate = await generateWorldProposal(draft, 'cast', '', 'en', '{malformed candidate text');
    expect(generate.mock.calls[0]?.[0].messages[1].text).toContain('{malformed candidate text');
    expect(generate.mock.calls[0]?.[0].messages[0].text).toContain('Do not invent missing');
    expect(candidate.traceId).toBe('format-trace');
    expect(draft.characters).toHaveLength(0);
  });
});

describe('Protected draft storage', () => {
  it.each([
    { task: 'develop', accepted: [], notes: [], traceId: 'trace', sourceUpdatedAt: 'now' },
    { task: 'cast', accepted: [], notes: [], characters: [null], traceId: 'trace', sourceUpdatedAt: 'now' },
    { task: 'review', accepted: [], notes: [{ title: {}, detail: 'Issue', suggestion: 'Fix' }], traceId: 'trace', sourceUpdatedAt: 'now' },
  ])('rejects unreadable persisted proposals without overwriting storage: $task', async invalidProposal => {
    useWorldDrafts.setState({ loaded: false });
    storage.readJson.mockResolvedValue({ value: [{ ...createWorldDraft(), proposal: invalidProposal }] });
    await loadWorldDrafts();
    expect(useWorldDrafts.getState().loaded).toBe(false);
    expect(useWorldDrafts.getState().error).toContain('unreadable');
    await expect(persistWorldDrafts()).rejects.toThrow();
    expect(storage.writeJson).not.toHaveBeenCalled();
  });

  it('loads complete persisted proposals without changing their content or identities', async () => {
    const draft = createWorldDraft('A city of memories');
    draft.proposal = { ...parseWorldProposal(JSON.stringify(proposal)), task: 'develop', traceId: 'trace', sourceUpdatedAt: draft.updatedAt, accepted: [] };
    useWorldDrafts.setState({ loaded: false });
    storage.readJson.mockResolvedValue({ value: [draft] });
    await loadWorldDrafts();
    expect(useWorldDrafts.getState().loaded).toBe(true);
    expect(useWorldDrafts.getState().drafts).toEqual([draft]);
  });

  it('does not overwrite unread or corrupt draft storage', async () => {
    useWorldDrafts.setState({ loaded: false });
    storage.readJson.mockResolvedValue({ value: { broken: true } });
    await loadWorldDrafts();
    expect(useWorldDrafts.getState().loaded).toBe(false);
    await expect(persistWorldDrafts()).rejects.toThrow();
    expect(storage.writeJson).not.toHaveBeenCalled();
  });

  it('distinguishes a missing file from a transport failure', async () => {
    useWorldDrafts.setState({ loaded: false });
    storage.readJson.mockRejectedValue({ reasonCode: 'not-found' });
    await loadWorldDrafts();
    expect(useWorldDrafts.getState().loaded).toBe(true);
    useWorldDrafts.setState({ loaded: false });
    storage.readJson.mockRejectedValue(new Error('transport unavailable'));
    await loadWorldDrafts();
    expect(useWorldDrafts.getState().loaded).toBe(false);
  });

  it('preserves in-memory work and exposes write failure', async () => {
    const draft = createWorldDraft('Keep my work');
    useWorldDrafts.setState({ drafts: [draft] });
    storage.writeJson.mockRejectedValue(new Error('storage unavailable'));
    await expect(persistWorldDrafts()).rejects.toThrow('storage unavailable');
    expect(useWorldDrafts.getState().drafts[0]?.brief).toBe('Keep my work');
    expect(useWorldDrafts.getState().error).toBe('storage unavailable');
  });

  it('restores a draft when its deletion cannot be persisted', async () => {
    const draft = createWorldDraft('Keep on failed deletion');
    useWorldDrafts.setState({ drafts: [draft] });
    storage.writeJson.mockRejectedValueOnce(new Error('storage unavailable'));
    await expect(removeWorldDraft(draft.id)).rejects.toThrow();
    expect(useWorldDrafts.getState().drafts[0]?.id).toBe(draft.id);
  });
});

function renderDraft(draft: ReturnType<typeof createWorldDraft>, chapter = 'overview') {
  useWorldDrafts.setState({ drafts: [draft] });
  return render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })}><MemoryRouter initialEntries={[`/drafts/${draft.id}?chapter=${chapter}`]}><Routes><Route path="/drafts/:draftId" element={<WorldDraftPage />} /></Routes></MemoryRouter></QueryClientProvider>);
}

describe('Creator review interaction', () => {
  it('locks proposal undo while the reviewed world is being saved', async () => {
    const draft = { ...createWorldDraft(), ...parseWorldProposal(JSON.stringify(proposal)).content };
    draft.proposal = { ...parseWorldProposal(JSON.stringify(proposal)), task: 'develop', traceId: 'trace', sourceUpdatedAt: draft.updatedAt, accepted: [] };
    let finishSave!: (world: typeof TEST_WORLD_CORE) => void;
    vi.mocked(createCreatorWorldCore).mockReturnValueOnce(new Promise(resolve => { finishSave = resolve; }));
    renderDraft(draft, 'review');
    fireEvent.click(screen.getByRole('button', { name: 'Use name & summary' }));
    expect(screen.getByRole('button', { name: 'Undo last addition' })).toBeEnabled();
    fireEvent.click(screen.getByRole('checkbox'));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Create in Realm' })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: 'Create in Realm' }));
    await waitFor(() => expect(createCreatorWorldCore).toHaveBeenCalledOnce());
    const locked = screen.getByRole('button', { name: 'Undo last addition' });
    const submittedDraft = useWorldDrafts.getState().drafts[0];
    fireEvent.click(locked);
    const unchanged = useWorldDrafts.getState().drafts[0] === submittedDraft;
    const disabled = locked.hasAttribute('disabled');
    await act(async () => { finishSave({ ...TEST_WORLD_CORE, id: draft.id }); });
    await act(async () => { await persistWorldDrafts(); });
    expect(disabled).toBe(true);
    expect(unchanged).toBe(true);
    expect(useWorldDrafts.getState().drafts[0]?.savedWorld?.id).toBe(draft.id);
  });

  it('reports a completed review with no specific findings without claiming world readiness', () => {
    const draft = createWorldDraft('A city of memories');
    draft.proposal = { task: 'review', notes: [], traceId: 'trace', sourceUpdatedAt: draft.updatedAt, accepted: [] };
    renderDraft(draft);
    expect(screen.getByText('This review is complete and proposed no specific changes. You can ask it to examine a particular rule or relationship next.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Use name & summary' })).not.toBeInTheDocument();
  });
  it('keeps AI proposals separate until a creator adopts them and supports undo', async () => {
    const draft = createWorldDraft('A city of memories');
    draft.proposal = { ...parseWorldProposal(JSON.stringify(proposal)), task: 'develop', traceId: 'trace', sourceUpdatedAt: draft.updatedAt, accepted: [] };
    renderDraft(draft);
    expect(screen.getByLabelText('World name')).toHaveValue('');
    fireEvent.click(screen.getByRole('button', { name: 'Use name & summary' }));
    expect(screen.getByLabelText('World name')).toHaveValue('The Glass Tide');
    fireEvent.click(screen.getByRole('button', { name: 'Undo last addition' }));
    expect(screen.getByLabelText('World name')).toHaveValue('');
    await persistWorldDrafts();
  });

  it('requires human review and a canonical response before showing Realm success', async () => {
    const draft = { ...createWorldDraft(), ...parseWorldProposal(JSON.stringify(proposal)).content };
    vi.mocked(createCreatorWorldCore).mockRejectedValueOnce(new Error('Realm unavailable'));
    renderDraft(draft, 'review');
    expect(screen.getByRole('button', { name: 'Create in Realm' })).toBeDisabled();
    fireEvent.click(screen.getByRole('checkbox'));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Create in Realm' })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: 'Create in Realm' }));
    await screen.findByText('The world was not saved to Realm. Your draft is preserved. Check the details and retry.');
    expect(useWorldDrafts.getState().drafts[0]?.savedWorld).toBeNull();
    vi.mocked(createCreatorWorldCore).mockResolvedValueOnce({ ...TEST_WORLD_CORE, id: draft.id });
    fireEvent.click(screen.getByRole('button', { name: 'Create in Realm' }));
    await waitFor(() => expect(useWorldDrafts.getState().drafts[0]?.savedWorld?.id).toBe(draft.id));
    await persistWorldDrafts();
  });
});
