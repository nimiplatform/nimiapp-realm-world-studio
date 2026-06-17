---
id: SPEC-REALM-WORLD-STUDIO-WORLD-CHARACTER-OBJECT-001
title: Realm World Studio WorldCharacter Object
status: active
owner: "@team"
updated: 2026-06-18
---

# WorldCharacter Object

- **[R-RWS-CHARACTER-001]** A world character exists only as WorldCharacterCore returned by Realm.
- **[R-RWS-CHARACTER-002]** The parent world is proven by WorldCharacterCore.worldId and the selected WorldCore id.
- **[R-RWS-CHARACTER-003]** characterId alone is never enough to prove Studio authority; reads and writes must carry the parent world context in product state.
- **[R-RWS-CHARACTER-004]** Display name, handle, description, greeting, media, voice, source profile, and readiness fields must be read from WorldCharacterCore.core when present.
- **[R-RWS-CHARACTER-005]** contentHash and contentRevision are canonical concurrency and revision evidence.
- **[R-RWS-CHARACTER-006]** Missing optional fields render as source gaps and drive creator-reviewed authoring targets.
- **[R-RWS-CHARACTER-007]** CBDB or other source skeleton fields must remain source-backed and cannot become generated source identity.
- **[R-RWS-CHARACTER-008]** Local candidates, Runtime output, and authoring briefs do not create or replace WorldCharacterCore without Realm confirmation.
- **[R-RWS-CHARACTER-009]** WorldCharacterCore objects must not be shown in Realm Persona Studio owner portfolio surfaces.
