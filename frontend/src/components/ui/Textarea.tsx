import type { ComponentPropsWithRef } from 'react';
import { useFieldProps } from './field-context';
export type TextareaProps = ComponentPropsWithRef<'textarea'>;
export function Textarea({ className = '', ...props }: TextareaProps) {
  const fieldProps = useFieldProps(props);
  return <textarea {...props} {...fieldProps} className={`ui-control ${className}`} />;
}
