import { getStudioLocalAppClient } from './studio-platform.js';

export type StudioCurrentUser = {
  readonly handle: string;
  readonly displayName: string;
  readonly avatarUrl: string | null;
};

// The local-app currentUser surface exposes only display facts
// ({handle, displayName, avatarUrl}). It carries no credential, token, or
// account authority material, so it is safe to render directly.
export async function getStudioCurrentUser(): Promise<StudioCurrentUser> {
  const user = await getStudioLocalAppClient().currentUser.get();
  return {
    handle: user.handle,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
  };
}
