---
id: SPEC-REALM-WORLD-STUDIO-KERNEL-INDEX-002
title: Realm World Studio Kernel Authority
status: active
owner: "@team"
updated: 2026-07-09
---

# Realm World Studio Kernel Authority

## Scope

This kernel is the single authoritative product/app contract source for Realm
World Studio in this repository. Realm World Studio is a creator-facing desktop
workspace for creator-owned Realm worlds and world-owned characters. It helps a
creator browse, create, inspect, edit, update, and prepare Realm world source
records without reimplementing Nimi platform substrate.

- **[R-RWS-CORE-001]** This kernel is the only current app authority for Realm World Studio creator workflows.

## Thin Product Layer Principle

Realm World Studio owns creator product composition: navigation, workbench
layout, form drafts, review affordances, typed DTO projection, and explicit
failure presentation. It does not own Nimi account custody, design-system
primitives, model/provider configuration authority, Runtime AI execution,
Runtime private state, Realm transport, or Realm canonical source truth.

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

- Realm `WorldCoreController.listWorldCores` is the creator world inventory read surface.
- Realm `WorldCoreController.getWorldCore` is the creator world detail read surface.
- Realm `WorldCoreController.createWorldCore` and `replaceWorldCore` are the typed world create/update surfaces when the corresponding creator form submits.
- Realm `WorldCoreController.listWorldCharacters` and `getWorldCharacter` are the world-owned character read surfaces.
- Realm `WorldCoreController.createWorldCharacter` and `replaceWorldCharacter` are the typed world-character create/update surfaces when admitted form submissions exist.
- Realm `WorldCoreController.listWorldEntities`, `getWorldEntity`, `listWorldRelationships`, and `getWorldRelationship` are creator inspection surfaces for world graph slices when routed.
- Runtime AI, model configuration, and source materialization are accessed only through admitted SDK/kit/Runtime or Realm core surfaces, never through app-local substitutes.

## Explicit Non-Current Surfaces

- `WorldPublicController.*` public showcase reads are not Realm World Studio success paths.
- RealmPersona owner portfolio routes, public World Atlas presentation, Forge imported-system curation, generic public catalog fallback, resource direct-publication/upload, LocalAgent private memory/emotion/cognition state, economic settlement, and team collaboration are not current success paths.
- Missing typed Realm/Runtime/kit/SDK capability must fail closed or render capability-unavailable creator copy; the app must not synthesize platform success.
