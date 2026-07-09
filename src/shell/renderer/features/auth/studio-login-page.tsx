import { useTranslation } from 'react-i18next';
import { AmbientBackground, InlineAlert, Surface } from '@nimiplatform/kit/ui';
import { LanguageSwitcher } from '../../app-shell/language-switcher.js';

export function StudioLoginPage() {
  const { t } = useTranslation();
  return (
    <AmbientBackground variant="mesh" className="ras-entry-fallback">
      <LanguageSwitcher className="ras-auth-language-switcher" />
      <Surface tone="panel" padding="lg" className="ras-entry-fallback__panel">
        <InlineAlert tone="warning">
          <div className="ras-bootstrap-copy">
            <strong>{t('auth.loginRequired.title', 'Sign in required')}</strong>
            <span>{t('auth.loginRequired.body', 'Use the host Nimi account surface, then reopen Realm World Studio.')}</span>
          </div>
        </InlineAlert>
      </Surface>
    </AmbientBackground>
  );
}
