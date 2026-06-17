---
id: SPEC-REALM-WORLD-STUDIO-PRODUCT-ACCEPTANCE-001
title: Product Acceptance And Execution Plan
status: active
owner: "@team"
updated: 2026-06-18
---

# Product Acceptance And Execution Plan

- **[R-RWS-ACCEPT-001]** App identity is Realm World Studio across package metadata, Tauri identity, routes, README, and spec.
- **[R-RWS-ACCEPT-002]** Source reads use WorldCoreController WorldCore and WorldCharacterCore surfaces only.
- **[R-RWS-ACCEPT-003]** Character writes use ReplaceWorldCharacterCoreDto only.
- **[R-RWS-ACCEPT-004]** RuntimeSourceSnapshot is the only Realm-to-runtime materialization path in this app.
- **[R-RWS-ACCEPT-005]** Non-runtime Agent naming is absent from source code and current app authority, except legacy-denylist strings.
- **[R-RWS-ACCEPT-006]** AgentRule, CharacterCard, and RealmAgent compatibility are absent from current success paths.
- **[R-RWS-ACCEPT-007]** Assets, authoring candidates, and Runtime review preserve candidate-vs-source boundaries.
- **[R-RWS-ACCEPT-008]** Failure states are explicit and fail closed.
- **[R-RWS-ACCEPT-009]** pnpm run check:spec-consistency, typecheck, test, validate, local-audit, build, and check must pass before acceptance.
- **[R-RWS-ACCEPT-010]** Downstream work must adapt to WorldCore / WorldCharacterCore / RuntimeSourceSnapshot and must not restore old routes.
