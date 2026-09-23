import type { JsonValue } from '@nimiplatform/sdk/types';
import { getStudioLocalAppClient } from '../src/shell/renderer/app-shell/studio-platform.js';
import { newDraftId } from '../src/shell/renderer/features/worlds/world-draft.js';
import { assertWorldDraftDocument } from '../src/shell/renderer/features/worlds/world-draft-storage.js';

/**
 * One-time development-data conversion, invoked explicitly in the exact
 * Desktop-supervised Studio renderer. Never imported by the application.
 * Preview first; apply only while the old format has the notebook locked.
 */
export async function convertDevelopmentWorldDrafts({ apply = false }: { apply?: boolean } = {}) {
  const host = globalThis.window?.realmWorldStudio;
  if (!host) throw new Error('Run this utility in the Desktop-supervised Studio renderer.');
  let invalidated = false;
  const stop = host.onSessionInvalidated(() => { invalidated = true; });
  const assertCurrent = () => {
    if (invalidated) throw new Error('The session changed; reopen Studio before converting local drafts.');
  };
  try {
    const client = getStudioLocalAppClient();
    if (!(await client.auth.status()).sessionBound) throw new Error('A protected Studio session is required.');
    assertCurrent();
    const drafts = (await client.storage.readJson('world-studio/drafts.json')).value;
    assertCurrent();
    if (!Array.isArray(drafts)) throw new Error('Expected the old draft array. No records were modified.');
    let activityOutbox: JsonValue = [];
    try {
      activityOutbox = (await client.storage.readJson('world-studio/activity-outbox.json')).value;
    } catch (error) {
      if ((error as { reasonCode?: string }).reasonCode !== 'not-found') throw error;
    }
    assertCurrent();
    const document = { drafts, activityOutbox };
    assertWorldDraftDocument(document);
    const summary = { drafts: document.drafts.length, publications: document.activityOutbox.length };
    if (!apply) return { ...summary, applied: false };

    const backupPath = `world-studio/development-backups/${newDraftId()}.json`;
    const data = JSON.parse(JSON.stringify(document)) as JsonValue;
    await client.storage.writeJson(backupPath, data);
    assertCurrent();
    await client.storage.writeJson('world-studio/drafts.json', data);
    assertCurrent();
    // Leave the old outbox and backup intact for local inspection. The App
    // reads only the new combined document after the renderer is reopened.
    return { ...summary, applied: true, backupPath };
  } finally {
    stop();
  }
}
