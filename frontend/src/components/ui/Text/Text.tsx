import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentPropsWithRef } from 'react';
import { cn } from '../cn';

const textVariants = cva('m-0 font-normal tracking-[-0.02em] wrap-anywhere', {
  variants: {
    size: { small: 'text-xs/4', medium: 'text-sm/[21px]' },
    tone: { primary: 'text-primary', muted: 'text-control-muted' },
  },
  defaultVariants: { size: 'medium', tone: 'primary' },
});
export type TextProps = ComponentPropsWithRef<'p'> &
  VariantProps<typeof textVariants> & { as?: 'p' | 'span' };
export function Text({ as: Tag = 'p', size, tone, className, ...props }: TextProps) {
  return <Tag {...props} className={cn(textVariants({ size, tone }), className)} />;
}
