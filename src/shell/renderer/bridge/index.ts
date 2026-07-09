// Studio mirrors parentos PO-SHELL-008 / K-ACCSVC-008: the app does not own
// access/refresh token custody. Auth session storage commands and token
// exchange commands stay disabled at the host layer and are not re-exported
// here.
export {
  BridgeError,
  confirmDialog,
  createInstalledNimiAppStandardShellSurface,
  focusMainWindow,
  startWindowDrag,
  hasElectronRuntime,
  hasNimiShellRuntime,
  hasTauriRuntime,
  readInstalledNimiAppLaunchBinding,
} from '@nimiplatform/kit/shell/renderer/bridge';
export type {
  InstalledNimiAppLaunchBinding,
  InstalledNimiAppStandardShellSurface,
  InstalledNimiAppStorageRemoveJsonResult,
  JsonValue,
  JsonObject,
  JsonPrimitive,
} from '@nimiplatform/kit/shell/renderer/bridge';
