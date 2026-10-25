import type { ComponentPropsWithRef } from 'react';
export type TextProps = ComponentPropsWithRef<'p'> & {
  as?: 'p' | 'span';
  size?: 'small' | 'medium';
  tone?: 'primary' | 'muted';
};
export function Text({
  as: Tag = 'p',
  size = 'medium',
  tone = 'primary',
  className = '',
  ...props
}: TextProps) {
  return <Tag {...props} className={`ui-text ui-text--${size} ui-tone--${tone} ${className}`} />;
}
export type HeadingProps = ComponentPropsWithRef<'h2'> & {
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  size?: 'small' | 'medium' | 'large';
};
export function Heading({ level = 2, size = 'medium', className = '', ...props }: HeadingProps) {
  const Tag = `h${level}` as 'h2';
  return <Tag {...props} className={`ui-heading ui-heading--${size} ${className}`} />;
}
