import { useEffect, useState } from 'react';
import { createHashRouter, RouterProvider } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { NimiAppAccessGate } from '@nimiplatform/kit/auth/app';
import { NimiToaster, TooltipProvider } from '@nimiplatform/kit/ui';
import { ShellErrorBoundary } from '@nimiplatform/kit/telemetry/error-boundary';
import { AppRoutes } from './app-shell/routes.js';
import { ShellLayout } from './app-shell/shell-layout.js';
import { StudioScopeProvider, type StudioScope } from './app-shell/studio-scope.js';
import { createStudioQueryClient } from './infra/query-client.js';
import { WorldActivityBridge } from './features/worlds/world-activity-bridge.js';
import { endWorldDraftSession } from './features/worlds/world-draft-store.js';
import { endCharacterDraftSession } from './features/worlds/character-draft-store.js';

export function App() {
  const { t, i18n } = useTranslation();
  return <ShellErrorBoundary appName={t('app.name')} fallbackTitle={t('app.rendererFailedTitle')} fallbackHint={t('app.rendererFailedHint')}>
    <NimiAppAccessGate title={t('app.name')} language={i18n.language.startsWith('zh') ? 'zh' : 'en'}>{scope => <ConnectedStudio scope={scope} />}</NimiAppAccessGate>
  </ShellErrorBoundary>;
}
function ConnectedStudio({ scope }: { scope: StudioScope }) {
  const [queryClient] = useState(createStudioQueryClient);
  const [router] = useState(() => createHashRouter([{ path: '*', element: <><WorldActivityBridge /><ShellLayout><AppRoutes /></ShellLayout></> }]));
  useEffect(() => () => {
    endWorldDraftSession(scope); endCharacterDraftSession(scope);
    void queryClient.cancelQueries(); queryClient.clear(); router.dispose();
    history.replaceState(history.state, '', location.pathname + location.search);
  }, [scope, queryClient, router]);
  return <StudioScopeProvider scope={scope}><QueryClientProvider client={queryClient}><TooltipProvider>
    <RouterProvider router={router} /><NimiToaster />
  </TooltipProvider></QueryClientProvider></StudioScopeProvider>;
}
