import type { WorldShowcaseThemeConfig, WorldShowcaseThemeId } from './world-showcase-types.js';

export const historyHeroFallback = new URL(
  './assets/world-cover-yuan-academy.png',
  import.meta.url,
).href;

export const historyCardFallback = new URL(
  './assets/world-card-yuan-academy.png',
  import.meta.url,
).href;

export const worldThemeConfig: Record<WorldShowcaseThemeId, WorldShowcaseThemeConfig> = {
  history: {
    id: 'history',
    primaryColor: '#2f8f83',
    secondaryColor: '#c49a4a',
    backgroundStyle: 'paper',
    cardStyle: 'parchment',
    borderStyle: 'ink-line',
    iconStyle: 'seal',
    heroOverlay: 'linear-gradient(90deg, rgba(11, 20, 28, 0.82), rgba(11, 20, 28, 0.42), rgba(11, 20, 28, 0.2))',
    typographyTone: 'classical',
    texture: 'rice-paper',
    emptyStateTone: '正在整理中',
    moduleNames: {
      library: '资料馆',
      timeline: '时间长河',
      scenes: '场景',
      settings: '世界设定',
    },
    characterFilters: ['全部', '核心人物', '文人', '官员', '学者', '已加好友', '可聊天'],
  },
  future: {
    id: 'future',
    primaryColor: '#58a7ff',
    secondaryColor: '#9b7cff',
    backgroundStyle: 'deep-space',
    cardStyle: 'glass',
    borderStyle: 'glow-line',
    iconStyle: 'tech',
    heroOverlay: 'linear-gradient(90deg, rgba(4, 10, 28, 0.88), rgba(15, 31, 68, 0.52), rgba(36, 21, 74, 0.24))',
    typographyTone: 'precise',
    texture: 'star-map',
    emptyStateTone: '档案同步中',
    moduleNames: {
      library: '星际档案库',
      timeline: '星系纪年',
      scenes: '星区',
      settings: '世界协议',
    },
    characterFilters: ['全部', '核心人物', 'AI', '科学家', '组织领袖', '舰队成员', '已加好友', '可聊天'],
  },
  xianxia: {
    id: 'xianxia',
    primaryColor: '#6aa77d',
    secondaryColor: '#d4b25f',
    backgroundStyle: 'cloud-sea',
    cardStyle: 'jade',
    borderStyle: 'gold-line',
    iconStyle: 'glyph',
    heroOverlay: 'linear-gradient(90deg, rgba(16, 29, 22, 0.78), rgba(42, 64, 49, 0.42), rgba(74, 91, 69, 0.18))',
    typographyTone: 'mythic',
    texture: 'mist',
    emptyStateTone: '卷宗正在归藏',
    moduleNames: {
      library: '藏经阁',
      timeline: '纪元长卷',
      scenes: '秘境',
      settings: '天地设定',
    },
    characterFilters: ['全部', '核心人物', '宗门', '修士', '长老', '已加好友', '可聊天'],
  },
  cyberpunk: {
    id: 'cyberpunk',
    primaryColor: '#2cf2a5',
    secondaryColor: '#ff4fd2',
    backgroundStyle: 'terminal',
    cardStyle: 'neon-panel',
    borderStyle: 'scan-line',
    iconStyle: 'line',
    heroOverlay: 'linear-gradient(90deg, rgba(0, 6, 9, 0.9), rgba(18, 24, 39, 0.58), rgba(67, 9, 54, 0.2))',
    typographyTone: 'sharp',
    texture: 'noise',
    emptyStateTone: '记录解密中',
    moduleNames: {
      library: '数据黑箱',
      timeline: '城市时间线',
      scenes: '城区',
      settings: '城市协议',
    },
    characterFilters: ['全部', '核心人物', '黑客', '公司', 'AI', '地下组织', '已加好友', '可聊天'],
  },
};

export function resolveWorldTheme(input: {
  readonly name: string;
  readonly tags: readonly string[];
  readonly type: string;
}): WorldShowcaseThemeConfig {
  const haystack = [input.name, input.type, ...input.tags].join(' ').toLocaleLowerCase();
  if (/(future|sci|星际|未来|ai|舰|殖民|联邦)/i.test(haystack)) return worldThemeConfig.future;
  if (/(xianxia|修仙|宗门|仙|灵气|秘境)/i.test(haystack)) return worldThemeConfig.xianxia;
  if (/(cyber|赛博|黑客|义体|霓虹|公司)/i.test(haystack)) return worldThemeConfig.cyberpunk;
  return worldThemeConfig.history;
}
