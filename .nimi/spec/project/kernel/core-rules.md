---
id: SPEC-REALM-WORLD-STUDIO-CORE-RULES-002
title: Realm World Studio Core Rules
status: active
owner: "@team"
updated: 2026-07-09
---

# Core Rules

- **[R-RWS-CORE-001]** `.nimi/spec/project/kernel/**` is the only current app authority for Realm World Studio.
- **[R-RWS-CORE-002]** Product success state must come from typed Realm core DTOs, Runtime account state, SDK results, kit-owned UI/model-config contracts, or admitted desktop shell host results (Tauri or Electron).
- **[R-RWS-CORE-003]** Realm World Studio is a thin creator product layer over Nimi platform substrate; it may compose workflows but must not reimplement auth custody, Realm transport, model configuration, AI execution, or canonical Realm source state.
- **[R-RWS-CORE-004]** Creator-visible world data authority comes from Realm `WorldCoreController` world, world-character, entity, relationship, and source-materialization surfaces admitted by this kernel.
- **[R-RWS-CORE-005]** App-local drafts, generated candidates, screenshots, tests, and local audit output are not canonical Realm source truth.
- **[R-RWS-CORE-006]** Missing source, permission, capability, content hash, SDK method, kit contract, or typed response must fail closed.
- **[R-RWS-CORE-007]** `WorldPublicController.*`, World Atlas public showcase projections, owner RealmPersona portfolio surfaces, Forge curation, LocalAgent private runtime state, and generic public catalog fallback are non-current success paths.
- **[R-RWS-CORE-008]** Creator writes succeed only after the corresponding typed Realm core endpoint returns canonical DTO data.
- **[R-RWS-CORE-009]** App session UI state may track selected world, selected character, tabs, drawers, and draft fields, but it must not become hidden canonical source truth.
- **[R-RWS-CORE-010]** User-facing copy uses creator/workbench/world-character terminology; implementation types use Realm world/world-character/source terminology rather than public showcase terminology.
- **[R-RWS-CORE-011]** Spec changes and implementation changes for the same behavior must land together.
- **[R-RWS-CORE-012]** No contract violation may be hidden behind fallback logic, fake return data, pseudo-success metrics, or compatibility shims.
