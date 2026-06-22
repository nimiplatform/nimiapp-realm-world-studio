---
id: SPEC-REALM-WORLD-STUDIO-METRICS-GAPS-001
title: Metrics And Realm Gaps
status: active
owner: "@team"
updated: 2026-06-22
---

# Metrics And Realm Gaps

- **[R-RWS-METRIC-001]** characterCount is displayed only from WorldCore.core.characterCount or the actual returned character list length.
- **[R-RWS-METRIC-002]** Missing counts render as source unavailable unless a returned list gives an exact count.
- **[R-RWS-METRIC-003]** Missing authoring targets are computed from WorldCharacterCore source fields and shown as source gaps.
- **[R-RWS-METRIC-004]** Runtime readiness checksums come from RuntimeSourceSnapshot.payloadHash or the source content hash.
- **[R-RWS-METRIC-005]** Source-fact counts, relationship counts, and timeline counts must come from source-backed core fields.
- **[R-RWS-METRIC-006]** New metrics require source owner, unavailable state, and fail-closed behavior before use.
- **[R-RWS-METRIC-007]** Source-backed graph counts for EntityCore, RelationshipCore, and CharacterCore must come from exact typed Realm list reads or render as unavailable before being translated into creator-facing copy.
- **[R-RWS-METRIC-008]** Runtime readiness, runtime blocked state, and materialization health are not Creator Worlds default metrics unless a runtime-owned summary contract is returned.
- **[R-RWS-METRIC-009]** Asset readiness must not be inferred from Core asset refs; declared refs may be counted, while resolver readiness remains unavailable until a Resource-owned resolver contract exists.
- **[R-RWS-METRIC-010]** Creator-facing overview metrics must separate creator-action gaps from platform blockers; unavailable Realm or Runtime contracts must not be counted as tasks the creator can personally fix.
