# Changelog

All notable changes to this project are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added
- Initial standalone Realm World Studio desktop app for creator-owned worlds
  and world-owned agent maintenance.
- Tauri 2 shell with Runtime-mediated account bootstrap, code-only desktop auth,
  and app-scoped Nimi client construction.
- React Router routes for creator world list, creator world detail,
  world-agent detail/editing, and AI model/profile configuration.
- Creator-world Realm facade constrained to creator-world worlds, world-agent
  settings, profile media, voice, chat-readiness, and resource upload surfaces.
- `.nimi/spec/project/kernel/**` product authority with `R-RWS-*` rule catalog
  and local spec-consistency checks.

### Changed
- Replaced the default repository README with Realm World Studio scope,
  boundary, and development commands.
