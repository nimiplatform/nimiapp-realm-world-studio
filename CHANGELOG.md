> Reading this history: versioned and development entries describe their recorded stage, including older dependency and shell choices. They are not current setup instructions or proof of publication. Use the current package manifest and README for setup; App release notes and the matching immutable release describe release-specific status.

# Changelog

All notable changes to this project are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added
- Coauthor candidates are published as App activity review todos
  (`app.activity`): generating a proposal opens a todo for its draft, the new
  Finish review action completes it with the adopted count, and a replaced
  candidate, deleted draft or Realm save cancels it. Publications follow a
  successful draft save and wait in an account-scoped protected-storage outbox
  committed in the same document write, including completed and deleted reviews;
  a publication Nimi has not accepted is shown as not synced with a retry, and
  open candidates are republished after session start. When the Nimi session
  changes, Studio stops its pending saves and publications and asks to be
  reopened. Opening the todo from Nimi Home or another App navigates to the
  draft before confirming.

### Fixed
- Recheck the session before queued draft writes and after asynchronous writes,
  so ended-session work cannot continue into a rebound account.
- Preserve failed review publications for retry and restart recovery. Reject
  malformed draft/outbox documents without overwriting them, and show storage
  failures without inventing a pending count.

### Changed
- Moved to the SDK 0.16 / Kit 0.12 pairing (App Tools 0.8.0) for the App
  activity carrier.

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
