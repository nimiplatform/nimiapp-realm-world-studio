import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { AuthProvider } from './auth-provider.js';
import { useAppStore } from './app-store.js';

const { runStudioBootstrapMock } = vi.hoisted(() => ({
  runStudioBootstrapMock: vi.fn(),
}));

vi.mock('../infra/studio-bootstrap.js', () => ({
  runStudioBootstrap: runStudioBootstrapMock,
}));

describe('Realm World Studio protected-session UI', () => {
  beforeEach(() => {
    runStudioBootstrapMock.mockReset();
    useAppStore.setState({
      auth: { status: 'unauthenticated' },
      bootstrapReady: false,
      bootstrapError: 'Protected operation unavailable',
      bootstrapFailure: {
        state: 'capability-unavailable',
        reasonCode: 'world-studio-operation-not-in-app-access',
        actionHint: 'wait_for_platform_app_surface',
        message: 'Protected operation unavailable',
      },
    });
  });

  afterEach(cleanup);

  it('renders an actionable fail-closed panel and never exposes product children', () => {
    render(<AuthProvider><div data-testid="world-workbench">world workbench</div></AuthProvider>);

    const panel = screen.getByTestId('world-studio-protected-session-failure');
    expect(panel.getAttribute('data-protected-state')).toBe('capability-unavailable');
    expect(screen.queryByTestId('world-workbench')).toBeNull();
    expect((screen.getByTestId('world-studio-protected-operations-locked') as HTMLButtonElement).disabled).toBe(true);
    // Machine codes stay inside the collapsed technical details, never in the
    // primary alert copy.
    const details = screen.getByText('Technical details').closest('details');
    expect(details).not.toBeNull();
    expect(details?.open).toBe(false);
    expect(details?.textContent).toContain('world-studio-operation-not-in-app-access');
  });

  it('offers a same-host recheck that forces a fresh bootstrap', () => {
    render(<AuthProvider><div /></AuthProvider>);

    const retry = screen.getByTestId('world-studio-protected-session-retry') as HTMLButtonElement;
    expect(retry.disabled).toBe(false);
    retry.click();
    expect(runStudioBootstrapMock).toHaveBeenLastCalledWith({ force: true });
  });

  it('renders typed access-denied posture for undeclared App Access domains', () => {
    useAppStore.setState({
      bootstrapFailure: {
        state: 'access-denied',
        reasonCode: 'local-app-access-denied',
        message: 'The effective App Access snapshot does not cover the operation domain.',
      },
    });

    render(<AuthProvider><div data-testid="world-workbench">world workbench</div></AuthProvider>);
    const panel = screen.getByTestId('world-studio-protected-session-failure');
    expect(panel.getAttribute('data-protected-state')).toBe('access-denied');
    expect(screen.queryByTestId('world-workbench')).toBeNull();
  });

  it('keeps technical details collapsed when no machine codes are present', () => {
    useAppStore.setState({
      bootstrapFailure: {
        state: 'action-required',
        message: 'Account action is required in Nimi Desktop',
      },
    });

    render(<AuthProvider><div /></AuthProvider>);
    expect(runStudioBootstrapMock).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Technical details')).toBeNull();
    expect((screen.getByTestId('world-studio-protected-operations-locked') as HTMLButtonElement).disabled).toBe(true);
  });
});
