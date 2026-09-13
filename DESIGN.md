---
name: Realm World Studio
description: A calm world reference notebook for creator-owned Realm worlds.
colors:
  primary: "#4058ba"
  primary-hover: "#3146a0"
  primary-soft: "#eaf0fd"
  ink: "#263247"
  muted: "#64718a"
  paper: "#fff"
  ground: "#f6f8fc"
  line: "#e0e6f0"
  sidebar: "#f2f5fb"
  chrome: "#f7f9fc"
  coauthor: "#f7f9fd"
  nav-text: "#53617a"
  nav-hover: "#e8edf6"
  nav-selected: "#e1e9fa"
  nav-selected-text: "#304d9e"
  idea: "#eef3ff"
  idea-border: "#dce5f7"
  field-border: "#d9e0ec"
  field-focus: "#718acb"
  field-focus-ring: "#dbe5ff"
  field-label: "#43516a"
  field-disabled: "#f8f9fc"
  selection: "#d9e4ff"
  selection-text: "#24345d"
  badge-text: "#5d6c84"
  badge-border: "#e0e5ee"
  success-soft: "#edf7f0"
  success-border: "#d9ecdf"
  success-text: "#34644a"
  warning-soft: "#faf6e9"
  warning-text: "#685b38"
  warning-border: "#e2d7b6"
  review-notes: "#edf2fa"
  kit-secondary-border: "rgba(226,232,240,0.9)"
  kit-secondary-text: "#111827"
  kit-ghost-text: "#4b5563"
typography:
  headline:
    fontFamily: '"Inter", "Noto Sans SC", "Source Han Sans SC", "PingFang SC", "Microsoft YaHei UI", "Segoe UI", system-ui, sans-serif'
    fontSize: "26px"
    fontWeight: 650
    lineHeight: 1.4
    letterSpacing: "-0.025em"
  title:
    fontSize: "20px"
    fontWeight: 650
    lineHeight: 1.5
    letterSpacing: "-0.015em"
  section:
    fontSize: "16px"
    fontWeight: 600
    lineHeight: 1.5
  body:
    fontFamily: '"Inter", "Noto Sans SC", "Source Han Sans SC", "PingFang SC", "Microsoft YaHei UI", "Segoe UI", system-ui, sans-serif'
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.65
  field:
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.85
  field-label:
    fontSize: "12px"
    fontWeight: 600
  secondary:
    fontSize: "11px"
  badge:
    fontSize: "10px"
  reading-lead:
    fontSize: "15px"
    lineHeight: 1.9
  reading-body:
    fontSize: "13px"
    lineHeight: 1.95
  action:
    fontSize: "0.9375rem"
    fontWeight: 600
    letterSpacing: "0"
  action-small:
    fontSize: "0.8125rem"
    fontWeight: 600
    letterSpacing: "0"
rounded:
  badge: "5px"
  chapter: "6px"
  field: "7px"
  action: "8px"
  composer-field: "10px"
  composer: "14px"
  book-mark: "6px 12px 12px 6px"
  account: "999px"
spacing:
  icon-gap: "7px"
  control-gap: "8px"
  compact: "12px"
  standard: "16px"
  paired-fields: "18px"
  panel: "20px"
  field-stack: "22px"
  section: "24px"
  manuscript: "30px 38px 24px"
  page: "38px 48px 48px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.paper}"
    typography: "{typography.action}"
    rounded: "{rounded.action}"
    padding: "0 16px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-secondary:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.kit-secondary-text}"
    typography: "{typography.action-small}"
    rounded: "{rounded.action}"
    padding: "0 12px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.kit-ghost-text}"
    typography: "{typography.action-small}"
    rounded: "{rounded.action}"
    padding: "0 12px"
  creation-link:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.paper}"
    rounded: "{rounded.action}"
    padding: "9px 14px"
  field:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.field}"
    rounded: "{rounded.field}"
    padding: "11px 12px"
  field-disabled:
    backgroundColor: "{colors.field-disabled}"
    textColor: "{colors.muted}"
  navigation:
    textColor: "{colors.nav-text}"
    rounded: "{rounded.field}"
    padding: "8px 12px"
  navigation-selected:
    backgroundColor: "{colors.nav-selected}"
    textColor: "{colors.nav-selected-text}"
  badge:
    backgroundColor: "{colors.chrome}"
    textColor: "{colors.badge-text}"
    typography: "{typography.badge}"
    rounded: "{rounded.badge}"
    padding: "2px 7px"
  badge-success:
    backgroundColor: "{colors.success-soft}"
    textColor: "{colors.success-text}"
  idea-composer:
    backgroundColor: "{colors.idea}"
    rounded: "{rounded.composer}"
    padding: "26px 28px 18px"
  world-row:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    padding: "22px 8px"
  suggestion:
    textColor: "{colors.nav-text}"
    padding: "20px 0"
  review-notes:
    backgroundColor: "{colors.review-notes}"
    rounded: "{rounded.action}"
    padding: "15px"
  capability-note:
    backgroundColor: "{colors.warning-soft}"
    textColor: "{colors.warning-text}"
    rounded: "{rounded.chapter}"
    padding: "12px 14px"
---

# Design System: Realm World Studio

## Overview

**Creative North Star: "The World Reference Notebook"**

Cool white writing pages sit beside slate-blue navigation and a quiet AI review rail. Graphite text, cornflower selection and fine dividers make the creator's words the visual center. Controls are compact; editable and readable content gets the space.

The world-character notebook follows the same composition with three chapters:
profile, behavior/boundaries, and review/save. Canonical characters appear as
readable rows under their parent world, with unfinished character drafts nearby.
Version conflicts show the latest Realm content in a bounded comparison panel;
the creator retains the draft and confirms it again. The detail page confirms the
Realm save and its canonical version, then presents the character settings and an
edit action. Downstream materialization readiness creates no warning or next step
in this authoring flow; actual field and save failures retain the existing alert style.

The system uses the existing Nimi Kit font stack, controls and platform surfaces. Its notebook character comes from page structure, book-shaped world marks and chapter navigation. It adds no shipping raster illustrations, textures or image-generated composition.

**Key Characteristics:**

- Cool paper, graphite text and a single cornflower action accent.
- Flat writing surfaces separated by tone, whitespace and fine rules.
- Compact controls around generous, resizable writing fields.
- Headings precede chapter progress and suggestion categories.
- Local drafts, AI candidates and Realm records have distinct visible labels.

This file and `.impeccable/design.json` are derived implementation references, not product authority. The frontmatter records the current reusable visual values; the CSS and published Kit exports implement them. Product authority remains `.nimi/spec/realm-world-studio/canonical/**`. Neither design artifact establishes endpoint availability, ownership, admission or completion of a product path.

The extraction inspected `src/shell/renderer/world-studio.css`, `styles.css`, `app-shell/shell-layout.tsx`, `app-shell/language-switcher.tsx`, and the library, notebook, coauthor, model settings and shared UI under `features/worlds/`. Font and control details were checked against the installed public Kit exports. The five actual Electron captures in `.nimi/local/review/` establish the library, notebook and Realm reading composition. Final source takes precedence over those captures for the corrected placeholder color, review-result copy and placement of suggestion categories. This pass documents the direct implementation; there was no approved image comp.

## Colors

The palette is a cool reading environment with deliberate cornflower action and selection states. Frontmatter names refer to the exact recorded values; CSS variables retain their existing names in implementation.

### Primary

- **Cornflower** (`primary`, implemented by `--studio-accent` and the shell's Kit primary-action override) identifies the main action, links, focus and text carets.
- **Deep cornflower** (`primary-hover`) gives the main action hover feedback.
- **Pale cornflower** (`primary-soft`) identifies the current chapter. The navigation selection uses its own slightly stronger `nav-selected` surface and `nav-selected-text`.

### Neutral

- **Graphite** (`ink`) carries page headings and authored content.
- **Slate** (`muted`) carries hints, secondary labels and placeholders. Placeholder content uses the same legible slate value as other secondary text.
- **Cool paper** (`paper`) is the writing surface. `sidebar`, `chrome`, `ground` and `coauthor` separate app navigation, platform chrome, supporting panels and AI work without decorative effects.
- **Fine rule** (`line`) separates sections. `field-border` establishes the editable boundary; `field-focus` and `field-focus-ring` reinforce focus.
- **Idea wash** (`idea`) distinguishes the starting composer. `review-notes` gives consistency feedback a bounded reading region.

### Status accents

Soft green badges indicate the specific Realm or saved state named by the accompanying text. Warm pale notes explain missing prerequisites or unavailable capabilities. These accents support a status label; they are not additional brand colors. The retained language control uses the Kit accent treatment.

**The Readable Slate Rule.** Keep placeholders and secondary guidance on the recorded muted token; do not lighten them to create hierarchy.

## Typography

The renderer inherits `--nimi-font-sans` from the published Kit stylesheet. The stack begins with Inter and supplies Chinese fallbacks through Noto Sans SC, Source Han Sans SC, PingFang SC and Microsoft YaHei UI. It ends with Segoe UI and the platform sans-serif fallback. No new font files or separate display face were added. This is the declared stack, not a claim that a particular font was installed or rendered in every environment.

The page headline, section title and body roles use one family. The hierarchy changes size, weight and spacing rather than introducing a second visual voice. Body copy is left aligned, authored line breaks are preserved in reading views, and long content wraps within the available column.

- **Headline** is the library and detail page heading. Narrow library headings step down through (24px) and (22px); the notebook identity is deliberately compact (16px).
- **Title** heads a notebook chapter or the idea composer; section headings use the smaller section role. The world-row title is (15px).
- **Body** is the shell's reading baseline. Form values use the field role; the AI rail uses smaller body text (12px) with a generous line height (1.9).
- **Reading** uses a larger lead and a slower body rhythm. The dedicated reading block is bounded at (74ch), while chapter introductions are bounded at (68ch).
- **Labels** remain compact. The smallest badge and progress text supports the main heading; it does not replace it. Counts and dates use tabular numerals.

**The Heading First Rule.** Put the readable subject before chapter progress or suggestion category. Metadata sits below the heading rather than forming a decorative kicker.

## Layout

This is a desktop creation workspace rendered by Electron. The app fills (100dvh) with a persistent top bar (48px). Its left navigation and primary content occupy the remaining height. Library and Realm reading pages scroll in the main region; the desktop notebook keeps chapter navigation visible while its manuscript and AI rail scroll independently.

At the observed desktop viewport (1346 CSS px), the labelled sidebar is (216px). Library pages use a centered container with a maximum width of (1260px). The notebook uses a flexible writing column and an AI rail (330px). The writing column is not fixed at the direction brief's provisional 650px; it takes the remaining space and has the recorded manuscript padding. The document view is bounded at (1120px), the new-world view at (1040px), and AI settings at (1080px).

At the observed narrow viewport (1024 CSS px), the sidebar is still labelled and becomes (180px). Page padding becomes (30px), manuscript padding (26px), and the AI rail (295px). Chapters wrap onto additional lines, preserving their labels. The notebook identity and save controls may wrap within their header. The two-column writing and AI structure remains intact.

At the observed compact library viewport (560 CSS px), the sidebar becomes an icon rail (52px), retaining accessible link names. The secondary top-bar label is hidden. The library uses padding of (22px 20px); the composer and toolbar wrap, and a world's status and date move beneath its copy. The row chevron is hidden. At this same breakpoint, notebook CSS stacks the AI rail below the manuscript, changes to normal page scrolling, and places paired fields in a single column. The supplied compact capture verifies the library; the stacked notebook behavior is source-inspected, not screenshot-verified by this documentation pass.

The implemented breakpoints are: large at a minimum of (1500px), narrow at a maximum of (1180px), icon navigation at a maximum of (940px), and stacked content at a maximum of (700px). Large notebooks use a rail (370px), manuscript padding of (36px 56px), and editor content bounded at (740px). Between 701px and 940px, the icon rail is (64px) and the AI rail is (290px). The protected-session entry has an independent compact action rule at (520px).

Spacing follows the task's density: small icon and control gaps; about one field line between related controls; more space and a rule between authored entries. Flex and grid children use zero minimum widths so long names and translated copy can wrap or truncate deliberately.

## Elevation & Depth

Custom notebook surfaces have no box shadows. Their structure comes from cool tonal layers, one-pixel dividers and clear padding. `AmbientBackground` remains the existing Kit component with its `minimal` variant. Opaque paper and chrome provide the visible notebook surface.

Existing Kit controls retain their own depth: secondary buttons can use the Kit base shadow on hover, and the language control and account popover keep Kit elevation. The sidecar records the inspected base and floating shadows as Kit-owned values. This does not introduce those shadows to world rows, writing pages or the AI rail.

**The Quiet Surface Rule.** Use tone and dividers for notebook structure; reserve the existing Kit elevation for the controls and overlays that already own it.

Custom hover transitions are short (150ms), limited to background, text or border color. Kit actions retain their fast transition (120ms), standard easing and pressed scale (0.97). The local saving spinner rotates over (1.2s). Reduced-motion preference disables animation and transitions throughout the shell.

## Shapes

Small, gently rounded controls sit within largely rectangular pages. Actions and supporting notes share the action radius; fields and navigation use the field radius. Chapters are slightly tighter, and status badges tighter again. The idea composer is the broadest rounded surface, with an inset white input area.

World marks have the asymmetric book silhouette recorded in `rounded.book-mark`, at (54px × 64px), with a small variant (32px × 38px). A name-derived initial and one of five existing subdued CSS tones identify the world. These are identifiers, not substitute illustrations or activity data. Draft marks use a dashed outline and a Lucide document icon. The account trigger retains its capsule shape.

## Components

### Buttons and links

Actions use published Kit `Button` with `primary`, `secondary` or `ghost` tone. The shell overrides the primary accent and action radius. Medium Kit buttons have a minimum height (40px); small buttons have a minimum height (32px). Disabled and loading controls retain the Kit disabled treatment, and loading exposes `aria-busy`.

The library creation link is a compact filled link with a minimum height (38px). Secondary navigation and model-settings links use underlining where appropriate. Icon-only controls have accessible labels. The shell excludes buttons, links and inputs from window dragging.

### Fields and the idea composer

Each notebook field groups a visible label, input and optional hint. Inputs have a white background, a thin border and the field radius. Textareas resize vertically; the main setting field has a minimum height (340px). Focus changes the border and applies a visible outline (2px, offset 1px). The general shell focus outline is (2px, offset 3px).

The idea composer pairs a brief prompt with a broad inset textarea. Its starting examples are explicitly inspiration actions that fill the input. The main action is disabled until an idea exists; starting a blank draft remains a separate action. The spacious new-world variant enlarges the writing area without inventing a different component language.

### Navigation and collection rows

The main rail combines Lucide icons with ordinary sentence-case labels. Active links have both a selected surface and `aria-current`. Library tabs use an accent underline and actual returned counts. Visibility filters use a compact selected wash. The search control stays adjacent to the collection controls and wraps as space narrows.

A whole world or draft row is one open target. Its mark, title and short description lead; visibility or draft state and date follow. Thin rules define the row list. Hover changes the row surface without lifting it. Drafts retain their own tab and visible state label.

### The notebook and AI suggestions

Six labelled chapters organize the manuscript. Chapter content stays editable in ordinary fields. The AI rail combines a short instruction field, one prominent develop action, two secondary tasks and a direct route to Kit model settings.

Generated items appear as individual suggestions, each with a heading, optional category below it, readable content and an explicit adoption action. Adopted items have a visible accepted state. The latest eligible adoption exposes undo. Consistency-review results use their own explanatory copy; an empty result displays the explicit no-findings status rather than an empty panel. The document records this rendering behavior, not the correctness of a model's conclusion.

When failed AI output includes recoverable candidate text, an explicit secondary action follows the error notice so the creator can ask AI to organize that candidate. Its pending state has separate status copy. It reuses the current rail, buttons and loading pattern; it does not add an automatic acceptance state or a new visual direction.

### Status and platform surfaces

Badges remain small text-bearing status markers. Loading skeletons, retry alerts, empty states and toasts use Kit. Save status visibly distinguishes saving, saved draft and unsaved work. Failure details live in a disclosure beneath actionable copy. Capability notes sit beside the affected task.

The protected-session entry, account popover and Kit model-configuration surface remain platform-owned components within the app layout. Their technical settings stay in those surfaces. This notebook design does not add login, session ownership or a parallel model picker.

### Assets and previews

There are no new shipping raster assets, so there is no new raster provenance set. Actual Electron screenshots remain local review evidence under `.nimi/local/review/`; they are not bundled product imagery. Lucide supplies interface icons, CSS supplies book marks, and the account avatar can display existing user media. The sidecar's isolated HTML/CSS previews are documentation samples of these patterns, not app components or product records. Its synthesized tonal ramps are preview aids, not additional implementation color tokens.

## Do's and Don'ts

### Do:

- **Do** preserve cool paper, graphite text and the cornflower action hierarchy.
- **Do** use the recorded muted color for placeholders and secondary guidance.
- **Do** keep headings above progress text and suggestion categories.
- **Do** give authored content generous line spacing and resizable writing fields.
- **Do** reuse Kit controls, icons with accessible labels and platform-owned settings surfaces.
- **Do** distinguish drafts, AI candidates and Realm records with truthful text-bearing states.
- **Do** keep responsive changes tied to the implemented layout breakpoints and preserve readable labels where they fit.

### Don't:

- **Don't** add decorative glass, dramatic shadows or raster scenery to the notebook's flat writing surfaces.
- **Don't** present invented worlds, inventory counts, activity or AI output as real data.
- **Don't** use pale placeholder text or decorative metadata above headings to create hierarchy.
- **Don't** turn book-mark tones or preview tonal ramps into extra brand accents.
- **Don't** copy platform settings or session responsibilities into a separate app-owned control system.
- **Don't** treat this derived design record or its screenshots as product authority or proof of unexecuted behavior.
