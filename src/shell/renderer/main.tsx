import { StrictMode, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import { useTranslation } from 'react-i18next';
import {
  AmbientBackground,
  LoadingSkeleton,
  NimiThemeProvider,
  Surface,
} from '@nimiplatform/kit/ui';
import { installNimiShellRuntimeBridge } from '@nimiplatform/kit/shell/renderer/bridge';
import {
  DEFAULT_DEV_RENDERER_ENTRY_IMPORT_RETRY_DELAYS_MS,
  createRendererEntryModuleLoader,
} from '@nimiplatform/kit/shell/renderer/bootstrap';
import { installStudioGlobalErrorLogging } from './infra/telemetry/renderer-log.js';
import './i18n/index.js';
import './styles.css';

installStudioGlobalErrorLogging();
installNimiShellRuntimeBridge();

const entryModuleLoader = createRendererEntryModuleLoader({
  retryDelaysMs: import.meta.env.DEV ? DEFAULT_DEV_RENDERER_ENTRY_IMPORT_RETRY_DELAYS_MS : [],
});

const App = lazy(async () => {
  const mod = await entryModuleLoader.load('entry:realm-world-studio-app', () => import('./App.js'));
  return { default: mod.App };
});

function EntryFallback() {
  const { t } = useTranslation();

  return (
    <AmbientBackground variant="mesh" className="ras-entry-fallback">
      <Surface tone="panel" padding="lg" className="ras-entry-fallback__panel">
        <div className="ras-entry-fallback__title">{t('app.name')}</div>
        <LoadingSkeleton lines={2} aria-label={t('entry.loadingAria')} />
      </Surface>
    </AmbientBackground>
  );
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('REALM_AGENT_STUDIO_ROOT_MISSING');
}

createRoot(rootElement).render(
  <StrictMode>
    <NimiThemeProvider accentPack="nimi-accent" defaultScheme="light">
      <Suspense fallback={<EntryFallback />}>
        <App />
      </Suspense>
    </NimiThemeProvider>
  </StrictMode>,
);
