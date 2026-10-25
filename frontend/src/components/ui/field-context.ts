import { createContext, useContext } from 'react';
export const FieldContext = createContext<{
  id: string;
  describedBy?: string;
  invalid: boolean;
} | null>(null);
export function useFieldProps(props: {
  id?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean | 'true' | 'false' | 'grammar' | 'spelling';
}) {
  const field = useContext(FieldContext);
  return {
    id: field?.id ?? props.id,
    'aria-describedby':
      [field?.describedBy, props['aria-describedby']].filter(Boolean).join(' ') || undefined,
    'aria-invalid': field?.invalid || props['aria-invalid'] || undefined,
  };
}
