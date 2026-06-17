---
id: SPEC-REALM-WORLD-STUDIO-SETTING-FIELD-MAP-001
title: Character Setting Field Map
status: active
owner: "@team"
updated: 2026-06-18
---

# Character Setting Field Map

- **[R-RWS-SETTING-001]** displayName, description, and greeting are admitted as WorldCharacterCore.core fields.
- **[R-RWS-SETTING-002]** communication.contentStyle is admitted as a WorldCharacterCore.core field.
- **[R-RWS-SETTING-003]** positioning.targetAudience and positioning.positioning are admitted as WorldCharacterCore.core fields.
- **[R-RWS-SETTING-004]** avatarUrl, profileCoverUrl, voiceId, speechModelId, and speechRoutePolicy are admitted only as creator-reviewed core fields or local candidates.
- **[R-RWS-SETTING-005]** Every save builds ReplaceWorldCharacterCoreDto from the latest detail read.
- **[R-RWS-SETTING-006]** Every save must include baseContentHash, origin, and merged core.
- **[R-RWS-SETTING-007]** Raw AgentRule CRUD, owner persona settings, world-control binding APIs, and generated hidden fields must not be used as settings authority.
- **[R-RWS-SETTING-008]** Partial save success must be represented explicitly; Studio must not collapse failed fields into all-success.
