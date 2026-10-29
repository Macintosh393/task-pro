import { cva, type VariantProps } from 'class-variance-authority';
import { Button, type ButtonProps } from '../Button';
import { Icon, type IconName, type IconProps } from '../Icon';
import { cn } from '../cn';

const iconButtonVariants = cva(
  'ui-icon-button shrink-0 p-0 [&>.ui-spinner]:static [&>.ui-spinner]:size-5',
  {
    variants: {
      size: { small: 'size-11', medium: 'size-[49px]' },
      treatment: {
        standard: '',
        'compact-add':
          'isolate size-11 min-h-11 rounded-md border-0 bg-transparent text-compact-ink before:absolute before:-z-10 before:h-9 before:w-10 before:rounded-md before:bg-compact-surface enabled:hover:bg-transparent enabled:hover:before:bg-compact-hover disabled:bg-transparent disabled:before:bg-control-disabled-surface',
      },
    },
    defaultVariants: { size: 'medium', treatment: 'standard' },
  },
);

export type IconButtonProps = Omit<
  ButtonProps,
  'children' | 'aria-label' | 'leadingIcon' | 'fullWidth'
> &
  Pick<VariantProps<typeof iconButtonVariants>, 'treatment'> & {
    icon: IconName;
    iconSize?: IconProps['size'];
    'aria-label': string;
  };

export function IconButton({
  icon,
  iconSize = 20,
  treatment,
  size,
  className,
  loading,
  ...props
}: IconButtonProps) {
  return (
    <Button
      {...props}
      size={size}
      loading={loading}
      className={cn(iconButtonVariants({ treatment, size }), className)}
    >
      {!loading && <Icon name={icon} size={iconSize} />}
    </Button>
  );
}
