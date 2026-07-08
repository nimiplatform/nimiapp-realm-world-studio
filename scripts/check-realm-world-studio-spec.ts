#!/usr/bin/env tsx
/**
 * Spec consistency check for Realm World Studio.
 *
 * Per `.nimi/spec/INDEX.md`, the active authority surface is the kernel doc set under
 * `.nimi/spec/project/kernel/`. This check verifies the required canonical kernel files
 * exist, the rule catalog is bidirectionally consistent with every inline
 * R-RWS-* identifier used across the kernel docs, stale adjacent-app authority
 * is absent, and public-showcase / adjacent-app anti-targets never leak into
 * implementation success paths.
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';

const REPO_ROOT = path.resolve(import.meta.dirname, '..');
const SPEC_ROOT = path.join(REPO_ROOT, '.nimi', 'spec');
const KERNEL_DIR = path.join(SPEC_ROOT, 'project', 'kernel');
const RULE_CATALOG_PATH = path.join(KERNEL_DIR, 'tables', 'rule-catalog.yaml');
const SRC_DIR = path.join(REPO_ROOT, 'src');

const REQUIRED_TOP_LEVEL_FILES = [
  '.nimi/spec/INDEX.md',
  '.nimi/spec/project/AGENTS.md',
] as const;

const REQUIRED_KERNEL_FILES = [
  'index.md',
  'core-rules.md',
  'product-scope.md',
  'world-character-object.md',
  'character-setting-field-map.md',
  'asset-and-binding.md',
  'post-publishing.md',
  'runtime-ai-consumption.md',
  'metrics-and-realm-gaps.md',
  'failure-semantics.md',
  'storybook.md',
  'product-acceptance-and-execution-plan.md',
] as const;

const REQUIRED_KERNEL_TABLES = [
  'tables/rule-catalog.yaml',
] as const;

const FORBIDDEN_PHRASES: Array<{ phrase: string; rationale: string }> = [
  {
    phrase: '/api/me/characters',
    rationale: 'Owner portfolio authority belongs to the adjacent owner-persona app, not Realm World Studio.',
  },
  {
    phrase: 'listMyRealmPersonas',
    rationale: 'Owner portfolio list authority belongs to the adjacent owner-persona app, not Realm World Studio.',
  },
  {
    phrase: 'getMyRealmPersona',
    rationale: 'Owner portfolio detail authority belongs to the adjacent owner-persona app, not Realm World Studio.',
  },
  {
    phrase: 'personaControllerCreate',
    rationale: 'Owner persona creation belongs to the adjacent Realm Persona Studio app, not Realm World Studio.',
  },
  {
    phrase: 'WorldPublicController',
    rationale: 'Public showcase reads must not be used for Realm World Studio creator success state.',
  },
  {
    phrase: 'worldPublicController',
    rationale: 'Public showcase SDK methods must not be used for Realm World Studio creator success state.',
  },
  {
    phrase: 'world-showcase',
    rationale: 'World Atlas showcase implementation must not be a Realm World Studio success path.',
  },
  {
    phrase: 'WorldShowcase',
    rationale: 'World Atlas showcase implementation must not be a Realm World Studio success path.',
  },
  {
    phrase: 'WorldController_listWorlds',
    rationale: 'Public world catalog reads must not be used for creator-world success state.',
  },
  {
    phrase: 'WorldAtlas',
    rationale: 'World Atlas implementation naming must not be a Realm World Studio success path.',
  },
  {
    phrase: 'worldAtlas',
    rationale: 'World Atlas implementation naming must not be a Realm World Studio success path.',
  },
  {
    phrase: '/api/creator/characters',
    rationale: 'Creator character portfolio APIs must not be used as world-character authority.',
  },
  {
    phrase: '/api/agent/forge-imported-system',
    rationale: 'Forge imported-system APIs are non-current anti-targets for Realm World Studio.',
  },
  {
    phrase: 'forge-imported-system',
    rationale: 'Forge imported-system implementation naming is a non-current anti-target for Realm World Studio.',
  },
  {
    phrase: 'forgeImportedSystem',
    rationale: 'Forge imported-system client bindings are non-current anti-targets for Realm World Studio.',
  },
  {
    phrase: '/api/agent/dev/my-characters',
    rationale: 'Developer evidence surface; must not be promoted into World Studio canonical surfaces.',
  },
  {
    phrase: 'personaFriendCount',
    rationale: 'Use source-backed `friendCount`; do not invent `personaFriendCount`.',
  },
];

const RULE_ID_RE = /R-RWS-[A-Z]+-\d+/g;
const ADJACENT_PERSONA_STUDIO_RULE_PREFIX = 'R-RPS-';
const ADJACENT_PERSONA_STUDIO_KERNEL_TITLE = 'Realm Persona Studio Kernel Authority';

type Finding = { file: string; line: number; column: number; message: string };

async function exists(target: string): Promise<boolean> {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}

async function checkRequiredFiles(): Promise<Finding[]> {
  const findings: Finding[] = [];
  for (const relative of REQUIRED_TOP_LEVEL_FILES) {
    const absolute = path.join(REPO_ROOT, relative);
    if (!(await exists(absolute))) {
      findings.push({
        file: relative,
        line: 0,
        column: 0,
        message: `Required spec file missing.`,
      });
    }
  }
  for (const relative of REQUIRED_KERNEL_FILES) {
    const absolute = path.join(KERNEL_DIR, relative);
    if (!(await exists(absolute))) {
      findings.push({
        file: path.relative(REPO_ROOT, absolute),
        line: 0,
        column: 0,
        message: `Required kernel doc missing.`,
      });
    }
  }
  for (const relative of REQUIRED_KERNEL_TABLES) {
    const absolute = path.join(KERNEL_DIR, relative);
    if (!(await exists(absolute))) {
      findings.push({
        file: path.relative(REPO_ROOT, absolute),
        line: 0,
        column: 0,
        message: `Required kernel table missing.`,
      });
    }
  }
  return findings;
}

async function checkRuleCatalogCoversInlineIds(): Promise<Finding[]> {
  const findings: Finding[] = [];
  if (!(await exists(RULE_CATALOG_PATH))) {
    return findings; // already reported as missing
  }
  const catalogText = await fs.readFile(RULE_CATALOG_PATH, 'utf8');
  const catalogIds = new Set<string>();
  for (const match of catalogText.matchAll(/^\s*(?:-\s*)?rule_id:\s*(R-RWS-[A-Z]+-\d+)\s*$/gm)) {
    catalogIds.add(match[1]);
  }
  if (catalogIds.size === 0) {
    findings.push({
      file: path.relative(REPO_ROOT, RULE_CATALOG_PATH),
      line: 0,
      column: 0,
      message: 'Rule catalog must enumerate at least one R-RWS-* rule_id.',
    });
  }
  const inlineIds = new Set<string>();
  for (const relative of REQUIRED_KERNEL_FILES) {
    const absolute = path.join(KERNEL_DIR, relative);
    if (!(await exists(absolute))) continue;
    const text = await fs.readFile(absolute, 'utf8');
    const inline = new Set<string>();
    for (const m of text.matchAll(RULE_ID_RE)) {
      inline.add(m[0]);
    }
    if (inline.size === 0) {
      findings.push({
        file: path.relative(REPO_ROOT, absolute),
        line: 0,
        column: 0,
        message: 'Kernel document must carry at least one inline R-RWS-* rule identifier.',
      });
    }
    for (const id of inline) {
      inlineIds.add(id);
      if (!catalogIds.has(id)) {
        findings.push({
          file: path.relative(REPO_ROOT, absolute),
          line: 0,
          column: 0,
          message: `Inline rule identifier ${id} is not enumerated in tables/rule-catalog.yaml. Either add it to the catalog or remove it from the kernel doc.`,
        });
      }
    }
  }
  for (const id of catalogIds) {
    if (!inlineIds.has(id)) {
      findings.push({
        file: path.relative(REPO_ROOT, RULE_CATALOG_PATH),
        line: 0,
        column: 0,
        message: `Catalog rule identifier ${id} is not used inline by any kernel doc.`,
      });
    }
  }
  return findings;
}

async function checkNoAdjacentPersonaStudioAuthority(): Promise<Finding[]> {
  const findings: Finding[] = [];
  const files = [
    ...REQUIRED_TOP_LEVEL_FILES.map((relative) => path.join(REPO_ROOT, relative)),
    ...REQUIRED_KERNEL_FILES.map((relative) => path.join(KERNEL_DIR, relative)),
    ...REQUIRED_KERNEL_TABLES.map((relative) => path.join(KERNEL_DIR, relative)),
  ];
  for (const absolute of files) {
    if (!(await exists(absolute))) continue;
    const text = await fs.readFile(absolute, 'utf8');
    const lines = text.split('\n');
    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index] ?? '';
      const adjacentRuleColumn = line.indexOf(ADJACENT_PERSONA_STUDIO_RULE_PREFIX);
      if (adjacentRuleColumn >= 0) {
        findings.push({
          file: path.relative(REPO_ROOT, absolute),
          line: index + 1,
          column: adjacentRuleColumn + 1,
          message: 'Adjacent Realm Persona Studio rule namespace must not appear in Realm World Studio spec authority.',
        });
      }
      const adjacentTitleColumn = line.indexOf(ADJACENT_PERSONA_STUDIO_KERNEL_TITLE);
      if (adjacentTitleColumn >= 0) {
        findings.push({
          file: path.relative(REPO_ROOT, absolute),
          line: index + 1,
          column: adjacentTitleColumn + 1,
          message: 'Adjacent Realm Persona Studio kernel title must not appear in Realm World Studio spec authority.',
        });
      }
    }
  }
  return findings;
}

async function walkImplementationFiles(): Promise<string[]> {
  const out: string[] = [];
  async function walk(dir: string): Promise<void> {
    let entries: Awaited<ReturnType<typeof fs.readdir>>;
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const absolute = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '_archive') continue;
        await walk(absolute);
      } else if (entry.isFile() && /\.(ts|tsx|js|jsx|rs|toml|json)$/.test(entry.name)) {
        out.push(absolute);
      }
    }
  }
  await walk(SRC_DIR);
  return out;
}

async function checkForbiddenPhrasesInImplementation(): Promise<Finding[]> {
  // Spec files name the forbidden phrases as evidence-only anti-targets by
  // design; we only flag if they leak into implementation/source code.
  const findings: Finding[] = [];
  const files = await walkImplementationFiles();
  for (const absolute of files) {
    const text = await fs.readFile(absolute, 'utf8');
    const lines = text.split('\n');
    for (let lineNo = 0; lineNo < lines.length; lineNo += 1) {
      const line = lines[lineNo] ?? '';
      // Skip comment lines that explicitly cite the phrase as forbidden /
      // evidence-only (e.g., a code comment naming the anti-target).
      if (/forbidden|evidence-only|do not promote|anti-target|must not|deprecated/i.test(line)) {
        continue;
      }
      for (const { phrase, rationale } of FORBIDDEN_PHRASES) {
        const column = line.indexOf(phrase);
        if (column >= 0) {
          findings.push({
            file: path.relative(REPO_ROOT, absolute),
            line: lineNo + 1,
            column: column + 1,
            message: `Forbidden phrase "${phrase}" in implementation: ${rationale}`,
          });
        }
      }
    }
  }
  return findings;
}

async function main(): Promise<void> {
  const findings = [
    ...(await checkRequiredFiles()),
    ...(await checkRuleCatalogCoversInlineIds()),
    ...(await checkNoAdjacentPersonaStudioAuthority()),
    ...(await checkForbiddenPhrasesInImplementation()),
  ];
  if (findings.length === 0) {
    console.log('Spec consistency: OK');
    return;
  }
  for (const f of findings) {
    if (f.line === 0) {
      console.error(`${f.file}: ${f.message}`);
    } else {
      console.error(`${f.file}:${f.line}:${f.column}  ${f.message}`);
    }
  }
  console.error(`\nSpec consistency: ${findings.length} finding(s)`);
  process.exit(1);
}

void main();
