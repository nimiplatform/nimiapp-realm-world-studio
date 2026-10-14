# Realm World Studio Nimi Listing Request

This document is a developer-submitted listing request. It is not an approval, release descriptor, operational access grant, or install truth. Release and signing governance are documented in `README.md` and `RELEASE_NOTES.md`.

## Developer Runbook

Realm World Studio targets the Desktop-supervised Electron host with `@nimiplatform/sdk` (`^0.21.0`), `@nimiplatform/kit` (`^0.19.0`), `@nimiplatform/app-tools` (`^0.12.1`), and `@nimiplatform/nimi-coding` (`0.6.5`).

Install dependencies and launch protected local development through the Desktop-supervised Electron host (`pnpm dev` runs `nimi-app dev --shell electron`; `pnpm dev:shell` runs `nimi-app dev`):

```bash
pnpm install --frozen-lockfile
pnpm dev
```

`pnpm dev:renderer` starts only the unprivileged renderer and cannot perform protected operations.

Because `pnpm dev` blocks the terminal, open a separate terminal to run checks, target builds, and packaging on the matching host OS (`windows-x86_64` on Windows; replace with `macos-aarch64` on Apple Silicon macOS):

```bash
pnpm check
pnpm exec nimi-app check
pnpm exec nimi-app build --target windows-x86_64
pnpm exec nimi-app pack --target windows-x86_64
```

Current App Tools schemas may still include `cargo_package_name` and `tauri_identifier` metadata fields; they do not select the shell or enable a Tauri runtime path.

## Submission Inputs

- `nimi.app.yaml` declares `app_id`, its `app_access` domain set (`[realm.data, runtime.consume, app.activity]`), and the local Electron renderer configuration.
- `.nimi/config/build-profile.yaml` defines target builds, payload paths, and lockfile policy.
- `.nimi/admission/submission.yaml` references `.nimi/config/build-profile.yaml` and records publish-readiness commands and review inputs.
- `.nimi/spec/**` is the product and app specification authority surface for this repository.
- The scaffold boundary declaration is a review input only and does not constitute platform admission evidence.
- `nimi-app pack --target <target>` produces `dist/nimi-app/*.nimiapp`, `dist/nimi-app/*.target.json`, and `dist/nimi-app/*.app-info.json` after a successful target build (`nimi-app pack --aggregate` produces `dist/nimi-app/*.candidate.json`).

## Governance and Reviewer Boundary

- **Runtime** owns app registration, active session admission, operation access enforcement, and Nimi credential custody.
- **Desktop** provides exact Host supervision, process lifecycle management, and user management entrypoints.
- **Registry / Platform review** governs catalog review, ordinary-user listing visibility, and approved release descriptors (while any separate Integration standing resource permissions remain governed by their own resource model).

Declaring `app_access` domains in `nimi.app.yaml` or generating archives in `dist/nimi-app/` does not grant operational access, session admission, or release approval. See `README.md` and `RELEASE_NOTES.md` for release and signing governance.

## Pre-submission Self-Check

Local checks are pre-submission self-checks only; passing them does not establish admission truth. Run them in a separate terminal from `pnpm dev` (replace `windows-x86_64` with `macos-aarch64` on macOS):

```bash
pnpm check
pnpm exec nimi-app check --production
pnpm exec nimi-app build --target windows-x86_64 --production
pnpm exec nimi-app pack --target windows-x86_64 --production
```
