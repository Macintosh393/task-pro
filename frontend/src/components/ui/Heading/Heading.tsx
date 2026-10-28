import type { ComponentPropsWithRef } from 'react';
export type HeadingProps = ComponentPropsWithRef<'h2'> & {
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  size?: 'small' | 'medium' | 'large';
};
export function Heading({ level = 2, size = 'medium', className = '', ...props }: HeadingProps) {
  const Tag = `h${level}` as 'h2';
  return <Tag {...props} className={`ui-heading ui-heading--${size} ${className}`} />;
}
