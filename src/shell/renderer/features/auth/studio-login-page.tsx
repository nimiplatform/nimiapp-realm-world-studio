import { useMemo, useState } from 'react';
import { DesktopShellAuthPage } from '@nimiplatform/kit/auth';
import '@nimiplatform/kit/auth/styles.css';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../app-shell/app-store.js';
import {
  createStudioDesktopBrowserAuthAdapter,
  createStudioRuntimeAccountBrowserBroker,
} from './studio-auth-adapter.js';
import { studioTauriOAuthBridge } from '../../bridge/index.js';
import { LanguageSwitcher } from '../../app-shell/language-switcher.js';

type StudioAuthStatusBanner = { kind: string; message: string };

const AUTH_STATUS_MESSAGE_KEYS: Record<string, string> = {
  '已打开浏览器，请在网页完成授权登录。': 'auth.status.browserOpened',
  '网页登录授权成功，已登录。': 'auth.status.browserAuthorized',
  'Browser opened. Complete authorization on the web page.': 'auth.status.browserOpened',
  'Web authorization succeeded. Signed in.': 'auth.status.browserAuthorized',
};

export function StudioLoginPage() {
  const { t } = useTranslation();
  const [statusBanner, setStatusBanner] = useState<StudioAuthStatusBanner | null>(null);
  const adapter = useMemo(() => createStudioDesktopBrowserAuthAdapter(), []);
  const runtimeAccountBroker = useMemo(() => createStudioRuntimeAccountBrowserBroker(), []);
  const statusMessage = useMemo(() => {
    if (!statusBanner) return null;
    const key = AUTH_STATUS_MESSAGE_KEYS[statusBanner.message];
    return key ? t(key) : statusBanner.message;
  }, [statusBanner, t]);
  // Runtime owns the OAuth `authorize` URL end-to-end; the kit's optional
  // `baseUrl` is unused for Studio's loopback flow.
  const webBaseUrl = '';

  return (
    <>
      <LanguageSwitcher className="ras-auth-language-switcher" />
      <DesktopShellAuthPage
        adapter={adapter}
        session={{
          mode: 'desktop-browser',
          authStatus: 'unauthenticated',
          authError: statusMessage,
          setAuthSession: (user) => {
            const store = useAppStore.getState();
            if (!user || !user.id) {
              store.clearAuthSession();
              return;
            }
            store.setAuthSession({
              id: String(user.id),
              displayName: String(user.displayName || user.name || ''),
              email: user.email ? String(user.email) : undefined,
              avatarUrl: user.avatarUrl ? String(user.avatarUrl) : undefined,
            });
          },
          setStatusBanner,
        }}
        desktopBrowserAuth={{
          baseUrl: webBaseUrl || undefined,
          bridge: studioTauriOAuthBridge,
          runtimeAccountBroker,
          hintVisibility: 'always',
        }}
        testIds={{
          screen: 'realm-world-studio-login-page',
          logoTrigger: 'realm-world-studio-login-trigger',
        }}
      />
    </>
  );
}
