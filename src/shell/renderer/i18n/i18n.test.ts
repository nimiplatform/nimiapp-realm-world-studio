import { afterEach, describe, expect, it } from 'vitest';
import {
  normalizeStudioLocale,
  setStudioLocale,
  studioI18n,
} from './index.js';

describe('studio i18n', () => {
  afterEach(async () => {
    await setStudioLocale('en');
  });

  it('normalizes only the admitted Studio locales', () => {
    expect(normalizeStudioLocale('en-US')).toBe('en');
    expect(normalizeStudioLocale('zh_Hans_CN')).toBe('zh-CN');
    expect(normalizeStudioLocale('fr-FR')).toBeNull();
  });

  it('switches resources and document language together', async () => {
    await setStudioLocale('zh-CN');

    expect(studioI18n.t('shell.nav.worlds')).toBe('世界');
    expect(document.documentElement.lang).toBe('zh-CN');
    expect(document.title).toBe('Realm World Studio');
    expect(window.localStorage.getItem('nimi.realm-world-studio.locale')).toBe('zh-CN');

    await setStudioLocale('en');

    expect(studioI18n.t('shell.nav.worlds')).toBe('Worlds');
    expect(document.documentElement.lang).toBe('en');
  });
});
