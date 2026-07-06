import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  BookOpen,
  Clock3,
  Compass,
  Heart,
  Library,
  Map,
  MessageCircle,
  Search,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import { getWorldShowcase } from './world-showcase-public-client.js';
import type {
  ExplorationRoute,
  ShowcaseCharacter,
  ShowcaseResource,
  ShowcaseScene,
  WorldShowcase,
} from './world-showcase-types.js';

type ShowcaseTab = 'overview' | 'characters' | 'resources' | 'timeline' | 'scenes' | 'settings';
type DetailDrawer =
  | { kind: 'character'; item: ShowcaseCharacter }
  | { kind: 'resource'; item: ShowcaseResource }
  | { kind: 'scene'; item: ShowcaseScene }
  | null;

const tabItems: Array<{ id: ShowcaseTab; label: string }> = [
  { id: 'overview', label: '总览' },
  { id: 'characters', label: '人物' },
  { id: 'resources', label: '资料馆' },
  { id: 'timeline', label: '时间长河' },
  { id: 'scenes', label: '场景' },
  { id: 'settings', label: '世界设定' },
];

function showcaseQueryKey(worldId: string) {
  return ['world-atlas', 'showcase', worldId] as const;
}

function IconButton({ children, label }: { children: ReactNode; label: string }) {
  return (
    <button type="button" className="was-icon-button" aria-label={label} title={label}>
      {children}
    </button>
  );
}

function ActionButton({
  children,
  tone = 'secondary',
  onClick,
}: {
  children: ReactNode;
  tone?: 'primary' | 'secondary' | 'ghost';
  onClick?: () => void;
}) {
  return (
    <button type="button" className={`was-action was-action--${tone}`} onClick={onClick}>
      {children}
    </button>
  );
}

function WorldShowcaseThemeProvider({ world, children }: { world: WorldShowcase; children: ReactNode }) {
  const style = {
    '--was-primary': world.theme.primaryColor,
    '--was-secondary': world.theme.secondaryColor,
    '--was-hero-overlay': world.theme.heroOverlay,
    '--was-hero-image': world.coverImage ? `url("${world.coverImage}")` : 'none',
  } as CSSProperties;

  return (
    <div className={`was-page was-theme-${world.theme.id}`} style={style}>
      {children}
    </div>
  );
}

function PageState({ title, detail, action }: { title: string; detail: string; action?: ReactNode }) {
  return (
    <div className="was-page was-page--state">
      <section className="was-state-panel">
        <Sparkles size={26} strokeWidth={1.8} />
        <h1>{title}</h1>
        <p>{detail}</p>
        {action}
      </section>
    </div>
  );
}

function WorldHero({
  world,
  collected,
  onCollect,
  onBrowseCharacters,
}: {
  world: WorldShowcase;
  collected: boolean;
  onCollect: () => void;
  onBrowseCharacters: () => void;
}) {
  const { t } = useTranslation();
  return (
    <section className="was-hero">
      <div className="was-hero__chrome">
        <IconButton label={t('worldShowcase.backToAtlas')}>
          <ArrowLeft size={19} strokeWidth={1.9} />
        </IconButton>
        <div className="was-hero__tabs" aria-label={t('worldShowcase.contentNavAria')}>
          <span>{world.moduleNames.library}</span>
          <span>{world.moduleNames.settings}</span>
          <span>{t('worldShowcase.characters')}</span>
          <span>{world.moduleNames.scenes}</span>
          <span>{world.moduleNames.timeline}</span>
        </div>
      </div>

      <div className="was-hero__body">
        {world.icon ? <img className="was-hero__icon" src={world.icon} alt="" /> : null}
        <p className="was-hero__eyebrow">{world.subtitle}</p>
        <h1>{world.name}</h1>
        <p className="was-hero__description">{world.description}</p>
        <div className="was-tag-row">
          {world.tags.slice(0, 6).map((tag) => (
            <span key={tag} className="was-tag">{tag}</span>
          ))}
        </div>
        <div className="was-hero__actions">
          <ActionButton tone="primary">{t('worldShowcase.enterWorld')}</ActionButton>
          <ActionButton onClick={onBrowseCharacters}>{t('worldShowcase.browseCharacters')}</ActionButton>
          <ActionButton tone="ghost" onClick={onCollect}>
            {collected ? t('worldShowcase.collected') : t('worldShowcase.collectWorld')}
          </ActionButton>
        </div>
      </div>
    </section>
  );
}

function WorldStats({ world }: { world: WorldShowcase }) {
  const { t } = useTranslation();
  return (
    <section className="was-stats" aria-label={t('worldShowcase.statsAria')}>
      {world.statsCards.map((card) => (
        <div key={card.id} className="was-stat">
          <strong>{card.value}</strong>
          <span>{card.label}</span>
        </div>
      ))}
    </section>
  );
}

function WorldTabs({
  activeTab,
  onTabChange,
  moduleNames,
}: {
  activeTab: ShowcaseTab;
  onTabChange: (tab: ShowcaseTab) => void;
  moduleNames: WorldShowcase['moduleNames'];
}) {
  const { t } = useTranslation();
  const labels = {
    overview: t('worldShowcase.overview'),
    characters: t('worldShowcase.characters'),
    resources: moduleNames.library,
    timeline: moduleNames.timeline,
    scenes: moduleNames.scenes,
    settings: moduleNames.settings,
  } satisfies Record<ShowcaseTab, string>;

  return (
    <nav className="was-tabs" aria-label={t('worldShowcase.tabsAria')}>
      {tabItems.map((item) => (
        <button
          key={item.id}
          type="button"
          className={activeTab === item.id ? 'was-tab was-tab--active' : 'was-tab'}
          onClick={() => onTabChange(item.id)}
        >
          {labels[item.id]}
        </button>
      ))}
    </nav>
  );
}

function ExplorationRoutes({ routes }: { routes: readonly ExplorationRoute[] }) {
  const { t } = useTranslation();
  return (
    <section className="was-section">
      <div className="was-section__heading">
        <Compass size={19} strokeWidth={1.9} />
        <div>
          <h2>{t('worldShowcase.routesTitle')}</h2>
          <p>{t('worldShowcase.routesDescription')}</p>
        </div>
      </div>
      <div className="was-route-grid">
        {routes.map((route) => (
          <article key={route.id} className="was-route-card">
            <h3>{route.title}</h3>
            <p>{route.summary}</p>
            <ol>
              {route.steps.map((step) => <li key={step}>{step}</li>)}
            </ol>
            <button type="button">{route.primaryAction}</button>
          </article>
        ))}
      </div>
    </section>
  );
}

function CharacterCard({
  character,
  isFriend,
  onAddFriend,
  onChat,
  onOpen,
}: {
  character: ShowcaseCharacter;
  isFriend: boolean;
  onAddFriend: () => void;
  onChat: () => void;
  onOpen: () => void;
}) {
  const { t } = useTranslation();
  return (
    <article className="was-character-card" data-testid={`showcase-character-card-${character.id}`}>
      <div className="was-character-card__top">
        <div className="was-avatar">
          {character.avatar ? <img src={character.avatar} alt="" /> : <span>{character.name.slice(0, 1)}</span>}
        </div>
        <div>
          <h3>{character.name}</h3>
          <p>{character.role}</p>
        </div>
      </div>
      <p className="was-character-card__bio">{character.shortBio}</p>
      <div className="was-chip-row">
        {character.expertise.slice(0, 3).map((item) => (
          <span key={item} className="was-chip">{item}</span>
        ))}
      </div>
      <div className="was-character-card__metrics">
        <span>{character.resourceCount === null ? '资料整理中' : `${character.resourceCount} 条资料`}</span>
        <span>{character.relationCount === null ? '关系整理中' : `${character.relationCount} 条关系`}</span>
        <span>{character.timeSummary ?? t('worldShowcase.timeOrganizing')}</span>
      </div>
      <div className="was-character-card__question">{character.topics[0]}</div>
      <div className="was-card-actions">
        <button type="button" onClick={onAddFriend} disabled={isFriend || character.relationState === 'unavailable'}>
          {isFriend ? t('worldShowcase.friendAdded') : t('worldShowcase.addFriend')}
        </button>
        <button type="button" onClick={onChat}>{t('worldShowcase.chatWithCharacter')}</button>
        <button type="button" onClick={onOpen}>{t('worldShowcase.viewProfile')}</button>
      </div>
    </article>
  );
}

function ResourceCard({ resource, onOpen }: { resource: ShowcaseResource; onOpen: () => void }) {
  const { t } = useTranslation();
  return (
    <article className="was-resource-card">
      <div className="was-card-kicker">{resource.type}</div>
      <h3>{resource.title}</h3>
      <p>{resource.summary}</p>
      <div className="was-chip-row">
        {resource.tags.slice(0, 3).map((tag) => <span key={tag} className="was-chip">{tag}</span>)}
      </div>
      <div className="was-resource-card__meta">
        <span>{resource.relatedCharacters.length} 位关联人物</span>
        <span>{resource.recordCount === null ? '记录整理中' : `${resource.recordCount} 条记录`}</span>
      </div>
      <button type="button" onClick={onOpen}>{t('worldShowcase.viewResource')}</button>
    </article>
  );
}

function SceneCard({ scene, onOpen }: { scene: ShowcaseScene; onOpen: () => void }) {
  const { t } = useTranslation();
  return (
    <article className="was-scene-card">
      {scene.image ? <img src={scene.image} alt="" /> : null}
      <div className="was-scene-card__body">
        <h3>{scene.title}</h3>
        <p>{scene.summary}</p>
        <div className="was-scene-card__meta">
          <span>{scene.counts.relatedCharacterCount} 位人物</span>
          <span>{scene.counts.relatedEventCount} 件事件</span>
          <span>{scene.counts.relatedResourceCount} 条资料</span>
        </div>
        <button type="button" onClick={onOpen}>{t('worldShowcase.enterScene')}</button>
      </div>
    </article>
  );
}

function OverviewTab({
  world,
  friendIds,
  onAddFriend,
  onChat,
  onOpenDrawer,
}: {
  world: WorldShowcase;
  friendIds: ReadonlySet<string>;
  onAddFriend: (character: ShowcaseCharacter) => void;
  onChat: (character: ShowcaseCharacter) => void;
  onOpenDrawer: (drawer: DetailDrawer) => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="was-overview">
      <section className="was-section was-guide">
        <div className="was-section__heading">
        <Sparkles size={19} strokeWidth={1.9} />
        <div>
          <h2>{t('worldShowcase.guideTitle')}</h2>
          <p>{t('worldShowcase.guideDescription')}</p>
        </div>
        </div>
        <p>{world.description}</p>
        <div className="was-fact-grid">
          <div><strong>{world.settings.worldType}</strong><span>{t('worldShowcase.worldType')}</span></div>
          <div><strong>{world.settings.era}</strong><span>{t('worldShowcase.era')}</span></div>
          <div><strong>{world.settings.groups.slice(0, 3).join(' / ') || t('worldShowcase.organizing')}</strong><span>{t('worldShowcase.mainGroups')}</span></div>
        </div>
      </section>

      <ExplorationRoutes routes={world.explorationRoutes} />

      <section className="was-section">
        <div className="was-section__heading">
        <Users size={19} strokeWidth={1.9} />
        <div>
            <h2>{t('worldShowcase.meetCharactersTitle')}</h2>
            <p>{t('worldShowcase.meetCharactersDescription')}</p>
          </div>
        </div>
        <div className="was-character-grid">
          {world.characters.slice(0, 4).map((character) => (
            <CharacterCard
              key={character.id}
              character={character}
              isFriend={friendIds.has(character.id)}
              onAddFriend={() => onAddFriend(character)}
              onChat={() => onChat(character)}
              onOpen={() => onOpenDrawer({ kind: 'character', item: character })}
            />
          ))}
        </div>
      </section>

      <section className="was-section">
        <div className="was-section__heading">
        <Library size={19} strokeWidth={1.9} />
        <div>
            <h2>{t('worldShowcase.popularResourcesTitle')}</h2>
            <p>{t('worldShowcase.popularResourcesDescription')}</p>
          </div>
        </div>
        <div className="was-resource-grid">
          {world.resources.slice(0, 4).map((resource) => (
            <ResourceCard
              key={resource.id}
              resource={resource}
              onOpen={() => onOpenDrawer({ kind: 'resource', item: resource })}
            />
          ))}
        </div>
      </section>

      <section className="was-section">
        <div className="was-section__heading">
        <Map size={19} strokeWidth={1.9} />
        <div>
            <h2>{t('worldShowcase.scenesTitle')}</h2>
            <p>{t('worldShowcase.scenesDescription')}</p>
          </div>
        </div>
        <div className="was-scene-grid">
          {world.scenes.slice(0, 3).map((scene) => (
            <SceneCard key={scene.id} scene={scene} onOpen={() => onOpenDrawer({ kind: 'scene', item: scene })} />
          ))}
        </div>
      </section>

      <TimelinePreview world={world} />
    </div>
  );
}

function CharacterTab({
  world,
  friendIds,
  selectedFilter,
  onFilterChange,
  onAddFriend,
  onChat,
  onOpenDrawer,
}: {
  world: WorldShowcase;
  friendIds: ReadonlySet<string>;
  selectedFilter: string;
  onFilterChange: (filter: string) => void;
  onAddFriend: (character: ShowcaseCharacter) => void;
  onChat: (character: ShowcaseCharacter) => void;
  onOpenDrawer: (drawer: DetailDrawer) => void;
}) {
  const { t } = useTranslation();
  const filteredCharacters = world.characters.filter((character) => {
    if (selectedFilter === '全部') return true;
    if (selectedFilter === '已加好友') return friendIds.has(character.id);
    if (selectedFilter === '可聊天') return character.status === 'available';
    return character.expertise.includes(selectedFilter) || character.role.includes(selectedFilter);
  });

  return (
    <section className="was-section">
      <div className="was-toolbar">
        <div className="was-search-pill">
          <Search size={16} strokeWidth={1.9} />
          <span>{t('worldShowcase.characterSearch')}</span>
        </div>
        <div className="was-filter-row">
          {world.theme.characterFilters.map((filter) => (
            <button
              key={filter}
              type="button"
              className={selectedFilter === filter ? 'was-filter was-filter--active' : 'was-filter'}
              onClick={() => onFilterChange(filter)}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>
      <div className="was-character-grid was-character-grid--wide">
        {filteredCharacters.map((character) => (
          <CharacterCard
            key={character.id}
            character={character}
            isFriend={friendIds.has(character.id)}
            onAddFriend={() => onAddFriend(character)}
            onChat={() => onChat(character)}
            onOpen={() => onOpenDrawer({ kind: 'character', item: character })}
          />
        ))}
      </div>
    </section>
  );
}

function ResourcesTab({
  world,
  onOpenDrawer,
}: {
  world: WorldShowcase;
  onOpenDrawer: (drawer: DetailDrawer) => void;
}) {
  const { t } = useTranslation();
  return (
    <section className="was-section">
      <div className="was-toolbar">
        <div className="was-search-pill">
          <Search size={16} strokeWidth={1.9} />
          <span>{t('worldShowcase.resourceSearch', { library: world.moduleNames.library })}</span>
        </div>
      </div>
      <div className="was-resource-grid">
        {world.resources.map((resource) => (
          <ResourceCard
            key={resource.id}
            resource={resource}
            onOpen={() => onOpenDrawer({ kind: 'resource', item: resource })}
          />
        ))}
      </div>
    </section>
  );
}

function TimelinePreview({ world }: { world: WorldShowcase }) {
  const { t } = useTranslation();
  return (
    <section className="was-section">
      <div className="was-section__heading">
        <Clock3 size={19} strokeWidth={1.9} />
        <div>
          <h2>{world.moduleNames.timeline}</h2>
          <p>{t('worldShowcase.timelineDescription')}</p>
        </div>
      </div>
      {world.timeline.length === 0 ? (
        <div className="was-empty-line">{world.timelineEmptyMessage}</div>
      ) : (
        <div className="was-timeline">
          {world.timeline.slice(0, 4).map((item) => (
            <article key={item.id} className="was-timeline-item">
              <span>{item.period}</span>
              <strong>{item.title}</strong>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function TimelineTab({ world }: { world: WorldShowcase }) {
  return <TimelinePreview world={world} />;
}

function ScenesTab({
  world,
  onOpenDrawer,
}: {
  world: WorldShowcase;
  onOpenDrawer: (drawer: DetailDrawer) => void;
}) {
  return (
    <section className="was-section">
      <div className="was-scene-grid was-scene-grid--wide">
        {world.scenes.map((scene) => (
          <SceneCard key={scene.id} scene={scene} onOpen={() => onOpenDrawer({ kind: 'scene', item: scene })} />
        ))}
      </div>
    </section>
  );
}

function SettingsTab({ world }: { world: WorldShowcase }) {
  const { t } = useTranslation();
  const rows = [
    [t('worldShowcase.worldType'), world.settings.worldType],
    [t('worldShowcase.worldBackground'), world.settings.background],
    [t('worldShowcase.era'), world.settings.era],
    [t('worldShowcase.mainForces'), world.settings.groups.join(' / ') || t('worldShowcase.organizing')],
    [t('worldShowcase.contentBoundary'), world.settings.contentBoundary],
    [t('worldShowcase.dialogueRule'), world.settings.dialogueRule],
    [t('worldShowcase.trustNote'), world.settings.trustNote],
  ];
  return (
    <section className="was-section was-settings">
      {rows.map(([label, value]) => (
        <div key={label} className="was-setting-row">
          <span>{label}</span>
          <p>{value}</p>
        </div>
      ))}
    </section>
  );
}

function WorldProfileSidebar({
  world,
  collected,
  friendIds,
  onCollect,
  onOpenCharacter,
  onTabChange,
}: {
  world: WorldShowcase;
  collected: boolean;
  friendIds: ReadonlySet<string>;
  onCollect: () => void;
  onOpenCharacter: (character: ShowcaseCharacter) => void;
  onTabChange: (tab: ShowcaseTab) => void;
}) {
  const { t } = useTranslation();
  const recommendedCharacters = world.userRelation.recommendedCharacterIds
    .map((id) => world.characters.find((character) => character.id === id))
    .filter((character): character is ShowcaseCharacter => Boolean(character));
  const recentCharacters = world.userRelation.recentCharacterIds
    .map((id) => world.characters.find((character) => character.id === id))
    .filter((character): character is ShowcaseCharacter => Boolean(character));

  return (
    <aside className="was-profile-sidebar" aria-label={t('worldShowcase.myWorldRelation')}>
      <h2 className="was-sidebar-title">{t('worldShowcase.myWorldRelation')}</h2>
      <div className="was-profile-card">
        <div className="was-profile-card__top">
          {world.icon ? <img src={world.icon} alt="" /> : null}
          <div>
            <h2>{world.name}</h2>
            <div className="was-chip-row">
              <span className="was-chip">{world.settings.worldType}</span>
              <span className="was-chip">{collected ? t('worldShowcase.collected') : t('worldShowcase.collectable')}</span>
            </div>
          </div>
        </div>
        <div className="was-profile-stats">
          <div><strong>{friendIds.size}</strong><span>{t('worldShowcase.friendCount')}</span></div>
          <div><strong>{world.characters.length}</strong><span>{t('worldShowcase.characterCount')}</span></div>
        </div>
        <button type="button" className="was-sidebar-collect" onClick={onCollect}>
          <Heart size={16} strokeWidth={1.9} />
          {collected ? t('worldShowcase.collected') : t('worldShowcase.collectWorld')}
        </button>
      </div>

      <section className="was-sidebar-section">
        <h3>{t('worldShowcase.recentCharacters')}</h3>
        <div className="was-mini-list">
          {recentCharacters.map((character) => (
            <button key={character.id} type="button" onClick={() => onOpenCharacter(character)}>
              <span>{character.name.slice(0, 1)}</span>
              <strong>{character.name}</strong>
            </button>
          ))}
        </div>
      </section>

      <section className="was-sidebar-section">
        <h3>{t('worldShowcase.recommendedFriends')}</h3>
        <div className="was-mini-list">
          {recommendedCharacters.map((character) => (
            <button key={character.id} type="button" onClick={() => onOpenCharacter(character)}>
              <span>{character.name.slice(0, 1)}</span>
              <strong>{character.name}</strong>
            </button>
          ))}
        </div>
      </section>

      <section className="was-sidebar-section">
        <h3>{t('worldShowcase.quickEntry')}</h3>
        <div className="was-quick-grid">
          <button type="button" onClick={() => onTabChange('characters')}><Users size={16} />{t('worldShowcase.characters')}</button>
          <button type="button" onClick={() => onTabChange('resources')}><BookOpen size={16} />{t('worldShowcase.resources')}</button>
          <button type="button" onClick={() => onTabChange('scenes')}><Map size={16} />{t('worldShowcase.scenes')}</button>
          <button type="button" onClick={() => onTabChange('timeline')}><Clock3 size={16} />{t('worldShowcase.time')}</button>
        </div>
      </section>
    </aside>
  );
}

function DetailDrawerView({
  drawer,
  friendIds,
  onAddFriend,
  onChat,
  onClose,
}: {
  drawer: DetailDrawer;
  friendIds: ReadonlySet<string>;
  onAddFriend: (character: ShowcaseCharacter) => void;
  onChat: (character: ShowcaseCharacter) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  if (!drawer) return null;

  if (drawer.kind === 'character') {
    const character = drawer.item;
    return (
      <aside className="was-drawer" role="dialog" aria-label={character.name}>
        <button type="button" className="was-drawer__close" aria-label={t('worldShowcase.closeDetail')} onClick={onClose}><X size={18} /></button>
        <div className="was-drawer__hero">
          <div className="was-avatar was-avatar--large">
            {character.avatar ? <img src={character.avatar} alt="" /> : <span>{character.name.slice(0, 1)}</span>}
          </div>
          <h2>{character.name}</h2>
          <p>{character.role}</p>
        </div>
        <section>
          <h3>{t('worldShowcase.introduction')}</h3>
          <p>{character.shortBio}</p>
        </section>
        <section className="was-character-overview">
          <h3>{t('worldShowcase.characterOverview')}</h3>
          <div className="was-character-overview__grid">
            <div>
              <span>{t('worldShowcase.time')}</span>
              <strong>{character.timeSummary ?? t('worldShowcase.timeOrganizing')}</strong>
            </div>
            <div>
              <span>{t('worldShowcase.relatedResources')}</span>
              <strong>
                {character.resourceCount === null ? t('worldShowcase.organizing') : String(character.resourceCount)}
              </strong>
            </div>
            <div>
              <span>{t('worldShowcase.relatedScenes')}</span>
              <strong>
                {character.relatedScenes.length > 0 ? String(character.relatedScenes.length) : t('worldShowcase.organizing')}
              </strong>
            </div>
          </div>
        </section>
        <section>
          <h3>{t('worldShowcase.lifeTimeline')}</h3>
          {character.lifeEvents.length === 0 ? (
            <p>{t('worldShowcase.organizing')}</p>
          ) : (
            <ol className="was-life-timeline">
              {character.lifeEvents.map((event) => (
                <li key={event.id} className={`was-life-event was-life-event--${event.kind}`}>
                  <div className="was-life-event__kind">{event.kindLabel}</div>
                  <div className="was-life-event__body">
                    <div className="was-life-event__meta">
                      <span>{event.periodLabel ?? t('worldShowcase.timeUnspecified')}</span>
                      <span>{event.sourceLabel}</span>
                    </div>
                    <strong>{event.title}</strong>
                    <p>{event.summary}</p>
                  </div>
                </li>
              ))}
            </ol>
          )}
          {character.lifeSourceNotes.length > 0 ? (
            <p className="was-life-source-notes">{character.lifeSourceNotes.join(' / ')}</p>
          ) : null}
        </section>
        <section>
          <h3>{t('worldShowcase.whatTheyKnow')}</h3>
          <ul>{character.expertise.map((item) => <li key={item}>{item}</li>)}</ul>
        </section>
        <section>
          <h3>{t('worldShowcase.whatToAsk')}</h3>
          <ul>{character.suggestedQuestions.map((item) => <li key={item}>{item}</li>)}</ul>
        </section>
        <section>
          <h3>{t('worldShowcase.relatedResources')}</h3>
          <p>{character.relatedResources.join(' / ') || t('worldShowcase.organizing')}</p>
        </section>
        <section>
          <h3>{t('worldShowcase.relatedScenes')}</h3>
          <p>{character.relatedScenes.join(' / ') || t('worldShowcase.organizing')}</p>
        </section>
        <div className="was-drawer__actions">
          <button type="button" onClick={() => onAddFriend(character)} disabled={friendIds.has(character.id)}>
            {friendIds.has(character.id) ? t('worldShowcase.friendAdded') : t('worldShowcase.addFriend')}
          </button>
          <button type="button" onClick={() => onChat(character)}>{t('worldShowcase.startConversation')}</button>
          <button type="button">{t('worldShowcase.viewFullProfile')}</button>
        </div>
      </aside>
    );
  }

  if (drawer.kind === 'resource') {
    const resource = drawer.item;
    return (
      <aside className="was-drawer" role="dialog" aria-label={resource.title}>
        <button type="button" className="was-drawer__close" aria-label={t('worldShowcase.closeDetail')} onClick={onClose}><X size={18} /></button>
        <div className="was-drawer__hero">
          <Library size={28} strokeWidth={1.8} />
          <h2>{resource.title}</h2>
          <p>{resource.type}</p>
        </div>
        <section>
          <h3>{t('worldShowcase.introduction')}</h3>
          <p>{resource.summary}</p>
        </section>
        <section>
          <h3>{t('worldShowcase.relatedCharacters')}</h3>
          <p>{resource.relatedCharacters.join(' / ') || t('worldShowcase.organizing')}</p>
        </section>
        <section>
          <h3>{t('worldShowcase.relatedScenes')}</h3>
          <p>{resource.relatedScenes.join(' / ') || t('worldShowcase.organizing')}</p>
        </section>
      </aside>
    );
  }

  const scene = drawer.item;
  return (
    <aside className="was-drawer" role="dialog" aria-label={scene.title}>
      <button type="button" className="was-drawer__close" aria-label={t('worldShowcase.closeDetail')} onClick={onClose}><X size={18} /></button>
      <div className="was-drawer__scene">
        {scene.image ? <img src={scene.image} alt="" /> : null}
      </div>
      <div className="was-drawer__hero">
        <Map size={28} strokeWidth={1.8} />
        <h2>{scene.title}</h2>
        <p>{scene.summary}</p>
      </div>
      <section>
        <h3>{t('worldShowcase.suggestedQuestions')}</h3>
        <ul>{scene.suggestedQuestions.map((item) => <li key={item}>{item}</li>)}</ul>
      </section>
      <section>
        <h3>{t('worldShowcase.activeEntities')}</h3>
        <p>
          {scene.activeEntities
            .map((entity) => entity.label || entity.id)
            .join(' / ') || t('worldShowcase.organizing')}
        </p>
      </section>
      <section>
        <h3>{t('worldShowcase.involvedCharacters')}</h3>
        <p>{scene.relatedCharacters.map((character) => character.name).join(' / ') || t('worldShowcase.organizing')}</p>
      </section>
      <section>
        <h3>{t('worldShowcase.relatedEvents')}</h3>
        <p>{scene.relatedEvents.map((event) => event.title).join(' / ') || t('worldShowcase.organizing')}</p>
      </section>
      <section>
        <h3>{t('worldShowcase.involvedResources')}</h3>
        <p>{scene.relatedResources.map((resource) => resource.title).join(' / ') || t('worldShowcase.organizing')}</p>
      </section>
    </aside>
  );
}

function WorldShowcaseContent({ world }: { world: WorldShowcase }) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<ShowcaseTab>('overview');
  const [selectedFilter, setSelectedFilter] = useState('全部');
  const [collected, setCollected] = useState(world.userRelation.isCollected);
  const [friendIds, setFriendIds] = useState<Set<string>>(
    () => new Set(world.characters.filter((character) => character.isFriend).map((character) => character.id)),
  );
  const [drawer, setDrawer] = useState<DetailDrawer>(null);
  const [chatEntry, setChatEntry] = useState<string | null>(null);

  useEffect(() => {
    setCollected(world.userRelation.isCollected);
    setFriendIds(new Set(world.characters.filter((character) => character.isFriend).map((character) => character.id)));
    setDrawer(null);
    setChatEntry(null);
  }, [world]);

  const immutableFriendIds = useMemo(() => new Set(friendIds), [friendIds]);

  const addFriend = (character: ShowcaseCharacter) => {
    if (character.relationState === 'unavailable') return;
    setFriendIds((current) => new Set([...current, character.id]));
  };

  const startChat = (character: ShowcaseCharacter) => {
    setChatEntry(t('worldShowcase.chatEntryReady', { name: character.name }));
  };

  const renderTab = () => {
    switch (activeTab) {
      case 'characters':
        return (
          <CharacterTab
            world={world}
            friendIds={immutableFriendIds}
            selectedFilter={selectedFilter}
            onFilterChange={setSelectedFilter}
            onAddFriend={addFriend}
            onChat={startChat}
            onOpenDrawer={setDrawer}
          />
        );
      case 'resources':
        return <ResourcesTab world={world} onOpenDrawer={setDrawer} />;
      case 'timeline':
        return <TimelineTab world={world} />;
      case 'scenes':
        return <ScenesTab world={world} onOpenDrawer={setDrawer} />;
      case 'settings':
        return <SettingsTab world={world} />;
      case 'overview':
      default:
        return (
          <OverviewTab
            world={world}
            friendIds={immutableFriendIds}
            onAddFriend={addFriend}
            onChat={startChat}
            onOpenDrawer={setDrawer}
          />
        );
    }
  };

  return (
    <WorldShowcaseThemeProvider world={world}>
      <div className="was-breadcrumb">
        <button type="button"><ArrowLeft size={16} strokeWidth={1.9} /></button>
        <span>{t('worldShowcase.atlasName')}</span>
        <span>/</span>
        <strong>{world.name}</strong>
      </div>
      <div className="was-layout">
        <main className="was-main-content">
          <WorldHero
            world={world}
            collected={collected}
            onCollect={() => setCollected((current) => !current)}
            onBrowseCharacters={() => setActiveTab('characters')}
          />
          <WorldStats world={world} />
          <WorldTabs activeTab={activeTab} onTabChange={setActiveTab} moduleNames={world.moduleNames} />
          {chatEntry ? (
            <div className="was-chat-entry" role="status">
              <MessageCircle size={17} strokeWidth={1.9} />
              {chatEntry}
            </div>
          ) : null}
          <div className="was-tab-panel" role="tabpanel">
            {renderTab()}
          </div>
        </main>
        <WorldProfileSidebar
          world={world}
          collected={collected}
          friendIds={immutableFriendIds}
          onCollect={() => setCollected((current) => !current)}
          onOpenCharacter={(character) => setDrawer({ kind: 'character', item: character })}
          onTabChange={setActiveTab}
        />
      </div>
      <DetailDrawerView
        drawer={drawer}
        friendIds={immutableFriendIds}
        onAddFriend={addFriend}
        onChat={startChat}
        onClose={() => setDrawer(null)}
      />
    </WorldShowcaseThemeProvider>
  );
}

export function WorldShowcasePage() {
  const { t } = useTranslation();
  const { worldId = '' } = useParams();
  const query = useQuery({
    queryKey: showcaseQueryKey(worldId),
    queryFn: () => getWorldShowcase(worldId),
    enabled: Boolean(worldId.trim()),
  });

  if (!worldId.trim()) {
    return <PageState title={t('worldShowcase.noWorldTitle')} detail={t('worldShowcase.noWorldDetail')} />;
  }
  if (query.isLoading) {
    return <PageState title={t('worldShowcase.loadingTitle')} detail={t('worldShowcase.loadingDetail')} />;
  }
  if (query.isError) {
    const message = query.error instanceof Error ? query.error.message : t('worldShowcase.unavailableDetail');
    return (
      <PageState
        title={t('worldShowcase.unavailableTitle')}
        detail={message}
        action={<ActionButton tone="primary" onClick={() => void query.refetch()}>{t('common.retry')}</ActionButton>}
      />
    );
  }
  if (!query.data) {
    return <PageState title={t('worldShowcase.unavailableTitle')} detail={t('worldShowcase.noDataDetail')} />;
  }

  return <WorldShowcaseContent world={query.data} />;
}
