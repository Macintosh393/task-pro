import { Avatar, Button } from '../ui';
import { ThemePicker } from './ThemePicker';
import type { NavigationButtonProps } from './AppShell';
import type { WorkspaceViewProps } from './workspace-types';

export function WorkspaceHeader({
  user,
  menuButtonProps,
  onEditProfile,
}: Pick<WorkspaceViewProps, 'user' | 'onEditProfile'> & {
  menuButtonProps: NavigationButtonProps;
}) {
  return (
    <>
      <Button
        {...menuButtonProps}
        variant="ghost"
        size="small"
        className="workspace-menu w-11 shrink-0 justify-start border-0 p-0 text-primary enabled:hover:text-primary [&[hidden]]:hidden"
      >
        <span
          className="workspace-menu__icon block size-6 bg-current [mask-image:url(/src/assets/workspace/menu.svg)] [mask-position:center] [mask-size:contain] [mask-repeat:no-repeat] min-[768px]:size-8 min-[768px]:[mask-image:url(/src/assets/workspace/menu-tablet.svg)]"
          aria-hidden="true"
        />
      </Button>
      <div className="workspace-user ml-auto flex min-w-0 justify-end gap-3.5">
        <ThemePicker />
        <Button
          variant="ghost"
          size="small"
          onClick={onEditProfile}
          aria-label={`Edit profile: ${user.username}`}
          title={user.username}
          className="min-w-0 gap-2 border-0 p-0 text-primary enabled:hover:text-primary"
        >
          <span className="truncate">{user.username}</span>
          <Avatar
            size={32}
            name={user.username}
            src={user.avatarUrl ?? undefined}
            aria-hidden="true"
          />
        </Button>
      </div>
    </>
  );
}
