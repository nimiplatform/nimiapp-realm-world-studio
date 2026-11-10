import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import * as bridge from './index.js';

describe('studio auth bridge boundary', () => {
  let authProviderSource = '';
  let bootstrapSource = '';
  let stylesSource = '';

  beforeAll(() => {
    authProviderSource = readFileSync(
      join(process.cwd(), 'src/shell/renderer/App.tsx'),
      'utf8',
    );
    bootstrapSource = readFileSync(
      join(process.cwd(), 'src/shell/renderer/main.tsx'),
      'utf8',
    );
    stylesSource = readFileSync(
      join(process.cwd(), 'src/shell/renderer/styles.css'),
      'utf8',
    );
  });

  it('does not export oauthTokenExchange from the Studio renderer bridge', () => {
    expect('oauthTokenExchange' in bridge).toBe(false);
  });

  it('does not export Runtime defaults or OAuth bridge surfaces from the local-app bridge', () => {
    expect('getStudioRuntimeDefaults' in bridge).toBe(false);
    expect('getRuntimeDefaults' in bridge).toBe(false);
    expect('oauthListenForCode' in bridge).toBe(false);
    expect('openExternalUrl' in bridge).toBe(false);
    expect('studioTauriOAuthBridge' in bridge).toBe(false);
    expect('createNimiLocalAppStandardShellSurface' in bridge).toBe(true);
    expect('createInstalledNimiAppStandardShellSurface' in bridge).toBe(false);
    expect('readInstalledNimiAppLaunchBinding' in bridge).toBe(false);
  });

  it('does not register Runtime defaults or OAuth in the active renderer bootstrap', () => {
    expect(bootstrapSource).not.toContain('getStudioRuntimeDefaults');
    expect(bootstrapSource).not.toContain('accessToken');
    expect(bootstrapSource).not.toContain('refreshToken');
  });

  it('keeps login/token flow out of the Desktop-supervised local-app renderer', () => {
    expect(existsSync(join(
      process.cwd(),
      'src/shell/renderer/features/auth/studio-auth-adapter.ts',
    ))).toBe(false);
  });

  it('does not mount a renderer-owned desktop browser OAuth login page', () => {
    expect(existsSync(join(
      process.cwd(),
      'src/shell/renderer/features/auth/studio-login-page.tsx',
    ))).toBe(false);
    expect(authProviderSource).not.toContain('StudioLoginPage');
  });

  it('uses the shared access gate and retires App-owned bootstrap state', () => {
    expect(authProviderSource).toContain('NimiAppAccessGate');
    expect(bootstrapSource).toContain('createDesktopNimiAppSession');
    expect(existsSync(join(process.cwd(), 'src/shell/renderer/app-shell/app-store.ts'))).toBe(false);
    expect(stylesSource).not.toContain('.ras-fullscreen-center');
  });

});
