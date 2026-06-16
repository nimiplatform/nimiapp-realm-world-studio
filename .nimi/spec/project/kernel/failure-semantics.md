---
id: SPEC-REALM-WORLD-STUDIO-FAILURE-SEMANTICS-001
title: Realm World Studio Failure Semantics
status: active
owner: "@team"
updated: 2026-06-16
---

# Failure Semantics

## Named Failures

- **[R-RWS-FAIL-001]** `realm-unavailable`: Runtime-mediated Realm call failed
  before canonical data was returned.
- **[R-RWS-FAIL-002]** `permission-missing`: current Runtime account lacks
  creator-world authority.
- **[R-RWS-FAIL-003]** `creator-world-unavailable`: `worldId` is not returned by
  `/api/me/creator/worlds`.
- **[R-RWS-FAIL-004]** `world-agent-unavailable`: `agentId` is not returned under
  the selected creator world.
- **[R-RWS-FAIL-005]** `settings-unavailable`: settings read failed or returned
  an invalid contract.
- **[R-RWS-FAIL-006]** `settings-update-rejected`: settings write failed.
- **[R-RWS-FAIL-007]** `profile-media-update-rejected`: profile media write
  failed.
- **[R-RWS-FAIL-008]** `voice-update-rejected`: voice write failed.
- **[R-RWS-FAIL-009]** `runtime-unavailable`: Runtime IPC, account session, or
  route/model authority is unavailable.
- **[R-RWS-FAIL-010]** `ai-generation-failed`: Runtime AI generation failed.
- **[R-RWS-FAIL-011]** `source-unavailable`: optional source-backed metric or
  field is unavailable.
- **[R-RWS-FAIL-012]** `contract-invalid`: SDK DTO shape or typed contract does
  not satisfy the admitted field map.

## Rules

- **[R-RWS-FAIL-013]** Failure copy must name the unavailable authority or
  capability without implying a retry already succeeded.
- **[R-RWS-FAIL-014]** Failed writes must preserve the creator draft.
- **[R-RWS-FAIL-015]** Partial write failure must not be reported as full save
  success.
- **[R-RWS-FAIL-016]** Silent fallback from creator-world authority to owner,
  public, cached, or local authority is forbidden.
