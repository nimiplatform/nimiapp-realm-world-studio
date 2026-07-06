import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Surface } from '@nimiplatform/kit/ui';

const WorldShowcasePage = lazy(() =>
  import('../features/world-showcase/world-showcase-pages.js').then((m) => ({ default: m.WorldShowcasePage })),
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
        <Route path="/worlds" element={<WorldShowcasePage />} />
        <Route path="/worlds/:worldId" element={<WorldShowcasePage />} />
        <Route path="*" element={<Navigate to="/worlds" replace />} />
      </Routes>
    </Suspense>
  );
}
