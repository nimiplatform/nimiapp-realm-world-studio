import '@testing-library/jest-dom/vitest';
import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setStudioLocale } from '../../i18n/index.js';
import {
  createCreatorWorldCore,
  getCreatorWorld,
  getCreatorWorldCharacterCore,
  getCreatorWorldCharacterDetail,
  getCreatorWorldWorkbench,
  listCreatorWorlds,
  replaceCreatorWorldCharacterCore,
  replaceCreatorWorldCore,
} from './world-core-client.js';
import {
  CreatorWorldCharacterDetailPage,
  CreatorWorldCharacterEditPage,
  CreatorWorldCreatePage,
  CreatorWorldDetailPage,
  CreatorWorldEditPage,
  CreatorWorldListPage,
} from './worlds-pages.js';

vi.mock('./world-core-client.js', () => ({
  listCreatorWorlds: vi.fn(),
  getCreatorWorldWorkbench: vi.fn(),
  getCreatorWorld: vi.fn(),
  getCreatorWorldCharacterCore: vi.fn(),
  getCreatorWorldCharacterDetail: vi.fn(),
  createCreatorWorldCore: vi.fn(),
  replaceCreatorWorldCore: vi.fn(),
  replaceCreatorWorldCharacterCore: vi.fn(),
}));

const worldSummary = {
  id: 'world-yuan-academy',
  name: '元代文人书院世界',
  summary: '创作者维护的元代文人世界源。',
  visibility: 'private' as const,
  schemaVersion: 'world-core.v1',
  contentHash: 'hash-world-1',
  contentRevision: 7,
  originKind: 'manual' as const,
  creatorId: 'creator-1',
  updatedAt: '2026-07-09T01:00:00.000Z',
  entityKinds: ['人物', '书院'],
  relationshipTypes: ['师承', '同僚'],
  tags: ['历史'],
  characterCountExact: 1,
};

const characterSummary = {
  id: 'yao-sui',
  worldId: 'world-yuan-academy',
  entityId: 'entity-yao-sui',
  name: '姚燧',
  role: '元代文人',
  summary: '世界拥有的人物源。',
  schemaVersion: 'world-character.v1',
  contentHash: 'hash-character-1',
  contentRevision: 3,
  originKind: 'manual' as const,
  updatedAt: '2026-07-09T01:10:00.000Z',
  tags: ['文人'],
};

const worldCore = {
  ...worldSummary,
  createdAt: '2026-07-09T00:00:00.000Z',
  origin: { kind: 'manual' as const },
  core: {
    identity: {
      name: '元代文人书院世界',
      summary: '创作者维护的元代文人世界源。',
    },
  },
};

const characterCore = {
  ...characterSummary,
  createdAt: '2026-07-09T00:10:00.000Z',
  origin: { kind: 'manual' as const },
  core: {
    profile: {
      displayName: '姚燧',
      role: '元代文人',
      summary: '世界拥有的人物源。',
    },
  },
};

function renderWithRouter(initialEntry: string, element: ReactNode) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/worlds" element={element} />
          <Route path="/worlds/new" element={element} />
          <Route path="/worlds/:worldId" element={element} />
          <Route path="/worlds/:worldId/edit" element={element} />
          <Route path="/worlds/:worldId/characters/:characterId" element={element} />
          <Route path="/worlds/:worldId/characters/:characterId/edit" element={element} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('Realm World Studio worlds pages', () => {
  beforeEach(async () => {
    await setStudioLocale('zh-CN');
    vi.mocked(listCreatorWorlds).mockResolvedValue([worldSummary]);
    vi.mocked(getCreatorWorld).mockResolvedValue(worldCore);
    vi.mocked(getCreatorWorldWorkbench).mockResolvedValue({
      world: worldSummary,
      characters: [characterSummary],
    });
    vi.mocked(getCreatorWorldCharacterCore).mockResolvedValue(characterCore);
    vi.mocked(getCreatorWorldCharacterDetail).mockResolvedValue({
      character: characterSummary,
      rawCore: { profile: { displayName: '姚燧' } },
    });
    vi.mocked(createCreatorWorldCore).mockResolvedValue(worldCore);
    vi.mocked(replaceCreatorWorldCore).mockResolvedValue({
      ...worldCore,
      contentHash: 'hash-world-2',
      contentRevision: 8,
    });
    vi.mocked(replaceCreatorWorldCharacterCore).mockResolvedValue({
      ...characterCore,
      contentHash: 'hash-character-2',
      contentRevision: 4,
    });
  });

  afterEach(async () => {
    vi.clearAllMocks();
    await setStudioLocale('en');
  });

  it('renders creator WorldCore inventory without public-atlas vocabulary', async () => {
    renderWithRouter('/worlds', <CreatorWorldListPage />);

    expect(await screen.findByRole('heading', { name: '创作者世界', level: 1 })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: '元代文人书院世界', level: 2 })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '打开工作台' })).toHaveAttribute('href', '/worlds/world-yuan-academy');
    expect(screen.queryByText(new RegExp('World ' + 'Atlas', 'i'))).not.toBeInTheDocument();
    expect(screen.queryByText(/可结识人物/)).not.toBeInTheDocument();
  });

  it('renders a creator workbench over WorldCore and WorldCharacterCore data', async () => {
    renderWithRouter('/worlds/world-yuan-academy', <CreatorWorldDetailPage />);

    expect(await screen.findByRole('heading', { name: '元代文人书院世界', level: 1 })).toBeInTheDocument();
    expect(screen.getByText('WorldCore')).toBeInTheDocument();
    expect(screen.getByText('WorldCharacterCore')).toBeInTheDocument();
    expect(screen.getByText('hash-world-1')).toBeInTheDocument();
    const characterRow = screen.getByRole('heading', { name: '姚燧', level: 3 }).closest('article');
    expect(characterRow).not.toBeNull();
    expect(within(characterRow as HTMLElement).getByRole('link', { name: '打开人物' })).toHaveAttribute(
      'href',
      '/worlds/world-yuan-academy/characters/yao-sui',
    );
  });

  it('renders world-character detail with parent world authority', async () => {
    renderWithRouter('/worlds/world-yuan-academy/characters/yao-sui', <CreatorWorldCharacterDetailPage />);

    expect(await screen.findByRole('heading', { name: '姚燧', level: 1 })).toBeInTheDocument();
    expect(screen.getByText('entity-yao-sui')).toBeInTheDocument();
    expect(screen.getByText('hash-character-1')).toBeInTheDocument();
    expect(screen.getByText('原始 core payload 预览')).toBeInTheDocument();
  });

  it('submits world creation only through typed CreateWorldCoreDto input', async () => {
    renderWithRouter('/worlds/new', <CreatorWorldCreatePage />);

    expect(await screen.findByRole('heading', { name: '创建 WorldCore', level: 1 })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/世界 id/), { target: { value: 'world-draft-1' } });
    fireEvent.change(screen.getByLabelText(/Core JSON/), {
      target: { value: JSON.stringify({ identity: { name: '草稿世界' } }) },
    });
    fireEvent.click(screen.getByRole('button', { name: '创建 WorldCore' }));

    await waitFor(() => expect(createCreatorWorldCore).toHaveBeenCalledWith({
      id: 'world-draft-1',
      core: { identity: { name: '草稿世界' } },
      origin: { kind: 'manual' },
      visibility: 'private',
    }));
  });

  it('submits world replacement with baseContentHash from the latest Realm read', async () => {
    renderWithRouter('/worlds/world-yuan-academy/edit', <CreatorWorldEditPage />);

    expect(await screen.findByRole('heading', { name: '替换 WorldCore', level: 1 })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/Core JSON/), {
      target: { value: JSON.stringify({ identity: { name: '更新世界' } }) },
    });
    fireEvent.click(screen.getByRole('button', { name: '保存 WorldCore' }));

    await waitFor(() => expect(replaceCreatorWorldCore).toHaveBeenCalledWith('world-yuan-academy', {
      id: 'world-yuan-academy',
      baseContentHash: 'hash-world-1',
      core: { identity: { name: '更新世界' } },
      origin: { kind: 'manual' },
      visibility: 'private',
    }));
  });

  it('submits world-character replacement with parent world context and base hash', async () => {
    renderWithRouter('/worlds/world-yuan-academy/characters/yao-sui/edit', <CreatorWorldCharacterEditPage />);

    expect(await screen.findByRole('heading', { name: '替换 WorldCharacterCore', level: 1 })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/Core JSON/), {
      target: { value: JSON.stringify({ profile: { displayName: '姚燧更新' } }) },
    });
    fireEvent.click(screen.getByRole('button', { name: '保存 WorldCharacterCore' }));

    await waitFor(() => expect(replaceCreatorWorldCharacterCore).toHaveBeenCalledWith(
      'world-yuan-academy',
      'yao-sui',
      {
        id: 'yao-sui',
        baseContentHash: 'hash-character-1',
        core: { profile: { displayName: '姚燧更新' } },
        entityId: 'entity-yao-sui',
        origin: { kind: 'manual' },
      },
    ));
  });

  it('blocks world-character replacement when the parent world is read-only system authority', async () => {
    vi.mocked(getCreatorWorld).mockResolvedValueOnce({
      ...worldCore,
      visibility: 'system' as const,
    });

    renderWithRouter('/worlds/world-yuan-academy/characters/yao-sui/edit', <CreatorWorldCharacterEditPage />);

    expect(await screen.findByRole('heading', { name: '替换 WorldCharacterCore', level: 1 })).toBeInTheDocument();
    expect(screen.getByText(/系统世界在 Realm World Studio 中只读/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '保存 WorldCharacterCore' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: '保存 WorldCharacterCore' }));
    expect(replaceCreatorWorldCharacterCore).not.toHaveBeenCalled();
  });
});
