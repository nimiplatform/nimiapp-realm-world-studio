#!/usr/bin/env tsx

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { studioI18nResources } from '../src/shell/renderer/i18n/resources.js';

const REPO_ROOT = path.resolve(import.meta.dirname, '..');
const CONFIG_PATH = path.join(REPO_ROOT, 'scripts', 'i18n.config.json');

type I18nConfig = {
  supportedLocales?: unknown;
};

type LocaleBundle = {
  translation: Record<string, string>;
};

function readConfig(): { supportedLocales: string[] } {
  const parsed = JSON.parse(readFileSync(CONFIG_PATH, 'utf8')) as I18nConfig;
  const supportedLocales = Array.isArray(parsed.supportedLocales)
    ? parsed.supportedLocales.filter((item): item is string => typeof item === 'string' && item.length > 0)
    : [];

  if (!supportedLocales.includes('en') || !supportedLocales.includes('zh-CN')) {
    throw new Error('i18n config must include both "en" and "zh-CN".');
  }

  return { supportedLocales };
}

function asBundle(locale: string): LocaleBundle {
  const bundle = (studioI18nResources as Record<string, LocaleBundle>)[locale];
  if (!bundle?.translation) {
    throw new Error(`Missing i18n resource bundle for locale "${locale}".`);
  }
  return bundle;
}

function sortedKeys(record: Record<string, string>): string[] {
  return Object.keys(record).sort((left, right) => left.localeCompare(right));
}

function assertNoEmptyValues(locale: string, translations: Record<string, string>): string[] {
  return sortedKeys(translations).filter((key) => translations[key]?.trim() === '');
}

function main(): boolean {
  const { supportedLocales } = readConfig();
  const source = asBundle('en').translation;
  const sourceKeys = sortedKeys(source);
  const sourceKeySet = new Set(sourceKeys);
  let ok = true;

  console.log(`i18n:check locales: ${supportedLocales.join(', ')}`);
  console.log(`en source keys: ${sourceKeys.length}`);

  for (const locale of supportedLocales) {
    const bundle = asBundle(locale).translation;
    const keys = sortedKeys(bundle);
    const keySet = new Set(keys);
    const missing = sourceKeys.filter((key) => !keySet.has(key));
    const extra = keys.filter((key) => !sourceKeySet.has(key));
    const empty = assertNoEmptyValues(locale, bundle);

    if (missing.length > 0 || extra.length > 0 || empty.length > 0) {
      ok = false;
      console.error(`❌ ${locale}: keys=${keys.length} missing=${missing.length} extra=${extra.length} empty=${empty.length}`);
      for (const key of missing.slice(0, 30)) console.error(`  missing: ${key}`);
      for (const key of extra.slice(0, 30)) console.error(`  extra: ${key}`);
      for (const key of empty.slice(0, 30)) console.error(`  empty: ${key}`);
      continue;
    }

    console.log(`✅ ${locale}: keys=${keys.length}`);
  }

  return ok;
}

try {
  const ok = main();
  process.exit(ok ? 0 : 1);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`❌ i18n:check failed: ${message}`);
  process.exit(1);
}
