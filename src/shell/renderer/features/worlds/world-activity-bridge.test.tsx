import { afterEach, expect, it, vi } from 'vitest';
import { act, cleanup, render } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { WorldActivityBridge } from './world-activity-bridge.js';

const { activity, toast } = vi.hoisted(() => ({
  toast: { warning: vi.fn(() => 'toast-1'), dismiss: vi.fn() },
  activity: {
    beginWorldActivitySession: vi.fn(),
    endWorldActivitySession: vi.fn(),
    reconcileWorldActivity: vi.fn(async () => undefined),
    retryWorldActivity: vi.fn(async () => 0),
    subscribeWorldActivitySync: vi.fn((listener: (count: number | null) => void) => {
      activity.reportSync = listener;
      return () => { activity.reportSync = undefined; };
    }),
    reportSync: undefined as ((count: number | null) => void) | undefined,
    registerWorldActivityOpenHandler: vi.fn((input: { navigate: (path: string) => void }) => {
      activity.openNavigate = input.navigate;
      return { stop: vi.fn(async () => undefined) };
    }),
    openNavigate: undefined as ((path: string) => void) | undefined,
  },
}));

vi.mock('./world-activity.js', () => activity);
vi.mock('@nimiplatform/kit/ui', () => ({ nimiToast: toast }));
vi.mock('./world-draft-store.js', () => ({
  loadWorldDrafts: vi.fn(async () => undefined),
  useWorldDrafts: { getState: () => ({ loaded: true, drafts: [] }), subscribe: vi.fn() },
}));
vi.mock('../../bridge/index.js', () => ({ focusMainWindow: vi.fn(async () => undefined) }));

afterEach(cleanup);

let navigateTo: ((path: string) => void) | undefined;
function Navigator() {
  navigateTo = useNavigate();
  return null;
}

it('keeps one activity session across route changes and ends it only on unmount', async () => {
  const view = render(
    <MemoryRouter initialEntries={['/worlds']}>
      <WorldActivityBridge />
      <Navigator />
    </MemoryRouter>,
  );
  await act(async () => { navigateTo!('/drafts/01M36AGR7QHA14Z7WMT9F2KQA6'); });
  await act(async () => { navigateTo!('/worlds?tab=drafts'); });
  expect(activity.beginWorldActivitySession).toHaveBeenCalledTimes(1);
  expect(activity.endWorldActivitySession).not.toHaveBeenCalled();
  expect(activity.registerWorldActivityOpenHandler).toHaveBeenCalledTimes(1);
  // An open request still navigates with the router's current navigate.
  await act(async () => { activity.openNavigate!('/drafts/01M36AGR7QHA14Z7WMT9F2KQA6'); });
  view.unmount();
  expect(activity.endWorldActivitySession).toHaveBeenCalledTimes(1);
});

it('keeps a retryable warning visible while publications have not synced', async () => {
  const view = render(
    <MemoryRouter initialEntries={['/worlds']}>
      <WorldActivityBridge />
    </MemoryRouter>,
  );
  await act(async () => { activity.reportSync!(2); });
  expect(toast.warning).toHaveBeenCalledTimes(1);
  const [message, options] = toast.warning.mock.calls[0] as unknown as [string, { sticky: boolean; action: { onClick: () => void } }];
  expect(message).toContain('2');
  expect(options.sticky).toBe(true);
  // Automatic attempts that leave the same state do not raise it again.
  await act(async () => { activity.reportSync!(2); });
  expect(toast.warning).toHaveBeenCalledTimes(1);
  await act(async () => { options.action.onClick(); });
  expect(activity.retryWorldActivity).toHaveBeenCalledTimes(1);
  await act(async () => { activity.reportSync!(0); });
  expect(toast.dismiss).toHaveBeenCalledWith('toast-1');
  view.unmount();
});

it('shows storage failures without inventing an unsynced count', async () => {
  const view = render(<MemoryRouter><WorldActivityBridge /></MemoryRouter>);
  await act(async () => { activity.reportSync!(null); });
  expect(toast.warning).toHaveBeenCalledWith(
    expect.stringContaining('could not be read or saved'),
    expect.objectContaining({ sticky: true, action: expect.any(Object) }),
  );
  view.unmount();
});
