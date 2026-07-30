---
id: SPEC-REALM-WORLD-STUDIO-WORLD-CHARACTER-OBJECT-002
title: Realm World Studio World-Character Object
status: active
owner: "@team"
updated: 2026-07-09
---

# World-Character Object

- **[R-RWS-CHARACTER-001]** A RWS world character exists only as a typed `WorldCharacterCoreDto` returned by Realm core authority.
- **[R-RWS-CHARACTER-002]** The parent world is proven by `WorldCharacterCoreDto.worldId` and the selected `WorldCoreDto.id`.
- **[R-RWS-CHARACTER-003]** `characterId` alone is never enough for RWS authority; reads, routes, drafts, and writes must preserve parent world context.
- **[R-RWS-CHARACTER-004]** Character display projections may read name, role, summary, tags, avatar/profile media, voice, and behavior settings only from typed core payload fields or admitted media/resource references.
- **[R-RWS-CHARACTER-005]** Character replacement requires `baseContentHash` from the last typed Realm read and must fail closed when the hash is missing or stale.
- **[R-RWS-CHARACTER-006]** RWS must not show RealmPersona records as world-character authority.
- **[R-RWS-CHARACTER-007]** Runtime/private LocalAgent state is not part of world-character source authority.
- **[R-RWS-CHARACTER-008]** AI-generated character material is candidate draft material until the creator reviews it and a typed Realm core write succeeds.
- **[R-RWS-CHARACTER-009]** Missing optional character fields render as creator-facing incomplete/unavailable states, not synthesized values.
- **[R-RWS-CHARACTER-010]** World-character create/update UI must not build compatibility DTOs or app-local shadow records outside the typed Realm core contract.
