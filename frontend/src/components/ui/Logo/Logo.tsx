import { cn } from '../cn';
import type { ComponentPropsWithRef } from 'react';
import { Icon } from '../Icon';

export function Logo({ className = '', ...props }: ComponentPropsWithRef<'span'>) {
  return (
    <span
      {...props}
      className={cn(
        'inline-flex items-center gap-2 whitespace-nowrap font-ui text-base/6 font-semibold tracking-[-0.04em] text-sidebar',
        className,
      )}
    >
      <Icon name="logo" size={32} />
      Task Pro
    </span>
  );
}
