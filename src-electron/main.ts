import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { app, BrowserWindow, ipcMain, Menu, protocol, session, webContents } from 'electron';
import {
  createNimiElectronStandardApplicationMenuTemplate,
  isAllowedElectronRendererUrl,
  registerNimiElectronAppAssetProtocolScheme,
  registerNimiElectronAppBridge,
} from '@nimiplatform/kit/shell/electron/main';

const REALM_WORLD_STUDIO_APP_ID = 'nimi.realm-world-studio';
const REALM_WORLD_STUDIO_APP_NAME = 'Realm World Studio';

const currentFilePath = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFilePath);
const appRoot = resolveAppRoot(currentDir);
const preloadPath = path.join(currentDir, 'preload.cjs');
const rendererDistIndex = path.join(appRoot, 'dist', 'index.html');
const rendererDistUrl = pathToFileURL(rendererDistIndex).toString();
const developmentRendererUrl = readDevelopmentRendererUrl();

app.setName(REALM_WORLD_STUDIO_APP_NAME);
installRealmWorldStudioStandardApplicationMenu();
configureRealmWorldStudioElectronChromiumRuntime();
registerNimiElectronAppAssetProtocolScheme(protocol);

void app.whenReady().then(bootstrapElectron).catch(handleElectronStartupFailure);

async function bootstrapElectron(): Promise<void> {
  registerNimiElectronAppBridge({
    appId: REALM_WORLD_STUDIO_APP_ID,
    allowedRendererUrls: [activeRendererUrl()],
    assetMediaPlatform: { protocol, webRequest: session.defaultSession.webRequest, webContents },
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
  return developmentRendererUrl || rendererDistUrl;
}

function readDevelopmentRendererUrl(): string {
  const prefix = '--nimi-dev-renderer-url=';
  const values = process.argv.filter((value) => value.startsWith(prefix));
  if (values.length === 0) return '';
  if (values.length !== 1) throw new Error('Nimi development renderer URL must be singular.');
  const selected = values[0];
  if (!selected) throw new Error('Nimi development renderer URL is missing.');
  const parsed = new URL(selected.slice(prefix.length));
  if (
    parsed.protocol !== 'http:'
    || !['127.0.0.1', 'localhost', '[::1]', '::1'].includes(parsed.hostname.toLowerCase())
    || !parsed.port
    || parsed.username
    || parsed.password
    || (parsed.pathname !== '/' && parsed.pathname !== '')
    || parsed.search
    || parsed.hash
  ) {
    throw new Error('Nimi development renderer URL must be exact loopback.');
  }
  return parsed.origin;
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
