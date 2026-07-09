import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

function read(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('Realm World Studio Electron host contract', () => {
  it('adds an Electron shell beside the Tauri shell using Kit host primitives', () => {
    for (const relativePath of [
      'src-electron/main.ts',
      'src-electron/preload.cts',
      'src-electron/runtime-auth.ts',
      'scripts/run-electron-dev.mjs',
      'scripts/ensure-dev-renderer-port.mjs',
      'scripts/bundle-electron-preload.mjs',
      'tsconfig.electron.json',
    ]) {
      expect(existsSync(join(process.cwd(), relativePath))).toBe(true);
    }

    const packageJson = JSON.parse(read('package.json')) as {
      scripts: Record<string, string>;
      devDependencies: Record<string, string>;
    };
    expect(packageJson.scripts['dev:electron'] || '').toContain('run-electron-dev.mjs');
    expect(packageJson.scripts['build:electron'] || '').toContain('tsconfig.electron.json');
    expect(packageJson.scripts['typecheck:electron'] || '').toContain('tsconfig.electron.json');
    expect(packageJson.devDependencies.electron || '').toMatch(/^\^?42\./);
    expect(packageJson.devDependencies.esbuild || '').toBeTruthy();
  });

  it('registers a narrowed Kit Electron bridge without app-local token custody or shadow storage', () => {
    const mainSource = read('src-electron/main.ts');
    const preloadSource = read('src-electron/preload.cts');
    const runtimeAuthSource = read('src-electron/runtime-auth.ts');

    expect(mainSource).toContain('@nimiplatform/kit/shell/electron/main');
    expect(mainSource).toContain('registerNimiElectronRuntimeBridge');
    expect(mainSource).toContain('createNimiElectronStandardApplicationMenuTemplate');
    expect(mainSource).toContain('createRealmWorldStudioElectronTrustedRuntimeMetadataProvider');
    expect(mainSource).toContain('realmWorldStudioElectronCommandPolicy');
    expect(mainSource).toContain('NIMI_REALM_WORLD_STUDIO_ELECTRON_RENDERER_URL');
    expect(mainSource).toContain('NIMI_REALM_WORLD_STUDIO_ELECTRON_RUNTIME_ENDPOINT');
    expect(mainSource).toContain('isAllowedElectronRendererUrl');
    expect(mainSource).toContain("NIMI_STANDARD_SHELL_COMMANDS['runtime.unary']");
    expect(mainSource).toContain("NIMI_STANDARD_SHELL_COMMANDS['runtime-defaults.get']");
    expect(mainSource).toContain("NIMI_STANDARD_SHELL_COMMANDS['oauth.openExternalUrl']");
    expect(mainSource).toContain("NIMI_STANDARD_SHELL_COMMANDS['oauth.listenForCode']");
    expect(mainSource).not.toContain("NIMI_STANDARD_SHELL_COMMANDS['oauth.tokenExchange']");
    expect(mainSource).not.toContain('createNimiElectronFileAIConfigStore');
    expect(mainSource).not.toContain('standardDataRootBinding');
    expect(mainSource).not.toContain('localAgentIdentity');

    expect(preloadSource).toContain('@nimiplatform/kit/shell/electron/preload-cjs');
    expect(preloadSource).toContain('installNimiElectronRuntimeBridge');
    expect(preloadSource).not.toContain('exposeInMainWorld(\'electron\'');

    expect(runtimeAuthSource).toContain('createNimiRuntimeAppSessionMetadataProvider');
    expect(runtimeAuthSource).toContain('local-first-party-app');
    expect(runtimeAuthSource).not.toContain('getAccessToken');
    expect(runtimeAuthSource).not.toContain('refreshToken');
    expect(runtimeAuthSource).not.toContain('protectedAccess');
  });

  it('selects electron-ipc in the renderer without spoofing Tauri transport', () => {
    const studioPlatformSource = read('src/shell/renderer/app-shell/studio-platform.ts');
    const bridgeSource = read('src/shell/renderer/bridge/index.ts');
    const windowDragSource = read('src/shell/renderer/bridge/window-drag.ts');

    expect(studioPlatformSource).toContain('hasElectronRuntime');
    expect(studioPlatformSource).toContain("type: 'electron-ipc'");
    expect(studioPlatformSource).toContain("type: 'tauri-ipc'");
    expect(studioPlatformSource).toContain("hostKind !== 'electron'");
    expect(bridgeSource).toContain('hasElectronRuntime');
    expect(bridgeSource).toContain('hasShellHostInvoke');
    expect(bridgeSource).toContain('startWindowDrag');
    expect(windowDragSource).toContain('startWindowDrag');
    expect(windowDragSource).not.toContain('realm_world_studio_start_window_drag');
  });

  it('keeps the app identity single-sourced across Runtime and Electron', () => {
    const identitySource = read('src/shell/app-identity.ts');
    const studioPlatformSource = read('src/shell/renderer/app-shell/studio-platform.ts');
    const mainSource = read('src-electron/main.ts');
    const runtimeAuthSource = read('src-electron/runtime-auth.ts');

    expect(identitySource).toContain("REALM_WORLD_STUDIO_APP_ID = 'nimi.realm-world-studio'");
    expect(studioPlatformSource).toContain('REALM_WORLD_STUDIO_RUNTIME_APP_ID');
    expect(mainSource).toContain('REALM_WORLD_STUDIO_APP_ID');
    expect(runtimeAuthSource).toContain('REALM_WORLD_STUDIO_RUNTIME_APP_INSTANCE_ID');
  });
});
