import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useTranslation } from 'react-i18next';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { setStudioLocale } from '../i18n/index.js';
import { LanguageSwitcher } from './language-switcher.js';

function LocalizedProbe() {
  const { t } = useTranslation();
  return (
    <div>
      <LanguageSwitcher />
      <span>{t('shell.nav.worldAtlas')}</span>
    </div>
  );
}

describe('LanguageSwitcher', () => {
  beforeEach(async () => {
    window.localStorage.clear();
    await setStudioLocale('en');
  });

  afterEach(async () => {
    await setStudioLocale('en');
    window.localStorage.clear();
  });

  it('switches visible React copy through the kit segmented control', async () => {
    render(<LocalizedProbe />);

    expect(screen.getByText('World atlas')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('radio', { name: '中' }));

    await waitFor(() => expect(screen.getByText('世界图谱')).toBeInTheDocument());
    expect(document.documentElement.lang).toBe('zh-CN');
    expect(window.localStorage.getItem('nimi.realm-world-studio.locale')).toBe('zh-CN');
  });
});
