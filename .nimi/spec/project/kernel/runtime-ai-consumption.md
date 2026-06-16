---
id: SPEC-REALM-WORLD-STUDIO-RUNTIME-AI-CONSUMPTION-001
title: Realm World Studio Runtime AI Consumption
status: active
owner: "@team"
updated: 2026-06-16
---

# Runtime AI Consumption

## Runtime Boundary

- **[R-RWS-RUNTIME-001]** Runtime is an AI and account mediation layer for
  Studio; it does not own Realm world or world-agent truth.
- **[R-RWS-RUNTIME-002]** Studio must consume Runtime through the
  `nimi-shell-tauri` IPC bridge and app-scoped SDK client.
- **[R-RWS-RUNTIME-003]** Runtime account session, app session, and protected
  access metadata must not be persisted by Studio as long-lived credentials.
- **[R-RWS-RUNTIME-004]** Runtime defaults provide Realm base URL and account
  mediation only; missing defaults fail closed.

## AI Usage

- **[R-RWS-RUNTIME-005]** AI may draft or rewrite world-agent setting text,
  profile-media prompts, voice descriptions, and operational suggestions only
  inside visible creator review flows.
- **[R-RWS-RUNTIME-006]** AI image, audio, or text generation output is candidate
  material until creator review and admitted Realm write success.
- **[R-RWS-RUNTIME-007]** Model and route choices must come from Runtime route
  options or reviewed Studio AI config.
- **[R-RWS-RUNTIME-008]** Studio must not send LocalAgent private memory,
  emotion, cognition, local chat transcripts, or app-specific memory fragments
  to Runtime.
- **[R-RWS-RUNTIME-009]** Runtime route failure is capability unavailable, not
  Realm failure.
- **[R-RWS-RUNTIME-010]** Malformed AI output must be rejected or kept as draft;
  it must not be coerced into a successful Realm write.
