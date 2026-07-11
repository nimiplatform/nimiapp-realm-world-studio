import { useCallback, useEffect, type ReactNode } from 'react';
import { LockKeyhole, RefreshCw, ShieldAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  AmbientBackground,
  Button,
  InlineAlert,
  LoadingSkeleton,
  Surface,
} from '@nimiplatform/kit/ui';
import { useAppStore } from './app-store.js';
import { runStudioBootstrap } from '../infra/studio-bootstrap.js';
import { LanguageSwitcher } from './language-switcher.js';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const authStatus = useAppStore((state) => state.auth.status);
  const bootstrapReady = useAppStore((state) => state.bootstrapReady);
  const bootstrapError = useAppStore((state) => state.bootstrapError);
  const bootstrapFailure = useAppStore((state) => state.bootstrapFailure);

  useEffect(() => {
    void runStudioBootstrap();
  }, []);

  const retryBootstrap = useCallback(() => {
    void runStudioBootstrap({ force: true });
  }, []);

  if (bootstrapFailure) {
    return (
      <BootstrapFrame>
        <Surface
          data-testid="world-studio-protected-session-failure"
          data-protected-state={bootstrapFailure.state}
          tone="card"
          material="solid"
          elevation="raised"
          padding="md"
          className="ras-protected-session"
        >
          <div className="ras-protected-session__stack">
            <div className="ras-protected-session__heading">
              <div className="ras-protected-session__icon" aria-hidden="true">
                <ShieldAlert size={22} />
              </div>
              <div className="ras-protected-session__copy">
                <p className="ras-protected-session__eyebrow">
                  {t('auth.protectedSession.eyebrow')}
                </p>
                <h1>{t(`auth.protectedSession.states.${bootstrapFailure.state}.title`)}</h1>
                <p>{t(`auth.protectedSession.states.${bootstrapFailure.state}.description`)}</p>
              </div>
            </div>

            <InlineAlert tone="warning" role="alert" icon={<LockKeyhole size={17} aria-hidden="true" />}>
              <div className="ras-protected-session__alert-copy">
                <strong>{t('auth.protectedSession.operationsLocked')}</strong>
                <span>{t('auth.protectedSession.reasonCode')}: {bootstrapFailure.reasonCode}</span>
              </div>
            </InlineAlert>

            <div className="ras-protected-session__next-step">
              <strong>{t('auth.protectedSession.nextStep')}</strong>
              <span>{t(`auth.protectedSession.states.${bootstrapFailure.state}.action`)}</span>
            </div>

            <div className="ras-protected-session__actions">
              <Button
                data-testid="world-studio-protected-operations-locked"
                disabled
                tone="secondary"
                leadingIcon={<LockKeyhole size={16} aria-hidden="true" />}
              >
                {t('auth.protectedSession.operationsUnavailable')}
              </Button>
              <Button
                data-testid="world-studio-protected-session-retry"
                tone="primary"
                leadingIcon={<RefreshCw size={16} aria-hidden="true" />}
                onClick={retryBootstrap}
              >
                {t('common.retry')}
              </Button>
            </div>
          </div>
        </Surface>
      </BootstrapFrame>
    );
  }

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

  return <>{children}</>;
}

function BootstrapFrame({ children }: { children: ReactNode }) {
  return (
    <AmbientBackground variant="minimal" className="ras-entry-fallback">
      <LanguageSwitcher className="ras-auth-language-switcher" />
      <div className="ras-entry-fallback__panel">{children}</div>
    </AmbientBackground>
  );
}
