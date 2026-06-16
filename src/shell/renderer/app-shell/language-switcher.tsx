import { SegmentedControl } from '@nimiplatform/kit/ui';
import { useTranslation } from 'react-i18next';
import { useStudioLocale, type StudioLocale } from '../i18n/index.js';

export function LanguageSwitcher({ className }: { className?: string }) {
  const { t } = useTranslation();
  const { locale, setLocale } = useStudioLocale();

  return (
    <SegmentedControl
      ariaLabel={t('language.ariaLabel')}
      size="sm"
      className={className}
      value={locale}
      onValueChange={(value) => setLocale(value as StudioLocale)}
      items={[
        { value: 'en', label: t('language.englishShort') },
        { value: 'zh-CN', label: t('language.chineseShort') },
      ]}
    />
  );
}
