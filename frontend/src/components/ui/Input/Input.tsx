import { cn } from '../cn';
import { fieldStyles } from '../control-styles';
import type { ComponentPropsWithRef } from 'react';
import { useFieldProps } from '../FormField/field-context';
export type InputProps = ComponentPropsWithRef<'input'> & { variant?: 'default' | 'subtle' };
export function Input({
  className = '',
  placeholder = ' ',
  variant = 'default',
  ...props
}: InputProps) {
  const fieldProps = useFieldProps(props);
  return (
    <input
      {...props}
      {...fieldProps}
      placeholder={placeholder}
      className={cn(
        fieldStyles,
        variant === 'subtle' &&
          'bg-transparent px-[17px] text-control-muted shadow-none enabled:not-placeholder-shown:border-control-border enabled:focus:border-field-accent enabled:focus:text-primary enabled:aria-invalid:border-text-error',
        className,
      )}
    />
  );
}
