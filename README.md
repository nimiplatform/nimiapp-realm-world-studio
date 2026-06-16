# Realm World Studio

Realm World Studio is the creator-facing desktop app for Realm worlds,
creator-owned worlds, and the world-owned agents under those worlds.

## Scope

- `/worlds` lists source-backed creator worlds available to
  the current Runtime account.
- `/worlds/:worldId` reads that creator world's world-owned agents through
  `/api/me/creator/worlds/{worldId}/agents`.
- `/worlds/:worldId/agents/:agentId` reads and updates world-agent settings,
  profile media, voice, and chat readiness through
  `/api/me/creator/worlds/{worldId}/agents/**`.

This app is not the owner portfolio. User-owned `MASTER_OWNED` Realm Agent
operation belongs to `nimiapp-realm-agent-studio` and `/api/me/agents`.

## Development

```bash
pnpm install
pnpm typecheck
pnpm test
pnpm lint
pnpm dev:shell
```
