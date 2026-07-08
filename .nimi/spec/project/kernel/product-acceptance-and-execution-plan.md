---
id: SPEC-REALM-WORLD-STUDIO-PRODUCT-ACCEPTANCE-002
title: Realm World Studio Product Acceptance And Execution Plan
status: active
owner: "@team"
updated: 2026-07-09
---

# Product Acceptance And Execution Plan

- **[R-RWS-ACCEPT-001]** Package, Tauri identifier, and app_id remain `nimi.realm-world-studio`, while active product copy presents creator Realm World Studio semantics.
- **[R-RWS-ACCEPT-002]** Creator world reads use `WorldCoreController` Realm core surfaces, not `WorldPublicController` public showcase surfaces.
- **[R-RWS-ACCEPT-003]** Creator writes use typed Realm core create/replace endpoints and treat returned DTOs as post-write authority.
- **[R-RWS-ACCEPT-004]** Auth uses kit/Runtime account surfaces with no renderer-owned access or refresh token custody.
- **[R-RWS-ACCEPT-005]** Shared UI primitives and model configuration use kit surfaces; RWS app CSS stays product-layout scoped.
- **[R-RWS-ACCEPT-006]** AI execution and source materialization use SDK/Runtime/Realm surfaces only, and AI output remains candidate material until creator review.
- **[R-RWS-ACCEPT-007]** WorldPublicController, World Atlas pages, owner persona portfolio routes, Forge curation, and source-connection anti-targets are absent from current success paths.
- **[R-RWS-ACCEPT-008]** Failure states are explicit and fail closed.
- **[R-RWS-ACCEPT-009]** `pnpm run check:spec-consistency`, `typecheck`, `test`, `validate`, `local-audit`, `build`, and `check` must pass before acceptance.
- **[R-RWS-ACCEPT-010]** Downstream work must extend RWS creator workbench modules without restoring public showcase routes or app-local substrate replacements.
