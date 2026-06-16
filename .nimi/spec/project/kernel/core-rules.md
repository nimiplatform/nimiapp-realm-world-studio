---
id: SPEC-REALM-WORLD-STUDIO-CORE-RULES-001
title: Realm World Studio Core Rules
status: active
owner: "@team"
updated: 2026-06-16
---

# Core Rules

These rules are the cross-cutting invariants for every Realm World Studio
domain rule.

## Authority

- **[R-RWS-CORE-006]** Every implementation, test, governance check, and review
  comment that cites a Realm World Studio rule must use an `R-RWS-*` identifier.
- **[R-RWS-CORE-007]** Kernel rule changes require the affected kernel document
  and `tables/rule-catalog.yaml` to change together.
- **[R-RWS-CORE-008]** No compatibility layer, shim, legacy branch, or staged
  "MVP first" shortcut is allowed for this pre-launch standalone app.
- **[R-RWS-CORE-009]** Renderer screenshots, generated packets, `.nimi/local/**`,
  topic files, and chat summaries are evidence, not authority.

## Platform Posture

- **[R-RWS-CORE-010]** Runtime account state must flow through
  `runtime.account.*` via the `nimi-shell-tauri` IPC bridge.
- **[R-RWS-CORE-011]** Studio must not store access tokens, refresh tokens, or
  raw Realm credentials in renderer state, browser storage, files, or app-local
  stores.
- **[R-RWS-CORE-012]** Realm calls must be mediated through the app-scoped
  `@nimiplatform/sdk` client and Runtime Realm bridge; app-local REST bypasses
  are forbidden.
- **[R-RWS-CORE-013]** Runtime AI route or model choices must come from Runtime
  route/model authority or user-reviewed AI config, not hardcoded provider
  routing.

## Product Truth

- **[R-RWS-CORE-014]** Studio must not synthesize placeholders, fake returns,
  zero-fill counts, or renderer-local success to hide source unavailability.
- **[R-RWS-CORE-015]** AI output is candidate material until human review and
  the relevant admitted Realm write success.
- **[R-RWS-CORE-016]** Kit and shared shell patterns are the visible interaction
  system; a parallel design system requires a recorded kit gap before use.
