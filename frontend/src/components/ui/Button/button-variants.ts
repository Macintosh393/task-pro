import { cva } from 'class-variance-authority';
import { focusRing } from '../control-styles';

export const buttonVariants = cva(
  [
    'ui-button group/button relative inline-flex max-w-full cursor-pointer items-center justify-center gap-2 rounded-lg border',
    'font-ui text-sm/normal font-medium tracking-[-0.02em] wrap-anywhere',
    'enabled:active:shadow-[inset_0_0_0_2px_currentColor]',
    'disabled:cursor-not-allowed disabled:border-control-border disabled:bg-control-disabled-surface disabled:text-control-disabled-text',
    focusRing,
  ],
  {
    variants: {
      variant: {
        primary:
          'border-transparent bg-action-primary text-action-on-primary enabled:hover:bg-action-hover',
        secondary:
          'border-control-border bg-control-surface text-primary enabled:hover:bg-action-secondary-hover',
        destructive:
          'border-transparent bg-action-danger text-action-on-danger enabled:hover:bg-action-danger-hover',
        ghost:
          'border-transparent bg-transparent text-icon-action enabled:hover:text-icon-action-active',
      },
      size: { small: 'min-h-11 px-3.5 py-[9px]', medium: 'min-h-[49px] px-5 py-3' },
      fullWidth: { true: 'w-full' },
      withIcon: { true: null },
    },
    compoundVariants: [{ size: 'medium', withIcon: true, className: 'py-[9px]' }],
    defaultVariants: { variant: 'primary', size: 'medium', fullWidth: false, withIcon: false },
  },
);
