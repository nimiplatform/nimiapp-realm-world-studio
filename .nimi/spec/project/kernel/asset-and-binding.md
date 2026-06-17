---
id: SPEC-REALM-WORLD-STUDIO-ASSET-BINDING-001
title: Character Asset And Binding Boundary
status: active
owner: "@team"
updated: 2026-06-18
---

# Character Asset And Binding Boundary

- **[R-RWS-ASSET-001]** Avatar, profile cover, voice, and reference media outputs are local candidates until creator review.
- **[R-RWS-ASSET-002]** A reviewed media URL may become source state only through replaceWorldCharacter.
- **[R-RWS-ASSET-003]** Resource, OwnableAsset, or Binding publication is not admitted unless a future owner-scoped Realm ingress is added.
- **[R-RWS-ASSET-004]** Studio must not write AGENT host bindings or AGENT_* binding points.
- **[R-RWS-ASSET-005]** Local preview media must preserve source world id, character id, content hash, and review state.
- **[R-RWS-ASSET-006]** Missing media source data renders as a source gap, not a placeholder public asset.
