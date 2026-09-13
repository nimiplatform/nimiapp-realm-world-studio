import '@testing-library/jest-dom/vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, expect, it, vi } from 'vitest';
import { WorldCharacterEditorPage } from './world-character-page.js';
import { characterWriteBody, newCharacterDraft, type CharacterRecord } from './world-character-model.js';
import { putCharacterDraft, useCharacterDrafts } from './character-draft-store.js';
import { useWorldDrafts } from './world-draft-store.js';
import { getStudioLocalAppClient } from '../../app-shell/studio-platform.js';
import { getCreatorWorld, getCreatorWorldCharacterCore, worldCharacterKey, worldRecordKey } from './world-core-client.js';
import { setStudioLocale } from '../../i18n/index.js';
import { TEST_WORLD_CORE, TEST_WORLD_CHARACTER_CORE } from './world-core-test-fixtures.js';

vi.mock('../../app-shell/studio-platform.js', () => ({ getStudioLocalAppClient: vi.fn() }));
vi.mock('./world-core-client.js', async original => ({ ...await original<typeof import('./world-core-client.js')>(), getCreatorWorld: vi.fn(), getCreatorWorldCharacterCore: vi.fn() }));

const draft = () => {
  const value = newCharacterDraft(TEST_WORLD_CORE.id, 'character-1', null);
  value.form = { name: 'Ira', summary: 'A harbor keeper.', role: 'Keeper', drives: 'Recover a name.', traits: 'Afraid to remember.', tone: 'Short sentences.', greeting: 'Mind the tide.', identityStatement: 'Remain Ira, the harbor keeper.', behavior: 'Ask before taking a memory.', speaking: 'Use concrete and concise words.', boundaries: 'Do not invent future knowledge.' };
  return value;
};

beforeEach(async () => {
  vi.clearAllMocks();
  await setStudioLocale('en');
  useWorldDrafts.setState({ drafts: [], loaded: true, loading: false, saving: false, error: null });
  useCharacterDrafts.setState({ drafts: [], loaded: true, loading: false, saving: false, error: null });
  vi.mocked(getCreatorWorld).mockResolvedValue(TEST_WORLD_CORE);
});

function mount(value: ReturnType<typeof draft>, api: Record<string, unknown>, editing = false) {
  useCharacterDrafts.setState({ drafts: [value] });
  vi.mocked(getStudioLocalAppClient).mockReturnValue({ realm: { worldCore: api }, storage: { writeJson: vi.fn(async () => ({})) } } as unknown as ReturnType<typeof getStudioLocalAppClient>);
  const url = editing ? `/worlds/${value.worldId}/characters/${value.id}/edit` : `/worlds/${value.worldId}/characters/new?characterDraftId=${value.id}`;
  return render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })}><MemoryRouter initialEntries={[url]}><Routes><Route path="/worlds/:worldId/characters/new" element={<WorldCharacterEditorPage />} /><Route path="/worlds/:worldId/characters/:characterId/edit" element={<WorldCharacterEditorPage />} /><Route path="/worlds/:worldId/characters/:characterId" element={<p>Canonical character route</p>} /></Routes></MemoryRouter></QueryClientProvider>);
}

it('requires review, then preserves the draft when the canonical character write fails', async () => {
  const value = draft();
  const create = vi.fn().mockRejectedValue(new Error('Realm unavailable'));
  mount(value, { getCharacter: vi.fn().mockRejectedValue({ reasonCode: 'not-found' }), getEntity: vi.fn().mockResolvedValue({ id: value.entityId, worldId: value.worldId, kind: 'character' }), createCharacter: create });
  await screen.findByLabelText('Name');
  fireEvent.click(screen.getByRole('button', { name: 'Review & save' }));
  expect(screen.getByRole('button', { name: 'Create character in Realm' })).toBeDisabled();
  fireEvent.click(screen.getByRole('checkbox'));
  fireEvent.click(screen.getByRole('button', { name: 'Create character in Realm' }));
  await screen.findByText('The character could not be saved. Your draft and any created world entity have been kept for retry.');
  expect(create).toHaveBeenCalledOnce();
  expect(useCharacterDrafts.getState().drafts[0]).toMatchObject({ saved: false, entityCreated: true, form: value.form });
  expect(screen.queryByText('Canonical character route')).not.toBeInTheDocument();
});

it('shows the new canonical version on conflict and requires another review after rebase', async () => {
  const value = draft();
  const input = characterWriteBody(value, null);
  const source = { ...input, schemaVersion: 'realm.world-character-core/v1', worldId: value.worldId, creatorId: 'creator-1', contentRevision: 1, contentHash: 'a'.repeat(64), sourceHash: 'b'.repeat(64), profile: { ...input.profile, profileHash: 'c'.repeat(64), profileCoverage: { manifestSchemaVersion: 'realm.character-profile-coverage/v1', profileCoverageHash: 'e'.repeat(64), aggregateStatus: 'complete', diagnostics: [], optionalRefs: [], optionalSections: [], requiredRefs: [], requiredSections: [] } }, validity: { status: 'valid', issues: [] }, materializationReadiness: { status: 'ready', blockers: [] }, createdAt: '2026-09-12T00:00:00Z', updatedAt: '2026-09-12T00:00:00Z' } as CharacterRecord;
  value.source = source;
  const latest = { ...source, contentRevision: 2, contentHash: 'd'.repeat(64) };
  vi.mocked(getCreatorWorldCharacterCore).mockResolvedValue(latest);
  const replace = vi.fn();
  mount(value, { getCharacter: vi.fn().mockResolvedValue(latest), replaceCharacter: replace }, true);
  await screen.findByLabelText('Name');
  fireEvent.click(screen.getByRole('button', { name: 'Review & save' }));
  fireEvent.click(screen.getByRole('checkbox'));
  fireEvent.click(screen.getByRole('button', { name: 'Save character changes' }));
  await screen.findByText('This source has changed in Realm.');
  expect(replace).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Keep my draft and review against this version' }));
  expect(screen.getByRole('checkbox')).not.toBeChecked();
  expect(screen.getByRole('button', { name: 'Save character changes' })).toBeDisabled();
  await waitFor(() => expect(useCharacterDrafts.getState().drafts[0]?.source?.contentHash).toBe(latest.contentHash));
  expect(useCharacterDrafts.getState().drafts[0]?.form).toEqual(value.form);
});

it('does not replace a cached character draft when a wrong parent-world route is opened', async () => {
  const source = TEST_WORLD_CHARACTER_CORE;
  const original = newCharacterDraft(source.worldId, source.id, source);
  original.form.summary = 'An unsaved edit that must survive.';
  useCharacterDrafts.setState({ drafts: [original] });
  const otherWorld = { ...TEST_WORLD_CORE, id: 'world-b' };
  vi.mocked(getCreatorWorld).mockResolvedValue(otherWorld);
  let rejectSource!: (error: Error) => void;
  vi.mocked(getCreatorWorldCharacterCore).mockReturnValue(new Promise((_, reject) => { rejectSource = reject; }));
  const writeJson = vi.fn(async () => ({}));
  vi.mocked(getStudioLocalAppClient).mockReturnValue({ storage: { writeJson } } as unknown as ReturnType<typeof getStudioLocalAppClient>);
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  client.setQueryData(worldCharacterKey(source.worldId, source.id), source);
  client.setQueryData(worldRecordKey(otherWorld.id), otherWorld);
  render(<QueryClientProvider client={client}><MemoryRouter initialEntries={[`/worlds/${otherWorld.id}/characters/${source.id}/edit`]}><Routes><Route path="/worlds/:worldId/characters/:characterId/edit" element={<WorldCharacterEditorPage />} /></Routes></MemoryRouter></QueryClientProvider>);
  await waitFor(() => expect(getCreatorWorldCharacterCore).toHaveBeenCalledWith(otherWorld.id, source.id));
  expect(useCharacterDrafts.getState().drafts).toEqual([original]);
  expect(writeJson).not.toHaveBeenCalled();
  rejectSource(new Error('parent world mismatch'));
  await screen.findByText('This character or its source world could not be loaded. Your drafts are preserved.');
  expect(useCharacterDrafts.getState().drafts).toEqual([original]);
  expect(writeJson).not.toHaveBeenCalled();
});

it('rejects a wrong-world draft before touching existing storage', async () => {
  const source = TEST_WORLD_CHARACTER_CORE;
  const original = newCharacterDraft(source.worldId, source.id, source);
  useCharacterDrafts.setState({ drafts: [original] });
  const writeJson = vi.fn();
  vi.mocked(getStudioLocalAppClient).mockReturnValue({ storage: { writeJson } } as unknown as ReturnType<typeof getStudioLocalAppClient>);
  await expect(putCharacterDraft({ ...original, worldId: 'world-b' })).rejects.toThrow('CHARACTER_DRAFT_CONTEXT_MISMATCH');
  expect(useCharacterDrafts.getState().drafts).toEqual([original]);
  expect(writeJson).not.toHaveBeenCalled();
});
