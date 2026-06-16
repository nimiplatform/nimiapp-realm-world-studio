---
id: SPEC-REALM-WORLD-STUDIO-METRICS-AND-GAPS-001
title: Realm World Studio Metrics And Realm Gaps
status: active
owner: "@team"
updated: 2026-06-16
---

# Metrics And Realm Gaps

## Source-Backed Metrics

- **[R-RWS-METRIC-001]** `agentCount` may be displayed only from the
  creator-world list/detail source.
- **[R-RWS-METRIC-002]** `friendCount` may be displayed only from the
  world-agent source field when present.
- **[R-RWS-METRIC-003]** Missing counts are source unavailable, not zero.
- **[R-RWS-METRIC-004]** Studio must not infer counts from list length,
  LocalAgent data, public profiles, adoption data, or historical cache.

## Realm Gaps

- **[R-RWS-METRIC-005]** If Realm lacks a source for a desired creator metric,
  Studio must show an unavailable state or omit the metric.
- **[R-RWS-METRIC-006]** Operation logs, recent failures, and local draft state
  may be shown only when labeled as local operational evidence.
- **[R-RWS-METRIC-007]** Public success, admission, permission grants, install
  availability, and release descriptors are platform-owned and must not be
  inferred from local checks.
- **[R-RWS-METRIC-008]** Adding a metric requires identifying its Realm or
  Runtime source and adding a kernel rule before implementation.
