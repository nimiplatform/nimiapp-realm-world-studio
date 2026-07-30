// Studio mirrors parentos PO-SHELL-008 / K-ACCSVC-008: the app does not own
// access/refresh token custody. Auth session storage commands and token
// exchange commands stay disabled at the host layer and are not re-exported
// here.
export {
  BridgeError,
  confirmDialog,
  createNimiLocalAppStandardShellSurface,
  focusMainWindow,
  startWindowDrag,
  hasElectronRuntime,
  hasNimiShellRuntime,
} from '@nimiplatform/kit/shell/renderer/bridge';
export type {
  JsonValue,
  JsonObject,
  JsonPrimitive,
  NimiLocalAppStandardShellSurface,
  NimiLocalAppStorageRemoveResult,
} from '@nimiplatform/kit/shell/renderer/bridge';
