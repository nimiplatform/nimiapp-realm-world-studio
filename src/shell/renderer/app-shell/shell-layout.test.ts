import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const shellLayoutSource = () =>
  readFileSync(join(process.cwd(), 'src/shell/renderer/app-shell/shell-layout.tsx'), 'utf8');

const languageSwitcherSource = () =>
  readFileSync(join(process.cwd(), 'src/shell/renderer/app-shell/language-switcher.tsx'), 'utf8');

const rendererStylesSource = () =>
  readFileSync(join(process.cwd(), 'src/shell/renderer/styles.css'), 'utf8');

const rendererEntrySource = () =>
  readFileSync(join(process.cwd(), 'src/shell/renderer/main.tsx'), 'utf8');

describe('Studio shell kit boundary', () => {
  it('uses governed kit primitives for shell background and account menu behavior', () => {
    const source = shellLayoutSource();

    expect(source).toContain('AmbientBackground');
    expect(source).toContain('variant="mesh"');
    expect(source).toContain('Popover');
    expect(source).toContain('PopoverTrigger');
    expect(source).toContain('PopoverContent');
    expect(source).toContain('Button');
    expect(source).toContain('LanguageSwitcher');
  });

  it('uses kit SegmentedControl for the bilingual language switcher', () => {
    const source = languageSwitcherSource();

    expect(source).toContain('SegmentedControl');
    expect(source).toContain("value: 'en'");
    expect(source).toContain("value: 'zh-CN'");
  });

  it('does not keep an app-local account menu state machine', () => {
    const source = shellLayoutSource();

    expect(source).not.toContain('document.addEventListener');
    expect(source).not.toContain('requestAnimationFrame');
    expect(source).not.toContain('ras-avatar-menu--closed');
    expect(source).not.toContain('onTransitionEnd');
  });

  it('exposes creator-world navigation without public showcase tooling', () => {
    const source = shellLayoutSource();

    expect(source).toContain("to: '/worlds'");
    expect(source).toContain("to: '/worlds/new'");
    expect(source).not.toContain("to: '/settings'");
    expect(source).not.toContain("to: '/discover'");
    expect(source).not.toContain("to: '/favorites'");
    expect(source).not.toContain("to: '/messages'");
    expect(source).not.toContain("to: '/friends'");
    expect(source).not.toContain("to: '/ai-config'");
    expect(source).not.toContain("to: '/curation/forge-" + "imported-system'");
    expect(source).not.toContain("to: '/portfolio'");
  });

  it('keeps app CSS scoped to shell/product layout rather than kit primitive forks', () => {
    const styles = rendererStylesSource();

    expect(styles).not.toContain('Kit Button tone polyfill');
    expect(styles).not.toContain('Tailwind arbitrary-value polyfills');
    expect(styles).not.toContain('.nimi-action--primary');
    expect(styles).toContain('.rws-page');
  });

  it('does not use a blank renderer-entry lazy fallback', () => {
    const source = rendererEntrySource();

    expect(source).toContain('function EntryFallback');
    expect(source).toContain('AmbientBackground');
    expect(source).toContain('LoadingSkeleton');
    expect(source).toContain('fallback={<EntryFallback />}');
    expect(source).not.toContain('fallback={null}');
  });
});
