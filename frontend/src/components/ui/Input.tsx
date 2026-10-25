import type { ComponentPropsWithRef } from 'react';
import { useFieldProps } from './field-context';
export type InputProps = ComponentPropsWithRef<'input'>;
export function Input({ className = '', ...props }: InputProps) {
  const fieldProps = useFieldProps(props);
  return <input {...props} {...fieldProps} className={`ui-control ${className}`} />;
}
