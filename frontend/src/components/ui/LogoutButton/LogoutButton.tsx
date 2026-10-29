import { cn } from '../cn';
import { Button, type ButtonProps } from '../Button';
import { Icon } from '../Icon';

export function LogoutButton({
  children = 'Log out',
  className = '',
  ...props
}: Omit<ButtonProps, 'variant' | 'leadingIcon'>) {
  return (
    <Button
      {...props}
      variant="ghost"
      className={cn(
        'ui-logout group/logout min-h-11 gap-3.5 px-0 py-1.5 text-base/6 tracking-normal text-sidebar enabled:hover:text-sidebar focus-visible:outline-focus-ring-sidebar',
        className,
      )}
    >
      <Icon
        name="logout"
        size={32}
        className="text-logout-icon group-[:enabled:hover]/logout:text-logout-hover group-disabled/logout:text-inherit"
      />
      {children}
    </Button>
  );
}
