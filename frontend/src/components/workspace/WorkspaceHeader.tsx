import './WorkspaceHeader.css';
import { Button } from '../ui';
import type { NavigationButtonProps } from './AppShell';
import type { WorkspaceViewProps } from './workspace-types';

export function WorkspaceHeader({
  user,
  onLogout,
  menuButtonProps,
}: Pick<WorkspaceViewProps, 'user' | 'onLogout'> & { menuButtonProps: NavigationButtonProps }) {
  return (
    <>
      <Button {...menuButtonProps} variant="ghost" size="small" className="workspace-menu">
        <span className="workspace-menu__icon" aria-hidden="true" />
      </Button>
      <div className="workspace-user">
        <span>{user.username}</span>
        <span className="workspace-user__email">{user.email}</span>
      </div>
      <Button variant="secondary" size="small" onClick={onLogout}>
        Log Out
      </Button>
    </>
  );
}
