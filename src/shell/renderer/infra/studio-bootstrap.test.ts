import { beforeEach, describe, expect, it, vi } from 'vitest';

const authStatusMock = vi.fn();
const createNimiClientMock = vi.fn();
const createNimiLocalAppStandardShellSurfaceMock = vi.fn();

vi.mock('@nimiplatform/sdk', () => ({
  createNimiClient: createNimiClientMock,
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
  createNimiLocalAppStandardShellSurface: createNimiLocalAppStandardShellSurfaceMock,
}));

let useAppStore: typeof import('../app-shell/app-store.js').useAppStore;
let runStudioBootstrap: typeof import('./studio-bootstrap.js').runStudioBootstrap;
let ensureStudioRuntimeClientReady: typeof import('./studio-bootstrap.js').ensureStudioRuntimeClientReady;

describe('Realm World Studio Desktop-supervised bootstrap hardcut', () => {
  beforeEach(async () => {
    vi.resetModules();
    authStatusMock.mockReset();
    createNimiClientMock.mockReset();
    createNimiLocalAppStandardShellSurfaceMock.mockReset();
    const standardShell = { session: { status: vi.fn() } };
    createNimiLocalAppStandardShellSurfaceMock.mockReturnValue(standardShell);
    createNimiClientMock.mockReturnValue({ auth: { status: authStatusMock } });
    authStatusMock.mockResolvedValue({
      state: 'session-bound',
      sessionBound: true,
      reasonCode: 'local-app-session-bound',
      actionHint: 'none',
    });

    ({ useAppStore } = await import('../app-shell/app-store.js'));
    ({ runStudioBootstrap, ensureStudioRuntimeClientReady } = await import('./studio-bootstrap.js'));
    useAppStore.setState({
      auth: { status: 'bootstrapping' },
      bootstrapReady: false,
      bootstrapError: null,
      bootstrapFailure: null,
    });
  });

  it('binds only through the Desktop-supervised local-app standard shell', async () => {
    await runStudioBootstrap();

    expect(createNimiLocalAppStandardShellSurfaceMock).toHaveBeenCalledTimes(1);
    expect(createNimiClientMock).toHaveBeenCalledWith({
      localApp: {
        standardShell: expect.objectContaining({ session: expect.any(Object) }),
      },
    });
    expect(useAppStore.getState().bootstrapReady).toBe(true);
    expect(useAppStore.getState().bootstrapFailure).toBeNull();
    expect(useAppStore.getState().auth.status).toBe('authenticated');
  });

  it('preserves local-app carrier failures as typed repair states', async () => {
    authStatusMock.mockResolvedValueOnce({
      state: 'action-required',
      sessionBound: false,
      reasonCode: 'protected-carrier-required',
      actionHint: 'repair_verified_runtime_service',
    });

    await runStudioBootstrap({ force: true });

    expect(useAppStore.getState().bootstrapFailure).toEqual({
      state: 'repair-required',
      reasonCode: 'protected-carrier-required',
      actionHint: 'repair_verified_runtime_service',
      message: 'Realm World Studio Desktop-supervised local-app session is not bound.',
    });
  });

  it('keeps generic Runtime client access explicitly unavailable after session binding', async () => {
    await expect(ensureStudioRuntimeClientReady()).rejects.toThrow(
      /Runtime client access is not covered by the Nimi App Access operation set/,
    );
    expect(authStatusMock).toHaveBeenCalledTimes(1);
  });
});
