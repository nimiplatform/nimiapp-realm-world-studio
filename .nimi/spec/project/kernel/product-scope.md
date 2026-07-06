---
id: SPEC-REALM-WORLD-STUDIO-PRODUCT-SCOPE-001
title: World Atlas Product Scope
status: active
owner: "@team"
updated: 2026-06-27
---

# Product Scope

- **[R-RWS-SCOPE-001]** World Atlas reads public worlds through typed Realm public world surfaces and presents them to ordinary users as explorable worlds.
- **[R-RWS-SCOPE-002]** The detail page loads public world detail before showing Hero, stats, tabs, world relationship sidebar, or content modules.
- **[R-RWS-SCOPE-003]** The detail page lists public world-character cards under their parent world and may project them into "可结识人物" cards.
- **[R-RWS-SCOPE-004]** The current page does not write WorldCore, WorldCharacterCore, RealmPersona, relationship, asset, or Runtime source records.
- **[R-RWS-SCOPE-005]** AI generation, missing-field completion, source skeleton repair, and creator review are out of scope for this page.
- **[R-RWS-SCOPE-006]** The page may keep session-local UI state for tabs, drawers, collect toggles, friend toggles, and chat-entry affordances only.
- **[R-RWS-SCOPE-007]** RealmPersona owner portfolio, Persona settings, Forge curation, post scheduling, gift/economic settlement, team collaboration, and localAgent private runtime are out of scope.
- **[R-RWS-SCOPE-008]** Creator legacy routes, source connection routes, Runtime readiness routes, and owner-persona routes must not be fallback success paths for World Atlas.
- **[R-RWS-SCOPE-009]** World creation and world generation are not admitted in this app until this kernel adds an explicit creation/generation surface.
- **[R-RWS-SCOPE-010]** Relationship, entity, system, scene, and timeline facts may be displayed only when returned by typed public world DTOs or derived directly from their public counts/arrays.
- **[R-RWS-SCOPE-011]** The World Atlas detail screen must translate public Realm facts into localizable user-facing exploration language; schema ids, controller names, content hashes, source connection language, and raw unavailable reasons belong outside the default product layer.
