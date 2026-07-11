import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import * as bridge from './index.js';

describe('studio auth bridge boundary', () => {
  let tauriMainSource = '';
  let studioAuthAdapterSource = '';
  let authProviderSource = '';
  let bootstrapSource = '';
  let stylesSource = '';

  beforeAll(() => {
    tauriMainSource = readFileSync(
      join(process.cwd(), 'src-tauri/src/main.rs'),
      'utf8',
    );
    studioAuthAdapterSource = readFileSync(
      join(process.cwd(), 'src/shell/renderer/features/auth/studio-auth-adapter.ts'),
      'utf8',
    );
    authProviderSource = readFileSync(
      join(process.cwd(), 'src/shell/renderer/app-shell/auth-provider.tsx'),
      'utf8',
    );
    bootstrapSource = readFileSync(
      join(process.cwd(), 'src/shell/renderer/infra/studio-bootstrap.ts'),
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

  it('does not export Runtime defaults or OAuth bridge surfaces from the installed app bridge', () => {
    expect('getStudioRuntimeDefaults' in bridge).toBe(false);
    expect('getRuntimeDefaults' in bridge).toBe(false);
    expect('oauthListenForCode' in bridge).toBe(false);
    expect('openExternalUrl' in bridge).toBe(false);
    expect('studioTauriOAuthBridge' in bridge).toBe(false);
    expect('createInstalledNimiAppStandardShellSurface' in bridge).toBe(true);
    expect('readInstalledNimiAppLaunchBinding' in bridge).toBe(false);
  });

  it('does not register oauth_token_exchange in the Tauri invoke handler', () => {
    expect(tauriMainSource).not.toContain('oauth_commands::oauth_token_exchange');
    expect(tauriMainSource).not.toContain('oauth_token_exchange,');
  });

  it('does not register Runtime defaults or OAuth in the Tauri invoke handler', () => {
    expect(tauriMainSource).not.toContain('runtime_defaults::runtime_defaults');
    expect(tauriMainSource).not.toContain('oauth::open_external_url');
    expect(tauriMainSource).not.toContain('oauth::oauth_listen_for_code');
    expect(bootstrapSource).not.toContain('getStudioRuntimeDefaults');
    expect(bootstrapSource).not.toContain('accessToken');
    expect(bootstrapSource).not.toContain('refreshToken');
  });

  it('installs only the protected native carrier and artifact command in Tauri', () => {
    expect(tauriMainSource).toContain('RuntimeBridgeInstalledHost::platform_default()');
    expect(tauriMainSource).toContain('nimi_shell_tauri_installed_app_standard_shell_handler![]');
    expect(tauriMainSource).not.toContain('installed_app_launch');
    expect(tauriMainSource).not.toContain('resolve_installed_nimi_app_launch_binding_from_env');
    expect(tauriMainSource).not.toContain('append_invoke_initialization_script');
    expect(tauriMainSource).not.toContain('std::env');
  });

  it('does not register generic Runtime, storage, AI config, OAuth, or app-domain commands', () => {
    expect(tauriMainSource).not.toContain('runtime_bridge_unary');
    expect(tauriMainSource).not.toContain('runtime_bridge_stream_open');
    expect(tauriMainSource).not.toContain('data_path_resolve');
    expect(tauriMainSource).not.toContain('storage_read_json');
    expect(tauriMainSource).not.toContain('ai_config_get');
    expect(tauriMainSource).not.toContain('oauth_token_exchange');
    expect(tauriMainSource).not.toContain('realm_world_studio_');
  });

  it('keeps login/token flow out of the installed app renderer', () => {
    expect(studioAuthAdapterSource).not.toContain('createRuntimeAccountBrowserBroker');
    expect(studioAuthAdapterSource).not.toContain('studioTauriOAuthBridge');
    expect(studioAuthAdapterSource).not.toContain('runtime.account.completeLogin');
    expect(studioAuthAdapterSource).not.toContain('runtime.account.beginLogin');
    expect(studioAuthAdapterSource).not.toContain("refreshToken: ''");
    expect(studioAuthAdapterSource).not.toContain("sealedCompletionTicket: ''");
    expect(studioAuthAdapterSource).not.toContain("uxTraceId: ''");
  });

  it('does not mount a renderer-owned desktop browser OAuth login page', () => {
    expect(existsSync(join(
      process.cwd(),
      'src/shell/renderer/features/auth/studio-login-page.tsx',
    ))).toBe(false);
    expect(authProviderSource).not.toContain('StudioLoginPage');
  });

  it('uses Kit bootstrap surfaces instead of app-local loading chrome', () => {
    expect(authProviderSource).toContain('AmbientBackground');
    expect(authProviderSource).toContain('LoadingSkeleton');
    expect(authProviderSource).toContain('InlineAlert');
    expect(authProviderSource).toContain('runStudioBootstrap({ force: true })');
    expect(authProviderSource).not.toContain('ras-fullscreen-center');
    expect(authProviderSource).not.toContain('ras-spinner');
    expect(stylesSource).not.toContain('.ras-fullscreen-center');
    expect(stylesSource).not.toContain('.ras-spinner');
    expect(stylesSource).toMatch(/\.ras-entry-fallback__panel\s*{[^}]*position:\s*relative;[^}]*z-index:\s*1;/s);
  });

  it('clears stale bootstrap failure state before Runtime retry execution', () => {
    expect(bootstrapSource).toContain('store.setBootstrapReady(false)');
    expect(bootstrapSource).toContain('store.setBootstrapError(null)');
    expect(bootstrapSource).toContain('store.setBootstrapFailure(null)');
  });
});
