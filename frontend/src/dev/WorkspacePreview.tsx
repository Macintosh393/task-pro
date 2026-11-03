import { useEffect, useState } from 'react';
import { WorkspaceView } from '../components/workspace/WorkspaceView';
import { workspaceBoards, workspaceUser } from './workspace-fixtures';
import './workspace-preview.css';

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
    <div className="workspace-preview">
      <aside className="workspace-preview__controls" aria-label="Development fixtures">
        <strong>DEV fixtures</strong>
        <label>
          <input
            type="checkbox"
            checked={populated}
            onChange={(event) => setPopulated(event.target.checked)}
          />{' '}
          Populated
        </label>
        <label>
          Theme{' '}
          <select value={theme} onChange={(event) => setTheme(event.target.value)}>
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
            <div className="workspace-preview__columns">
              {Array.from({ length: 4 }, (_, index) => (
                <section className="workspace-preview__column" key={index}>
                  <h2>Column fixture {index + 1}</h2>
                  <div
                    className="workspace-preview__list"
                    tabIndex={0}
                    role="region"
                    aria-label={`Column fixture ${index + 1} cards`}
                  >
                    {Array.from({ length: 12 }, (_, card) => (
                      <p key={card}>Content fixture {card + 1}</p>
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
