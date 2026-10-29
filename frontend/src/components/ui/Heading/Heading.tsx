import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentPropsWithRef } from 'react';
import { cn } from '../cn';

const headingVariants = cva('ui-heading m-0 font-medium tracking-[-0.02em] wrap-anywhere', {
  variants: {
    size: { small: 'text-base/[1.4]', medium: 'text-lg/[1.4]', large: 'text-2xl/[1.4]' },
  },
  defaultVariants: { size: 'medium' },
});
export type HeadingProps = ComponentPropsWithRef<'h2'> &
  VariantProps<typeof headingVariants> & { level?: 1 | 2 | 3 | 4 | 5 | 6 };
const tags = { 1: 'h1', 2: 'h2', 3: 'h3', 4: 'h4', 5: 'h5', 6: 'h6' } as const;
export function Heading({ level = 2, size, className, ...props }: HeadingProps) {
  const Tag = tags[level];
  return <Tag {...props} className={cn(headingVariants({ size }), className)} />;
}
