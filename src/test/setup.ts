import { expect } from 'vitest';

function createMemoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() {
      return values.size;
    },
    clear() {
      values.clear();
    },
    getItem(key: string) {
      return values.get(key) ?? null;
    },
    key(index: number) {
      return Array.from(values.keys())[index] ?? null;
    },
    removeItem(key: string) {
      values.delete(key);
    },
    setItem(key: string, value: string) {
      values.set(key, String(value));
    },
  };
}

Object.defineProperty(window, 'localStorage', {
  configurable: true,
  value: createMemoryStorage(),
});
Object.defineProperty(window, 'sessionStorage', {
  configurable: true,
  value: createMemoryStorage(),
});

import '../shell/renderer/i18n/index.js';

void expect;
