import { vi } from 'vitest';
import { createHash } from 'node:crypto';
import type { WorldDraftDocument } from '../shell/renderer/features/worlds/world-draft-storage.js';

export const previousWorldDraftPath = 'world-studio/drafts.json';
export const worldDraftRecordPath = (id: string) => `world-studio/drafts/${id}.json`;

export function worldDraftStorageFixture(files = new Map<string, unknown>()) {
  const hash = (value: unknown) => 'sha256:' + createHash('sha256').update(JSON.stringify(value)).digest('hex');
  function read(path: string) {
    if (!files.has(path)) throw Object.assign(new Error('missing'), { reasonCode: 'not-found' });
    return structuredClone(files.get(path));
  }
  const storage = {
    readJson: vi.fn(async (path: string) => ({ value: read(path) })),
    removeJson: vi.fn(async (path: string) => ({ removed: files.delete(path) })),
    assets: {
      list: vi.fn(async ({ prefix }: { prefix: string }) => ({
        assets: [...files.keys()].filter(path => path.startsWith(prefix)).map(relativePath => ({ relativePath })), nextCursor: '',
      })),
      read: vi.fn(async ({ relativePath }: { relativePath: string }) => {
        const value = read(relativePath);
        const bytes = new TextEncoder().encode(JSON.stringify(value));
        return { asset: { sha256: hash(value) }, body: (async function* () { yield bytes; })() };
      }),
      write: vi.fn(async ({ relativePath, body, overwrite, expectedSha256 }: { relativePath: string; body: Uint8Array; overwrite?: boolean; expectedSha256?: string }) => {
        if (expectedSha256 !== undefined && (!files.has(relativePath) || expectedSha256 !== hash(files.get(relativePath)))) {
          throw Object.assign(new Error('content changed'), { reasonCode: 'APP_STORAGE_CONTENT_CONFLICT' });
        }
        if (expectedSha256 === undefined && overwrite === false && files.has(relativePath)) {
          throw Object.assign(new Error('already exists'), { reasonCode: 'APP_STORAGE_ENTRY_ALREADY_EXISTS' });
        }
        files.set(relativePath, JSON.parse(new TextDecoder().decode(body)));
        return { relativePath };
      }),
      remove: vi.fn(async (path: string) => ({ removed: files.delete(path) })),
    },
  };
  const document = (): WorldDraftDocument => {
    const records = [...files].filter(([path]) => path.startsWith('world-studio/drafts/'))
      .map(([, value]) => value as { draft: WorldDraftDocument['drafts'][number] | null; activityOutbox: WorldDraftDocument['activityOutbox'] });
    return { drafts: records.flatMap(record => record.draft ? [record.draft] : []), activityOutbox: records.flatMap(record => record.activityOutbox) };
  };
  return { storage, files, document };
}
