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
  plus: {
    viewBox: '0 0 20 20',
    paths: (
      <>
        <path
          d="M10 4.16667V15.8333"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          stroke="currentColor"
        />
        <path
          d="M4.16667 10H15.8333"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          stroke="currentColor"
        />
      </>
    ),
  },
  trash: {
    viewBox: '0 0 16 16',
    paths: (
      <>
        <path
          d="M6 2H10"
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
          stroke="currentColor"
        />
        <path
          d="M2 4H14"
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
          stroke="currentColor"
        />
        <path
          d="M12.6667 4L12.2661 10.0089C12.1917 11.1245 12.1545 11.6823 11.9722 12.1304C11.6412 12.9441 10.9703 13.5718 10.1364 13.8479C9.67715 14 9.1181 14 8 14C6.8819 14 6.32285 14 5.86357 13.8479C5.02972 13.5718 4.35878 12.9441 4.02779 12.1304C3.84549 11.6823 3.8083 11.1245 3.73392 10.0089L3.33333 4"
          strokeWidth="1.3"
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
/** Omit label inside an already named button; supply it for a meaningful standalone icon. */
export function Icon({ name, size = 20, label, className = '', ...props }: IconProps) {
  return (
    <svg
      {...props}
      className={`ui-icon ${className}`}
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
