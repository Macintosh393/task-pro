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
