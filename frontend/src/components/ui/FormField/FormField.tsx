import { useId, type ReactNode } from 'react';
import { FieldContext } from './field-context';
export type FormFieldProps = {
  id?: string;
  label: string;
  help?: string;
  error?: string;
  children: ReactNode;
  className?: string;
};
/** One Input or Textarea per field. Supply an id here, not on its child. */
export function FormField({ id, label, help, error, children, className = '' }: FormFieldProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const describedBy =
    [help && `${fieldId}-help`, error && `${fieldId}-error`].filter(Boolean).join(' ') || undefined;
  return (
    <div className={`ui-field ${className}`}>
      <label htmlFor={fieldId} className="ui-field__label">
        {label}
      </label>
      <FieldContext value={{ id: fieldId, describedBy, invalid: Boolean(error) }}>
        {children}
      </FieldContext>
      {help && (
        <p id={`${fieldId}-help`} className="ui-field__help">
          {help}
        </p>
      )}
      {error && (
        <p id={`${fieldId}-error`} className="ui-field__error" aria-live="polite">
          {error}
        </p>
      )}
    </div>
  );
}
