import { cn } from '../cn';
import type { ComponentPropsWithRef } from 'react';
import { sourceIcons } from './icon-data';
const icons = {
  ...sourceIcons,
  close: {
    viewBox: '0 0 18 18',
    paths: (
      <>
        <path
          d="M13.5 4.5L4.5 13.5"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          stroke="currentColor"
        />
        <path
          d="M4.5 4.5L13.5 13.5"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          stroke="currentColor"
        />
      </>
    ),
  },
};
export type IconName = keyof typeof icons;
export type IconProps = Omit<ComponentPropsWithRef<'svg'>, 'children' | 'name'> & {
  name: IconName;
  size?: 10 | 16 | 18 | 20 | 24 | 28 | 32 | 68;
  label?: string;
};
export function Icon({ name, size = 20, label, className = '', ...props }: IconProps) {
  return (
    <svg
      {...props}
      className={cn('inline-block shrink-0 align-middle', className)}
      width={size}
      height={size}
      viewBox={icons[name].viewBox}
      fill="none"
      focusable="false"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {icons[name].paths}
    </svg>
  );
}
