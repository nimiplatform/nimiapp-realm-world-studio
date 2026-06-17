---
id: SPEC-REALM-WORLD-STUDIO-RUNTIME-AI-001
title: Runtime AI Consumption
status: active
owner: "@team"
updated: 2026-06-18
---

# Runtime AI Consumption

- **[R-RWS-RUNTIME-001]** Runtime text, image, and speech calls are candidate-generation surfaces.
- **[R-RWS-RUNTIME-002]** RuntimeSourceSnapshot creation uses sourceRef.kind = worldCharacter, worldId, sourceId, and sourceContentHash.
- **[R-RWS-RUNTIME-003]** RuntimeSourceSnapshot payloads are by-value materializations and must not write back to WorldCore or WorldCharacterCore.
- **[R-RWS-RUNTIME-004]** Runtime readiness summaries may expose source counts, missing targets, and checksums only.
- **[R-RWS-RUNTIME-005]** Studio must never send private LocalAgent memory, emotions, cognition, private transcript, or app-specific memory fragments.
- **[R-RWS-RUNTIME-006]** Runtime output accepted by a creator still requires replaceWorldCharacter before it becomes source state.
- **[R-RWS-RUNTIME-007]** Runtime route-unbound, transport-unavailable, malformed-output, and invalid-payload states are explicit failures.
