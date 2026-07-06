---
id: SPEC-REALM-WORLD-STUDIO-RUNTIME-AI-001
title: Runtime Boundary
status: active
owner: "@team"
updated: 2026-06-27
---

# Runtime Boundary

- **[R-RWS-RUNTIME-001]** Runtime text, image, speech, and generation calls are not part of the World Atlas detail page.
- **[R-RWS-RUNTIME-002]** RuntimeSourceSnapshot creation is not admitted from this page.
- **[R-RWS-RUNTIME-003]** The chat-entry affordance may open or signal a conversation entry only when a future typed chat route exists; it must not materialize Runtime source state.
- **[R-RWS-RUNTIME-004]** Runtime readiness summaries, source counts, checksums, and blocked states must not appear in default World Atlas copy.
- **[R-RWS-RUNTIME-005]** The page must never read or send private LocalAgent memory, emotions, cognition, private transcript, or app-specific memory fragments.
- **[R-RWS-RUNTIME-006]** Runtime output cannot become showcase source state from this page.
- **[R-RWS-RUNTIME-007]** Runtime route-unbound, transport-unavailable, malformed-output, and invalid-payload states remain explicit failures if future chat surfaces are wired.
