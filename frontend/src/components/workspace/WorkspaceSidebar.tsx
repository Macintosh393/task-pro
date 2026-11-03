import { Logo } from '../ui';

export function WorkspaceSidebar() {
  return (
    <div className="workspace-sidebar flex min-h-0 grow shrink-0 flex-col gap-[60px] p-6 min-[1440px]:min-h-full">
      <Logo />
      <nav aria-label="My boards" className="workspace-boards flex min-w-0 flex-col gap-3">
        <h2 className="m-0 text-[12px] font-normal text-sidebar">My boards</h2>
        <p className="workspace-sidebar__empty text-[12px] wrap-anywhere text-sidebar">
          Your boards will appear here.
        </p>
      </nav>
    </div>
  );
}
