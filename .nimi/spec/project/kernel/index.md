---
id: SPEC-REALM-WORLD-STUDIO-KERNEL-INDEX-001
title: Realm World Studio Kernel Authority
status: active
owner: "@team"
updated: 2026-06-16
---

# Realm World Studio Kernel Authority

## Scope

This kernel is the single authoritative product/app contract source for Realm
World Studio. Every kernel document carries explicit `R-RWS-<DOMAIN>-NNN` rule
IDs. Implementation, tests, checks, and review must cite IDs rather than
copying prose.

Realm World Studio is the creator-facing desktop app for creator-owned Realm
worlds and the world-owned agents under those worlds. It is not the owner Realm
Agent portfolio, not LocalAgent runtime management, and not a generic world or
agent control center.

## Rule ID Format

`R-RWS-<DOMAIN>-NNN`

| Domain | Kernel Document |
|---|---|
| `CORE` | `core-rules.md` |
| `SCOPE` | `product-scope.md` |
| `AGENT` | `realm-agent-object.md` |
| `SETTING` | `agent-setting-field-map.md` |
| `ASSET` | `asset-and-binding.md` |
| `POST` | `post-publishing.md` |
| `RUNTIME` | `runtime-ai-consumption.md` |
| `METRIC` | `metrics-and-realm-gaps.md` |
| `FAIL` | `failure-semantics.md` |
| `STORY` | `storybook.md` |
| `ACCEPT` | `product-acceptance-and-execution-plan.md` |

The canonical rule catalog lives in
[`tables/rule-catalog.yaml`](tables/rule-catalog.yaml).

## Canonical Surface Summary

- `GET /api/me/creator/worlds` is the Studio creator-world list authority.
- `GET /api/me/creator/worlds/{worldId}/agents` is the Studio world-agent list
  authority for a creator world already admitted by the list authority.
- `GET /api/me/creator/worlds/{worldId}/agents/{agentId}` is the Studio
  world-agent detail authority.
- `GET/PATCH /api/me/creator/worlds/{worldId}/agents/{agentId}/settings` is the
  Studio world-agent settings read/write authority.
- `PATCH /api/me/creator/worlds/{worldId}/agents/{agentId}/profile-media` is
  the Studio profile-media write authority.
- `PATCH /api/me/creator/worlds/{worldId}/agents/{agentId}/voice` is the Studio
  voice-setting write authority.
- `GET /api/me/creator/worlds/{worldId}/agents/{agentId}/chat-readiness` is the
  Studio chat-readiness read authority.

Owner portfolio surfaces such as `/api/me/agents`, Forge-imported system
curation surfaces, `/api/creator/agents`, and public world catalog reads are not
Realm World Studio product success authority.

## Desktop Runtime Caller Authority

Realm World Studio uses the fixed Nimi app identity `nimi.realm-world-studio`.
Runtime account custody, app sessions, and mediated Realm calls flow through
`nimi-shell-tauri` and `@nimiplatform/sdk`; Studio does not own Realm tokens or
Runtime refresh tokens.

## Hard Boundaries

- **[R-RWS-CORE-001]** `.nimi/spec/project/kernel/**` is the only normative
  product/app authority root for Realm World Studio.
- **[R-RWS-CORE-002]** `app_id`, Tauri identifier, Runtime caller identity, and
  packaging identity must remain `nimi.realm-world-studio`.
- **[R-RWS-CORE-003]** Product success state must come from creator-world Realm
  authority, Runtime authority, or admitted SDK authority; app-local shadow
  truth is forbidden.
- **[R-RWS-CORE-004]** Creator/world writes succeed only after the corresponding
  creator-world Realm endpoint returns canonical data or accepted write
  confirmation.
- **[R-RWS-CORE-005]** Missing source, permission, contract, platform client, or
  capability must fail closed with a typed failure state.
