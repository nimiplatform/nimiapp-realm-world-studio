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

    expect(studioI18n.t('shell.nav.worldAtlas')).toBe('世界图谱');
    expect(document.documentElement.lang).toBe('zh-CN');
    expect(document.title).toBe('World Atlas');
    expect(window.localStorage.getItem('nimi.realm-world-studio.locale')).toBe('zh-CN');

    await setStudioLocale('en');

    expect(studioI18n.t('shell.nav.worldAtlas')).toBe('World atlas');
    expect(document.documentElement.lang).toBe('en');
  });
});
