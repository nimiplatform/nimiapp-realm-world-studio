import { useState } from 'react';
import { useNimiAppSession } from '@nimiplatform/kit/auth/app';
import { nimiToast } from '@nimiplatform/kit/ui';
import { getWorldDraftState, persistWorldDrafts } from '../features/worlds/world-draft-store.js';
import { getCharacterDraftState, persistCharacterDrafts } from '../features/worlds/character-draft-store.js';
import { useStudioScope } from '@renderer/app-shell/studio-scope.js';
import type { MouseEvent as ReactMouseEvent, ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useIsMutating } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { BookOpen, ChevronDown, FilePenLine, PlusCircle, Settings2, User } from 'lucide-react';
import {
  AmbientBackground,
  Avatar,
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@nimiplatform/kit/ui';
import { startStudioWindowDrag } from '../bridge/window-drag.js';

import { LanguageSwitcher } from './language-switcher.js';

const MACOS_TRAFFIC_LIGHT_SAFE_ZONE_PX = 84;
const TITLEBAR_INTERACTIVE_SELECTOR = [
  '[data-titlebar-interactive="true"]',
  'a',
  'button',
  'input',
  'select',
  'textarea',
  '[role="button"]',
  '[tabindex]',
].join(',');

const navItems = [
  { to: '/worlds', labelKey: 'studio.library', Icon: BookOpen, end: true },
  { to: '/worlds?tab=drafts', labelKey: 'studio.drafts', Icon: FilePenLine, end: true },
  { to: '/worlds/new', labelKey: 'studio.new', Icon: PlusCircle, end: true },
] as const;

function SidebarItem({
  to,
  label,
  children,
}: {
  to: string;
  label: string;
  children: ReactNode;
}) {
  const location = useLocation();
  const isCurrent = to.includes('?') ? location.search.includes('tab=drafts') || location.pathname.startsWith('/drafts/') : to === '/worlds' ? location.pathname === '/worlds' && !location.search.includes('tab=drafts') : location.pathname === to;
  return (
      <Link
        to={to}
        aria-current={isCurrent ? 'page' : undefined}
        data-titlebar-interactive="true"
        aria-label={label}
        className={isCurrent ? 'ras-sidebar__item ras-sidebar__item--active' : 'ras-sidebar__item'}
      >
        {children}
        <span>{label}</span>
      </Link>
  );
}

function AccountMenu() {
  const scope = useStudioScope();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { session, snapshot } = useNimiAppSession();
  const account = session.account;
  const [leaving, setLeaving] = useState(false);
  const mutating = useIsMutating() > 0;
  const user = snapshot.identity.status === 'signed-in' ? snapshot.identity.user : null;
  const displayName = user?.displayName.trim() || t('shell.account.fallbackDisplayName');
  const avatarUrl = user?.avatarUrl ?? null;
  const leave = async (action: () => Promise<void> | void) => {
    if (leaving || mutating) return;
    setLeaving(true);
    try {
      const world = getWorldDraftState(scope).store.getState();
      if (world.loaded && (world.saving || world.error)) await persistWorldDrafts(scope);
      const character = getCharacterDraftState(scope).store.getState();
      if (character.loaded && (character.saving || character.error)) await persistCharacterDrafts(scope);
      scope.signal.throwIfAborted(); await action();
    } catch { if (!scope.signal.aborted) nimiToast.warning(t('shell.account.saveBeforeExit')); }
    finally { if (!scope.signal.aborted) setLeaving(false); }
  };
  const initial = displayName.charAt(0).toUpperCase() || 'O';

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          data-titlebar-interactive="true"
          aria-haspopup="dialog"
          aria-label={t('shell.account.openMenu')}
          className="ras-avatar-trigger"
        >
          <Avatar
            src={avatarUrl}
            alt={displayName}
            size="sm"
            shape="circle"
            fallback={<span style={{ fontSize: 14, fontWeight: 600 }}>{initial}</span>}
          />
          <ChevronDown
            className="ras-avatar-trigger__chevron"
            size={14}
            strokeWidth={1.9}
            aria-hidden="true"
          />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={10} className="ras-avatar-popover">
        <div role="menu" aria-label={t('shell.account.menuAria')}>
          <div className="ras-avatar-menu__header">
            <Avatar
              src={avatarUrl}
              alt={displayName}
              size="md"
              shape="circle"
              fallback={<span style={{ fontSize: 16, fontWeight: 600 }}>{initial}</span>}
            />
            <div style={{ minWidth: 0, flex: 1 }}>
              <p className="ras-avatar-menu__name">{displayName}</p>
              <p className="ras-avatar-menu__email">
                {user?.handle ?? t('shell.account.emailFallback')}
              </p>
            </div>
          </div>
          <div className="ras-avatar-menu__actions">
            <Button
              tone="ghost"
              size="sm"
              fullWidth
              role="menuitem"
              className="ras-avatar-menu__action"
              leadingIcon={<User size={16} strokeWidth={1.8} />}
              onClick={() => {
                navigate('/worlds');
              }}
            >
              {t('shell.account.worlds')}
            </Button>
            {account.kind === 'app-session' ? <>
              <Button tone="ghost" size="sm" fullWidth role="menuitem" disabled={leaving || mutating} onClick={() => { void leave(() => session.disconnectRuntime()); }}>{t('shell.account.disconnect')}</Button>
              <Button tone="ghost" size="sm" fullWidth role="menuitem" disabled={leaving || mutating} onClick={() => { void leave(() => account.signOut()); }}>{t('shell.account.signOut')}</Button>
            </> : null}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function ShellLayout({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const isTitlebarInteractiveTarget = (target: EventTarget | null) =>
    target instanceof Element && target.closest(TITLEBAR_INTERACTIVE_SELECTOR) !== null;

  const handleTitlebarMouseDown = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    if (event.detail > 1) return;
    if (event.clientX < MACOS_TRAFFIC_LIGHT_SAFE_ZONE_PX) return;
    if (isTitlebarInteractiveTarget(event.target)) return;
    void startStudioWindowDrag();
  };

  return (
    <AmbientBackground variant="minimal" className="ras-shell">
      <div className="ras-topbar" onMouseDown={handleTitlebarMouseDown}>
        <div className="ras-topbar__inner">
          <h1 className="ras-topbar__title">{t('app.name')}</h1>
          <span className="ras-topbar__chip">{t('studio.notebook')}</span>
          <div className="ras-topbar__right">
            <LanguageSwitcher />
            <AccountMenu />
          </div>
        </div>
      </div>

      <div className="ras-shell__body">
        <aside className="ras-sidebar">
          <div className="ras-sidebar__logo">
            <div className="ras-sidebar__logo-mark" aria-label={t('app.name')}>
              <BookOpen size={24} strokeWidth={1.5} />
            </div>
            <div className="ras-sidebar__brand"><strong>{t('studio.brand')}</strong><span>{t('studio.byNimi')}</span></div>
          </div>
          <nav className="ras-sidebar__nav" aria-label={t('shell.navigationAria')}>
            {navItems.map((item) => {
              const label = t(item.labelKey);
              return (
                <SidebarItem key={item.to} to={item.to} label={label}>
                  <item.Icon size={19} strokeWidth={1.8} />
                </SidebarItem>
              );
            })}
          </nav>
          <div className="ras-sidebar__bottom"><SidebarItem to="/settings/ai" label={t('studio.models')}><Settings2 size={18} /></SidebarItem><p><span className="studio-connection-dot" />{t('studio.connected')}</p></div>
        </aside>

        <main
          className="ras-main"
          onMouseDown={(event) => {
            if (event.button !== 0) return;
            if (event.detail > 1) return;
            const rect = event.currentTarget.getBoundingClientRect();
            if (event.clientY - rect.top > 40) return;
            if (event.clientX < MACOS_TRAFFIC_LIGHT_SAFE_ZONE_PX) return;
            if (isTitlebarInteractiveTarget(event.target)) return;
            void startStudioWindowDrag();
          }}
          data-testid="shell-main-drag-region"
        >
          {children}
        </main>
      </div>
    </AmbientBackground>
  );
}
