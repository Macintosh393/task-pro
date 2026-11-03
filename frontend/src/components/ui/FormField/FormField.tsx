import { cn } from '../cn';
import { useId, type ReactNode } from 'react';
import { FieldContext } from './field-context';
export type FormFieldProps = {
  id?: string;
  label: string;
  help?: string;
  error?: string;
  children: ReactNode;
  className?: string;
  labelClassName?: string;
};
export function FormField({
  id,
  label,
  help,
  error,
  children,
  className = '',
  labelClassName = '',
}: FormFieldProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const describedBy =
    [help && `${fieldId}-help`, error && `${fieldId}-error`].filter(Boolean).join(' ') || undefined;
  return (
    <div className={cn('flex min-w-0 flex-col gap-1.5', className)}>
      <label
        htmlFor={fieldId}
        className={cn('text-sm/normal font-medium wrap-anywhere', labelClassName)}
      >
        {label}
      </label>
      <FieldContext value={{ id: fieldId, describedBy, invalid: Boolean(error) }}>
        {children}
      </FieldContext>
      {help && (
        <p id={`${fieldId}-help`} className="m-0 text-xs/normal text-control-muted wrap-anywhere">
          {help}
        </p>
      )}
      {error && (
        <p
          id={`${fieldId}-error`}
          className="m-0 text-xs/normal text-text-error wrap-anywhere"
          aria-live="polite"
        >
          {error}
        </p>
      )}
    </div>
  );
}
