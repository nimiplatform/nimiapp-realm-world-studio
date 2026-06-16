import i18next from 'i18next';
import { initReactI18next, useTranslation } from 'react-i18next';
import { studioI18nResources } from './resources.js';

export type StudioLocale = 'en' | 'zh-CN';

const STUDIO_LOCALES: readonly StudioLocale[] = ['en', 'zh-CN'];
const STUDIO_LOCALE_STORAGE_KEY = 'nimi.realm-world-studio.locale';

function canUseBrowserStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function normalizeStudioLocale(value: string | null | undefined): StudioLocale | null {
  const normalized = value?.trim().replace('_', '-').toLowerCase();
  if (!normalized) return null;
  if (normalized === 'en' || normalized.startsWith('en-')) return 'en';
  if (normalized === 'zh' || normalized.startsWith('zh-')) return 'zh-CN';
  return null;
}

function readStoredLocale(): StudioLocale | null {
  if (!canUseBrowserStorage()) return null;
  try {
    return normalizeStudioLocale(window.localStorage.getItem(STUDIO_LOCALE_STORAGE_KEY));
  } catch {
    return null;
  }
}

function detectBrowserLocale(): StudioLocale | null {
  if (typeof navigator === 'undefined') return null;
  const candidates = [
    ...Array.from(navigator.languages || []),
    navigator.language,
  ];
  for (const candidate of candidates) {
    const locale = normalizeStudioLocale(candidate);
    if (locale) return locale;
  }
  return null;
}

function resolveInitialLocale(): StudioLocale {
  return readStoredLocale() || detectBrowserLocale() || 'en';
}

function writeStoredLocale(locale: StudioLocale): void {
  if (!canUseBrowserStorage()) return;
  try {
    window.localStorage.setItem(STUDIO_LOCALE_STORAGE_KEY, locale);
  } catch {
    // Local storage availability is a preference detail; i18n remains usable.
  }
}

function syncDocumentLocale(locale: StudioLocale): void {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = locale;
  document.title = studioI18n.t('app.name');
}

export const studioI18n = i18next;

if (!studioI18n.isInitialized) {
  void studioI18n
    .use(initReactI18next)
    .init({
      resources: studioI18nResources,
      lng: resolveInitialLocale(),
      fallbackLng: 'en',
      supportedLngs: STUDIO_LOCALES,
      keySeparator: false,
      nsSeparator: false,
      interpolation: { escapeValue: false },
      initAsync: false,
      react: { useSuspense: false },
    });
}

syncDocumentLocale(normalizeStudioLocale(studioI18n.language) || 'en');

studioI18n.on('languageChanged', (language) => {
  const locale = normalizeStudioLocale(language) || 'en';
  syncDocumentLocale(locale);
});

export async function setStudioLocale(locale: StudioLocale): Promise<void> {
  writeStoredLocale(locale);
  await studioI18n.changeLanguage(locale);
}

export function useStudioLocale(): {
  locale: StudioLocale;
  setLocale: (locale: StudioLocale) => void;
} {
  const { i18n } = useTranslation();
  const locale = normalizeStudioLocale(i18n.language) || 'en';
  return {
    locale,
    setLocale: (nextLocale) => {
      void setStudioLocale(nextLocale);
    },
  };
}
