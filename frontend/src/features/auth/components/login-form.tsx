import { useForm } from '@tanstack/react-form';
import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useAuth } from '../hooks/use-auth';
import { FormField, Input, Button } from '../../../components/ui';
import { loginSchema } from '../validation/login.schema';

function getValidationMessage(schema: (typeof loginSchema.shape)[keyof typeof loginSchema.shape], value: string) {
  const result = schema.safeParse(value);
  return result.success ? undefined : result.error.issues[0]?.message;
}

export interface LoginFormProps {
  redirectTo?: string;
  className?: string;
}

export function LoginForm({ redirectTo = '/home', className = '' }: LoginFormProps) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
    onSubmit: async ({ value }) => {
      setServerError(null);
      try {
        await login({
          email: value.email,
          password: value.password,
        });
        await navigate({ to: redirectTo });
      } catch (err: unknown) {
        const errorResponse = (err as { response?: { data?: { message?: string | string[] } } })
          ?.response?.data;
        const message =
          errorResponse?.message ||
          (err instanceof Error ? err.message : 'Invalid credentials. Please try again.');
        setServerError(Array.isArray(message) ? message.join(', ') : String(message));
      }
    },
  });

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
      className={`flex w-full max-w-[344px] flex-col ${className}`}
    >
      {serverError && (
        <div
          role="alert"
          aria-live="polite"
          className="mb-4 rounded-lg border border-action-danger bg-action-danger/10 p-3 text-xs font-medium text-action-danger"
        >
          {serverError}
        </div>
      )}

      <div className="mb-10 flex items-center gap-4 font-ui text-sm/normal tracking-[-0.02em]">
        <span className="text-text-caption">Registration</span>
        <h1 className="m-0 font-medium text-primary">Log In</h1>
      </div>

      <div className="flex flex-col gap-3.5">
        <form.Field
          name="email"
          validators={{
            onChange: ({ value }) => getValidationMessage(loginSchema.shape.email, value),
            onSubmit: ({ value }) => getValidationMessage(loginSchema.shape.email, value),
          }}
        >
          {(field) => {
            const error = field.state.meta.errors[0]?.toString();
            return (
              <FormField label="Email" labelClassName="sr-only" error={error}>
                <Input
                  type="email"
                  id="login-email"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  placeholder="Enter your email"
                  autoComplete="email"
                  required
                />
              </FormField>
            );
          }}
        </form.Field>

        <form.Field
          name="password"
          validators={{
            onChange: ({ value }) => getValidationMessage(loginSchema.shape.password, value),
            onSubmit: ({ value }) => getValidationMessage(loginSchema.shape.password, value),
          }}
        >
          {(field) => {
            const error = field.state.meta.errors[0]?.toString();
            return (
              <FormField label="Password" labelClassName="sr-only" error={error}>
                <Input
                  type="password"
                  id="login-password"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                />
              </FormField>
            );
          }}
        </form.Field>
      </div>

      <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
        {([canSubmit, isSubmitting]) => (
          <Button
            type="submit"
            variant="primary"
            size="medium"
            fullWidth
            loading={Boolean(isSubmitting)}
            disabled={!canSubmit || Boolean(isSubmitting)}
            className="mt-6"
          >
            {isSubmitting ? 'Logging In...' : 'Log In Now'}
          </Button>
        )}
      </form.Subscribe>
    </form>
  );
}
