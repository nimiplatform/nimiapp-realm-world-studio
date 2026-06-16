import type { Realm } from '@nimiplatform/sdk/realm';
import { getCurrentStudioNimiClient } from '@renderer/app-shell/studio-platform.js';

export const STUDIO_REALM_SURFACE_METHODS = [
  'listMyCreatorWorlds',
  'listCreatorWorldAgents',
  'getCreatorWorldAgent',
  'getCreatorWorldAgentSettings',
  'updateCreatorWorldAgentSettings',
  'updateCreatorWorldAgentProfileMedia',
  'updateCreatorWorldAgentVoice',
  'getCreatorWorldAgentChatReadiness',
  'projectRuntimePayload',
  'createImageDirectUpload',
  'createVideoDirectUpload',
  'createAudioDirectUpload',
  'finalizeResource',
  'createTextResource',
] as const;

export type StudioRealmSurfaceMethod = typeof STUDIO_REALM_SURFACE_METHODS[number];
export type StudioRealmSurface = Pick<Realm['generated'], StudioRealmSurfaceMethod>;

export function createStudioRealmSurface(realm: Pick<Realm, 'generated'>): StudioRealmSurface {
  const generated = realm.generated;
  return {
    listMyCreatorWorlds: generated.listMyCreatorWorlds.bind(generated),
    listCreatorWorldAgents: generated.listCreatorWorldAgents.bind(generated),
    getCreatorWorldAgent: generated.getCreatorWorldAgent.bind(generated),
    getCreatorWorldAgentSettings: generated.getCreatorWorldAgentSettings.bind(generated),
    updateCreatorWorldAgentSettings: generated.updateCreatorWorldAgentSettings.bind(generated),
    updateCreatorWorldAgentProfileMedia: generated.updateCreatorWorldAgentProfileMedia.bind(generated),
    updateCreatorWorldAgentVoice: generated.updateCreatorWorldAgentVoice.bind(generated),
    getCreatorWorldAgentChatReadiness: generated.getCreatorWorldAgentChatReadiness.bind(generated),
    projectRuntimePayload: generated.projectRuntimePayload.bind(generated),
    createImageDirectUpload: generated.createImageDirectUpload.bind(generated),
    createVideoDirectUpload: generated.createVideoDirectUpload.bind(generated),
    createAudioDirectUpload: generated.createAudioDirectUpload.bind(generated),
    finalizeResource: generated.finalizeResource.bind(generated),
    createTextResource: generated.createTextResource.bind(generated),
  };
}

export function createStudioRealmClient(): StudioRealmSurface {
  const realm = getCurrentStudioNimiClient().realm;
  if (!realm) {
    throw new Error(
      'Realm World Studio Realm client is unavailable. Reopen Studio after Runtime account bootstrap completes.',
    );
  }
  return createStudioRealmSurface(realm);
}
