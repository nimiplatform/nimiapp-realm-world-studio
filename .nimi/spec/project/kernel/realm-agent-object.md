---
id: SPEC-REALM-WORLD-STUDIO-REALM-AGENT-OBJECT-001
title: Realm World Studio World-Agent Object
status: active
owner: "@team"
updated: 2026-06-16
---

# World-Agent Object

## Creator World

- **[R-RWS-AGENT-001]** A creator world is admitted into Studio only when
  `/api/me/creator/worlds` returns it for the current Runtime account.
- **[R-RWS-AGENT-002]** World identity, creator identity, maintain authority,
  status, media, and counts must be read from the creator-world DTO, not
  app-local cache.
- **[R-RWS-AGENT-003]** If a route references a `worldId` not present in the
  current creator-world authority list, Studio must fail closed.

## World-Owned Agent

- **[R-RWS-AGENT-004]** A world-agent is admitted into Studio only when returned
  by `/api/me/creator/worlds/{worldId}/agents` or the corresponding detail
  endpoint under the same `worldId`.
- **[R-RWS-AGENT-005]** `agentId` alone is never enough to prove Studio
  authority; every read and write must carry the creator-world `worldId`.
- **[R-RWS-AGENT-006]** `WORLD_OWNED` display is descriptive source projection,
  not a lifecycle state machine owned by Studio.
- **[R-RWS-AGENT-007]** Agent display name, handle, bio, avatar URL, profile
  cover URL, state, world linkage, and `friendCount` must be source-backed when
  shown.
- **[R-RWS-AGENT-008]** Missing optional source fields may render as unavailable
  copy, but must not be replaced with invented defaults.
- **[R-RWS-AGENT-009]** The detail page must read both agent detail and settings
  from creator-world authority before enabling save.
- **[R-RWS-AGENT-010]** After a save, Studio must refresh or re-read canonical
  world-agent detail before claiming the updated object.
- **[R-RWS-AGENT-013]** CBDB-derived world-agent detail must read
  `/api/me/creator/worlds/{worldId}/agents/{agentId}/source-skeleton` before
  claiming source identity, timeline, relationship, completion-gap, or
  authoring-brief state.
- **[R-RWS-AGENT-014]** A CBDB source skeleton must render canonical name,
  aliases, source profile, birth/death years, timeline or office fact count,
  representative facts, relationships, missing runtime fields, Forge-derived
  completion brief, and runtime readiness as source-backed fields.
- **[R-RWS-AGENT-015]** Forge-derived completion brief is not AI-generated
  output. Studio must not label it as AI-generated or use it as runtime-ready
  dialogue, voice, greeting, portrait, or behavior without creator review.

## Anti-Targets

- **[R-RWS-AGENT-011]** Studio must not construct world-agent authority from
  owner portfolio objects, public user profiles, LocalAgent forks, or generated
  AI output.
- **[R-RWS-AGENT-012]** Studio must not create world-owned agents unless a
  creator-world create endpoint is explicitly admitted into this kernel.
