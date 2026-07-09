// Canonical Realm World Studio app identity.
//
// Keep this single-source across manifest, Runtime/SDK callers, desktop shell
// hosts, storage/session projection, and the Tauri bundle identity.

export const REALM_WORLD_STUDIO_APP_ID = 'nimi.realm-world-studio';
export const REALM_WORLD_STUDIO_PRODUCT_SLUG = 'realm-world-studio';
export const REALM_WORLD_STUDIO_TAURI_IDENTIFIER = REALM_WORLD_STUDIO_APP_ID;
export const REALM_WORLD_STUDIO_RUNTIME_APP_ID = REALM_WORLD_STUDIO_APP_ID;
export const REALM_WORLD_STUDIO_RUNTIME_APP_INSTANCE_ID = `${REALM_WORLD_STUDIO_RUNTIME_APP_ID}.desktop-installed`;
export const REALM_WORLD_STUDIO_RUNTIME_DEVICE_ID = 'desktop-installed-app';
export const REALM_WORLD_STUDIO_RELEASE_DESCRIPTOR_REF = 'nimi.realm-world-studio.bundled-with-nimi' as const;
