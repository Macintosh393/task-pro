/** Message from a NestJS error body (`message` is a string or a list of validation messages). */
export function serverErrorMessage(error: unknown, fallback: string): string {
  const message = (error as { response?: { data?: { message?: unknown } } })?.response?.data
    ?.message;
  if (Array.isArray(message) && message.length > 0) return message.join(', ');
  if (typeof message === 'string' && message) return message;
  return fallback;
}

/** First TanStack Form field error as text (zod issues carry `message`). */
export function firstErrorMessage(errors: readonly unknown[]): string | undefined {
  const error = errors[0];
  if (!error) return undefined;
  if (typeof error === 'string') return error;
  return (error as { message?: string }).message;
}
