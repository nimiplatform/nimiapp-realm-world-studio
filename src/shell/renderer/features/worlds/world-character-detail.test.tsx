import '@testing-library/jest-dom/vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, expect, it, vi } from 'vitest';
import { openDesktopIntent } from '@nimiplatform/kit/shell/renderer/bridge';
import { WorldCharacterDetailPage } from './world-character-page.js';
import { getCreatorWorld, getCreatorWorldCharacterCore } from './world-core-client.js';
import { TEST_WORLD_CORE, TEST_WORLD_CHARACTER_CORE } from './world-core-test-fixtures.js';
import { setStudioLocale } from '../../i18n/index.js';

vi.mock('@nimiplatform/kit/shell/renderer/bridge', () => ({ openDesktopIntent: vi.fn(() => { throw new Error('A source detail must not hand off to an Agent workflow'); }) }));
vi.mock('./world-core-client.js', async original => ({ ...await original<typeof import('./world-core-client.js')>(), getCreatorWorld: vi.fn(), getCreatorWorldCharacterCore: vi.fn() }));

beforeEach(async () => {
  vi.resetAllMocks();
  await setStudioLocale('en');
  vi.mocked(getCreatorWorld).mockResolvedValue(TEST_WORLD_CORE);
  vi.mocked(getCreatorWorldCharacterCore).mockResolvedValue({ ...TEST_WORLD_CHARACTER_CORE, materializationReadiness: { status: 'blocked', blockers: [{ path: 'assets.resourceRefs', code: 'required-array-empty', message: 'Resource coverage incomplete' }] } });
});

function mount() {
  return render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><MemoryRouter initialEntries={[`/worlds/${TEST_WORLD_CORE.id}/characters/${TEST_WORLD_CHARACTER_CORE.id}`]}><Routes><Route path="/worlds/:worldId/characters/:characterId" element={<WorldCharacterDetailPage />} /></Routes></MemoryRouter></QueryClientProvider>);
}

it('shows a saved and editable template independently of downstream readiness', async () => {
  mount();
  expect(await screen.findByText('Character settings saved in Realm')).toBeVisible();
  expect(screen.getByText('Version 3')).toBeVisible();
  expect(screen.getByRole('link', { name: 'Edit character' })).toHaveAttribute('href', `/worlds/${TEST_WORLD_CORE.id}/characters/${TEST_WORLD_CHARACTER_CORE.id}/edit`);
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  expect(screen.queryByText(/Try in Nimi|Materialization readiness|Resource coverage incomplete/)).not.toBeInTheDocument();
  expect(openDesktopIntent).not.toHaveBeenCalled();
});

it('keeps source maintenance available after the parent world changes', async () => {
  vi.mocked(getCreatorWorld).mockResolvedValue({ ...TEST_WORLD_CORE, updatedAt: '2026-09-12T00:00:00.000Z' });
  mount();
  expect(await screen.findByRole('link', { name: 'Edit character' })).toBeVisible();
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  expect(openDesktopIntent).not.toHaveBeenCalled();
});
