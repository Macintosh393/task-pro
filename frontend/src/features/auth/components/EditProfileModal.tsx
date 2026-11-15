import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Avatar, Button, FormField, Input, Modal } from '../../../components/ui';
import { updateProfile } from '../api/profile.api';
import { AUTH_QUERY_KEY } from '../context/auth-context-definition';
import type { User } from '../types';

export function EditProfileModal({ user, onClose }: { user: User; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [username, setUsername] = useState(user.username);
  const [email, setEmail] = useState(user.email);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const submitting = useRef(false);
  const mounted = useRef(true);
  const nameInput = useRef<HTMLInputElement>(null);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const close = () => {
    if (submitting.current) return;
    mounted.current = false;
    onClose();
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting.current) return;
    if (
      !username.trim() ||
      Array.from(username.trim()).length > 32 ||
      username.includes('\u0000')
    ) {
      setNameError('Name must contain between 1 and 32 characters.');
      return;
    }
    submitting.current = true;
    setPending(true);
    setError('');
    setNameError('');
    setEmailError('');
    const authQuery = queryClient.getQueryCache().find({ queryKey: AUTH_QUERY_KEY, exact: true });
    const isCurrentSession = () => {
      const currentQuery = queryClient
        .getQueryCache()
        .find({ queryKey: AUTH_QUERY_KEY, exact: true });
      const currentUser = queryClient.getQueryData<User | null>(AUTH_QUERY_KEY);
      return Boolean(authQuery && currentQuery === authQuery && currentUser?.id === user.id);
    };
    try {
      const updatedUser = await updateProfile({
        username: username.trim(),
        email: email.trim().toLowerCase(),
      });
      if (!isCurrentSession()) return;
      await queryClient.cancelQueries({ queryKey: AUTH_QUERY_KEY });
      if (!isCurrentSession()) return;
      queryClient.setQueryData(AUTH_QUERY_KEY, updatedUser);
      if (mounted.current) onClose();
    } catch (failure) {
      if (mounted.current) {
        if (axios.isAxiosError(failure) && failure.response?.status === 409) {
          setEmailError('This email is already registered.');
        } else {
          setError('Could not save your profile. Check your details and try again.');
        }
      }
    } finally {
      submitting.current = false;
      if (mounted.current) setPending(false);
    }
  };

  return (
    <Modal
      open
      title="Edit profile"
      variant="compact"
      closeDisabled={pending}
      onClose={close}
      initialFocusRef={nameInput}
    >
      <form onSubmit={submit} className="flex flex-col gap-3.5" aria-busy={pending}>
        <div className="mb-[11px] flex justify-center">
          <Avatar name={user.username} src={user.avatarUrl ?? undefined} size={68} />
        </div>
        <FormField label="Name" labelClassName="sr-only" error={nameError}>
          <Input
            ref={nameInput}
            variant="subtle"
            autoComplete="name"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            required
            disabled={pending}
          />
        </FormField>
        <FormField label="Email" labelClassName="sr-only" error={emailError}>
          <Input
            variant="subtle"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            maxLength={255}
            disabled={pending}
          />
        </FormField>
        {error && (
          <p role="alert" className="text-sm text-text-error wrap-anywhere">
            {error}
          </p>
        )}
        <Button type="submit" loading={pending} className="mt-2.5">
          Send
        </Button>
      </form>
    </Modal>
  );
}
