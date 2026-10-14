# Security

## Credential custody

- Do not store Realm credentials, Runtime access tokens, or Runtime refresh tokens in this repository or in any app-local storage.
- **Runtime** owns app registration, active session admission, operation access enforcement, and Nimi credential custody. **Desktop** provides exact Electron Host supervision, process lifecycle management, and user management entrypoints.
- The renderer receives only the bounded local-app standard shell surface; tokens, endpoints, launch leases, and session material never enter Studio state, and Studio must not implement app-local login or OAuth flows.

## Nimi client

- Use the local-app client constructed in `src/shell/renderer/app-shell/studio-platform.ts` via the host-bound `createNimiClient` paired with `createNimiLocalAppStandardShellSurface`.
- Do not introduce direct bare Runtime or Realm requests, legacy Tauri IPC paths, generic proxies, renderer-owned identity, or parallel client construction paths.

## App Access posture

- `nimi.app.yaml` declares the `[realm.data, runtime.consume, app.activity]` `app_access` domains. These declarations state requested scope and are not self-granted operational authorization: Runtime enforces active session admission and operation access, Registry/Platform governs catalog review and approved release descriptors, and any separate Integration standing resource permissions remain independent.
- Do not invent undeclared domains or side channels, and do not synthesize success on a typed contract gap. Unavailable operations must fail closed with an operation-specific capability-unavailable error.

## Reporting a vulnerability

If you discover a vulnerability in Realm World Studio, do not open a public issue. Contact the Nimi Platform security team through the channel listed in the Nimi developer portal.
