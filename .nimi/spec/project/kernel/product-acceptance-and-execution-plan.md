---
id: SPEC-REALM-WORLD-STUDIO-ACCEPTANCE-001
title: Realm World Studio Acceptance And Execution Plan
status: active
owner: "@team"
updated: 2026-06-16
---

# Product Acceptance And Execution Plan

## Gates

- **[R-RWS-ACCEPT-001]** A change is not acceptable until spec consistency,
  TypeScript typecheck, tests, lint, and relevant Rust checks pass or a blocker
  is explicitly recorded.
- **[R-RWS-ACCEPT-002]** `pnpm run check:spec-consistency` must reject stale
  adjacent-app rule authority and catalog drift.
- **[R-RWS-ACCEPT-003]** `pnpm run validate` and `pnpm run local-audit` must
  keep admission inputs as developer-submitted inputs, not platform truth.
- **[R-RWS-ACCEPT-004]** `pnpm run pack` may generate a submission packet only
  after renderer build output exists.
- **[R-RWS-ACCEPT-005]** CI green is pre-submission evidence only; it is not an
  admission, install, permission, or release decision.

## Execution Waves

- **[R-RWS-ACCEPT-006]** W1 establishes app identity, Tauri shell, Runtime
  bridge, admission inputs, and spec authority.
- **[R-RWS-ACCEPT-007]** W2 establishes creator-world list/detail routes and
  fail-closed source availability.
- **[R-RWS-ACCEPT-008]** W3 establishes world-agent list/detail/settings routes
  under creator-world authority.
- **[R-RWS-ACCEPT-009]** W4 establishes profile media, voice, chat-readiness,
  and AI candidate workflows.
- **[R-RWS-ACCEPT-010]** W5 hardens boundary checks, failure semantics, desktop
  smoke, and visual QA.

## Required Verification

- **[R-RWS-ACCEPT-011]** Code layer verification is `pnpm typecheck`,
  `pnpm test`, and `pnpm lint`.
- **[R-RWS-ACCEPT-012]** Rust layer verification is `cargo check` and
  `cargo test` under `src-tauri/`; CI additionally runs rustfmt and clippy.
- **[R-RWS-ACCEPT-013]** Spec layer verification is
  `pnpm check:spec-consistency`.
- **[R-RWS-ACCEPT-014]** Pre-submission verification is `pnpm run validate`,
  `pnpm run local-audit`, and `pnpm run pack`.
- **[R-RWS-ACCEPT-015]** CBDB source-skeleton acceptance for the Su Shi chain
  requires the Studio agent detail page to visibly render `蘇軾`, aliases
  including `子瞻`, `文忠`, and `東坡居士`, source profile `CBDB historical`,
  birth/death years `1036` and `1101`, timeline or office fact count, at least
  one representative office or timeline fact, relationship `蘇轍`, missing
  fields for portrait/voice/greeting/dialogue/behavior, Forge-derived brief
  fields for description/content style/positioning/avatar/voice/greeting/DNA,
  and blocked roleplay readiness with the creator-review reason.
