// @vitest-environment jsdom
import { act } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, expect, it, vi } from 'vitest';
import { setupDomTest } from '../../../test/setupDomTest';
import { EditProfileModal } from './EditProfileModal';
import { AUTH_QUERY_KEY } from '../context/auth-context-definition';
import { updateProfile } from '../api/profile.api';
import type { User } from '../types';

vi.mock('../api/profile.api', () => ({ updateProfile: vi.fn() }));
const dom = setupDomTest();
const user: User = {
  id: 'self',
  username: 'Before',
  email: 'before@example.com',
  avatarUrl: null,
  theme: 'dark',
};
const updated = { ...user, username: 'After' };
let queryClient: QueryClient;
let resolveSave: (user: User) => void;
let rejectSave: (error: Error) => void;
let onClose: ReturnType<typeof vi.fn<() => void>>;

beforeEach(() => {
  vi.clearAllMocks();
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute('open');
  };
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  queryClient.setQueryData(AUTH_QUERY_KEY, user);
  onClose = vi.fn();
  vi.mocked(updateProfile).mockImplementation(
    () =>
      new Promise((resolve, reject) => {
        resolveSave = resolve;
        rejectSave = reject;
      }),
  );
  act(() =>
    dom.root.render(
      <QueryClientProvider client={queryClient}>
        <EditProfileModal user={user} onClose={onClose} />
      </QueryClientProvider>,
    ),
  );
});

function submit() {
  act(() =>
    dom.host
      .querySelector('form')!
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })),
  );
}

it('blocks Escape, Close and another submit while saving, then closes on success', async () => {
  submit();
  const close = dom.host.querySelector<HTMLButtonElement>('button[aria-label="Close dialog"]')!;
  expect(close.disabled).toBe(true);
  act(() => {
    close.click();
    dom.host.querySelector('dialog')!.dispatchEvent(new Event('cancel', { cancelable: true }));
  });
  submit();
  expect(onClose).not.toHaveBeenCalled();
  expect(updateProfile).toHaveBeenCalledTimes(1);
  await act(async () => resolveSave(updated));
  expect(queryClient.getQueryData(AUTH_QUERY_KEY)).toEqual(updated);
  expect(onClose).toHaveBeenCalledTimes(1);
});

it.each(['logout', 'other-user', 'same-user-new-session'])(
  'ignores a late response after %s',
  async (state) => {
    submit();
    act(() => dom.root.render(<div />));
    queryClient.clear();
    const nextUser =
      state === 'logout' ? null : { ...user, id: state === 'other-user' ? 'other' : user.id };
    if (nextUser) queryClient.setQueryData(AUTH_QUERY_KEY, nextUser);
    await act(async () => resolveSave(updated));
    expect(queryClient.getQueryData(AUTH_QUERY_KEY)).toEqual(nextUser ?? undefined);
    expect(onClose).not.toHaveBeenCalled();
  },
);

it('ignores a late response when the current auth user was cleared', async () => {
  submit();
  queryClient.setQueryData(AUTH_QUERY_KEY, null);
  await act(async () => resolveSave(updated));
  expect(queryClient.getQueryData(AUTH_QUERY_KEY)).toBeNull();
});

it('does not cancel queries belonging to a new session', async () => {
  submit();
  queryClient.clear();
  queryClient.setQueryData(AUTH_QUERY_KEY, { ...user, id: 'other' });
  const cancel = vi.spyOn(queryClient, 'cancelQueries');
  await act(async () => resolveSave(updated));
  expect(cancel).not.toHaveBeenCalled();
  expect(queryClient.getQueryData<User>(AUTH_QUERY_KEY)?.id).toBe('other');
});

it('rechecks the session after awaiting cancellation', async () => {
  submit();
  vi.spyOn(queryClient, 'cancelQueries').mockImplementationOnce(async () => {
    queryClient.clear();
    queryClient.setQueryData(AUTH_QUERY_KEY, { ...user, id: 'other' });
  });
  await act(async () => resolveSave(updated));
  expect(queryClient.getQueryData<User>(AUTH_QUERY_KEY)?.id).toBe('other');
  expect(onClose).not.toHaveBeenCalled();
});

it('can finish after unmount without closing another modal in the same session', async () => {
  submit();
  act(() => dom.root.render(<div />));
  await act(async () => resolveSave(updated));
  expect(queryClient.getQueryData(AUTH_QUERY_KEY)).toEqual(updated);
  expect(onClose).not.toHaveBeenCalled();
});

it('shows an error and allows closing and retrying after a failed save', async () => {
  submit();
  await act(async () => rejectSave(new Error('Network failed')));
  expect(dom.host.querySelector('[role="alert"]')?.textContent).toContain('Could not save');
  expect(
    dom.host.querySelector<HTMLButtonElement>('button[aria-label="Close dialog"]')!.disabled,
  ).toBe(false);
  submit();
  expect(updateProfile).toHaveBeenCalledTimes(2);
  await act(async () => resolveSave(updated));
  expect(onClose).toHaveBeenCalledTimes(1);
});
