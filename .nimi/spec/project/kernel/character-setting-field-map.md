---
id: SPEC-REALM-WORLD-STUDIO-SETTING-FIELD-MAP-002
title: Realm World Studio Field Map
status: active
owner: "@team"
updated: 2026-07-09
---

# Creator Field Map

- **[R-RWS-SETTING-001]** World identity, summary, visibility, type, tags, ontology, time model, systems, rules, scenes, timeline, media references, and provenance are admitted only when present in `WorldCoreDto.core` or typed top-level `WorldCoreDto` fields.
- **[R-RWS-SETTING-002]** World-character settings, profile media, voice settings, behavior settings, source references, and provenance are admitted only when present in `WorldCharacterCoreDto.core` or typed top-level `WorldCharacterCoreDto` fields.
- **[R-RWS-SETTING-003]** RWS may project nested core payload fields into creator-friendly labels, but field projection must preserve unavailable and unknown states.
- **[R-RWS-SETTING-004]** RWS must not hide missing source fields by using public DTOs, owner persona DTOs, generated defaults, or local placeholders.
- **[R-RWS-SETTING-005]** Save actions must submit complete typed Realm core DTO payloads with explicit `origin` and required content-hash preconditions.
- **[R-RWS-SETTING-006]** Content hash, schema version, revision, origin, creatorId, worldId, and updatedAt are authority metadata and may appear in diagnostics/workbench copy, but they must not be rewritten locally.
- **[R-RWS-SETTING-007]** Raw AgentRule CRUD, public showcase DTOs, owner persona settings, source connection anti-targets, and generated hidden fields must not be used as RWS setting authority.
- **[R-RWS-SETTING-008]** App-local draft validation may guide creators, but the Realm response after submit is the only save success authority.
- **[R-RWS-SETTING-009]** Form fields unavailable from current typed contracts must render as capability unavailable or contract missing, not as disabled success controls.
