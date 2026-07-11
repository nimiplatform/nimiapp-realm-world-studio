import type { Runtime } from '@nimiplatform/sdk/runtime';
import { createStudioProtectedOperationUnavailableError } from '@renderer/app-shell/studio-platform.js';
export { hasTauriIpcRuntime } from '@renderer/app-shell/tauri-runtime.js';

export async function createStudioRuntimeClient(): Promise<Runtime> {
  throw createStudioProtectedOperationUnavailableError();
}
