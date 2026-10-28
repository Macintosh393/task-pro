import { Button, type ButtonProps } from '../Button';
import { Icon, type IconName, type IconProps } from '../Icon';
export type IconButtonProps = Omit<
  ButtonProps,
  'children' | 'aria-label' | 'leadingIcon' | 'fullWidth'
> & {
  icon: IconName;
  iconSize?: IconProps['size'];
  treatment?: 'standard' | 'compact-add';
  'aria-label': string;
};
export function IconButton({
  icon,
  iconSize = 20,
  treatment = 'standard',
  className = '',
  loading,
  ...props
}: IconButtonProps) {
  return (
    <Button
      {...props}
      loading={loading}
      className={`ui-icon-button ui-icon-button--${treatment} ${className}`}
    >
      {!loading && <Icon name={icon} size={iconSize} />}
    </Button>
  );
}
