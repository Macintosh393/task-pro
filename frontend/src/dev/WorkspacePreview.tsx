import { useEffect, useState } from 'react';
import { WorkspaceView } from '../components/workspace/WorkspaceView';
import { workspaceBoards, workspaceUser } from './workspace-fixtures';

export default function WorkspacePreview() {
  const [populated, setPopulated] = useState(true);
  const [activeBoardId, setActiveBoardId] = useState(workspaceBoards[0].id);
  const [theme, setTheme] = useState('dark');
  const [logoutMessage, setLogoutMessage] = useState('');

  useEffect(() => {
    const previous = document.documentElement.dataset.theme;
    document.documentElement.dataset.theme = theme;
    return () => {
      if (previous) document.documentElement.dataset.theme = previous;
      else delete document.documentElement.dataset.theme;
    };
  }, [theme]);

  return (
    <div className="workspace-preview flex h-dvh flex-col [&>.app-shell]:h-auto [&>.app-shell]:min-h-0 [&>.app-shell]:flex-1">
      <aside
        className="workspace-preview__controls flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 border-b border-border-subtle px-5 py-2 text-[12px]"
        aria-label="Development fixtures"
      >
        <strong>DEV fixtures</strong>
        <label className="flex items-center gap-1">
          <input
            type="checkbox"
            checked={populated}
            onChange={(event) => setPopulated(event.target.checked)}
          />{' '}
          Populated
        </label>
        <label className="flex items-center gap-1">
          Theme{' '}
          <select
            className="bg-surface-card text-primary"
            value={theme}
            onChange={(event) => setTheme(event.target.value)}
          >
            <option value="dark">Dark</option>
            <option value="light">Light</option>
            <option value="violet">Violet</option>
          </select>
        </label>
        <span>Drawer below 1440px</span>
        <span role="status">{logoutMessage}</span>
      </aside>
      <WorkspaceView
        user={workspaceUser}
        onLogout={() => setLogoutMessage('Preview logout selected')}
        boards={populated ? workspaceBoards : []}
        activeBoardId={populated ? activeBoardId : undefined}
        onSelectBoard={setActiveBoardId}
        boardContent={
          populated ? (
            <div className="workspace-preview__columns flex h-full gap-6 pb-3">
              {Array.from({ length: 4 }, (_, index) => (
                <section
                  className="workspace-preview__column flex min-h-0 basis-[334px] grow-0 shrink-0 flex-col gap-3"
                  key={index}
                >
                  <h2 className="m-0 rounded-lg bg-surface-column-heading p-4 text-[14px]">
                    Column fixture {index + 1}
                  </h2>
                  <div
                    className="workspace-preview__list min-h-0 overflow-y-auto overscroll-y-contain"
                    tabIndex={0}
                    role="region"
                    aria-label={`Column fixture ${index + 1} cards`}
                  >
                    {Array.from({ length: 12 }, (_, card) => (
                      <p className="m-0 mb-2 rounded-lg bg-surface-card px-6 py-10" key={card}>
                        Content fixture {card + 1}
                      </p>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : undefined
        }
      />
    </div>
  );
}
