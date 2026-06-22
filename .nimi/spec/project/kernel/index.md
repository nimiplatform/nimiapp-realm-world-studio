---
id: SPEC-REALM-WORLD-STUDIO-KERNEL-INDEX-001
title: Realm World Studio Kernel Authority
status: active
owner: "@team"
updated: 2026-06-18
---

# Realm World Studio Kernel Authority

## Scope

This kernel is the single authoritative product/app contract source for Realm World Studio. Every current rule uses R-RWS-<DOMAIN>-NNN.

Realm World Studio maintains WorldCore records and their WorldCharacterCore objects through Realm core surfaces. It is not Realm Persona Studio, not localAgent runtime management, not Forge curation, and not a generic world control panel.

- **[R-RWS-CORE-001]** This kernel is the only current app authority for Realm World Studio.

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

- Realm WorldCoreController.listWorldCores is the world list surface.
- Realm WorldCoreController.getWorldCore is the world detail surface.
- Realm WorldCoreController.listWorldCharacters is the world-character list surface.
- Realm WorldCoreController.getWorldCharacter is the world-character detail surface.
- Realm WorldCoreController.listWorldEntities is the world entity list surface when entity-backed facts are displayed.
- Realm WorldCoreController.getWorldEntity is the canonical world entity detail surface for a WorldCharacterCore.entityId binding.
- Realm WorldCoreController.listWorldRelationships is the relationship list surface for source-backed RelationshipCore counts and relationship ontology cockpit checks.
- Realm WorldCoreController.replaceWorldCharacter is the creator-reviewed world-character replacement surface.
- Realm WorldCoreController.createRuntimeSourceSnapshot materializes runtime input by value through sourceRef and never mutates WorldCore or WorldCharacterCore.

## Explicit Non-Current Surfaces

- /api/me/creator/worlds/**, /api/creator/characters/**, /api/agent/**, owner persona portfolio routes, world-control binding APIs, raw AgentRule CRUD, and public world catalog fallback are not current success paths for this Studio.
- Realm Persona Studio owns owner-created RealmPersona work. Realm World Studio owns WorldCore and WorldCharacterCore work.
- LocalAgent may be named only when describing runtime-private state that must not be read or written by this app.
