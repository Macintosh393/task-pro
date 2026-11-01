import { cn } from '../cn';
import type { ComponentPropsWithRef } from 'react';
import { Icon } from '../Icon';
import welcomeMark from '../../../assets/welcome/logo-desktop.svg';
import welcomeMobileMark from '../../../assets/welcome/logo-mobile.svg';

export type LogoProps = ComponentPropsWithRef<'span'> & {
  variant?: 'sidebar' | 'welcome';
};

export function Logo({ className = '', variant = 'sidebar', ...props }: LogoProps) {
  return (
    <span
      {...props}
      className={cn(
        'inline-flex items-center gap-2 whitespace-nowrap font-ui text-base/6 font-semibold tracking-[-0.04em] text-sidebar',
        variant === 'welcome' && 'gap-3.5 text-[28px]/[42px] md:text-[40px]/[60px]',
        className,
      )}
    >
      {variant === 'welcome' ? (
        <picture className="shrink-0">
          <source media="(min-width: 768px)" srcSet={welcomeMark} />
          <img src={welcomeMobileMark} alt="" />
        </picture>
      ) : (
        <Icon name="logo" size={32} />
      )}
      Task Pro
    </span>
  );
}
