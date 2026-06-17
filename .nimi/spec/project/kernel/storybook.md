---
id: SPEC-REALM-WORLD-STUDIO-STORYBOOK-001
title: Realm World Studio Storybook
status: active
owner: "@team"
updated: 2026-06-18
---

# Storybook

| Story | Rule |
|---|---|
| Review worlds | **[R-RWS-STORY-001]** Worlds load from listWorldCores and display source-backed character counts. |
| Inspect world | **[R-RWS-STORY-002]** World detail loads getWorldCore plus listWorldCharacters before showing character workspaces. |
| Inspect character | **[R-RWS-STORY-003]** Character detail loads getWorldCharacter and keeps contentHash visible to save logic. |
| Complete missing fields | **[R-RWS-STORY-004]** Authoring targets derive from missing WorldCharacterCore source fields. |
| Save character | **[R-RWS-STORY-005]** Creator-reviewed changes save through replaceWorldCharacter with baseContentHash. |
| Generate candidates | **[R-RWS-STORY-006]** Runtime text/image/voice outputs remain local candidates until creator review and Realm core replacement. |
| Prepare runtime snapshot | **[R-RWS-STORY-007]** Runtime readiness uses RuntimeSourceSnapshot by value and does not expose private LocalAgent memory. |
| Keep adjacent products out | **[R-RWS-STORY-008]** Realm Persona Studio, Forge curation, owner persona portfolio, and legacy Agent routes stay out of World Studio routes. |
