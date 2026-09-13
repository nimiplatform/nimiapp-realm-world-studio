import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ModelConfigAIConfigSurface } from '@nimiplatform/kit/features/model-config';
import { getStudioLocalAppClient, STUDIO_RUNTIME_APP_ID } from '../../app-shell/studio-platform.js';
import { worldModelCopyZh } from '../../i18n/model-copy.js';

// @nimi-authority: rule.realm-world-studio.runtime-ai.r002
export function WorldModelsPage() {
  const { t, i18n } = useTranslation();
  const client = getStudioLocalAppClient();
  const query = useQuery({ queryKey: ['world-studio', 'ai-config'], queryFn: () => client.aiConfig.get(), retry: false });
  return <div className="studio-page studio-settings"><header className="studio-page-title"><h1>{t('studio.modelsTitle')}</h1><p>{t('studio.modelsHint')}</p></header>
    <ModelConfigAIConfigSurface
      context={{ owner: 'app-ai-config', appId: STUDIO_RUNTIME_APP_ID }}
      capabilityContracts={['text.generate']}
      capabilities={query.data ? query.data.config?.capabilities ?? null : undefined}
      revision={query.data?.revision}
      effectiveSelections={query.data?.effectiveSelections}
      loading={query.isLoading}
      loadError={query.isError ? t('studio.modelLoadError') : null}
      onRetry={() => void query.refetch()}
      listOptions={query => client.aiConfig.listOptions(query)}
      onOverwrite={async input => { const result = await client.aiConfig.overwrite(input); await query.refetch(); return result; }}
      language={i18n.language}
      copy={i18n.language === 'zh-CN' ? worldModelCopyZh : { capabilityLabel: () => 'Worldbuilding', capabilityDescription: () => 'World settings, character concepts and consistency reviews' }}
    />
  </div>;
}
