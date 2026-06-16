import { useCallback, useEffect, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { AmbientBackground, Button, InlineAlert, LoadingSkeleton, Surface } from '@nimiplatform/kit/ui';
import { useAppStore } from './app-store.js';
import { runStudioBootstrap } from '../infra/studio-bootstrap.js';
import { StudioLoginPage } from '../features/auth/studio-login-page.js';
import { LanguageSwitcher } from './language-switcher.js';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const authStatus = useAppStore((s) => s.auth.status);
  const bootstrapReady = useAppStore((s) => s.bootstrapReady);
  const bootstrapError = useAppStore((s) => s.bootstrapError);

  useEffect(() => {
    void runStudioBootstrap();
  }, []);

  const retryBootstrap = useCallback(() => {
    void runStudioBootstrap({ force: true });
  }, []);

  if (bootstrapError) {
    return (
      <BootstrapFrame>
        <InlineAlert
          tone="danger"
          action={<Button tone="secondary" size="sm" onClick={retryBootstrap}>{t('common.retry')}</Button>}
        >
          <div className="ras-bootstrap-copy">
            <strong>{t('auth.bootstrap.failedTitle')}</strong>
            <span>{bootstrapError}</span>
          </div>
        </InlineAlert>
      </BootstrapFrame>
    );
  }

  if (!bootstrapReady || authStatus === 'bootstrapping') {
    return (
      <BootstrapFrame>
        <div className="ras-entry-fallback__title">{t('app.name')}</div>
        <LoadingSkeleton lines={2} aria-label={t('entry.openingAria')} />
      </BootstrapFrame>
    );
  }

  if (authStatus === 'unauthenticated') {
    return <StudioLoginPage />;
  }

  return <>{children}</>;
}

function BootstrapFrame({ children }: { children: ReactNode }) {
  return (
    <AmbientBackground variant="mesh" className="ras-entry-fallback">
      <LanguageSwitcher className="ras-auth-language-switcher" />
      <Surface tone="panel" padding="lg" className="ras-entry-fallback__panel">
        {children}
      </Surface>
    </AmbientBackground>
  );
}
