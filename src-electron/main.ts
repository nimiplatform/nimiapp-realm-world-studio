import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { appendFile, mkdir } from 'node:fs/promises';
import { app, BrowserWindow, ipcMain, Menu, shell } from 'electron';
import { NIMI_STANDARD_SHELL_COMMANDS } from '@nimiplatform/kit/shell/capabilities';
import {
  createNimiElectronStandardApplicationMenuTemplate,
  isAllowedElectronRendererUrl,
  registerNimiElectronRuntimeBridge,
  type NimiElectronHostCommandPolicy,
} from '@nimiplatform/kit/shell/electron/main';
import { REALM_WORLD_STUDIO_APP_ID } from '../src/shell/app-identity.js';
import { createRealmWorldStudioElectronTrustedRuntimeMetadataProvider } from './runtime-auth.js';

const currentFilePath = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFilePath);
const appRoot = resolveAppRoot(currentDir);
const preloadPath = path.join(currentDir, 'preload.cjs');
const rendererDistIndex = path.join(appRoot, 'dist', 'index.html');
const rendererDistUrl = pathToFileURL(rendererDistIndex).toString();
const rendererUrl = normalizeText(process.env.NIMI_REALM_WORLD_STUDIO_ELECTRON_RENDERER_URL);
const runtimeEndpoint = normalizeText(process.env.NIMI_RUNTIME_GRPC_ADDR)
  || normalizeText(process.env.NIMI_REALM_WORLD_STUDIO_ELECTRON_RUNTIME_ENDPOINT)
  || '127.0.0.1:46371';
let mainWindow: BrowserWindow | undefined;

app.setName('Realm World Studio');
installRealmWorldStudioStandardApplicationMenu();
configureRealmWorldStudioElectronChromiumRuntime();

void app.whenReady().then(bootstrapElectron).catch(handleElectronStartupFailure);

async function bootstrapElectron(): Promise<void> {
  registerNimiElectronRuntimeBridge({
    appId: REALM_WORLD_STUDIO_APP_ID,
    runtimeEndpoint,
    allowedOrigins: allowedRendererOrigins(),
    allowedRendererUrls: allowedRendererUrls(),
    ipcMain,
    trustedRuntimeMetadataProvider: createRealmWorldStudioElectronTrustedRuntimeMetadataProvider({
      appId: REALM_WORLD_STUDIO_APP_ID,
      runtimeEndpoint,
    }),
    commandPolicy: realmWorldStudioElectronCommandPolicy,
    standardShellHost: {
      openExternalUrl: openRealmWorldStudioExternalUrl,
      focusMainWindow,
    },
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
    createNimiElectronStandardApplicationMenuTemplate({ appName: 'Realm World Studio' }),
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
    minWidth: 1040,
    minHeight: 680,
    title: 'Realm World Studio',
    autoHideMenuBar: true,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  mainWindow = window;
  window.on('closed', () => {
    if (mainWindow === window) {
      mainWindow = undefined;
    }
  });
  hardenRealmWorldStudioWindowChrome(window);
  secureRealmWorldStudioWindow(window);
  await loadRenderer(window);
  return window;
}

async function loadRenderer(window: BrowserWindow): Promise<void> {
  if (rendererUrl) {
    await window.loadURL(rendererUrl);
    return;
  }
  await window.loadURL(rendererDistUrl);
}

function hardenRealmWorldStudioWindowChrome(window: BrowserWindow): void {
  window.setAutoHideMenuBar(true);
  window.setMenuBarVisibility(false);
}

function secureRealmWorldStudioWindow(window: BrowserWindow): void {
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  window.webContents.on('will-navigate', (event, url) => {
    if (!isRealmWorldStudioRendererUrl(url)) {
      event.preventDefault();
    }
  });
}

function allowedRendererOrigins(): string[] {
  const origins = new Set<string>();
  for (const url of allowedRendererUrls()) {
    origins.add(originForRendererUrl(url));
  }
  for (const origin of normalizeText(process.env.NIMI_REALM_WORLD_STUDIO_ELECTRON_ALLOWED_ORIGINS).split(',')) {
    const normalized = normalizeText(origin);
    if (normalized) {
      origins.add(normalized);
    }
  }
  return [...origins];
}

function originForRendererUrl(url: string): string {
  const parsed = new URL(url);
  return parsed.protocol === 'file:' ? 'file://' : parsed.origin;
}

function allowedRendererUrls(): string[] {
  const urls = new Set<string>([rendererUrl || rendererDistUrl]);
  for (const url of normalizeText(process.env.NIMI_REALM_WORLD_STUDIO_ELECTRON_ALLOWED_RENDERER_URLS).split(',')) {
    const normalized = normalizeText(url);
    if (normalized) {
      urls.add(normalized);
    }
  }
  return [...urls];
}

function isRealmWorldStudioRendererUrl(url: string): boolean {
  return isAllowedElectronRendererUrl(url, allowedRendererUrls());
}

const allowedStandardCommands: ReadonlySet<string> = new Set([
  NIMI_STANDARD_SHELL_COMMANDS['runtime.unary'],
  NIMI_STANDARD_SHELL_COMMANDS['runtime.streamOpen'],
  NIMI_STANDARD_SHELL_COMMANDS['runtime.streamClose'],
  NIMI_STANDARD_SHELL_COMMANDS['runtime-defaults.get'],
  NIMI_STANDARD_SHELL_COMMANDS['oauth.openExternalUrl'],
  NIMI_STANDARD_SHELL_COMMANDS['oauth.listenForCode'],
  NIMI_STANDARD_SHELL_COMMANDS['shell-ui.confirmDialog'],
  NIMI_STANDARD_SHELL_COMMANDS['shell-ui.startWindowDrag'],
  NIMI_STANDARD_SHELL_COMMANDS['shell-ui.focusMainWindow'],
]);

const realmWorldStudioElectronCommandPolicy: NimiElectronHostCommandPolicy = (input) => {
  if (input.commandKind === 'standard' && allowedStandardCommands.has(input.command)) {
    return { allow: true };
  }
  return {
    allow: false,
    code: 'capability-unavailable',
    reasonCode: 'realm-world-studio-electron-command-not-admitted',
    actionHint: 'use_admitted_realm_world_studio_shell_command',
    details: { command: input.command, commandKind: input.commandKind },
  };
};

async function openRealmWorldStudioExternalUrl(url: string): Promise<void> {
  const capturePath = normalizeText(process.env.NIMI_REALM_WORLD_STUDIO_ELECTRON_OPEN_EXTERNAL_CAPTURE_FILE);
  if (capturePath) {
    const resolved = path.resolve(capturePath);
    await mkdir(path.dirname(resolved), { recursive: true });
    await appendFile(resolved, `${url}\n`, 'utf8');
    return;
  }
  await shell.openExternal(url);
}

async function focusMainWindow(): Promise<void> {
  const window = mainWindow && !mainWindow.isDestroyed()
    ? mainWindow
    : BrowserWindow.getAllWindows().find((candidate) => !candidate.isDestroyed());
  if (!window) {
    throw new Error('Realm World Studio Electron main window unavailable');
  }
  if (window.isMinimized()) {
    window.restore();
  }
  window.show();
  window.focus();
}

function normalizeText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}
