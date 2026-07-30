export type StudioProtectedSessionState =
  | 'action-required'
  | 'runtime-unavailable'
  | 'permission-denied'
  | 'revoked'
  | 'repair-required'
  | 'capability-unavailable';

export type StudioProtectedSessionFailure = {
  readonly state: StudioProtectedSessionState;
  readonly reasonCode?: string;
  readonly actionHint?: string;
  readonly message: string;
};

const ACTION_REQUIRED_REASONS = new Set([
  'account-authentication-required',
  'runtime-account-authentication-required',
  'runtime-unauthenticated',
]);

const RUNTIME_UNAVAILABLE_REASONS = new Set([
  'runtime-service-unavailable',
  'runtime-service-not-running',
  'runtime-connection-unavailable',
  'runtime-restarted',
]);

const PERMISSION_DENIED_REASONS = new Set([
  'runtime-permission-denied',
  'local-app-permission-denied',
]);

const REVOKED_REASONS = new Set([
  'local-app-permission-revoked',
]);

const REPAIR_REQUIRED_REASONS = new Set([
  'protected-carrier-required',
  'runtime-service-repair-required',
  'runtime-service-untrusted',
  'protected-peer-untrusted',
  'process-replaced',
  'account-changed',
  'local-development-project-changed',
]);

export function classifyStudioProtectedSessionFailure(
  error: unknown,
): StudioProtectedSessionFailure {
  const direct = asRecord(error);
  const message = messageFrom(error);
  const embedded = parseEmbeddedError(message);
  const reasonCode = firstText(
    direct?.reasonCode,
    direct?.code,
    embedded?.reasonCode,
    embedded?.code,
  );
  const actionHint = firstText(
    direct?.actionHint,
    embedded?.actionHint,
  );

  return {
    state: stateFor(reasonCode),
    ...(reasonCode ? { reasonCode } : {}),
    ...(actionHint ? { actionHint } : {}),
    message,
  };
}

function stateFor(reasonCode: string): StudioProtectedSessionState {
  if (ACTION_REQUIRED_REASONS.has(reasonCode)) return 'action-required';
  if (RUNTIME_UNAVAILABLE_REASONS.has(reasonCode)) return 'runtime-unavailable';
  if (REVOKED_REASONS.has(reasonCode)) return 'revoked';
  if (PERMISSION_DENIED_REASONS.has(reasonCode)) return 'permission-denied';
  if (REPAIR_REQUIRED_REASONS.has(reasonCode)) return 'repair-required';
  return 'capability-unavailable';
}

function messageFrom(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message.trim();
  }
  const record = asRecord(error);
  return firstText(record?.message, record?.reasonCode, record?.code)
    || 'The protected Realm World Studio operation set is unavailable.';
}

function parseEmbeddedError(message: string): Record<string, unknown> | undefined {
  try {
    return asRecord(JSON.parse(message) as unknown);
  } catch {
    return undefined;
  }
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined;
}

function firstText(...values: readonly unknown[]): string {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}
