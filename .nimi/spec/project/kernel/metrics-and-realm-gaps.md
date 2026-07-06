---
id: SPEC-REALM-WORLD-STUDIO-METRICS-GAPS-001
title: Showcase Metrics And Realm Gaps
status: active
owner: "@team"
updated: 2026-06-27
---

# Showcase Metrics And Realm Gaps

- **[R-RWS-METRIC-001]** characterCount is displayed only from WorldPublicStatsDto.characterCount or the actual returned public character-card list length.
- **[R-RWS-METRIC-002]** Missing counts render as unavailable or user-facing "正在整理中" copy unless a typed public DTO gives an exact count.
- **[R-RWS-METRIC-003]** Recommended exploration-route counts are derived from available public characters, resources, scenes, and timeline arrays.
- **[R-RWS-METRIC-004]** Runtime readiness checksums and source content hashes are not World Atlas display metrics.
- **[R-RWS-METRIC-005]** Resource, relationship, scene, and timeline counts must come from WorldPublicStatsDto or typed public arrays.
- **[R-RWS-METRIC-006]** New metrics require a public source owner, unavailable state, and fail-closed behavior before use.
- **[R-RWS-METRIC-007]** Public graph counts are translated into user-facing copy only after exact typed DTO values are present.
- **[R-RWS-METRIC-008]** Runtime readiness, runtime blocked state, and materialization health are not World Atlas default metrics.
- **[R-RWS-METRIC-009]** Asset readiness must not be inferred from public media URLs; media URLs are display assets, not resolver readiness claims.
- **[R-RWS-METRIC-010]** User-facing overview metrics must not count unavailable Realm or Runtime contracts as user tasks or creator tasks.
