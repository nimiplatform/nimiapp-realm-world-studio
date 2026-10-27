Current development dependencies are SDK 0.22.2, Kit/native 0.22.1, App Tools 0.14.0 and Nimi Coding 0.7.0. The checked-in pnpm lock resolves these packages from the public registry. Run `pnpm install --frozen-lockfile`, `pnpm exec nimi-app check`, then `pnpm dev` with a matching source-built Nimi Runtime and Home. App versions and published App releases are unchanged. Earlier versioned notes retain their original acceptance scope. Home uses the App-owned root `NIMI_APP.md`; this README remains developer documentation.

Upgrade verification: public-registry installation, frozen-lockfile installation, App Tools checks and the applicable type/Host build checks passed. Desktop-supervised macOS development opened the complete returned page of 50 Realm worlds. New model-output journeys and packaged installation were not rerun; earlier evidence below retains its stated versions and scope.

[App introduction and usage](NIMI_APP.md)

# Realm World Studio (世界工坊)

> An immersive worldbuilding and lore workbench for authors, creators, and game designers.

Realm World Studio gives creators a structured workspace to co-author fictional worlds with AI, establish consistent world laws and geography, and populate settings with living characters. Keep your setting, rules, and characters together as your world takes shape.

---

## Studio Workflow & Features

### 1. The Interactive World Manual
Structure your universe with clarity and depth:
- **Concept & Lore**: Define your setting's core premise, aesthetic tone, and historical eras.
- **Rules & Constraints**: Establish the metaphysical laws, technology limits, social taboos, or magical systems that govern everyday life.
- **Places & Geography**: Catalog regions, cities, mysterious landmarks, and environmental conditions.
- **Resident Characters**: Outline the personalities, conflicting motives, and social roles native to this setting.

### 2. AI Co-Authoring & Consistency Checking
- **Prompt to Proposal**: Start with a single evocative premise (e.g., *"an archipelago of floating islands powered by acoustic resonance"*) and let AI generate complete setting proposals.
- **Granular Control**: Every AI suggestion appears as an independent candidate. Adopt items individually (`Add to Draft`), edit the draft, and keep only the ideas you choose.
- **Contradiction Auditing**: Ask AI to verify whether proposed rules create lore paradoxes or logical holes with existing landmarks.

### 3. World Characters
- Turn outline concepts into full **World Characters** with defined speech registers, emotional boundaries, and behavioral objectives.
- Characters live within the world context as world-owned source settings. Creating a LocalAgent or starting a conversation is handled in separate downstream workflows.

### 4. Save to Realm
- Review and refine drafts in your local workspace.
- When ready, save your world definition as a `WorldCore` record and confirm Realm's response. Saving stores the record under your account without automatically creating a public catalog listing or version-history service.

---

## Technical Architecture

| Layer | Technology | Role |
| :--- | :--- | :--- |
| **Desktop Shell** | Desktop-supervised Electron | Native desktop lifecycle and host security bridge |
| **User Interface** | React 19 + Vite + Tailwind CSS | Built on `@nimiplatform/kit` design primitives |
| **Platform Client** | `@nimiplatform/sdk` | Protected Realm state reads/writes and AI inference |
| **Local Drafts** | Local App Storage | Stores drafts and proposals safely on disk |

---

## Getting Started & Development

### Prerequisites
- Node.js ≥ 24, pnpm ≥ 10
- Running Nimi Desktop with an authenticated account

### Running Locally
```bash
# Install dependencies
pnpm install

# Start development in Desktop-supervised Electron shell
pnpm dev
```

To resume an existing development workspace session:
```bash
pnpm dev -- --list-registrations
pnpm dev -- --resume <selector>
```

### Build & Verification
```bash
# Typecheck and build
pnpm build

# Run unit tests
pnpm test

# Verify specification consistency and lint
pnpm check:spec-consistency
pnpm lint
```

---

## Privacy & Storage

- **Local Private Workspace**: Drafts and AI proposals are saved in local App storage. AI generation requires a ready model capability, and choosing a Cloud route sends the relevant request input to your selected provider.
- **Realm Records**: Reading and writing Realm records requires connectivity. World and character settings are saved under your authenticated creator account; confirm the returned save result before continuing.

---

## Release & Verification Status

- **Verified Publisher Release**: [v0.1.6](https://github.com/nimiplatform/nimiapp-realm-world-studio/releases/tag/v0.1.6)
- **Registry Admission**: [#82](https://github.com/nimiplatform/nimi-app-registry/pull/82) (macOS arm64 and Windows x64)
- **Recorded Toolchain Combination**: SDK 0.21.0, Kit/native 0.19.3, App Tools 0.12.1, Nimi Coding 0.6.5
- **Previously Recorded Platform Checks**: macOS arm64 Catalog install, complete AI world proposal generation (wind-chime island), local draft saving and restart persistence, and reading 50 Realm worlds verified. (Windows GUI execution marked as `NOT-VERIFIED`).
