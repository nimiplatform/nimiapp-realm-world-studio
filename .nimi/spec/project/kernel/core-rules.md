---
id: SPEC-REALM-WORLD-STUDIO-CORE-RULES-001
title: World Atlas Core Rules
status: active
owner: "@team"
updated: 2026-06-27
---

# Core Rules

- **[R-RWS-CORE-001]** .nimi/spec/project/kernel/** is the only current app authority for Realm World Studio.
- **[R-RWS-CORE-002]** Current app authority is the WorldPublicController public world detail, public world-character card, media, stats, and viewer-relation DTO surface.
- **[R-RWS-CORE-003]** Product success state must come from typed Realm public DTOs, Runtime account state, SDK, or Tauri results.
- **[R-RWS-CORE-004]** App-local drafts, generated candidates, screenshots, tests, and local audit output are not source authority.
- **[R-RWS-CORE-005]** Missing source, permission, capability, content hash, or typed response must fail closed.
- **[R-RWS-CORE-006]** Creator cockpit, source connection, generation, AgentRule, owner-persona portfolio, and Runtime readiness paths are non-current for the World Atlas detail page.
- **[R-RWS-CORE-007]** "Agent" may appear only in user-facing copy that explains chat-capable world characters; implementation types use showcase/world-character terminology.
- **[R-RWS-CORE-008]** Page-local collect, friend, drawer, tab, and chat-entry state is session UI state only unless a typed platform relation write succeeds.
- **[R-RWS-CORE-009]** Public fields that are unavailable must render as unavailable or "正在整理中", not as zero-filled or invented success metrics.
- **[R-RWS-CORE-010]** Spec changes and implementation changes for the same behavior must land together.
- **[R-RWS-CORE-011]** World Showcase projection is a user-facing read model over typed public Realm DTOs; it must not synthesize Runtime, Forge, creator-write, or local app authority.
