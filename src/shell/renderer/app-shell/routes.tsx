import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Surface } from '@nimiplatform/kit/ui';

const CreatorWorldListPage = lazy(() =>
  import('../features/worlds/worlds-pages.js').then((m) => ({ default: m.CreatorWorldListPage })),
);
const CreatorWorldDetailPage = lazy(() =>
  import('../features/worlds/worlds-pages.js').then((m) => ({ default: m.CreatorWorldDetailPage })),
);
const CreatorWorldCharacterDetailPage = lazy(() =>
  import('../features/worlds/worlds-pages.js').then((m) => ({ default: m.CreatorWorldCharacterDetailPage })),
);
const CreatorWorldCreatePage = lazy(() =>
  import('../features/worlds/worlds-pages.js').then((m) => ({ default: m.CreatorWorldCreatePage })),
);
const CreatorWorldEditPage = lazy(() =>
  import('../features/worlds/worlds-pages.js').then((m) => ({ default: m.CreatorWorldEditPage })),
);
const CreatorWorldCharacterEditPage = lazy(() =>
  import('../features/worlds/worlds-pages.js').then((m) => ({ default: m.CreatorWorldCharacterEditPage })),
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
        <Route path="/worlds/new" element={<CreatorWorldCreatePage />} />
        <Route path="/worlds/:worldId" element={<CreatorWorldDetailPage />} />
        <Route path="/worlds/:worldId/edit" element={<CreatorWorldEditPage />} />
        <Route path="/worlds/:worldId/characters/:characterId" element={<CreatorWorldCharacterDetailPage />} />
        <Route path="/worlds/:worldId/characters/:characterId/edit" element={<CreatorWorldCharacterEditPage />} />
        <Route path="*" element={<Navigate to="/worlds" replace />} />
      </Routes>
    </Suspense>
  );
}
