import type { ComponentPropsWithRef } from 'react';
import { useFieldProps } from '../FormField/field-context';
export type TextareaProps = ComponentPropsWithRef<'textarea'>;
export function Textarea({ className = '', placeholder = ' ', ...props }: TextareaProps) {
  const fieldProps = useFieldProps(props);
  return (
    <textarea
      {...props}
      {...fieldProps}
      placeholder={placeholder}
      className={`ui-control ${className}`}
    />
  );
}
