import { createStudioProtectedOperationUnavailableError } from '../../app-shell/studio-platform.js';

export async function logoutStudioRuntimeAccount(): Promise<never> {
  throw createStudioProtectedOperationUnavailableError();
}
