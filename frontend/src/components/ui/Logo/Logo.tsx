import type { ComponentPropsWithRef } from 'react';
import { Icon } from '../Icon';

export function Logo({ className = '', ...props }: ComponentPropsWithRef<'span'>) {
  return (
    <span {...props} className={`ui-logo ${className}`}>
      <Icon name="logo" size={32} />
      Task Pro
    </span>
  );
}
