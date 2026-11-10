// @vitest-environment jsdom
import { act } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { setupDomTest } from '../../../test/setupDomTest';
import type { WorkspaceBoard, WorkspaceSidebarProps } from '../workspace-types';
import { WorkspaceSidebar } from './WorkspaceSidebar';

const dom = setupDomTest();

const boards: WorkspaceBoard[] = [
  { id: 'a', title: 'Project office', icon: 'project' },
  { id: 'b', title: 'Neon Light Project', icon: 'puzzle' },
];

function createProps(overrides: Partial<WorkspaceSidebarProps> = {}): WorkspaceSidebarProps {
  return {
    boards: [],
    status: 'ready',
    activeBoardId: null,
    onCreateBoard: vi.fn(),
    onSelectBoard: vi.fn(),
    onEditBoard: vi.fn(),
    onDeleteBoard: vi.fn(),
    onRetryBoards: vi.fn(),
    onOpenHelp: vi.fn(),
    onLogout: vi.fn(),
    ...overrides,
  };
}

function render(props: WorkspaceSidebarProps) {
  act(() => dom.root.render(<WorkspaceSidebar {...props} />));
}

function button(name: string) {
  const found = Array.from(dom.host.querySelectorAll('button')).find(
    (element) => (element.getAttribute('aria-label') ?? element.textContent?.trim()) === name,
  );
  if (!found) throw new Error(`Button "${name}" not found`);
  return found;
}

function click(element: HTMLElement) {
  act(() => element.click());
}

describe('WorkspaceSidebar', () => {
  it('renders the empty state with create, help and logout', () => {
    render(createProps());
    expect(dom.host.querySelector('nav[aria-label="My boards"] h2')?.textContent).toBe('My boards');
    expect(dom.host.textContent).toContain('Your boards will appear here.');
    expect(dom.host.textContent).toContain(
      'If you need help with TaskPro, check out our support resources or reach out to our customer support team.',
    );
    expect(button('Create a new board')).toBeTruthy();
    expect(button('Need help?')).toBeTruthy();
    expect(button('Log out')).toBeTruthy();
    expect(dom.host.querySelectorAll('li')).toHaveLength(0);
  });

  it('places the create row before the board list', () => {
    render(createProps({ boards }));
    const create = button('Create a new board');
    const list = dom.host.querySelector('ul')!;
    expect(create.compareDocumentPosition(list) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('breaks the create label after "a"', () => {
    render(createProps());
    const label = dom.host.querySelector('br')!.parentElement!;
    expect(label.innerHTML).toBe('Create a<br>new board');
  });

  it('renders loading without fake boards', () => {
    render(createProps({ status: 'loading' }));
    expect(dom.host.querySelector('[role="status"]')?.textContent).toBe('Loading boards…');
    expect(dom.host.querySelectorAll('li')).toHaveLength(0);
  });

  it('renders the error state and retries', () => {
    const props = createProps({ status: 'error' });
    render(props);
    expect(dom.host.querySelector('[role="alert"]')?.textContent).toBe(
      'Could not load your boards.',
    );
    click(button('Try again'));
    expect(props.onRetryBoards).toHaveBeenCalledTimes(1);
  });

  it('renders boards and marks only the active one', () => {
    render(createProps({ boards, activeBoardId: 'a' }));
    const rows = dom.host.querySelectorAll('li');
    expect(rows).toHaveLength(2);
    expect(rows[0].querySelector('svg')).toBeTruthy();
    expect(rows[0].textContent).toContain('Project office');
    expect(rows[0].querySelector('[aria-current="true"]')).toBeTruthy();
    expect(rows[1].querySelector('[aria-current]')).toBeNull();
  });

  it('selects a board exactly once', () => {
    const props = createProps({ boards });
    render(props);
    click(dom.host.querySelectorAll<HTMLElement>('li > button[title]')[1]);
    expect(props.onSelectBoard).toHaveBeenCalledTimes(1);
    expect(props.onSelectBoard).toHaveBeenCalledWith(boards[1]);
  });

  it('edit and delete never select the board', () => {
    const props = createProps({ boards });
    render(props);
    click(button('Edit Project office'));
    click(button('Delete Project office'));
    expect(props.onEditBoard).toHaveBeenCalledExactlyOnceWith(boards[0]);
    expect(props.onDeleteBoard).toHaveBeenCalledExactlyOnceWith(boards[0]);
    expect(props.onSelectBoard).not.toHaveBeenCalled();
  });

  it('keeps edit and delete as siblings of the select button', () => {
    render(createProps({ boards }));
    expect(dom.host.querySelectorAll('button button')).toHaveLength(0);
  });

  it('creates only through the plus button, not its label', () => {
    const props = createProps();
    render(props);
    const label = Array.from(dom.host.querySelectorAll('span')).find(
      (element) => element.textContent?.startsWith('Create a') && element.querySelector('br') !== null,
    )!;
    click(label);
    expect(props.onCreateBoard).not.toHaveBeenCalled();
    click(button('Create a new board'));
    expect(props.onCreateBoard).toHaveBeenCalledTimes(1);
  });

  it('opens help', () => {
    const props = createProps();
    render(props);
    click(button('Need help?'));
    expect(props.onOpenHelp).toHaveBeenCalledTimes(1);
  });

  it('keeps the full long title as name and tooltip', () => {
    const title = 'A very long board title that must be truncated visually but remain readable';
    render(createProps({ boards: [{ id: 'long', title, icon: 'star' }] }));
    const select = dom.host.querySelector<HTMLButtonElement>('li > button[title]')!;
    expect(select.getAttribute('title')).toBe(title);
    expect(select.textContent).toBe(title);
    expect(button(`Edit ${title}`)).toBeTruthy();
  });

  it('logs out once and disables the control while pending', () => {
    const props = createProps();
    render(props);
    click(button('Log out'));
    expect(props.onLogout).toHaveBeenCalledTimes(1);
    render(createProps({ ...props, logoutPending: true }));
    expect(button('Log out').disabled).toBe(true);
  });
});
