# Realm World Studio Spec AGENTS

This is the editing surface for the Realm World Studio canonical product/app
contract under `.nimi/spec/project/**`. Read `.nimi/spec/INDEX.md` first, then
this file, before changing kernel rules.

## Authority Layout

- `kernel/index.md` declares the active kernel document set and the
  `R-RWS-<DOMAIN>-NNN` rule namespace.
- `kernel/core-rules.md` owns cross-cutting invariants. Domain rules cannot
  override them by interpretation.
- Each `kernel/*.md` file owns one bounded product domain.
- `kernel/tables/rule-catalog.yaml` enumerates every admitted rule identifier.

## Editing Rules

1. `.nimi/spec/project/kernel/**` is the only active product/app authority root
   for Realm World Studio in this repo.
2. Adding, removing, or rewording a rule requires editing both the affected
   kernel document and `kernel/tables/rule-catalog.yaml` in the same change.
3. New domain prefixes require updating `kernel/index.md`, adding or assigning
   a kernel document, and extending the catalog.
4. Topic files, `.nimi/local/**`, generated packets, screenshots, and chat
   summaries are evidence only; they do not become authority without a kernel
   rule update.
5. Scope expansion into owner `/api/me/characters`, LocalAgent private runtime
   state, generic public world catalog success, Forge-imported system curation,
   economic settlement, or team collaboration is rejected unless the kernel is
   explicitly changed first.
6. Acceptance claims based only on renderer tests, partial feature wiring, or
   local screenshots are rejected. Acceptance gates live in
   `kernel/product-acceptance-and-execution-plan.md`.
