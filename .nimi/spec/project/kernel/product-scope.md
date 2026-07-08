---
id: SPEC-REALM-WORLD-STUDIO-PRODUCT-SCOPE-002
title: Realm World Studio Product Scope
status: active
owner: "@team"
updated: 2026-07-09
---

# Product Scope

- **[R-RWS-SCOPE-001]** Realm World Studio presents creator-owned Realm worlds as creator workbench objects, not as public World Atlas showcase pages.
- **[R-RWS-SCOPE-002]** The `/worlds` route lists creator-accessible `WorldCoreDto` records through typed Realm core surfaces.
- **[R-RWS-SCOPE-003]** A world detail route loads `WorldCoreDto` before showing creator workbench identity, ontology, graph, character, or operation modules.
- **[R-RWS-SCOPE-004]** World creation and update routes may submit only typed `CreateWorldCoreDto` or `ReplaceWorldCoreDto` payloads and must render the returned `WorldCoreDto` as the post-write authority.
- **[R-RWS-SCOPE-005]** World-character list/detail routes read world-owned `WorldCharacterCoreDto` records under their parent world context.
- **[R-RWS-SCOPE-006]** World-character create/update routes may submit only typed `CreateWorldCharacterCoreDto` or `ReplaceWorldCharacterCoreDto` payloads and must render the returned `WorldCharacterCoreDto` as the post-write authority.
- **[R-RWS-SCOPE-007]** Entity, relationship, scene, timeline, source-materialization, and AI-assisted generation modules are incremental creator workbench extensions that require explicit kernel rules before becoming success paths.
- **[R-RWS-SCOPE-008]** RealmPersona owner portfolio, public World Atlas browsing, Forge curation, post scheduling, gift/economic settlement, team collaboration, and LocalAgent private runtime are out of scope.
- **[R-RWS-SCOPE-009]** RWS may keep app-local form drafts and review notes, but unsaved draft state must be labeled as draft/candidate and must not be treated as Realm source success.
- **[R-RWS-SCOPE-010]** Creator workflow copy must distinguish creator-actionable gaps from platform-unavailable capabilities.
- **[R-RWS-SCOPE-011]** No route may fall back from Realm core reads to public world reads or owner-persona reads to produce a success state.
- **[R-RWS-SCOPE-012]** Product expansion must preserve the thin-layer boundary: add workflow composition in RWS and reusable substrate in kit/sdk/runtime/realm.
