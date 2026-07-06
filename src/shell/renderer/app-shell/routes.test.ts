import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const routesSource = () =>
  readFileSync(join(process.cwd(), 'src/shell/renderer/app-shell/routes.tsx'), 'utf8');

describe('Studio route boundaries', () => {
  it('keeps World Atlas on public world detail routes only', () => {
    const source = routesSource();

    expect(source).toContain('path="/worlds"');
    expect(source).toContain('path="/worlds/:worldId"');
    expect(source).toContain('WorldShowcasePage');
    expect(source).not.toContain('path="/worlds/:worldId/characters/:characterId"');
    expect(source).not.toContain('path="/ai-config"');
    expect(source).not.toContain('path="/creator-characters/:characterId"');
    expect(source).not.toContain('path="/curation/forge-imported-system"');
    expect(source).not.toContain('path="/portfolio"');
  });
});
