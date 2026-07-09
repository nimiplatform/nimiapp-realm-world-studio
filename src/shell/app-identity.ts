// Canonical Realm World Studio app identity.
//
// Keep this single-source across manifest, Runtime/SDK callers, desktop shell
// hosts, storage/session projection, and the Tauri bundle identity.

export const REALM_WORLD_STUDIO_APP_ID = 'nimi.realm-world-studio';
export const REALM_WORLD_STUDIO_PRODUCT_SLUG = 'realm-world-studio';
export const REALM_WORLD_STUDIO_TAURI_IDENTIFIER = REALM_WORLD_STUDIO_APP_ID;
export const REALM_WORLD_STUDIO_RUNTIME_APP_ID = REALM_WORLD_STUDIO_APP_ID;
export const REALM_WORLD_STUDIO_RUNTIME_APP_INSTANCE_ID = `${REALM_WORLD_STUDIO_RUNTIME_APP_ID}.local-first-party`;
export const REALM_WORLD_STUDIO_RUNTIME_DEVICE_ID = 'local-first-party-device';
export const REALM_WORLD_STUDIO_RUNTIME_APP_SESSION_INSTANCE_ID = `${REALM_WORLD_STUDIO_RUNTIME_APP_ID}.platform-runtime-session`;
export const REALM_WORLD_STUDIO_RUNTIME_APP_SESSION_DEVICE_ID = 'platform-runtime-session';
