import {
  ensureStudioRuntimeClientReady,
} from '../../infra/studio-bootstrap.js';
import { getStudioNimiClient } from '../../infra/studio-nimi-client.js';
import {
  loadStudioRuntimeAccountUser,
  type StudioAuthUser,
} from '../../app-shell/studio-platform.js';

const STUDIO_ACCOUNT_CONTROL_FORBIDDEN =
  'Realm World Studio is an installed Nimi app and cannot own Runtime account logout. '
  + 'Use the first-party Desktop account surface.';

export async function loadCurrentUser(): Promise<StudioAuthUser | null> {
  await ensureStudioRuntimeClientReady();
  return loadStudioRuntimeAccountUser(getStudioNimiClient().runtime);
}

export async function logoutStudioRuntimeAccount(): Promise<void> {
  await ensureStudioRuntimeClientReady();
  throw new Error(STUDIO_ACCOUNT_CONTROL_FORBIDDEN);
}
