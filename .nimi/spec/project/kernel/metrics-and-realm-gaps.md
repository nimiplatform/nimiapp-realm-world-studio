---
id: SPEC-REALM-WORLD-STUDIO-METRICS-GAPS-002
title: Realm World Studio Metrics And Realm Gaps
status: active
owner: "@team"
updated: 2026-07-09
---

# Metrics And Realm Gaps

- **[R-RWS-METRIC-001]** Creator inventory counts must come from typed Realm core arrays, typed DTO count fields, or exact returned list lengths.
- **[R-RWS-METRIC-002]** Missing counts render as unavailable/incomplete; they must not be zero-filled.
- **[R-RWS-METRIC-003]** World-character count may use the exact returned `listWorldCharacters` length when no typed aggregate count exists.
- **[R-RWS-METRIC-004]** Entity, relationship, scene, timeline, media, and issue counts require typed source owner and unavailable state before display.
- **[R-RWS-METRIC-005]** Platform limitations must be separated from creator-actionable tasks.
- **[R-RWS-METRIC-006]** Runtime readiness, materialization health, private LocalAgent state, and public relation metrics are not RWS default metrics.
- **[R-RWS-METRIC-007]** Asset readiness must not be inferred from URLs; media references are display/source references only.
- **[R-RWS-METRIC-008]** New metrics require source owner, exact derivation, unavailable state, and fail-closed behavior before use.
