---
id: SPEC-REALM-WORLD-STUDIO-ASSET-BINDING-002
title: Realm World Studio Asset Boundary
status: active
owner: "@team"
updated: 2026-07-09
---

# Asset And Binding Boundary

- **[R-RWS-ASSET-001]** World and world-character media shown in RWS are creator display/source references only when present in typed Realm core payloads or admitted resource references.
- **[R-RWS-ASSET-002]** RWS must not promote a local file path, public URL, or generated preview into Realm source state until a typed Realm write succeeds.
- **[R-RWS-ASSET-003]** Resource upload, direct publication, OwnableAsset, binding publication, AGENT host binding, and Runtime materialization bindings are not current success paths unless explicitly added by this kernel.
- **[R-RWS-ASSET-004]** Missing media resolver capability must render as capability unavailable or incomplete, not as successful asset readiness.
- **[R-RWS-ASSET-005]** AI-generated images/audio are candidate assets until creator review and typed Realm/resource admission succeeds.
- **[R-RWS-ASSET-006]** Asset readiness must never be inferred from display URLs alone.
