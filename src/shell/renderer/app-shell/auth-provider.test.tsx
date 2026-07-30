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
        reasonCode: 'world-studio-protected-operation-set-not-admitted',
        actionHint: 'wait_for_world_studio_protected_operation_admission',
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
    expect(screen.getByText(/world-studio-protected-operation-set-not-admitted/)).toBeTruthy();
  });

  it('does not require a reason code or expose a universal retry action', () => {
    useAppStore.setState({
      bootstrapFailure: {
        state: 'action-required',
        message: 'Account action is required in Nimi Desktop',
      },
    });

    render(<AuthProvider><div /></AuthProvider>);
    expect(runStudioBootstrapMock).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId('world-studio-protected-session-retry')).toBeNull();
    expect(screen.queryByText(/Reason code:/)).toBeNull();
    expect((screen.getByTestId('world-studio-protected-operations-locked') as HTMLButtonElement).disabled).toBe(true);
  });
});
