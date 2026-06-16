---
id: SPEC-REALM-WORLD-STUDIO-SETTING-FIELD-MAP-001
title: Realm World Studio Setting Field Map
status: active
owner: "@team"
updated: 2026-06-16
---

# Setting Field Map

## Admitted Fields

- **[R-RWS-SETTING-001]** `displayName`, `description`, and `greeting` are
  editable only through the creator-world agent settings endpoint.
- **[R-RWS-SETTING-002]** `communication.contentStyle` is editable only through
  the creator-world agent settings endpoint.
- **[R-RWS-SETTING-003]** `positioning.targetAudience` and
  `positioning.positioning` are editable only through the creator-world agent
  settings endpoint.
- **[R-RWS-SETTING-004]** Avatar and profile cover URL writes are admitted only
  through the creator-world agent profile-media endpoint.
- **[R-RWS-SETTING-005]** `voiceId`, voice description, speech model ID, and
  speech route policy are editable only through the creator-world agent voice
  endpoint.
- **[R-RWS-SETTING-006]** Chat readiness is read authority only unless a write
  endpoint is added to this kernel.

## Write Semantics

- **[R-RWS-SETTING-007]** Save must send only fields visible to the creator for
  review.
- **[R-RWS-SETTING-008]** Blank optional fields may be omitted from partial
  media or voice writes, but required text fields must not be silently invented.
- **[R-RWS-SETTING-009]** Settings, media, and voice writes are separate
  admitted operations; partial success must not be collapsed into a single fake
  all-success state.
- **[R-RWS-SETTING-010]** A successful save message requires the final canonical
  detail re-read or a canonical response accepted by the kernel.

## Forbidden Mapping

- **[R-RWS-SETTING-011]** Owner settings endpoints, raw `AgentRule` CRUD,
  `/api/creator/agents`, and world-control binding APIs must not be reused as
  creator-world settings authority.
- **[R-RWS-SETTING-012]** AI-proposed setting text must remain editable
  candidate material until the creator saves it through admitted Realm authority.
