---
id: SPEC-REALM-WORLD-STUDIO-KERNEL-INDEX-001
title: World Atlas Kernel Authority
status: active
owner: "@team"
updated: 2026-06-27
---

# World Atlas Kernel Authority

## Scope

This kernel is the single authoritative product/app contract source for the
World Atlas world detail surface carried by this app package. Every current
rule uses R-RWS-<DOMAIN>-NNN.

World Atlas is a public, user-facing world showcase and exploration page. It
helps ordinary users understand a world, browse public资料, meet world
characters, enter scenes, follow timeline context, collect a world, and start
relationship-oriented exploration. It is not a creator maintenance cockpit,
world generation backend, source connection page, owner-persona portfolio, or
Runtime readiness console.

- **[R-RWS-CORE-001]** This kernel is the only current app authority for the World Atlas world detail surface.

## Rule ID Format

R-RWS-<DOMAIN>-NNN

| Domain | Kernel Document |
|---|---|
| CORE | core-rules.md |
| SCOPE | product-scope.md |
| CHARACTER | world-character-object.md |
| SETTING | character-setting-field-map.md |
| ASSET | asset-and-binding.md |
| POST | post-publishing.md |
| RUNTIME | runtime-ai-consumption.md |
| METRIC | metrics-and-realm-gaps.md |
| FAIL | failure-semantics.md |
| STORY | storybook.md |
| ACCEPT | product-acceptance-and-execution-plan.md |

## Canonical Current Surfaces

- Realm WorldPublicController.getWorldDetailWithCharacters is the world detail
  showcase read surface.
- Realm WorldPublicController.getWorld is the single-world public metadata read
  surface when characters are not needed.
- Realm WorldPublicController.listWorldCharacters is the public world-character
  card read surface.
- Realm WorldPublicController.listWorlds is the public atlas listing read
  surface for future list surfaces.
- Public media assets returned by the same DTO are the visual source for hero,
  icon, highlight, character avatar, and scene presentation.

## Explicit Non-Current Surfaces

- Creator maintenance reads/writes, replaceWorldCharacter, Runtime readiness,
  source connection, generation, owner persona portfolio routes, Forge curation,
  raw AgentRule CRUD, and localAgent private state are not current success paths
  for this World Atlas page.
- RealmPersona records returned by public DTOs are not world-character showcase
  authority for this page.
- Missing public detail, characters, media, or relation capability must fail
  closed or render user-facing unavailable copy; the page must not synthesize
  backend success.
