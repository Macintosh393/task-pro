import { Button, type ButtonProps } from './Button';
import { Icon, type IconName } from './Icon';
export type IconButtonProps = Omit<ButtonProps, 'children' | 'aria-label'> & {
  icon: IconName;
  'aria-label': string;
};
export function IconButton({ icon, className = '', loading, ...props }: IconButtonProps) {
  return (
    <Button {...props} loading={loading} className={`ui-icon-button ${className}`}>
      {!loading && <Icon name={icon} />}
    </Button>
  );
}
