---
id: SPEC-REALM-WORLD-STUDIO-STORYBOOK-002
title: Realm World Studio Storybook
status: active
owner: "@team"
updated: 2026-07-09
---

# Storybook

| Story | Rule |
|---|---|
| Open creator workspace | **[R-RWS-STORY-001]** Runtime account bootstrap completes before creator routes request Realm core data. |
| Browse worlds | **[R-RWS-STORY-002]** `/worlds` lists creator-accessible WorldCore records through Realm core authority. |
| Inspect world | **[R-RWS-STORY-003]** World detail loads WorldCore and world-character slices before showing creator workbench modules. |
| Create world | **[R-RWS-STORY-004]** World creation drafts remain local until `createWorldCore` returns canonical data. |
| Update world | **[R-RWS-STORY-005]** World updates require `baseContentHash` and render returned `WorldCoreDto` after `replaceWorldCore`. |
| Edit world character | **[R-RWS-STORY-006]** Character edits require parent world context, `baseContentHash`, and returned `WorldCharacterCoreDto`. |
| Use AI carefully | **[R-RWS-STORY-007]** AI-assisted generation produces candidate material only; creator review and Realm write are required for source success. |
| Keep platform substrate out | **[R-RWS-STORY-008]** Auth custody, design system primitives, model config, AI execution, Realm transport, public showcase, and LocalAgent private state stay outside RWS-owned implementation. |
