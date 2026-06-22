---
id: SPEC-REALM-WORLD-STUDIO-PRODUCT-SCOPE-001
title: Realm World Studio Product Scope
status: active
owner: "@team"
updated: 2026-06-22
---

# Product Scope

- **[R-RWS-SCOPE-001]** Studio lists WorldCore records admitted by Realm for Studio maintenance; Nimi-generated WorldCore records are maintainable only when their Realm creatorId is the stable Realm account id for halliday@nimi.ai (`01J00000000000000000000000`).
- **[R-RWS-SCOPE-002]** Studio inspects WorldCore detail before showing world-character workspaces.
- **[R-RWS-SCOPE-003]** Studio lists and inspects WorldCharacterCore objects under their parent world, and may read WorldEntityCore for source-backed graph counts and for resolving the same-world entity binding carried by WorldCharacterCore.entityId.
- **[R-RWS-SCOPE-004]** Studio updates only creator-reviewed WorldCharacterCore fields through replaceWorldCharacter.
- **[R-RWS-SCOPE-005]** Studio may generate local candidates for missing character fields when every candidate remains review-gated.
- **[R-RWS-SCOPE-006]** Studio may keep local view preferences and authoring draft state for ergonomics only.
- **[R-RWS-SCOPE-007]** RealmPersona owner portfolio, Persona settings, Forge curation, post scheduling, gift/economic settlement, team collaboration, and localAgent private runtime are out of scope.
- **[R-RWS-SCOPE-008]** Public world catalog reads and creator legacy routes must not be fallback success paths.
- **[R-RWS-SCOPE-009]** World creation is not admitted in this app until this kernel adds a create WorldCore rule and implementation path.
- **[R-RWS-SCOPE-010]** Studio may read WorldRelationshipCore lists for source-backed graph counts, relationship ontology inspection, and diagnostics; RelationshipCore editing is not admitted until a replace relationship rule exists.
- **[R-RWS-SCOPE-011]** The default Creator Worlds screen must translate Realm Core source facts into localizable creator-facing world inventory, world frame, cast, structure, timeline, asset, and next-action language; schema ids, controller names, content hashes, and raw unavailable reasons belong in diagnostics, not the default product layer.
