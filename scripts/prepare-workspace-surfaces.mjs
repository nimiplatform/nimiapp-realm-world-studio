// Prepares @nimiplatform/sdk and @nimiplatform/kit dist surfaces in the linked
// Nimi platform checkout (../../nimi). World Studio consumes the platform
// packages through `link:` dependencies whose package exports point at dist/,
// while Vite/Vitest alias to sources. tsc (renderer + Electron main) resolves
// through dist/*.d.ts, so dist must exist and be fresher than the sources.
//
// This mirrors the platform monorepo's scripts/with-workspace-surfaces.mjs
// for an external consumer repository. It runs the platform's own build
// scripts and never edits platform sources.

import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const nimiRepoRoot = resolve(repoRoot, '..', '..', 'nimi');

const SKIP_DIRS = new Set(['node_modules', 'dist', 'gen', 'target', '.git']);

const surfaces = [
  {
    name: '@nimiplatform/sdk',
    sourceRoot: join(nimiRepoRoot, 'sdks', 'typescript'),
    distMarker: join(nimiRepoRoot, 'sdks', 'typescript', 'dist', 'index.js'),
  },
  {
    name: '@nimiplatform/kit',
    sourceRoot: join(nimiRepoRoot, 'kit'),
    distMarker: join(nimiRepoRoot, 'kit', 'dist', 'ui', 'index.js'),
  },
];

function newestSourceMtimeMs(rootDir) {
  let newest = 0;
  const stack = [rootDir];
  while (stack.length > 0) {
    const dir = stack.pop();
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!SKIP_DIRS.has(entry.name)) stack.push(fullPath);
        continue;
      }
      if (!/\.(ts|tsx|cts|mts|css)$/.test(entry.name)) continue;
      const mtime = statSync(fullPath).mtimeMs;
      if (mtime > newest) newest = mtime;
    }
  }
  return newest;
}

if (!existsSync(nimiRepoRoot)) {
  throw new Error(
    `[realm-world-studio] linked Nimi platform checkout missing at ${nimiRepoRoot}. `
    + 'The link: dependencies in package.json require a sibling platform checkout.',
  );
}

const stale = surfaces.filter((surface) => {
  if (!existsSync(surface.distMarker)) return true;
  return newestSourceMtimeMs(surface.sourceRoot) > statSync(surface.distMarker).mtimeMs;
});

if (stale.length === 0) {
  console.log('[realm-world-studio] workspace surfaces are current (sdk/kit dist fresh)');
  process.exit(0);
}

console.log(`[realm-world-studio] preparing workspace surfaces: ${stale.map((s) => s.name).join(', ')}`);
for (const surface of stale) {
  execFileSync('pnpm', ['--filter', surface.name, 'build'], {
    cwd: nimiRepoRoot,
    stdio: 'inherit',
  });
}
console.log('[realm-world-studio] workspace surfaces prepared');
