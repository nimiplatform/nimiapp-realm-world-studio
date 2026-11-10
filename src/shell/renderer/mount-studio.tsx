import { createRoot } from 'react-dom/client';
import { lazy, Suspense } from 'react';
import { NimiThemeProvider, LoadingSkeleton } from '@nimiplatform/kit/ui';
import { NimiAppSessionProvider, type NimiAppSession } from '@nimiplatform/kit/auth/app';
import { DEFAULT_DEV_RENDERER_ENTRY_IMPORT_RETRY_DELAYS_MS, createRendererEntryModuleLoader } from '@nimiplatform/kit/shell/renderer/bootstrap';
import { installStudioGlobalErrorLogging } from './infra/telemetry/renderer-log.js';
import { studioI18n } from './i18n/index.js';
import './styles.css';
const loader = createRendererEntryModuleLoader({ retryDelaysMs: import.meta.env.DEV ? DEFAULT_DEV_RENDERER_ENTRY_IMPORT_RETRY_DELAYS_MS : [] });
const App = lazy(async () => { const module = await loader.load('entry:realm-world-studio-app', () => import('./App.js')); return { default: module.App }; });
export function mountStudio(session: NimiAppSession) {
  installStudioGlobalErrorLogging();
  const element = document.getElementById('root'); if (!element) throw new Error('REALM_WORLD_STUDIO_ROOT_MISSING');
  const root = createRoot(element);
  root.render(<NimiThemeProvider accentPack="nimi-accent" defaultScheme="light"><NimiAppSessionProvider session={session}><Suspense fallback={<LoadingSkeleton lines={2} aria-label={studioI18n.t('entry.loadingAria')} />}><App /></Suspense></NimiAppSessionProvider></NimiThemeProvider>);
  void session.start();
  return () => { session.dispose(); root.unmount(); };
}
