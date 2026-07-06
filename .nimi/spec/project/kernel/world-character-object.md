---
id: SPEC-REALM-WORLD-STUDIO-WORLD-CHARACTER-OBJECT-001
title: World Atlas Character Showcase Object
status: active
owner: "@team"
updated: 2026-06-30
---

# Character Showcase Object

- **[R-RWS-CHARACTER-001]** A showcase character exists only as a public WorldPublicSourceCardDto with sourceKind = worldCharacter.
- **[R-RWS-CHARACTER-002]** The parent world is proven by the public card worldId and the selected public world detail id.
- **[R-RWS-CHARACTER-003]** characterId alone is never enough to prove showcase authority; reads and UI state must carry the parent world context.
- **[R-RWS-CHARACTER-004]** Display name, role, summary, tags, avatar, relation state, sourceRef, and world binding must be read from the public character card when present.
- **[R-RWS-CHARACTER-005]** Public relation.state is the only admitted initial friend/connectability signal for the page.
- **[R-RWS-CHARACTER-006]** Missing optional showcase fields render as user-facing "正在整理中" copy, not creator source gaps.
- **[R-RWS-CHARACTER-007]** SourceRef and sourceContentHash remain hidden implementation authority; they must not appear in default user-facing copy.
- **[R-RWS-CHARACTER-008]** Session-local friend toggles and chat-entry prompts do not create or replace Realm records without a typed relation/chat write surface.
- **[R-RWS-CHARACTER-009]** RealmPersona cards returned by public DTOs must not be shown as world-character authority in this World Atlas detail page.
- **[R-RWS-CHARACTER-010]** Character detail biography timelines may display only typed public life-event projections derived from `WorldPublicSourceCardDto` world-character biography milestones and admitted relationship summaries; each event must carry a user-facing category such as birth, office, work, relationship, learning, death, or other, and the page must not invent missing dates, milestones, or source facts.
- **[R-RWS-CHARACTER-011]** Character overview time summaries and relationship clue timestamps must be derived only from existing public life-event `periodLabel` values; if no event carries a parseable year, the page must render the normal organizing state instead of deriving time from world era, biography prose, or scene copy.
