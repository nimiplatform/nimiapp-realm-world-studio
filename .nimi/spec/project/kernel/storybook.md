---
id: SPEC-REALM-WORLD-STUDIO-STORYBOOK-001
title: Realm World Studio Storybook
status: active
owner: "@team"
updated: 2026-06-16
---

# Storybook

| Story | Acceptance rule |
|---|---|
| Open Studio | **[R-RWS-STORY-001]** Runtime bootstrap uses the kit desktop auth surface and shows fail-closed bootstrap errors. |
| Review creator worlds | **[R-RWS-STORY-002]** The worlds view lists only creator worlds returned by `/api/me/creator/worlds`. |
| Search creator worlds | **[R-RWS-STORY-003]** Search is a local view filter and must not mutate world authority. |
| Inspect world detail | **[R-RWS-STORY-004]** World detail succeeds only when the selected world is present in creator-world authority. |
| Review world agents | **[R-RWS-STORY-005]** World agents are listed only through the selected creator world's agent endpoint. |
| Inspect world-agent detail | **[R-RWS-STORY-006]** Agent detail and settings are both read before the editor enables save. |
| Save world-agent settings | **[R-RWS-STORY-007]** Settings save uses the admitted settings endpoint and re-reads canonical detail before success. |
| Save profile media | **[R-RWS-STORY-008]** Profile media save uses the admitted creator-world profile-media endpoint. |
| Save voice settings | **[R-RWS-STORY-009]** Voice save uses the admitted creator-world voice endpoint. |
| Configure AI | **[R-RWS-STORY-010]** AI config is local preference state and cannot become Realm success. |
| Handle failures | **[R-RWS-STORY-011]** Failure states name unavailable Realm, Runtime, permission, or capability authority and preserve drafts. |
| Keep adjacent products out | **[R-RWS-STORY-012]** Owner portfolios, Forge-imported curation, LocalAgent private state, public world catalog success, and post scheduling stay out of Studio routes. |
