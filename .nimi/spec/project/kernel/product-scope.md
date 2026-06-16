---
id: SPEC-REALM-WORLD-STUDIO-PRODUCT-SCOPE-001
title: Realm World Studio Product Scope
status: active
owner: "@team"
updated: 2026-06-16
---

# Product Scope

## In Scope

- **[R-RWS-SCOPE-001]** Studio lists creator worlds maintainable by the current
  Runtime account through `/api/me/creator/worlds`.
- **[R-RWS-SCOPE-002]** Studio lists and inspects world-owned agents only under
  a creator world returned by the creator-world list authority.
- **[R-RWS-SCOPE-003]** Studio edits world-agent settings, profile media, voice,
  and chat-readiness maintenance only through creator-world agent endpoints.
- **[R-RWS-SCOPE-004]** Studio may keep local view preferences and owner drafts
  for ergonomics, but those values must never become public product success.
- **[R-RWS-SCOPE-005]** Studio may expose Runtime-assisted text, image, and voice
  candidate workflows when every output remains review-gated.
- **[R-RWS-SCOPE-006]** Studio includes local AI model/profile configuration as
  app preference state, not Realm product truth.
- **[R-RWS-SCOPE-007]** Studio must expose typed failure states for unavailable
  creator-world authority, permission denial, Realm outage, Runtime outage, and
  capability gaps.

## Out of Scope

- **[R-RWS-SCOPE-008]** Owner `/api/me/agents` portfolio, owner-created
  `MASTER_OWNED` agent creation, and owner-agent settings are out of scope.
- **[R-RWS-SCOPE-009]** Forge-imported system curation and
  `/api/agent/forge-imported-system/**` are out of scope.
- **[R-RWS-SCOPE-010]** Generic public world catalog reads and `/api/world`
  listing must not define Studio success state.
- **[R-RWS-SCOPE-011]** `/api/creator/agents` and `/api/agent/dev/my-agents` are
  evidence or adjacent products only; they are not Studio authority.
- **[R-RWS-SCOPE-012]** LocalAgent private memory, emotion, cognition, local chat
  transcripts, and runtime fork state are out of scope.
- **[R-RWS-SCOPE-013]** Owner-authored post scheduling, campaign automation,
  moderation queues, gift/economic settlement, and team collaboration are out of
  scope.
- **[R-RWS-SCOPE-014]** Studio must not provide fallback from creator-world
  reads to owner-agent reads or public catalog reads.
- **[R-RWS-SCOPE-015]** Studio must not claim launch, admission, install, or
  permission-grant truth from local files or CI success.
