# Realm World Studio

Realm World Studio is the creator-facing desktop app for Realm worlds,
creator-owned worlds, and the world-owned characters under those worlds.

## Scope

- `/worlds` lists source-backed WorldCore records through
  `Realm WorldCoreController.listWorldCores`.
- `/worlds/:worldId` reads `getWorldCore` plus `listWorldCharacters`.
- `/worlds/:worldId/characters/:characterId` reads and updates
  WorldCharacterCore through `getWorldCharacter` and `replaceWorldCharacter`.

This app is not the owner portfolio. User-owned `MASTER_OWNED` Realm Persona
operation belongs to `nimiapp-realm-persona-studio` and RealmPersona core
surfaces.

## Development

```bash
pnpm install
pnpm typecheck
pnpm test
pnpm lint
pnpm dev:shell
```
