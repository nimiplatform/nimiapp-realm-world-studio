import '@testing-library/jest-dom/vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WorldShowcasePage } from './world-showcase-pages.js';
import { getWorldShowcase } from './world-showcase-public-client.js';
import type { WorldShowcase } from './world-showcase-types.js';
import { setStudioLocale } from '../../i18n/index.js';

vi.mock('./world-showcase-public-client.js', () => ({
  getWorldShowcase: vi.fn(),
}));

const showcaseFixture: WorldShowcase = {
  id: 'yuan-academy-world',
  name: '元代文人书院世界',
  subtitle: '探索元代士人的交游、仕宦与著述网络',
  description: '本世界聚焦元代士人群体的学术社交网络，以书院、交游、仕宦与著述为核心线索。',
  type: 'history',
  tags: ['历史', '书院', '文人'],
  coverImage: 'https://example.test/hero.png',
  icon: 'https://example.test/icon.png',
  theme: {
    id: 'history',
    primaryColor: '#2f8f83',
    secondaryColor: '#c49a4a',
    backgroundStyle: 'paper',
    cardStyle: 'parchment',
    borderStyle: 'ink-line',
    iconStyle: 'seal',
    heroOverlay: 'linear-gradient(90deg, rgba(11,20,28,.78), rgba(11,20,28,.28))',
    typographyTone: 'classical',
    texture: 'rice-paper',
    emptyStateTone: '正在整理中',
    moduleNames: {
      library: '资料馆',
      timeline: '时间长河',
      scenes: '场景',
      settings: '世界设定',
    },
    characterFilters: ['全部', '核心人物', '文人', '官员', '已加好友', '可聊天'],
  },
  moduleNames: {
    library: '资料馆',
    timeline: '时间长河',
    scenes: '场景',
    settings: '世界设定',
  },
  stats: {
    characters: 50,
    resources: 116,
    scenes: 3,
    routes: 3,
  },
  statsCards: [
    { id: 'characters', value: '50', label: '位可结识人物' },
    { id: 'resources', value: '116', label: '条可查阅资料' },
    { id: 'scenes', value: '3', label: '个可探索场景' },
    { id: 'routes', value: '3', label: '条推荐探索路线' },
  ],
  explorationRoutes: [
    {
      id: 'characters-first',
      title: '从核心人物开始',
      summary: '先认识能解释世界关系的人物。',
      steps: ['认识姚燧', '查看关联资料'],
      primaryAction: '浏览人物',
    },
  ],
  characters: [
    {
      id: 'yao-sui',
      name: '姚燧',
      avatar: 'https://example.test/yao.png',
      role: '元代文人、官员、文章家',
      shortBio: '熟悉元代士人交游、书院讲学与仕宦经历。',
      expertise: ['元代士人交游', '书院与讲学', '仕宦经历'],
      topics: ['书院在士人网络中的作用', '元代文人如何建立关系'],
      resourceCount: 6,
      relationCount: 8,
      timeSummary: '1254年 - 1331年',
      status: 'available',
      isFriend: false,
      relationState: 'connectable',
      relatedResources: ['书院讲学网络'],
      relatedScenes: ['书院讲堂'],
      lifeEvents: [
        {
          id: 'yao-birth',
          kind: 'birth',
          kindLabel: '出生',
          periodLabel: '1254年',
          title: '1254年出生',
          summary: '1254年出生于元代士人家庭。',
          sourceLabel: '生平资料',
        },
        {
          id: 'yao-office',
          kind: 'office',
          kindLabel: '任职',
          periodLabel: '1314年',
          title: '1314年任书院山长',
          summary: '1314年任书院山长，主持讲学与士人往来。',
          sourceLabel: '生平资料',
        },
        {
          id: 'yao-work',
          kind: 'work',
          kindLabel: '著述',
          periodLabel: '1320年',
          title: '著述线索',
          summary: '1320年参与整理书院讲义与诗文材料。',
          sourceLabel: '关系线索',
        },
        {
          id: 'yao-death',
          kind: 'death',
          kindLabel: '去世',
          periodLabel: '1331年',
          title: '1331年去世',
          summary: '1331年去世，后由门人整理其诗文材料。',
          sourceLabel: '生平资料',
        },
      ],
      lifeSourceNotes: ['源自已接纳的历史人物图谱。'],
      suggestedQuestions: [
        '元代文人之间如何建立关系？',
        '书院在士人网络中有什么作用？',
      ],
    } as WorldShowcase['characters'][number] & {
      lifeEvents: Array<{
        id: string;
        kind: string;
        kindLabel: string;
        periodLabel: string | null;
        title: string;
        summary: string;
        sourceLabel: string;
      }>;
      lifeSourceNotes: string[];
      timeSummary: string;
    },
  ],
  resources: [
    {
      id: 'academy-network',
      title: '书院讲学网络',
      type: '资料',
      summary: '记录书院、人物与讲学关系。',
      relatedCharacters: ['姚燧'],
      relatedScenes: ['书院讲堂'],
      recordCount: 42,
      tags: ['书院', '关系'],
    },
  ],
  scenes: [
    {
      id: 'academy-hall',
      sceneId: 'academy-hall',
      title: '书院讲堂',
      image: 'https://example.test/scene.png',
      summary: '进入讲学、研讨与师承关系的核心空间。',
      activeEntities: [
        {
          id: 'academy-entity',
          kind: '书院',
          label: '书院讲堂',
          summary: '讲学、研讨与师承关系的核心空间。',
        },
      ],
      relatedCharacters: [
        {
          id: 'yao-sui',
          name: '姚燧',
          avatar: 'https://example.test/yao.png',
          role: '元代文人、官员、文章家',
          shortBio: '熟悉元代士人交游、书院讲学与仕宦经历。',
          expertise: ['元代士人交游', '书院与讲学', '仕宦经历'],
          topics: ['书院在士人网络中的作用', '元代文人如何建立关系'],
          resourceCount: 1,
          relationCount: null,
          timeSummary: '1254年 - 1331年',
          status: 'available',
          isFriend: false,
          relationState: 'connectable',
          relatedResources: ['书院讲学网络'],
          relatedScenes: ['书院讲堂'],
          lifeEvents: [
            {
              id: 'yao-birth',
              kind: 'birth',
              kindLabel: '出生',
              periodLabel: '1254年',
              title: '1254年出生',
              summary: '1254年出生于元代士人家庭。',
              sourceLabel: '生平资料',
            },
            {
              id: 'yao-office',
              kind: 'office',
              kindLabel: '任职',
              periodLabel: '1314年',
              title: '1314年任书院山长',
              summary: '1314年任书院山长，主持讲学与士人往来。',
              sourceLabel: '生平资料',
            },
            {
              id: 'yao-work',
              kind: 'work',
              kindLabel: '著述',
              periodLabel: '1320年',
              title: '著述线索',
              summary: '1320年参与整理书院讲义与诗文材料。',
              sourceLabel: '关系线索',
            },
            {
              id: 'yao-death',
              kind: 'death',
              kindLabel: '去世',
              periodLabel: '1331年',
              title: '1331年去世',
              summary: '1331年去世，后由门人整理其诗文材料。',
              sourceLabel: '生平资料',
            },
          ],
          lifeSourceNotes: ['源自已接纳的历史人物图谱。'],
          suggestedQuestions: [
            '元代文人之间如何建立关系？',
            '书院在士人网络中有什么作用？',
          ],
        } as WorldShowcase['characters'][number] & {
          lifeEvents: Array<{
            id: string;
            kind: string;
            kindLabel: string;
            periodLabel: string | null;
            title: string;
            summary: string;
            sourceLabel: string;
          }>;
          lifeSourceNotes: string[];
          timeSummary: string;
        },
      ],
      relatedEvents: [
        {
          id: 'academy-lecture',
          eventId: 'academy-lecture',
          period: '元代',
          title: '书院讲学',
          summary: '书院中的讲学与问答。',
          sceneRefs: ['academy-hall'],
          locationRefs: ['academy-entity'],
          entityRefs: ['academy-entity'],
          characterRefs: ['yao-sui'],
          sourceRefs: [],
          relatedCharacters: ['姚燧'],
          relatedResources: ['书院讲学网络'],
        },
      ],
      relatedResources: [
        {
          id: 'resource-academy-network',
          title: '书院讲学网络',
          kind: 'system',
          summary: '记录书院、人物与讲学关系。',
          entityRefs: ['academy-entity'],
          eventRefs: ['academy-lecture'],
        },
      ],
      counts: {
        activeEntityCount: 1,
        relatedCharacterCount: 1,
        relatedEventCount: 1,
        relatedResourceCount: 1,
      },
      suggestedQuestions: ['这座书院连接了哪些人物？'],
    },
  ],
  timeline: [],
  timelineEmptyMessage: '时间长河正在整理中，你可以先从人物和资料馆开始探索。',
  settings: {
    worldType: '历史世界',
    era: '静态历史世界',
    background: '元代士人群体的学术社交网络。',
    groups: ['人物', '书院', '官职'],
    contentBoundary: '公开世界资料与人物档案。',
    dialogueRule: '人物对话会优先使用已收录资料作为上下文。',
    trustNote: '资料不足时，人物会明确说明不确定。',
  },
  userRelation: {
    isCollected: false,
    friendCount: 0,
    recentCharacterIds: ['yao-sui'],
    recommendedCharacterIds: ['yao-sui'],
  },
};

function renderWorldShowcasePage() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/worlds/yuan-academy-world']}>
        <Routes>
          <Route path="/worlds/:worldId" element={<WorldShowcasePage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('WorldShowcasePage', () => {
  beforeEach(async () => {
    await setStudioLocale('zh-CN');
    vi.mocked(getWorldShowcase).mockResolvedValue(showcaseFixture);
  });

  afterEach(async () => {
    await setStudioLocale('en');
  });

  it('renders the World Atlas detail page without creator-console vocabulary', async () => {
    renderWorldShowcasePage();

    expect(await screen.findByRole('heading', { name: '元代文人书院世界', level: 1 })).toBeInTheDocument();
    expect(screen.getByText('World Atlas')).toBeInTheDocument();
    expect(screen.getByText('我的世界关系')).toBeInTheDocument();
    expect(screen.getByText('位可结识人物')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '进入世界' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: '浏览人物' }).length).toBeGreaterThan(0);

    for (const forbidden of [
      'Connect Source',
      'Primary Source',
      'PERSONAS',
      'World Owned',
      'Runtime Ready',
      'Readiness Checklist',
      'Operating Logic',
      'Source Coverage',
      'localAgent',
    ]) {
      expect(screen.queryByText(new RegExp(forbidden, 'i'))).not.toBeInTheDocument();
    }
  });

  it('supports collect, friend, chat entry, and character detail drawer interactions', async () => {
    renderWorldShowcasePage();

    await screen.findByRole('heading', { name: '元代文人书院世界', level: 1 });
    fireEvent.click(screen.getAllByRole('button', { name: '收藏世界' })[0]!);
    expect(screen.getAllByRole('button', { name: '已收藏' }).length).toBeGreaterThan(0);

    const card = screen.getByTestId('showcase-character-card-yao-sui');
    expect(within(card).getByText('1254年 - 1331年')).toBeInTheDocument();
    fireEvent.click(within(card).getByRole('button', { name: '加为好友' }));
    expect(within(card).getByRole('button', { name: '已添加' })).toBeInTheDocument();

    fireEvent.click(within(card).getByRole('button', { name: '和他聊聊' }));
    expect(screen.getByText('已准备与姚燧的对话入口')).toBeInTheDocument();

    fireEvent.click(within(card).getByRole('button', { name: '查看档案' }));
    expect(screen.getByRole('dialog', { name: '姚燧' })).toBeInTheDocument();
    const drawer = screen.getByRole('dialog', { name: '姚燧' });
    expect(within(drawer).getByText('人物速览')).toBeInTheDocument();
    expect(within(drawer).getByText('1254年 - 1331年')).toBeInTheDocument();
    expect(screen.getByText('他知道什么')).toBeInTheDocument();
    expect(screen.getByText('可以问他什么')).toBeInTheDocument();
    expect(screen.getByText('生涯节点')).toBeInTheDocument();
    expect(screen.getByText('1254年')).toBeInTheDocument();
    expect(screen.getByText('1320年')).toBeInTheDocument();
    expect(screen.getByText('出生')).toBeInTheDocument();
    expect(screen.getByText('1314年任书院山长')).toBeInTheDocument();
    expect(screen.getByText('著述线索')).toBeInTheDocument();
    expect(screen.getByText('关系线索')).toBeInTheDocument();
    expect(screen.getByText('源自已接纳的历史人物图谱。')).toBeInTheDocument();
  });

  it('renders structured scene detail data from backend projection', async () => {
    renderWorldShowcasePage();

    await screen.findByRole('heading', { name: '元代文人书院世界', level: 1 });
    const sceneCard = screen.getByText('书院讲堂').closest('article');
    expect(sceneCard).not.toBeNull();
    expect(within(sceneCard!).getByText('1 位人物')).toBeInTheDocument();
    expect(within(sceneCard!).getByText('1 件事件')).toBeInTheDocument();
    expect(within(sceneCard!).getByText('1 条资料')).toBeInTheDocument();

    fireEvent.click(within(sceneCard!).getByRole('button', { name: '进入场景' }));
    const drawer = screen.getByRole('dialog', { name: '书院讲堂' });
    expect(within(drawer).getByText('活跃实体')).toBeInTheDocument();
    expect(within(drawer).getByText('关联事件')).toBeInTheDocument();
    expect(within(drawer).getByText('书院讲学')).toBeInTheDocument();
    expect(within(drawer).getByText('书院讲学网络')).toBeInTheDocument();
  });
});
