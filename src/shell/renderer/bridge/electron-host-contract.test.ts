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
      'scripts/acceptance-electron.test.mjs',
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
    expect(packageJson.scripts.dev).toBe('nimi-app dev --shell tauri');
    expect(packageJson.scripts['dev:shell']).toBe('nimi-app dev');
    expect(packageJson.scripts['dev:electron']).toBe('nimi-app dev --shell electron');
    expect(packageJson.scripts['build:electron'] || '').toContain('tsconfig.electron.json');
    expect(packageJson.scripts['acceptance:electron'] || '').toContain('acceptance-electron.test.mjs');
    expect(packageJson.scripts['typecheck:electron'] || '').toContain('tsconfig.electron.json');
    expect(packageJson.devDependencies.electron || '').toMatch(/^\^?42\./);
    expect(packageJson.devDependencies.esbuild || '').toBeTruthy();
  });

  it('registers a narrowed Kit Electron bridge without app-local token custody or shadow storage', () => {
    const mainSource = read('src-electron/main.ts');
    const preloadSource = read('src-electron/preload.cts');
    expect(mainSource).toContain('@nimiplatform/kit/shell/electron/main');
    expect(mainSource).toContain('registerNimiElectronAppBridge');
    expect(mainSource).not.toContain('registerNimiElectronRuntimeBridge');
    expect(mainSource).not.toContain('createNimiElectronInstalledHost');
    expect(mainSource).not.toContain('NIMI_INSTALLED_NIMI_APP_STANDARD_SHELL_CAPABILITY_SET_ID');
    expect(mainSource).toContain('createNimiElectronStandardApplicationMenuTemplate');
    expect(mainSource).not.toContain('NIMI_REALM_WORLD_STUDIO_ELECTRON_RENDERER_URL');
    expect(mainSource).toContain('isAllowedElectronRendererUrl');
    expect(mainSource).not.toContain('runtimeEndpoint');
    expect(mainSource).not.toContain('allowedOrigins');
    expect(mainSource).not.toContain('installedHost');
    expect(mainSource).not.toContain('trustedRuntimeMetadataProvider');
    expect(mainSource).not.toContain('commandPolicy');
    expect(mainSource).not.toContain('additionalArguments');
    expect(mainSource).not.toContain('NIMI_RUNTIME_GRPC_ADDR');
    expect(mainSource).not.toContain('RUNTIME_ENDPOINT');
    expect(mainSource).not.toContain('NIMI_STANDARD_SHELL_COMMANDS');
    expect(mainSource).not.toContain('createNimiElectronFileAIConfigStore');
    expect(mainSource).not.toContain('standardDataRootBinding');
    expect(mainSource).toContain('--nimi-dev-renderer-url=');

    expect(preloadSource).toContain('@nimiplatform/kit/shell/electron/preload-cjs');
    expect(preloadSource).toContain('installNimiElectronRuntimeBridge');
    expect(preloadSource).not.toContain('exposeInMainWorld(\'electron\'');

    expect(existsSync(join(process.cwd(), 'src-electron/runtime-auth.ts'))).toBe(false);
    expect(existsSync(join(process.cwd(), 'scripts/run-electron-dev.mjs'))).toBe(false);
  });

  it('keeps generic Electron and Tauri Runtime transports out of the renderer', () => {
    const studioPlatformSource = read('src/shell/renderer/app-shell/studio-platform.ts');
    const bridgeSource = read('src/shell/renderer/bridge/index.ts');
    const windowDragSource = read('src/shell/renderer/bridge/window-drag.ts');

    expect(studioPlatformSource).not.toContain('hasElectronRuntime');
    expect(studioPlatformSource).not.toContain("type: 'electron-ipc'");
    expect(studioPlatformSource).not.toContain("type: 'tauri-ipc'");
    expect(bridgeSource).toContain('hasElectronRuntime');
    expect(bridgeSource).toContain('hasNimiShellRuntime');
    expect(bridgeSource).toContain('startWindowDrag');
    expect(windowDragSource).toContain('hasNimiShellRuntime');
    expect(windowDragSource).toContain('startWindowDrag');
    expect(windowDragSource).not.toContain('realm_world_studio_start_window_drag');
  });

  it('keeps the app identity single-sourced across Runtime and Electron', () => {
    const identitySource = read('src/shell/app-identity.ts');
    const studioPlatformSource = read('src/shell/renderer/app-shell/studio-platform.ts');
    const mainSource = read('src-electron/main.ts');

    expect(identitySource).toContain("REALM_WORLD_STUDIO_APP_ID = 'nimi.realm-world-studio'");
    expect(studioPlatformSource).toContain('REALM_WORLD_STUDIO_APP_ID');
    expect(mainSource).toContain("REALM_WORLD_STUDIO_APP_ID = 'nimi.realm-world-studio'");
    expect(identitySource).not.toContain('RUNTIME_APP_INSTANCE_ID');
    expect(identitySource).not.toContain('RELEASE_DESCRIPTOR_REF');
  });
});
