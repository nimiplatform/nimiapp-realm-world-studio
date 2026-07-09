# Realm World Studio

Realm World Studio is the creator-facing desktop workspace for creator-owned
Realm worlds and the world-owned characters under those worlds.

## Product Boundary

RWS is a thin product composition layer over Nimi platform substrate:

- Auth and account custody flow through Runtime account surfaces and kit auth UI.
- UI primitives and shared visual contracts come from `@nimiplatform/kit`.
- Realm reads/writes flow through `@nimiplatform/sdk` typed Realm core surfaces.
- AI model configuration and AI execution must use kit/sdk Runtime surfaces when admitted.

## Current Creator Surfaces

- `/worlds` lists creator-accessible `WorldCore` records through
  `Realm WorldCoreController.listWorldCores`.
- `/worlds/:worldId` reads `getWorldCore` plus `listWorldCharacters`.
- `/worlds/:worldId/characters/:characterId` reads `getWorldCharacter` in the
  selected parent world context.
- `/worlds/new`, `/worlds/:worldId/edit`, and
  `/worlds/:worldId/characters/:characterId/edit` submit typed
  `CreateWorldCoreDto`, `ReplaceWorldCoreDto`, or
  `ReplaceWorldCharacterCoreDto` payloads; save success exists only after Realm
  returns the canonical DTO.

This app is not World Atlas, an owner RealmPersona portfolio, Forge curation,
or LocalAgent private runtime tooling.

## Development

```bash
pnpm install
pnpm typecheck
pnpm test
pnpm lint
pnpm dev:shell      # Tauri
pnpm dev:electron   # Electron dev shell
```
