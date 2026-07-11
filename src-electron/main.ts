import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { app, BrowserWindow, ipcMain, Menu } from 'electron';
import {
  createNimiElectronStandardApplicationMenuTemplate,
  isAllowedElectronRendererUrl,
  registerNimiElectronInstalledAppBridge,
} from '@nimiplatform/kit/shell/electron/main';
import {
  REALM_WORLD_STUDIO_APP_ID,
  REALM_WORLD_STUDIO_APP_NAME,
} from '../src/shell/app-identity.js';

const currentFilePath = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFilePath);
const appRoot = resolveAppRoot(currentDir);
const preloadPath = path.join(currentDir, 'preload.cjs');
const rendererDistIndex = path.join(appRoot, 'dist', 'index.html');
const rendererDistUrl = pathToFileURL(rendererDistIndex).toString();
const devRendererUrl = 'http://127.0.0.1:1451';

app.setName(REALM_WORLD_STUDIO_APP_NAME);
installRealmWorldStudioStandardApplicationMenu();
configureRealmWorldStudioElectronChromiumRuntime();

void app.whenReady().then(bootstrapElectron).catch(handleElectronStartupFailure);

async function bootstrapElectron(): Promise<void> {
  registerNimiElectronInstalledAppBridge({
    appId: REALM_WORLD_STUDIO_APP_ID,
    allowedRendererUrls: [activeRendererUrl()],
    ipcMain,
  });

  await createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      void createMainWindow();
    }
  });
}

function handleElectronStartupFailure(error: unknown): void {
  process.stderr.write(`${error instanceof Error ? error.message : String(error || 'Realm World Studio Electron startup failed')}\n`);
  app.quit();
}

function resolveAppRoot(electronDir: string): string {
  if (path.basename(electronDir) === 'src-electron' && path.basename(path.dirname(electronDir)) === 'dist-electron') {
    return path.resolve(electronDir, '..', '..');
  }
  return path.resolve(electronDir, '..');
}

function configureRealmWorldStudioElectronChromiumRuntime(): void {
  app.commandLine.appendSwitch('disable-background-networking');
}

function installRealmWorldStudioStandardApplicationMenu(): void {
  Menu.setApplicationMenu(Menu.buildFromTemplate(
    createNimiElectronStandardApplicationMenuTemplate({ appName: REALM_WORLD_STUDIO_APP_NAME }),
  ));
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

async function createMainWindow(): Promise<BrowserWindow> {
  const window = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 390,
    minHeight: 620,
    title: REALM_WORLD_STUDIO_APP_NAME,
    autoHideMenuBar: true,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  hardenRealmWorldStudioWindowChrome(window);
  secureRealmWorldStudioWindow(window);
  await window.loadURL(activeRendererUrl());
  return window;
}

function activeRendererUrl(): string {
  return app.isPackaged ? rendererDistUrl : devRendererUrl;
}

function hardenRealmWorldStudioWindowChrome(window: BrowserWindow): void {
  window.setAutoHideMenuBar(true);
  window.setMenuBarVisibility(false);
}

function secureRealmWorldStudioWindow(window: BrowserWindow): void {
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  window.webContents.on('will-navigate', (event, url) => {
    if (!isAllowedElectronRendererUrl(url, [activeRendererUrl()])) {
      event.preventDefault();
    }
  });
}
