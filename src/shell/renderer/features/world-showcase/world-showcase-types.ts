export type WorldShowcaseThemeId = 'history' | 'future' | 'xianxia' | 'cyberpunk';

export type WorldShowcaseThemeConfig = {
  id: WorldShowcaseThemeId;
  primaryColor: string;
  secondaryColor: string;
  backgroundStyle: 'paper' | 'deep-space' | 'cloud-sea' | 'terminal';
  cardStyle: 'parchment' | 'glass' | 'jade' | 'neon-panel';
  borderStyle: 'ink-line' | 'glow-line' | 'gold-line' | 'scan-line';
  iconStyle: 'seal' | 'tech' | 'glyph' | 'line';
  heroOverlay: string;
  typographyTone: 'classical' | 'precise' | 'mythic' | 'sharp';
  texture: 'rice-paper' | 'star-map' | 'mist' | 'noise';
  emptyStateTone: string;
  moduleNames: WorldShowcaseModuleNames;
  characterFilters: string[];
};

export type WorldShowcaseModuleNames = {
  library: string;
  timeline: string;
  scenes: string;
  settings: string;
};

export type WorldShowcaseStats = {
  characters: number;
  resources: number;
  scenes: number;
  routes: number;
};

export type WorldShowcaseStatsCard = {
  id: keyof WorldShowcaseStats;
  value: string;
  label: string;
};

export type ShowcaseCharacterLifeEventKind =
  | 'birth'
  | 'office'
  | 'work'
  | 'relationship'
  | 'learning'
  | 'death'
  | 'other';

export type ShowcaseCharacterLifeEvent = {
  id: string;
  kind: ShowcaseCharacterLifeEventKind;
  kindLabel: string;
  periodLabel: string | null;
  title: string;
  summary: string;
  sourceLabel: string;
};

export type ShowcaseCharacter = {
  id: string;
  name: string;
  avatar: string | null;
  role: string;
  shortBio: string;
  expertise: string[];
  topics: string[];
  resourceCount: number | null;
  relationCount: number | null;
  timeSummary: string | null;
  status: 'available' | 'unavailable';
  isFriend: boolean;
  relationState: 'connectable' | 'connected' | 'unavailable';
  relatedResources: string[];
  relatedScenes: string[];
  lifeEvents: ShowcaseCharacterLifeEvent[];
  lifeSourceNotes: string[];
  suggestedQuestions: string[];
};

export type ShowcaseResource = {
  id: string;
  title: string;
  type: string;
  summary: string;
  relatedCharacters: string[];
  relatedScenes: string[];
  recordCount: number | null;
  tags: string[];
};

export type ShowcaseEntity = {
  id: string;
  kind: string;
  label: string | null;
  summary: string | null;
};

export type ShowcaseSceneResource = {
  id: string;
  title: string;
  kind: 'system' | 'entity' | 'relationship' | 'timelineEvent' | 'rule';
  summary: string | null;
  entityRefs: string[];
  eventRefs: string[];
};

export type ShowcaseSceneCounts = {
  activeEntityCount: number;
  relatedCharacterCount: number;
  relatedEventCount: number;
  relatedResourceCount: number;
};

export type ShowcaseScene = {
  id: string;
  sceneId: string;
  title: string;
  image: string | null;
  summary: string;
  activeEntities: ShowcaseEntity[];
  relatedCharacters: ShowcaseCharacter[];
  relatedEvents: ShowcaseTimelineItem[];
  relatedResources: ShowcaseSceneResource[];
  counts: ShowcaseSceneCounts;
  suggestedQuestions: string[];
};

export type ShowcaseTimelineItem = {
  id: string;
  eventId: string;
  period: string;
  title: string;
  summary: string | null;
  sceneRefs: string[];
  locationRefs: string[];
  entityRefs: string[];
  characterRefs: string[];
  sourceRefs: string[];
  relatedCharacters: string[];
  relatedResources: string[];
};

export type ExplorationRoute = {
  id: string;
  title: string;
  summary: string;
  steps: string[];
  primaryAction: string;
};

export type WorldSettingSummary = {
  worldType: string;
  era: string;
  background: string;
  groups: string[];
  contentBoundary: string;
  dialogueRule: string;
  trustNote: string;
};

export type UserWorldRelation = {
  isCollected: boolean;
  friendCount: number;
  recentCharacterIds: string[];
  recommendedCharacterIds: string[];
};

export type WorldShowcase = {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  type: string;
  tags: string[];
  coverImage: string | null;
  icon: string | null;
  theme: WorldShowcaseThemeConfig;
  moduleNames: WorldShowcaseModuleNames;
  stats: WorldShowcaseStats;
  statsCards: WorldShowcaseStatsCard[];
  explorationRoutes: ExplorationRoute[];
  characters: ShowcaseCharacter[];
  resources: ShowcaseResource[];
  scenes: ShowcaseScene[];
  timeline: ShowcaseTimelineItem[];
  timelineEmptyMessage: string;
  settings: WorldSettingSummary;
  userRelation: UserWorldRelation;
};
