import { contextBridge, ipcRenderer } from 'electron';
import { installNimiElectronRuntimeBridge } from '@nimiplatform/kit/shell/electron/preload-cjs';

installNimiElectronRuntimeBridge({
  contextBridge,
  ipcRenderer,
});

// Forwards the Kit Host's session invalidation so the renderer can stop the
// ended session's work. It carries no session, account or authority material.
const SESSION_INVALIDATED_CHANNEL = 'realm-world-studio:session-invalidated';
contextBridge.exposeInMainWorld('realmWorldStudio', {
  onSessionInvalidated(listener: () => void): () => void {
    const handler = () => listener();
    ipcRenderer.on(SESSION_INVALIDATED_CHANNEL, handler);
    return () => { ipcRenderer.removeListener(SESSION_INVALIDATED_CHANNEL, handler); };
  },
});
