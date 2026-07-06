---
id: SPEC-REALM-WORLD-STUDIO-ASSET-BINDING-001
title: Showcase Asset Boundary
status: active
owner: "@team"
updated: 2026-06-27
---

# Showcase Asset Boundary

- **[R-RWS-ASSET-001]** Hero, icon, highlight, avatar, profile cover, and scene imagery are display assets only on the World Atlas detail page.
- **[R-RWS-ASSET-002]** Public media URLs may be displayed but never promoted into source state by this page.
- **[R-RWS-ASSET-003]** Resource, OwnableAsset, Binding publication, upload, and direct-publication APIs are not admitted for this page.
- **[R-RWS-ASSET-004]** World Atlas must not write AGENT host bindings, AGENT_* binding points, or Runtime materialization bindings.
- **[R-RWS-ASSET-005]** Theme fallback media is visual presentation only and must not be treated as platform publication evidence.
- **[R-RWS-ASSET-006]** Missing media renders through theme fallback or user-facing unavailable states, not placeholder public asset claims.
