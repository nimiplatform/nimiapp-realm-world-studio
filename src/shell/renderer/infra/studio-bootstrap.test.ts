import { beforeEach, describe, expect, it, vi } from 'vitest';

const createInstalledNimiAppBootstrapMock = vi.fn();
const createInstalledNimiAppStandardShellSurfaceMock = vi.fn();

vi.mock('@nimiplatform/sdk/app', () => ({
  createInstalledNimiAppBootstrap: createInstalledNimiAppBootstrapMock,
}));

vi.mock('@nimiplatform/sdk/types', () => ({
  createNimiError: (input: {
    message: string;
    reasonCode: string;
    actionHint: string;
    source: string;
  }) => Object.assign(new Error(input.message), input),
}));

vi.mock('../bridge/index.js', () => ({
  createInstalledNimiAppStandardShellSurface: createInstalledNimiAppStandardShellSurfaceMock,
}));

let useAppStore: typeof import('../app-shell/app-store.js').useAppStore;
let runStudioBootstrap: typeof import('./studio-bootstrap.js').runStudioBootstrap;
let ensureStudioRuntimeClientReady: typeof import('./studio-bootstrap.js').ensureStudioRuntimeClientReady;

describe('Realm World Studio installed bootstrap hardcut', () => {
  beforeEach(async () => {
    vi.resetModules();
    createInstalledNimiAppBootstrapMock.mockReset();
    createInstalledNimiAppStandardShellSurfaceMock.mockReset();
    const standardShell = {
      artifacts: { readRuntimeBytes: vi.fn() },
    };
    createInstalledNimiAppStandardShellSurfaceMock.mockReturnValue(standardShell);
    createInstalledNimiAppBootstrapMock.mockReturnValue({ artifacts: standardShell.artifacts });

    ({ useAppStore } = await import('../app-shell/app-store.js'));
    ({ runStudioBootstrap, ensureStudioRuntimeClientReady } = await import('./studio-bootstrap.js'));
    useAppStore.setState({
      auth: { status: 'bootstrapping', user: null },
      bootstrapReady: false,
      bootstrapError: null,
      bootstrapFailure: null,
    });
  });

  it('constructs only the artifact bootstrap and then fails the unadmitted operation set closed', async () => {
    await runStudioBootstrap();

    expect(createInstalledNimiAppStandardShellSurfaceMock).toHaveBeenCalledTimes(1);
    expect(createInstalledNimiAppBootstrapMock).toHaveBeenCalledWith({
      standardShell: expect.objectContaining({ artifacts: expect.any(Object) }),
    });
    expect(useAppStore.getState().bootstrapReady).toBe(false);
    expect(useAppStore.getState().bootstrapFailure).toMatchObject({
      state: 'capability-unavailable',
      reasonCode: 'world-studio-protected-operation-set-not-admitted',
    });
    expect(useAppStore.getState().auth.status).toBe('unauthenticated');
  });

  it('preserves protected native carrier failures as typed repair states', async () => {
    createInstalledNimiAppBootstrapMock.mockImplementationOnce(() => {
      throw Object.assign(new Error('Protected carrier required'), {
        reasonCode: 'protected-carrier-required',
        actionHint: 'repair_verified_runtime_service',
      });
    });

    await runStudioBootstrap({ force: true });

    expect(useAppStore.getState().bootstrapFailure).toEqual({
      state: 'repair-required',
      reasonCode: 'protected-carrier-required',
      actionHint: 'repair_verified_runtime_service',
      message: 'Protected carrier required',
    });
  });

  it('never retries through a generic Runtime client', async () => {
    await expect(ensureStudioRuntimeClientReady()).rejects.toThrow(/protected installed session/i);
    expect(createInstalledNimiAppBootstrapMock).toHaveBeenCalledTimes(1);
  });
});
