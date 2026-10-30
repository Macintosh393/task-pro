import { type VariantProps } from 'class-variance-authority';
import type { ComponentPropsWithRef } from 'react';
import { Icon, type IconName } from '../Icon';
import { cn } from '../cn';
import { buttonVariants } from './button-variants';

export type ButtonProps = ComponentPropsWithRef<'button'> &
  Omit<VariantProps<typeof buttonVariants>, 'withIcon'> & {
    leadingIcon?: IconName;
    loading?: boolean;
  };

export function Button({
  variant,
  size,
  fullWidth,
  loading = false,
  leadingIcon,
  disabled = false,
  type = 'button',
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        buttonVariants({ variant, size, fullWidth, withIcon: Boolean(leadingIcon) }),
        className,
      )}
    >
      {loading && (
        <span
          className="ui-spinner absolute start-[3px] size-3 animate-spin rounded-full border-2 border-current border-r-transparent motion-reduce:animate-none"
          aria-hidden="true"
        />
      )}
      {leadingIcon && <Icon name={leadingIcon} size={leadingIcon === 'boxed-plus' ? 28 : 20} />}
      {children}
    </button>
  );
}
