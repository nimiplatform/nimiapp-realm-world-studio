import { describe, expect, it } from 'vitest';
import { classifyStudioProtectedSessionFailure } from './protected-session-state.js';

describe('Realm World Studio protected-session failure classifier', () => {
  it.each([
    ['account-authentication-required', 'login-required'],
    ['runtime-service-unavailable', 'runtime-unavailable'],
    ['installed-artifact-forbidden', 'permission-denied'],
    ['protected-carrier-required', 'repair-required'],
    ['world-studio-protected-operation-set-not-admitted', 'capability-unavailable'],
  ] as const)('maps %s to %s', (reasonCode, state) => {
    expect(classifyStudioProtectedSessionFailure(Object.assign(new Error(reasonCode), {
      reasonCode,
      actionHint: `act-${reasonCode}`,
    }))).toEqual({
      state,
      reasonCode,
      actionHint: `act-${reasonCode}`,
      message: reasonCode,
    });
  });

  it('extracts structured native failures without interpreting text as success', () => {
    expect(classifyStudioProtectedSessionFailure(new Error(JSON.stringify({
      code: 'runtime-service-untrusted',
      reasonCode: 'runtime-service-untrusted',
      actionHint: 'repair_verified_runtime_service',
    })))).toMatchObject({
      state: 'repair-required',
      reasonCode: 'runtime-service-untrusted',
      actionHint: 'repair_verified_runtime_service',
    });
  });
});
