---
id: SPEC-REALM-WORLD-STUDIO-ASSET-AND-BINDING-001
title: Realm World Studio Asset And Binding
status: active
owner: "@team"
updated: 2026-06-16
---

# Asset And Binding

## Candidate Lifecycle

- **[R-RWS-ASSET-001]** Runtime-generated or uploaded media is candidate
  material until creator review.
- **[R-RWS-ASSET-002]** Local preview, local history, or selected candidate state
  is not public Realm asset truth.
- **[R-RWS-ASSET-003]** Direct upload and resource finalization may be used only
  through SDK Realm surfaces admitted to the Studio facade.
- **[R-RWS-ASSET-004]** A profile-media save succeeds only after the
  creator-world profile-media endpoint accepts the reviewed media URL or
  identifier shape.

## Profile Media

- **[R-RWS-ASSET-005]** Avatar URL and profile cover URL are admitted profile
  media fields for current Studio editing.
- **[R-RWS-ASSET-006]** Studio must not infer additional public binding points
  for banners, scenes, portraits, or voice samples by analogy.
- **[R-RWS-ASSET-007]** Resource, OwnableAsset, or Binding truth may be claimed
  only after a creator-world endpoint or an explicitly admitted binding ingress
  confirms it.

## Voice And Audio

- **[R-RWS-ASSET-008]** Voice-demo audio remains candidate material unless the
  voice endpoint confirms the reviewed voice settings.
- **[R-RWS-ASSET-009]** Runtime audio synthesis output must not be treated as
  custom voice ownership or public profile state.

## Failure

- **[R-RWS-ASSET-010]** Upload, finalize, media-write, and voice-write failures
  must preserve the creator draft and report the failed capability.
