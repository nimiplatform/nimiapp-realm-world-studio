import type { MouseEvent as ReactMouseEvent, ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
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
import { getStudioCurrentUser } from './current-user.js';
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
  const { t } = useTranslation();
  const navigate = useNavigate();
  const currentUserQuery = useQuery({
    queryKey: ['realm-world-studio', 'current-user'] as const,
    queryFn: getStudioCurrentUser,
    staleTime: 300_000,
    retry: false,
  });

  // currentUser is a display-fact-only Base surface; when it is unavailable
  // the menu falls back to neutral copy instead of failing the shell.
  const displayName = currentUserQuery.data?.displayName.trim()
    || t('shell.account.fallbackDisplayName');
  const avatarUrl = currentUserQuery.data?.avatarUrl ?? null;
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
                {currentUserQuery.data?.handle ?? t('shell.account.emailFallback')}
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
