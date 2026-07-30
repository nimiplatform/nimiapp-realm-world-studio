# Realm World Studio

Realm World Studio is the creator-facing desktop workspace for creator-owned
Realm worlds and the world-owned characters under those worlds.

## Product Boundary

RWS is a thin product composition layer over Nimi platform substrate:

- Desktop owns local-app admission, authorization, protected session binding, and account custody.
- UI primitives and shared visual contracts come from `@nimiplatform/kit`.
- Admitted Realm reads/writes flow through the bounded local-app SDK surface.
- AI model configuration and AI execution must use kit/sdk Runtime surfaces when admitted.

## Current Creator Surfaces

- `/worlds` lists creator-accessible `WorldCore` records through
  `localApp.realm.worldCore.list`.
- `/worlds/new` submits a typed `CreateWorldCoreDto` through
  `localApp.realm.worldCore.create`; save success exists only after Realm
  returns the canonical `WorldCoreDto`.
- World detail, character, and replacement routes remain visibly unavailable
  until their exact bounded local-app Realm operations are admitted.
- Source materialization is not exposed through the public Realm surface.

This app is not World Atlas, an owner RealmPersona portfolio, Forge curation,
or LocalAgent private runtime tooling.

## Development

```bash
pnpm install
pnpm typecheck
pnpm test
pnpm lint
pnpm dev                              # Desktop-supervised Electron
pnpm dev:shell -- --shell electron    # explicit active shell
```

The Tauri identifier remains only as dormant packaging identity; it is not an
active development or compatibility path.
