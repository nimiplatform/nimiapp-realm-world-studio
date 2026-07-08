---
id: SPEC-REALM-WORLD-STUDIO-RUNTIME-AI-002
title: Realm World Studio Runtime And AI Boundary
status: active
owner: "@team"
updated: 2026-07-09
---

# Runtime And AI Boundary

- **[R-RWS-RUNTIME-001]** Runtime account/session state flows only through Runtime account SDK/IPC surfaces; RWS must not own access or refresh token custody.
- **[R-RWS-RUNTIME-002]** AI model/provider/capability configuration must use kit model-config surfaces and injected SDK/Runtime services rather than app-local model configuration systems.
- **[R-RWS-RUNTIME-003]** Text, image, speech, embedding, workflow, or scenario AI execution must go through `@nimiplatform/sdk` Runtime/AI/generation surfaces.
- **[R-RWS-RUNTIME-004]** AI output is candidate material until creator human review and a typed Realm core write succeeds.
- **[R-RWS-RUNTIME-005]** RuntimeSourceSnapshot, source materialization packet, or equivalent materialization output may be created only through admitted typed SDK/Realm/Runtime surfaces.
- **[R-RWS-RUNTIME-006]** Runtime readiness summaries, checksums, source counts, and blocked states must not be synthesized as creator success metrics.
- **[R-RWS-RUNTIME-007]** RWS must never read or send private LocalAgent memory, emotions, cognition, private transcripts, or app-specific memory fragments as source material.
- **[R-RWS-RUNTIME-008]** Runtime route-unbound, transport-unavailable, malformed-output, invalid-payload, and permission-missing states are explicit failures.
- **[R-RWS-RUNTIME-009]** Future AI-assisted creation must preserve owner draft state on failure and must not invent replacement world or character source data.
