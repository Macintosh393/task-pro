import plant from '../../../assets/figma/img2.png';
import { Button } from '../../ui';

export function WorkspaceHelpCard({ onOpenHelp }: { onOpenHelp: () => void }) {
  return (
    <div className="flex flex-col rounded-lg bg-surface-sidebar-help p-5 text-sidebar-help">
      <div aria-hidden="true" className="relative h-[78px] w-[54px] shrink-0 overflow-hidden">
        <img
          src={plant}
          alt=""
          className="absolute -top-[10.81%] -left-[31.88%] h-[110.81%] w-[159.41%] max-w-none"
        />
      </div>
      <p className="m-0 mt-4 text-xs/[18px] min-[768px]:text-sm/[21px]">
        If you need help with <span className="text-sidebar-help-accent">TaskPro</span>, check out
        our support resources or reach out to our customer support team.
      </p>
      <Button
        variant="ghost"
        size="small"
        leadingIcon="help"
        onClick={onOpenHelp}
        className="mt-4 gap-2 self-start px-0 text-xs text-sidebar-help enabled:hover:text-sidebar-help enabled:hover:underline"
      >
        Need help?
      </Button>
    </div>
  );
}
