import { cn } from '../cn';
import { fieldStyles } from '../control-styles';
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
      className={cn(fieldStyles, 'min-h-[120px] resize-y', className)}
    />
  );
}
