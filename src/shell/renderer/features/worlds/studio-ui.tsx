import { useEffect, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircle, Check, Cloud, Loader2, RefreshCw } from 'lucide-react';
import { Button, InlineAlert } from '@nimiplatform/kit/ui';
import { loadWorldDrafts, persistWorldDrafts, useWorldDrafts } from './world-draft-store.js';

export function useDraftLibrary() {
  const state = useWorldDrafts();
  useEffect(() => { void loadWorldDrafts(); }, []);
  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (useWorldDrafts.getState().saving || useWorldDrafts.getState().error) event.preventDefault();
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, []);
  return state;
}

export function DraftStorageNotice() {
  const { t } = useTranslation();
  const { loaded, error } = useWorldDrafts();
  if (!error) return null;
  return <FailureNotice message={t(loaded ? 'studio.storageError' : 'studio.storageLoadError')} error={error} retry={() => { void (loaded ? persistWorldDrafts() : loadWorldDrafts()).catch(() => {}); }} />;
}

export function SaveStatus() {
  const { t } = useTranslation();
  const { saving, error } = useWorldDrafts();
  return <span role="status" className={`studio-save-status${error ? ' studio-save-status--error' : ''}`}>
    {error ? <AlertCircle size={14} />
      : saving ? <Loader2 size={14} className="studio-spin" />
        : <Check size={14} />}
    {t(error ? 'studio.unsaved' : saving ? 'studio.saving' : 'studio.savedDraft')}
  </span>;
}

export function FailureNotice({ message, error, retry }: { message: string; error?: unknown; retry?: () => void }) {
  const { t } = useTranslation();
  const detail = error instanceof Error ? [error.message, typeof error.cause === 'string' ? error.cause : ''].filter(Boolean).join('\n\n') : typeof error === 'string' ? error : '';
  return <InlineAlert tone="warning" role="alert" icon={<AlertCircle size={17} />} action={retry ? <Button size="sm" tone="secondary" onClick={retry} leadingIcon={<RefreshCw size={14} />}>{t('studio.retry')}</Button> : undefined}>
    <div>{message}{detail && <details className="studio-error-detail"><summary>{t('studio.details')}</summary><code>{detail}</code></details>}</div>
  </InlineAlert>;
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return <label className="studio-field"><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>;
}

export function WorldMark({ name, small = false }: { name: string; small?: boolean }) {
  const tone = Array.from(name).reduce((sum, char) => sum + char.codePointAt(0)!, 0) % 5;
  return <span aria-hidden="true" className={`studio-world-mark studio-world-mark--${tone}${small ? ' studio-world-mark--small' : ''}`}>{name.trim().slice(0, 1).toUpperCase() || <Cloud size={24} />}</span>;
}

export function dateLabel(date: string, language: string): string {
  const value = new Date(date);
  return Number.isNaN(value.getTime()) ? date : new Intl.DateTimeFormat(language, { month: 'short', day: 'numeric' }).format(value);
}
