import { cn } from '../cn';
import { fieldStyles } from '../control-styles';
import type { ComponentPropsWithRef } from 'react';
import { useFieldProps } from '../FormField/field-context';
export type InputProps = ComponentPropsWithRef<'input'>;
export function Input({ className = '', placeholder = ' ', ...props }: InputProps) {
  const fieldProps = useFieldProps(props);
  return (
    <input
      {...props}
      {...fieldProps}
      placeholder={placeholder}
      className={cn(fieldStyles, className)}
    />
  );
}
