import { studioI18n } from '@renderer/i18n/index.js';

export function translateStudioModelConfigCopy(
  key: string,
  vars?: Readonly<Record<string, string | number | undefined>>,
): string {
  const defaultValue = typeof vars?.defaultValue === 'string' ? vars.defaultValue : key;
  return String(studioI18n.t(key, { ...vars, defaultValue }));
}
