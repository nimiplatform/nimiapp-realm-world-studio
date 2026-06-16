---
id: SPEC-REALM-WORLD-STUDIO-POST-PUBLISHING-001
title: Realm World Studio Post Boundary
status: active
owner: "@team"
updated: 2026-06-16
---

# Post Boundary

Realm World Studio is not an owner-authored post scheduling product in the
current kernel. This file exists to make that boundary explicit.

- **[R-RWS-POST-001]** Studio must not expose owner-authored post creation or
  scheduling as product success state.
- **[R-RWS-POST-002]** Studio must not reuse owner post, feed, campaign, or
  moderation surfaces for creator-world agent maintenance.
- **[R-RWS-POST-003]** AI-generated copy may be used only as reviewed candidate
  text for admitted world or world-agent fields unless a post rule is added.
- **[R-RWS-POST-004]** Local reminders, drafts, or scheduled timers must not be
  described as Realm post publication.
- **[R-RWS-POST-005]** If future post publishing is admitted, success must be
  defined by a Realm post authority response carrying canonical post identity.
- **[R-RWS-POST-006]** Missing or deferred post authority must fail closed rather
  than publishing stale drafts or silently dropping attachments.
