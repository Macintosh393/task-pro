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
    mounted.current = false;
    onClose();
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting.current) return;
    if (!username.trim() || username.trim().length > 32) {
      setNameError('Name must contain between 1 and 32 characters.');
      return;
    }
    submitting.current = true;
    setPending(true);
    setError('');
    setNameError('');
    setEmailError('');
    try {
      const updatedUser = await updateProfile({
        username: username.trim(),
        email: email.trim().toLowerCase(),
      });
      await queryClient.cancelQueries({ queryKey: AUTH_QUERY_KEY });
      queryClient.setQueryData(AUTH_QUERY_KEY, updatedUser);
      if (mounted.current) close();
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
    <div className="[&>dialog]:relative [&>dialog]:w-[min(400px,calc(100vw-40px))] [&>dialog]:border-border-filters [&>dialog]:shadow-[0_4px_8px_color-mix(in_srgb,var(--action-neutral)_5%,transparent)] [&>dialog]:p-[23px] [&>dialog>div]:mb-6 [&_[data-modal-heading]]:leading-normal [&>dialog>div>button]:absolute [&>dialog>div>button]:top-0 [&>dialog>div>button]:right-0 [&>dialog>div>button]:size-11 [&>dialog>div>button]:min-h-11 [&>dialog>div>button]:border-0 [&>dialog>div>button]:text-primary">
      <Modal open title="Edit profile" onClose={close} initialFocusRef={nameInput}>
        <form onSubmit={submit} className="flex flex-col gap-3.5" aria-busy={pending}>
          <div className="mb-[11px] flex justify-center">
            <Avatar name={user.username} src={user.avatarUrl ?? undefined} size={68} />
          </div>
          <FormField label="Name" labelClassName="sr-only" error={nameError}>
            <Input
              ref={nameInput}
              className="bg-transparent px-[17px] text-control-muted shadow-none enabled:not-placeholder-shown:border-control-border enabled:focus:border-field-accent enabled:focus:text-primary enabled:aria-invalid:border-text-error"
              autoComplete="name"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
              maxLength={32}
              disabled={pending}
            />
          </FormField>
          <FormField label="Email" labelClassName="sr-only" error={emailError}>
            <Input
              className="bg-transparent px-[17px] text-control-muted shadow-none enabled:not-placeholder-shown:border-control-border enabled:focus:border-field-accent enabled:focus:text-primary enabled:aria-invalid:border-text-error"
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
    </div>
  );
}
