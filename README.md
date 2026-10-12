# Realm World Studio

## Published dependency and Catalog acceptance (2026-10-13)

Current public release: [0.1.6](https://github.com/nimiplatform/nimiapp-realm-world-studio/releases/tag/v0.1.6); [Registry admission #82](https://github.com/nimiplatform/nimi-app-registry/pull/82) is merged for macOS arm64 and Windows x64. Frozen locks use published SDK 0.21.0, Kit/native 0.19.3, App Tools 0.12.1 and nimi-coding 0.6.5; no local Nimi archive or source-link resolution is required.

Repository checks and managed production builds, package provenance and immutable Release checks passed for both declared targets. Actual Catalog download, installation and AI acceptance ran on macOS arm64 through source Nimi Home and its matching protected Runtime (Nimi main 35498102b). Runtime identity and App Access checks remain enforced.

Real AI coauthoring produced a complete wind-chime island proposal. Title, summary, setting, rule, place and character were adopted through the UI; the saved draft and proposal survived a full Home stop/launch. The installed App read 50 Realm worlds after the bounded Runtime WorldCore heroResourceRef fix.

**NOT-VERIFIED:** Windows GUI installation and AI use. Realm world creation is NOT-VERIFIED: the current account lacks the administrator-managed creator grant, and the actual Create in Realm control stayed disabled. No new grant or world publication was fabricated. The Runtime fix is on Nimi main (35498102b), exercised in the source Runtime; a formal Nimi product release containing it was not performed.

创作者的 Realm 世界工作台

Realm World Studio is the creator-facing desktop workspace for creator-owned
Realm worlds and the world-owned characters under those worlds.

## Product Boundary

RWS is a thin product composition layer over Nimi platform substrate:

- Desktop owns local-app admission, authorization, protected session binding, and account custody.
- UI primitives and shared visual contracts come from `@nimiplatform/kit`.
- Admitted Realm reads/writes flow through the bounded local-app SDK surface.
- AI model configuration and AI execution must use kit/sdk Runtime surfaces when admitted.

## Current Creator Surfaces

- `/worlds` lists creator-accessible `WorldCore` records through
  `localApp.realm.worldCore.list`.
- `/worlds/new` submits a typed `CreateWorldCoreDto` through
  `localApp.realm.worldCore.create`; save success exists only after Realm
  returns the canonical `WorldCoreDto`.
- World detail reads the exact `WorldCoreDto` through `worldCore.get`; the library
  separately shows up to 50 accessible worlds. Reviewed maintenance uses
  `worldCore.replace` with a source content hash and preserves unedited source fields.
- `/drafts/:draftId` provides ordinary-language world, rule, place and character
  concept authoring. Drafts and AI proposals persist through protected
  `localApp.storage`; they never become an app-owned canonical world database.
- AI coauthoring uses `localApp.ai.text.generateCandidate` with declared
  `runtime.consume` / `text.generate`, separate proposal review, individual
  adoption and undo. Model selection uses the kit model-config surface and the
  SDK `localApp.aiConfig` client.
- World characters have canonical list/detail and create/edit routes. A concept
  stays a draft until its profile and explicit role declaration are reviewed and
  saved. Entity creation precedes character creation, and retries reuse the
  same entity. World and character conflicts preserve the draft and require a
  new review of the current Realm source before another write.
- World creation eligibility comes from Realm. It is independent of existing
  world maintenance, subscription, and role; App Access alone does not grant it.
- World characters are Realm-owned setting templates. Their save/readback and maintenance complete in Studio; LocalAgent materialization and conversation are outside this app’s workflows and acceptance.

This app is not World Atlas, an owner RealmPersona portfolio, Forge curation,
or LocalAgent private runtime tooling.

## Development

This closure iteration uses the user-authorized local SDK/Kit/native build from
`D:\nimi-realm\nimi`. The new world/character methods are not yet available in
published SDK 0.11.0 / Kit 0.7.0. Local dependency links/staging live under
`.nimi/local/`; they do not establish public release or installation readiness.
Ordinary public dependencies do not provide these new operations; use the matching local build when
continuing this development session. Keep Desktop's source native carrier and
source Runtime in sync as well; missing native exports fail closed at startup.

Start the local development stack in order:

1. In Nimi, run `pnpm dev:runtime` and wait for the **runtime ready** log.
2. Run `pnpm dev:desktop` and wait for Desktop to open.
3. In Studio, list registrations and resume the existing one as shown below.

Reuse an existing Realm API development process. A compiling `dev:api` may not
yet listen on port 3002; starting another copy can clear the first one's emitted
files. Do not run the API inside root `pnpm dev` and a second `dev:api` together.

```bash
pnpm install
pnpm typecheck
pnpm test
pnpm lint
pnpm dev                              # Desktop-supervised Electron
pnpm dev:shell -- --shell electron    # explicit active shell
```

To reopen an existing development App with its protected draft storage, use
App Tools' explicit registration selection:

```bash
pnpm dev -- --list-registrations
pnpm dev -- --resume <selector>
```

The selector comes from the current Desktop session; do not save it in the
repository. Plain `pnpm dev` creates a new registration when no matching run is
active. A new registration has a different protected storage owner, so it does
not reopen an earlier registration's drafts. This differs from restarting the
same registered App.

Development drafts and pending review activity now share one protected JSON
document, so a completed or deleted review can be recovered after a restart.
The previous array format fails closed and is never overwritten automatically.
For existing local development data, resume its exact registration and use
`scripts/convert-development-world-drafts.ts` once from that supervised
renderer while the old-format storage error has the notebook locked:

```js
const { convertDevelopmentWorldDrafts } = await import('/@fs/<absolute-app-root>/scripts/convert-development-world-drafts.ts');
await convertDevelopmentWorldDrafts(); // Preview counts; no writes.
await convertDevelopmentWorldDrafts({ apply: true }); // Validate, back up, convert.
location.reload();
```

Use the real checkout path in the import, with forward slashes. This explicit
development utility uses the same protected SDK storage, preserves the old
outbox and a backup, and stops on session invalidation or malformed data.
It is not an App startup migration or part of the production bundle.

## Windows package and release

The production target is Windows x86_64 using Desktop-supervised Electron.
Build and inspect the package from this repository:

```bash
pnpm run sync
pnpm exec nimi-app check --production
pnpm exec nimi-app test
pnpm exec nimi-app build --target windows-x86_64 --production
pnpm exec nimi-app pack --target windows-x86_64 --production
```

Before tagging, follow the [GitHub release setup guide](https://github.com/nimiplatform/nimi/blob/main/app-tools/README.md#publishing-on-github), including the `NIMI_REPOSITORY_ADMIN_TOKEN` Actions secret.
A protected annotated version tag on the repository default branch runs the managed build, provenance and immutable Release workflow.
The publisher then submits the immutable Release to [Nimi App Registry](https://github.com/nimiplatform/nimi-app-registry). Registry admission is a separate human review; local builds and GitHub Releases do not create admission or installed state.
