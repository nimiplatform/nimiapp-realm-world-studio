import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

function read(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('Realm World Studio managed-web Desktop carrier contract', () => {
  it('uses the shared managed-web carrier with no App-owned Electron host', () => {
    for (const relativePath of [
      'src-electron/main.ts',
      'src-electron/preload.cts',
      'src-electron/runtime-auth.ts',
      'scripts/bundle-electron-preload.mjs',
      'scripts/run-electron-dev.mjs',
      'tsconfig.electron.json',
    ]) {
      expect(existsSync(join(process.cwd(), relativePath)), relativePath).toBe(false);
    }

    const buildProfile = read('.nimi/config/build-profile.yaml');
    expect(buildProfile).toContain('build_profile_ref: managed-web-pnpm-vite');
    expect(buildProfile).toContain('desktop-universal:');
    expect(buildProfile).toContain('payload_path: dist/renderer');
    expect(buildProfile).toContain('runtime_entry: payload/index.html');

    const packageJson = JSON.parse(read('package.json')) as {
      scripts: Record<string, string>;
      devDependencies: Record<string, string>;
      main?: string;
    };
    expect(packageJson.main).toBeUndefined();
    expect(packageJson.scripts.dev).toBe('nimi-app dev --shell electron');
    expect(packageJson.scripts['dev:shell']).toBe('nimi-app dev');
    expect(packageJson.scripts['build:electron']).toBeUndefined();
    expect(packageJson.scripts['typecheck:electron']).toBeUndefined();
    expect(packageJson.scripts.postinstall).toBeUndefined();
    expect(packageJson.devDependencies.electron).toBeUndefined();
    expect(packageJson.devDependencies['@electron/packager']).toBeUndefined();
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

  it('keeps the app identity single-sourced across Runtime, manifest, and renderer', () => {
    const identitySource = read('src/shell/app-identity.ts');
    const studioPlatformSource = read('src/shell/renderer/app-shell/studio-platform.ts');
    const manifestSource = read('nimi.app.yaml');

    expect(identitySource).toContain("REALM_WORLD_STUDIO_APP_ID = 'nimi.realm-world-studio'");
    expect(studioPlatformSource).toContain('REALM_WORLD_STUDIO_APP_ID');
    expect(manifestSource).toContain('app_id: nimi.realm-world-studio');
    expect(manifestSource).toContain('kind: nimi-mediated-default');
    expect(manifestSource).toContain('title_bar_style: native');
    expect(identitySource).not.toContain('RUNTIME_APP_INSTANCE_ID');
    expect(identitySource).not.toContain('RELEASE_DESCRIPTOR_REF');
  });
});
