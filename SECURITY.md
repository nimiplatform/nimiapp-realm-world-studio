# Security

## Credential custody

- Do not store Realm credentials, Runtime access tokens, or Runtime refresh tokens in this repository or in any app-local storage.
- Desktop owns admission, authorization, protected session binding, and account custody.
- The renderer receives only the bounded local-app standard shell; tokens, endpoints, launch leases, and release/session material never enter Studio state.

## Nimi client

- Use the app-scoped local-app `NimiClient` constructed in `src/shell/renderer/app-shell/studio-platform.ts`.
- Do not introduce a generic Runtime or Realm proxy, direct gRPC/HTTP path, renderer-owned identity, or parallel client construction path.

## Permission posture

- `nimi.app.yaml` declares no product permissions. Do not invent a permission to compensate for a missing exact carrier.
- Do not synthesize success on a typed contract gap. Unadmitted Realm operations fail closed with an operation-specific capability-unavailable error.

## Reporting a vulnerability

If you discover a vulnerability in Realm World Studio, do not open a public issue. Contact the Nimi Platform security team through the channel listed in the Nimi developer portal.
