---
id: SPEC-REALM-WORLD-STUDIO-METRICS-GAPS-001
title: Metrics And Realm Gaps
status: active
owner: "@team"
updated: 2026-06-18
---

# Metrics And Realm Gaps

- **[R-RWS-METRIC-001]** characterCount is displayed only from WorldCore.core.characterCount or the actual returned character list length.
- **[R-RWS-METRIC-002]** Missing counts render as source unavailable unless a returned list gives an exact count.
- **[R-RWS-METRIC-003]** Missing authoring targets are computed from WorldCharacterCore source fields and shown as source gaps.
- **[R-RWS-METRIC-004]** Runtime readiness checksums come from RuntimeSourceSnapshot.payloadHash or the source content hash.
- **[R-RWS-METRIC-005]** Source-fact counts, relationship counts, and timeline counts must come from source-backed core fields.
- **[R-RWS-METRIC-006]** New metrics require source owner, unavailable state, and fail-closed behavior before use.
