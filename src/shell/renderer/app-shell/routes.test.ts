import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const routesSource = () =>
  readFileSync(join(process.cwd(), 'src/shell/renderer/app-shell/routes.tsx'), 'utf8');

describe('Studio route boundaries', () => {
  it('keeps Realm World Studio on creator-world routes only', () => {
    const source = routesSource();

    expect(source).toContain('path="/worlds"');
    expect(source).toContain('path="/worlds/:worldId"');
    expect(source).toContain('path="/worlds/:worldId/agents/:agentId"');
    expect(source).not.toContain('path="/creator-agents/:agentId"');
    expect(source).not.toContain('path="/curation/forge-imported-system"');
    expect(source).not.toContain('path="/portfolio"');
  });
});
