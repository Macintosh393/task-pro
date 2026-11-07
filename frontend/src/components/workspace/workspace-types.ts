export interface WorkspaceUser {
  username: string;
  email: string;
  avatarUrl?: string | null;
}

export interface WorkspaceViewProps {
  user: WorkspaceUser;
  activeBoard?: { id: string; title: string } | null;
  onEditProfile?: () => void;
  onOpenFilters?: () => void;
}
