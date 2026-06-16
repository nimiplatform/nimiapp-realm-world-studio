import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Surface } from '@nimiplatform/kit/ui';

const CreatorWorldListPage = lazy(() =>
  import('../features/world-studio/world-studio-pages.js').then((m) => ({ default: m.CreatorWorldListPage })),
);
const CreatorWorldDetailPage = lazy(() =>
  import('../features/world-studio/world-studio-pages.js').then((m) => ({ default: m.CreatorWorldDetailPage })),
);
const CreatorWorldAgentDetailPage = lazy(() =>
  import('../features/world-studio/world-studio-pages.js').then((m) => ({ default: m.CreatorWorldAgentDetailPage })),
);
const StudioAIConfigPage = lazy(() =>
  import('../features/ai-config/studio-ai-config-page.js').then((m) => ({ default: m.StudioAIConfigPage })),
);

function PageFallback() {
  const { t } = useTranslation();

  return (
    <Surface tone="canvas" padding="none" className="flex h-full items-center justify-center border-0 ras-text-muted">
      {t('common.loading')}
    </Surface>
  );
}

export function AppRoutes() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route path="/worlds" element={<CreatorWorldListPage />} />
        <Route path="/worlds/:worldId" element={<CreatorWorldDetailPage />} />
        <Route path="/worlds/:worldId/agents/:agentId" element={<CreatorWorldAgentDetailPage />} />
        <Route path="/ai-config" element={<StudioAIConfigPage />} />
        <Route path="*" element={<Navigate to="/worlds" replace />} />
      </Routes>
    </Suspense>
  );
}
