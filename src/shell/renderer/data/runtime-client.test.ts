import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const dataDir = dirname(fileURLToPath(import.meta.url));
const rendererRoot = resolve(dataDir, '..');

describe('studio runtime client gate', () => {
  it('does not construct app-owned Realm or Runtime clients in renderer data modules', () => {
    const realmClientSource = readFileSync(resolve(dataDir, 'realm-client.ts'), 'utf8');
    const bridgeSource = readFileSync(resolve(rendererRoot, 'bridge', 'index.ts'), 'utf8');
    const appStoreSource = readFileSync(resolve(rendererRoot, 'app-shell', 'app-store.ts'), 'utf8');
    const studioPlatformSource = readFileSync(resolve(rendererRoot, 'app-shell', 'studio-platform.ts'), 'utf8');
    const combinedDataSource = realmClientSource;

    expect(existsSync(resolve(dataDir, 'runtime-client.ts'))).toBe(false);
    expect(combinedDataSource).not.toMatch(/VITE_REALM_ACCESS_TOKEN|external_principal|allowAnonymousRealm/);
    expect(combinedDataSource).not.toMatch(/createRealmClient|createPlatformClient/);
    expect(studioPlatformSource).toContain('createNimiClient');
    expect(studioPlatformSource).not.toContain("type: 'tauri-ipc'");
    expect(existsSync(resolve(rendererRoot, 'app-shell', 'tauri-runtime.ts'))).toBe(false);
    expect(studioPlatformSource).not.toContain('createInstalledNimiAppBootstrap');
    expect(studioPlatformSource).toContain('createNimiLocalAppStandardShellSurface');
    expect(studioPlatformSource).not.toContain('createNimiLocalFirstPartyRuntimeAccountCaller');
    expect(studioPlatformSource).not.toContain('createNimiRuntimeAppSessionMetadataProvider');
    expect(studioPlatformSource).not.toContain('createNimiRuntimeFullAppRegistration');
    expect(studioPlatformSource).not.toContain('readInstalledNimiAppLaunchBinding');
    expect(studioPlatformSource).not.toContain('createStudioRealmBridgeOptions');
    expect(existsSync(resolve(rendererRoot, 'app-shell', 'studio-realm-transport.ts'))).toBe(false);
    expect(studioPlatformSource).not.toContain('getAccessToken');
    expect(studioPlatformSource).not.toContain('createRealmFetchTransport');
    expect(studioPlatformSource).not.toMatch(/VITE_REALM_ACCESS_TOKEN|refreshToken|sessionStore|subjectUserIdProvider/);
    expect(bridgeSource).not.toContain('readInstalledNimiAppLaunchBinding');
    expect(bridgeSource).toContain('createNimiLocalAppStandardShellSurface');
    expect(bridgeSource).not.toContain('getStudioRuntimeDefaults');
    expect(bridgeSource).not.toContain('getNimiRuntimeDefaults');
    expect(bridgeSource).not.toContain('RuntimeDefaults');
    expect(bridgeSource).not.toContain('VITE_NIMI_REALM_BASE_URL');
    expect(bridgeSource).not.toContain('NIMI_REALM_URL');
    expect(bridgeSource).not.toContain('localhost:3002');
    expect(appStoreSource).not.toContain('StudioRuntimeDefaults');
    expect(appStoreSource).not.toContain('accessToken');
  });
});
