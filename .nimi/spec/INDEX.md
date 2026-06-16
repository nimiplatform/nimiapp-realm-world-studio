# Spec Index

`.nimi/spec/**` is the active product/app contract source for Realm World
Studio in this repository. Topic notes, screenshots, conversation summaries,
generated artifacts, and `.nimi/local/**` execution state are evidence, not
authority.

## Active Authority

| Surface | Role |
|---------|------|
| `.nimi/spec/INDEX.md` | Thin entry point for the active spec tree. |
| `.nimi/spec/project/AGENTS.md` | Editing rules for the project spec root. |
| `.nimi/spec/project/kernel/**.md` | Canonical Realm World Studio product/app contract. |
| `.nimi/spec/project/kernel/tables/**.yaml` | Canonical rule registry and support tables. |

## Read Order

1. `.nimi/spec/INDEX.md`
2. `.nimi/spec/project/AGENTS.md`
3. `.nimi/spec/project/kernel/index.md`
4. `.nimi/spec/project/kernel/core-rules.md`
5. Target domain kernel doc
6. `.nimi/spec/project/kernel/tables/rule-catalog.yaml`

## Rule ID Format

Every normative rule body uses `R-RWS-<DOMAIN>-NNN`. The domain prefix table
and active kernel document set are declared in `project/kernel/index.md`. The
full enumerated registry lives in `project/kernel/tables/rule-catalog.yaml`.

## Non-Authority Surfaces

| Surface | Role |
|---------|------|
| `.nimi/methodology/**` | Package-canonical nimicoding projection. |
| `.nimi/contracts/**` | Package-canonical nimicoding projection. |
| `.nimi/config/**` | Package-canonical nimicoding projection. |
| `.nimi/local/**` | Local-only operational state; never product authority. |
| `.nimi/cache/**` | Local cache; never product authority. |
| `.nimi/topics/**` | Topic evidence only after absorption into the kernel. |

Refresh package-canonical projections after bumping `@nimiplatform/nimi-coding`
with `pnpm exec nimicoding start --yes`.

## Verification

```bash
pnpm exec nimicoding doctor
pnpm run check:spec-consistency
pnpm run typecheck
pnpm run test
pnpm run lint
```
