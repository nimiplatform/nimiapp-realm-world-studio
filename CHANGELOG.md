# Changelog

All notable changes to this project are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Changed
- Adapted to the declarative Nimi App Access model as a third-party local app:
  `nimi.app.yaml` declares `app_access: [realm.data]` (replacing the retired
  `permissions` field), the Electron main process registers the Kit app bridge
  without the removed `onProtectedSessionFailure` authority field, and
  session-loss posture is typed unavailable with same-host recheck instead of
  app quit. See `docs/nimi-app-access-audit.md` and
  `docs/nimi-app-access-adaptation.md`.
- Realm operations without an App Access surface (world detail/replace,
  world-character, entity, relationship) stay fail-closed with typed
  capability-unavailable copy; no direct Realm transport is introduced.
- `@nimiplatform/nimi-coding` bumped to 0.5.0; `spec:authority:check` updated
  to the 0.5.0 CLI shape.

### Added
- Initial standalone Realm World Studio desktop app for creator-owned worlds
  and world-owned agent maintenance.
- Tauri 2 shell with Runtime-mediated account bootstrap, code-only desktop auth,
  and app-scoped Nimi client construction.
- React Router routes for creator world list, creator world detail,
  world-character detail/editing, and AI model/profile configuration.
- Creator-world Realm facade constrained to creator-world worlds, world-character
  settings, profile media, voice, chat-readiness, and resource upload surfaces.
- `.nimi/spec/project/kernel/**` product authority with `R-RWS-*` rule catalog
  and local spec-consistency checks.
- `scripts/prepare-workspace-surfaces.mjs` to build the linked platform
  sdk/kit `dist/` surfaces before typecheck/Electron builds.
- Account menu identity via the Base `currentUser.get()` surface with neutral
  fallback copy.

### Changed
- Replaced the default repository README with Realm World Studio scope,
  boundary, and development commands.
