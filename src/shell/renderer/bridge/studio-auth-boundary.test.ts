import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import * as bridge from './index.js';

describe('studio auth bridge boundary', () => {
  let tauriMainSource = '';
  let studioAuthAdapterSource = '';
  let studioLoginPageSource = '';
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
    studioLoginPageSource = readFileSync(
      join(process.cwd(), 'src/shell/renderer/features/auth/studio-login-page.tsx'),
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
    expect('readInstalledNimiAppLaunchBinding' in bridge).toBe(true);
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

  it('projects installed app launch binding through the shared Kit Tauri helper', () => {
    expect(tauriMainSource).toContain('nimi_shell_tauri::installed_app_launch');
    expect(tauriMainSource).toContain('resolve_installed_nimi_app_launch_binding_from_env');
    expect(tauriMainSource).toContain('build_installed_nimi_app_launch_binding_script');
    expect(tauriMainSource).toContain('append_invoke_initialization_script');
    expect(tauriMainSource).toContain('NIMI_REALM_WORLD_STUDIO_TAURI_LAUNCH_NONCE');
  });

  it('registers standard shell capabilities and shell-ui aliases through Kit', () => {
    expect(tauriMainSource).toContain('use nimi_shell_tauri::capabilities::{');
    expect(tauriMainSource).toContain('ai_config');
    expect(tauriMainSource).toContain('data');
    expect(tauriMainSource).toContain('storage');
    expect(tauriMainSource).toContain('runtime::runtime_bridge_unary');
    expect(tauriMainSource).toContain('runtime::runtime_bridge_stream_open');
    expect(tauriMainSource).toContain('runtime::runtime_bridge_stream_close');
    expect(tauriMainSource).toContain('data::data_path_resolve');
    expect(tauriMainSource).toContain('storage::storage_read_json');
    expect(tauriMainSource).toContain('storage::storage_write_json');
    expect(tauriMainSource).toContain('storage::storage_remove_json');
    expect(tauriMainSource).toContain('ai_config::ai_config_get');
    expect(tauriMainSource).toContain('ai_config::ai_config_set');
    expect(tauriMainSource).toContain('confirm_dialog');
    expect(tauriMainSource).toContain('start_window_drag');
    expect(tauriMainSource).toContain('focus_main_window');
    expect(tauriMainSource).not.toContain('runtime::runtime_bridge_status');
    expect(tauriMainSource).not.toContain('session_logging::log_renderer_event');
    expect(tauriMainSource).not.toContain('use nimi_shell_tauri::oauth_commands');
    expect(tauriMainSource).not.toContain('use nimi_shell_tauri::runtime_bridge');
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
    expect(studioLoginPageSource).not.toContain('DesktopShellAuthPage');
    expect(studioLoginPageSource).not.toContain('desktopBrowserAuth');
    expect(studioLoginPageSource).not.toContain('studioTauriOAuthBridge');
    expect(studioLoginPageSource).not.toContain('createStudioRuntimeAccountBrowserBroker');
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
  });
});
