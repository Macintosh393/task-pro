import { Button } from '../ui';
import type { NavigationButtonProps } from './AppShell';
import type { WorkspaceViewProps } from './workspace-types';

export function WorkspaceHeader({
  user,
  menuButtonProps,
}: Pick<WorkspaceViewProps, 'user'> & { menuButtonProps: NavigationButtonProps }) {
  return (
    <>
      <Button
        {...menuButtonProps}
        variant="ghost"
        size="small"
        className="workspace-menu w-11 shrink-0 p-0 text-primary enabled:hover:text-primary [&[hidden]]:hidden"
      >
        <span
          className="workspace-menu__icon block size-6 bg-current [mask-image:url(/src/assets/workspace/menu.svg)] [mask-position:center] [mask-size:contain] [mask-repeat:no-repeat] min-[768px]:size-8 min-[768px]:[mask-image:url(/src/assets/workspace/menu-tablet.svg)]"
          aria-hidden="true"
        />
      </Button>
      <div className="workspace-user flex min-w-0 flex-1 flex-col items-end text-[14px]">
        <span className="max-w-full truncate">{user.username}</span>
        <span className="workspace-user__email max-w-full truncate text-[10px] text-text-description">
          {user.email}
        </span>
      </div>
    </>
  );
}
