import { Button, type ButtonProps } from '../Button';
import { Icon } from '../Icon';

export function LogoutButton({
  children = 'Log out',
  className = '',
  ...props
}: Omit<ButtonProps, 'variant' | 'leadingIcon'>) {
  return (
    <Button {...props} variant="ghost" className={`ui-logout ${className}`}>
      <Icon name="logout" size={32} />
      {children}
    </Button>
  );
}
