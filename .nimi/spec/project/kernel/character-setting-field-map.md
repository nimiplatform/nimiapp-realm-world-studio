---
id: SPEC-REALM-WORLD-STUDIO-SETTING-FIELD-MAP-001
title: Showcase Setting Field Map
status: active
owner: "@team"
updated: 2026-06-27
---

# Showcase Setting Field Map

- **[R-RWS-SETTING-001]** World name, summary, tagline, tags, visibility, and type are admitted showcase fields from WorldPublicDetailDto.
- **[R-RWS-SETTING-002]** Public systems, rules, scenes, timeline, entityKinds, and relationshipTypes are admitted only as user-facing world资料, setting, scene, and timeline material.
- **[R-RWS-SETTING-003]** Theme selection is derived from public world type, name, and tags, then resolved through worldThemeConfig.
- **[R-RWS-SETTING-004]** Hero, icon, highlight, avatar, and scene imagery come from public media DTOs or explicit theme fallback assets.
- **[R-RWS-SETTING-005]** The page has no save path and must not build ReplaceWorldCharacterCoreDto.
- **[R-RWS-SETTING-006]** Content hashes and origin fields are hidden authority metadata, not user-facing settings.
- **[R-RWS-SETTING-007]** Raw AgentRule CRUD, owner persona settings, source connection APIs, Runtime readiness APIs, and generated hidden fields must not be used as showcase setting authority.
- **[R-RWS-SETTING-008]** Missing public setting slices must be represented explicitly in user copy; the page must not collapse unavailable fields into all-success.
