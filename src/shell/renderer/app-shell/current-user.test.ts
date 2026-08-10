import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getStudioLocalAppClientMock } = vi.hoisted(() => ({
  getStudioLocalAppClientMock: vi.fn(),
}));

vi.mock('./studio-platform.js', () => ({
  getStudioLocalAppClient: getStudioLocalAppClientMock,
}));

import { getStudioCurrentUser } from './current-user.js';

describe('studio current-user projection', () => {
  const get = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    getStudioLocalAppClientMock.mockReturnValue({ currentUser: { get } });
  });

  it('projects only display facts from the local-app currentUser surface', async () => {
    get.mockResolvedValue({
      handle: '@halliday',
      displayName: 'Halliday',
      avatarUrl: 'https://example.test/avatar.png',
    });

    await expect(getStudioCurrentUser()).resolves.toEqual({
      handle: '@halliday',
      displayName: 'Halliday',
      avatarUrl: 'https://example.test/avatar.png',
    });
    expect(get).toHaveBeenCalledTimes(1);
  });

  it('propagates typed unavailability without synthesizing an identity', async () => {
    get.mockRejectedValue(Object.assign(new Error('current user unavailable'), {
      reasonCode: 'SDK_LOCAL_APP_CURRENT_USER_UNAVAILABLE',
    }));

    await expect(getStudioCurrentUser()).rejects.toMatchObject({
      reasonCode: 'SDK_LOCAL_APP_CURRENT_USER_UNAVAILABLE',
    });
  });
});
