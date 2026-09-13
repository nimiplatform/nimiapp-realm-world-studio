# Realm World Studio

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
