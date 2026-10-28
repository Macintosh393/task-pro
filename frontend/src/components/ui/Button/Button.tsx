import { Icon, type IconName } from '../Icon';
import type { ComponentPropsWithRef } from 'react';
export type ButtonProps = ComponentPropsWithRef<'button'> & {
  variant?: 'primary' | 'secondary' | 'destructive' | 'ghost';
  leadingIcon?: IconName;
  fullWidth?: boolean;
  size?: 'small' | 'medium';
  loading?: boolean;
};
/** Loading keeps the original label and disables repeat activation. Native form behavior is opt-in. */
export function Button({
  variant = 'primary',
  size = 'medium',
  loading = false,
  leadingIcon,
  fullWidth = false,
  disabled = false,
  type = 'button',
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`ui-button ui-button--${variant} ui-button--${size} ${leadingIcon ? 'ui-button--with-icon' : ''} ${fullWidth ? 'ui-button--full' : ''} ${className}`}
    >
      {loading && <span className="ui-spinner" aria-hidden="true" />}
      {leadingIcon && <Icon name={leadingIcon} size={leadingIcon === 'boxed-plus' ? 28 : 20} />}
      {children}
    </button>
  );
}
