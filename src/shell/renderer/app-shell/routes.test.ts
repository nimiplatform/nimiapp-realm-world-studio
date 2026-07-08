import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const routesSource = () =>
  readFileSync(join(process.cwd(), 'src/shell/renderer/app-shell/routes.tsx'), 'utf8');

describe('Studio route boundaries', () => {
  it('keeps Realm World Studio on creator world core routes', () => {
    const source = routesSource();

    expect(source).toContain('path="/worlds"');
    expect(source).toContain('path="/worlds/new"');
    expect(source).toContain('path="/worlds/:worldId"');
    expect(source).toContain('path="/worlds/:worldId/characters/:characterId"');
    expect(source).toContain('CreatorWorldListPage');
    expect(source).toContain('CreatorWorldDetailPage');
    expect(source).toContain('CreatorWorldCharacterDetailPage');
    expect(source).toContain('CreatorWorldCreatePage');
    expect(source).toContain('CreatorWorldEditPage');
    expect(source).toContain('CreatorWorldCharacterEditPage');
    expect(source).not.toContain('World' + 'ShowcasePage');
    expect(source).not.toContain('CreatorCapabilityUnavailablePage');
    expect(source).not.toContain('path="/discover"');
    expect(source).not.toContain('path="/portfolio"');
    expect(source).not.toContain('path="/curation/forge-' + 'imported-system"');
  });
});
