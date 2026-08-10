# Realm World Studio AGENTS.md

> Authoritative module-level instructions for AI assistants working on Realm World Studio.

## Identity

- **App name (English)**: Realm World Studio
- **Canonical Nimi app_id**: `nimi.realm-world-studio`
- **Tauri identifier**: `nimi.realm-world-studio`
- **One-line**: Creator-facing world and world-character operation desktop app for creator-owned Realm worlds.
- **Status**: Pre-Alpha, not yet launched.

## Architecture

| Layer | Technology | Location |
|-------|-----------|----------|
| Desktop shell | Electron 42 dev shell (active); Tauri 2 shell frozen | `src-electron/`; `src-tauri/` (frozen) |
| Renderer | React 19 + Vite 7 + Tailwind 4 | `src/shell/renderer/` |
| Routing | react-router-dom 7 | `src/shell/renderer/app-shell/routes.tsx` |
| Auth & runtime bridge | Desktop-supervised protected standard bridge | `src-electron/` |
| UI components | `@nimiplatform/kit` (`link:../../nimi/kit`) | renderer-wide |
| Platform client | `@nimiplatform/sdk` (`link:../../nimi/sdks/typescript`) | `app-shell/studio-platform.ts` |
| State | Zustand | `app-shell/app-store.ts` |
| Dev port | 1451 | `vite.config.ts` |

The linked platform packages resolve through their `dist/` exports for `tsc`
and the Electron main build, while Vite/Vitest alias to platform sources.
Run `pnpm prepare:workspace-surfaces` (already chained into `typecheck`,
`build:electron`) to build sdk/kit dist in the sibling `../../nimi` checkout
when it is missing or stale.

## Spec Authority & Sync

Closed v2 containers under `.nimi/spec/realm-world-studio/canonical/**` are
Realm World Studio's canonical product/app authority. Read only the affected
containers or bounded authority context; do not create parallel authority roots
(`apps/realm-world-studio/spec/**`, repo-root `spec/**`, sibling
`.nimi/spec/<other>/**`).

`.nimi/methodology/authority-authoring.yaml` is the package-managed authoring
guide; refresh with `pnpm exec nimicoding sync --apply` after bumping the
package.

Studio canonical world surfaces are `Realm WorldCoreController.listWorldCores`,
`getWorldCore`, `createWorldCore`, `replaceWorldCore`,
`listWorldCharacters`, `getWorldCharacter`, `createWorldCharacter`,
`replaceWorldCharacter`, `listWorldEntities`, `getWorldEntity`,
`listWorldRelationships`, `getWorldRelationship`, and typed source
materialization surfaces when admitted. RealmPersona portfolio surfaces belong
to Realm Persona Studio and must not be used as world-character authority.
`WorldPublicController.*`, `/api/agent/forge-imported-system/**`,
`/api/creator/characters/**`, resource upload/direct-publication APIs, and
public world catalog reads are explicitly non-current anti-targets.

Nimi-generated Realm world data is maintained by `halliday@nimi.ai`. Studio
must not synthesize maintenance authority for worlds owned by any other
creatorId.

## Hard Boundaries

### Scope boundary
- **In scope:** WorldCore records, WorldCharacterCore detail, creator world creation/update, world-character settings, profile media references, voice/source settings, and typed source materialization readiness through Realm core authority when admitted.
- **Out of scope:** RealmPersona owner portfolio, LocalAgent private runtime / memory / emotion state, owner-authored post scheduling, fallback from world reads to owner-persona reads, gift/economic settlement, team collaboration.

### Failure mode
- Fail-closed on every typed contract or source-availability gap. No pseudo-success, no synthesized placeholders, no zero-fill metrics, no parallel app-local shadow truth.
- Creator/world writes only succeed after the corresponding Realm core endpoint returns canonical data.
- AI generation output is candidate material until creator human review.

### Auth boundary
- Studio does **not** own access or refresh tokens (mirrors parentos PO-SHELL-008 / K-ACCSVC-008).
- The active development path is Desktop-supervised Electron; account, Realm, AI, and publication operations remain fail-closed unless their exact operation is covered by a declared `app_access` domain.
- Account projection flows through the Desktop-supervised protected local-app session. Studio must not add embedded login, a generic Runtime bridge, direct Realm transport, environment/argument launch identity, or app-owned release/session material.

## Development Principles

### No legacy, no shims
- This project starts standalone. There is no prior deployed version, no migration burden.
- No compatibility layers, adapters, or shims.
- No "simple version first, fix later" shortcuts.
- No backward-compatible fallback logic.
- Full storybook scope from day one.

### Fail-close
- Missing platform client → fail-close, show capability unavailable in product copy.
- Realm API failure → show typed failure category (`realm-unavailable`, `access-denied`, etc.), not silent retry.
- AI generation failure → preserve owner draft, never invent placeholder text.
- Schedule due time arrives but post draft missing → fail, do not publish stale draft.

## Admission Inputs

`nimi.app.yaml`, `ADMISSION.md`, `SECURITY.md`, and `.nimi/admission/**` are
developer-submitted review inputs, not platform admission truth. They mark
their own role:

- `nimi.app.yaml` → `manifest_role: submitted-input`
- `.nimi/admission/submission.yaml` → `submission_role: developer-submitted-input` and `admission_truth: platform-owned-after-review`
- `.nimi/admission/build-profile.yaml` → `profile_role: developer-workflow-input`

Reviewer boundary: Nimi Platform review owns final admission, release
descriptors, ordinary-user visibility, and install availability. App Access
is declared in `nimi.app.yaml` (`app_access`) and applies exactly as
declared — there is no permission/request/approval/grant surface. Do not
promote any local file or `dist/nimi-app-submission.json` field into a
release or access claim.

When editing admission inputs:

- Keep `app_id: nimi.realm-world-studio` identical across the manifest,
  `submission.yaml`, `scripts/pack.mjs`, Runtime/SDK callers, and the Tauri
  identifier. Do not introduce a second OS-bundle-only app identity.
- Keep the `app_access` domain set in `nimi.app.yaml` minimal — declare only
  domains the product actually consumes (currently `realm.data` only).
  Unknown entries are inert; do not declare speculative domains.
- Never add fields that claim grant/approval semantics
  (`permission_grant: granted`, `public_admission_truth: true`, etc.); the
  `scripts/local-audit.mjs` self-check rejects them.

## Verification

```bash
# Code layer
pnpm prepare:workspace-surfaces   # build sdk/kit dist in ../../nimi when stale (chained into typecheck/build:electron)
pnpm typecheck
pnpm test
pnpm lint
pnpm run build:electron

# Rust layer
(cd src-tauri && cargo check)
(cd src-tauri && cargo test)

# Spec layer
pnpm check:spec-consistency

# Pre-submission self-check (local-only; does not establish admission truth)
pnpm run validate       # manifest/submission/build-profile role markers
pnpm run local-audit    # admission inputs must defer truth to platform
pnpm run pack           # builds renderer + produces dist/nimi-app-submission.json
pnpm run check          # aggregate: validate + local-audit + spec-consistency + typecheck + lint + test
```

## CI

`.github/workflows/ci.yml` runs three jobs:

- `spec-and-typescript` — nimicoding doctor, spec consistency, typecheck,
  lint, vitest, Electron build, renderer build (uploads `renderer-dist` artifact).
- `pre-submission-self-check` — needs `spec-and-typescript`, runs `validate`
  + `local-audit`, then re-packs the submission packet from the renderer
  artifact and uploads `nimi-app-submission`.
- `rust-quality` — cargo fmt/check/clippy/test on `src-tauri/`.

The self-check is pre-submission only. CI green does not constitute an
admission decision.

## Retrieval Defaults

Start with: `.nimi/spec/realm-world-studio/canonical/`, `src/shell/renderer/app-shell/`, `src/shell/renderer/features/worlds/`, `src-tauri/src/`, `src-electron/`.

Skip: `node_modules/`, `dist/`, `dist-electron/`, `src-tauri/target/`, `src-tauri/gen/`, lockfiles.

## Code Conventions

- ULID for new app-level IDs.
- ISO 8601 for date/time fields.
- ESM imports use `.js` extension even for `.ts` files.
- Tauri host glue is consumed from `nimi-shell-tauri` (`crates.io` 0.1.0) and renderer bridge APIs from `@nimiplatform/kit/shell/renderer/bridge` (npm).
- Electron host glue is consumed from `@nimiplatform/kit/shell/electron/*`; renderer Runtime transport selects `electron-ipc` only when the kit Electron preload is present.

<!-- nimicoding:managed:agents:start -->
# Nimi Coding Managed Block

- Product authority lives under `.nimi/spec/**`.
- For canonical authority authoring, read only `.nimi/methodology/authority-authoring.yaml`, the affected authority files or bounded task context, and CLI diagnostics.
- Use `nimicoding authority context <path> <id> --max-units <n> --max-bytes <n> --json` only for the complete declared outgoing interpretation closure; it is not complete task context, and failure never permits guessed or partial context.
- Use `nimicoding authority diff` and `authority impact` with explicit `--max-bytes`; impact reports declared review obligations and does not prove implementation, consumers, or tests are synchronized.
- Under `.nimi/spec/**`, author only closed multi-unit `*.authority.yaml` containers or single-unit `*.authority.md`; historical document formats are unsupported and never inferred.
- Run `nimicoding authority fmt` on each changed file, then `nimicoding authority check` on the complete authority input set.
- Never bypass a failure with inferred or fallback semantics; choose repair values only from product/task authority.
- Keep derived and verification evidence under `.nimi/local/**`; it is never product authority.
<!-- nimicoding:managed:agents:end -->
