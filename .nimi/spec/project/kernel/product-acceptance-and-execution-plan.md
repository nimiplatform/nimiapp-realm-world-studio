---
id: SPEC-REALM-WORLD-STUDIO-PRODUCT-ACCEPTANCE-001
title: World Atlas Product Acceptance And Execution Plan
status: active
owner: "@team"
updated: 2026-06-27
---

# Product Acceptance And Execution Plan

- **[R-RWS-ACCEPT-001]** Package and Tauri identity remain stable, while active route/product copy presents World Atlas detail semantics.
- **[R-RWS-ACCEPT-002]** Showcase reads use WorldPublicController public world surfaces only.
- **[R-RWS-ACCEPT-003]** The World Atlas detail page performs no Realm creator writes.
- **[R-RWS-ACCEPT-004]** RuntimeSourceSnapshot is not created by this page.
- **[R-RWS-ACCEPT-005]** Implementation types use showcase/world-character terminology; "Agent" is limited to user-facing explanatory copy when needed.
- **[R-RWS-ACCEPT-006]** AgentRule, CharacterCard compatibility, creator cockpit, and source connection paths are absent from current success paths.
- **[R-RWS-ACCEPT-007]** Public media assets and theme fallback assets preserve display-vs-source boundaries.
- **[R-RWS-ACCEPT-008]** Failure states are explicit and fail closed.
- **[R-RWS-ACCEPT-009]** pnpm run check:spec-consistency, typecheck, test, validate, local-audit, build, and check must pass before acceptance.
- **[R-RWS-ACCEPT-010]** Downstream work must adapt to WorldPublicDetailWithCharacters / WorldPublicSourceCard projection and must not restore creator cockpit routes.
