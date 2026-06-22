---
id: SPEC-REALM-WORLD-STUDIO-CORE-RULES-001
title: Realm World Studio Core Rules
status: active
owner: "@team"
updated: 2026-06-18
---

# Core Rules

- **[R-RWS-CORE-001]** .nimi/spec/project/kernel/** is the only current app authority for Realm World Studio.
- **[R-RWS-CORE-002]** Current app authority is WorldCore / WorldEntityCore / WorldRelationshipCore / WorldCharacterCore / RuntimeSourceSnapshot.
- **[R-RWS-CORE-003]** Product success state must come from typed Realm, Runtime, SDK, or Tauri results.
- **[R-RWS-CORE-004]** App-local drafts, generated candidates, screenshots, tests, and local audit output are not source authority.
- **[R-RWS-CORE-005]** Missing source, permission, capability, content hash, or typed response must fail closed.
- **[R-RWS-CORE-006]** Realm-side Agent, AgentRule, CharacterCard, rule package, truth package, and projection package paths are non-current.
- **[R-RWS-CORE-007]** The word Agent may appear in this app only as LocalAgent runtime terminology or in explicitly forbidden legacy surface names.
- **[R-RWS-CORE-008]** Runtime output is candidate material until a creator-reviewed Realm core write succeeds.
- **[R-RWS-CORE-009]** Source fields that are unavailable must render as unavailable, not zero-filled or invented.
- **[R-RWS-CORE-010]** Spec changes and implementation changes for the same behavior must land together.
- **[R-RWS-CORE-011]** Realm Core Cockpit is a schema-first read model over typed Realm core surfaces; it must not synthesize Runtime, Asset, Forge, public catalog, or local app authority.
