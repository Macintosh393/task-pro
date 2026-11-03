import {
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentPropsWithRef,
  type ReactNode,
} from 'react';
import { Button } from '../ui';
import './AppShell.css';

export type NavigationButtonProps = ComponentPropsWithRef<'button'>;

export interface AppShellProps {
  header: (props: { menuButtonProps: NavigationButtonProps }) => ReactNode;
  sidebar: (props: { closeNavigation: () => void }) => ReactNode;
  children: ReactNode;
}

const desktopQuery = '(min-width: 1440px)';

export function AppShell({ header, sidebar, children }: AppShellProps) {
  const [desktop, setDesktop] = useState(() => window.matchMedia?.(desktopQuery).matches ?? false);
  const [navigationOpen, setNavigationOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const menuRef = useRef<HTMLButtonElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);
  const swipeStart = useRef<{ x: number; y: number } | null>(null);
  const navigationId = useId();

  const closeNavigation = () => setNavigationOpen(false);
  const openNavigation = () => {
    if (!desktop) setNavigationOpen(true);
  };

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (navigationOpen && !desktop && !dialog.open) dialog.showModal();
    else if ((!navigationOpen || desktop) && dialog.open) dialog.close();
  }, [navigationOpen, desktop]);

  useEffect(() => {
    const media = window.matchMedia?.(desktopQuery);
    if (!media) return;
    const handleChange = (event: MediaQueryListEvent) => {
      const wasOpen = Boolean(dialogRef.current?.open);
      const sidebarHadFocus = sidebarRef.current?.contains(document.activeElement);
      dialogRef.current?.close();
      setNavigationOpen(false);
      setDesktop(event.matches);
      if (wasOpen && event.matches) {
        requestAnimationFrame(() => sidebarRef.current?.focus());
      } else if (sidebarHadFocus && !event.matches) {
        requestAnimationFrame(() => menuRef.current?.focus());
      }
    };
    media.addEventListener('change', handleChange);
    return () => media.removeEventListener('change', handleChange);
  }, []);

  return (
    <div className="app-shell">
      {desktop && (
        <aside
          ref={sidebarRef}
          tabIndex={-1}
          aria-label="Workspace navigation"
          className="app-shell__sidebar"
        >
          {sidebar({ closeNavigation })}
        </aside>
      )}
      <div className="app-shell__workspace">
        <header className="app-shell__header">
          {header({
            menuButtonProps: {
              ref: menuRef,
              type: 'button',
              'aria-label': 'Open navigation',
              'aria-controls': navigationId,
              'aria-expanded': navigationOpen,
              onClick: openNavigation,
              hidden: desktop,
            },
          })}
        </header>
        <main className="app-shell__content">{children}</main>
      </div>
      {!desktop && (
        <div
          className="app-shell__swipe-edge"
          aria-hidden="true"
          onTouchStart={(event) => {
            const touch = event.touches[0];
            swipeStart.current = { x: touch.clientX, y: touch.clientY };
          }}
          onTouchEnd={(event) => {
            const start = swipeStart.current;
            const touch = event.changedTouches[0];
            swipeStart.current = null;
            if (start && touch.clientX - start.x > 60 && Math.abs(touch.clientY - start.y) < 40) {
              openNavigation();
            }
          }}
          onTouchCancel={() => {
            swipeStart.current = null;
          }}
        />
      )}
      <dialog
        ref={dialogRef}
        id={navigationId}
        aria-label="Workspace navigation"
        className="app-shell__drawer"
        onKeyDown={(event) => {
          if (event.key !== 'Tab') return;
          const controls = Array.from(
            event.currentTarget.querySelectorAll<HTMLElement>(
              'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
            ),
          ).filter((element) => element.getClientRects().length > 0);
          const first = controls[0];
          const last = controls[controls.length - 1];
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last?.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first?.focus();
          }
        }}
        onClose={(event) => {
          if (event.currentTarget.open) return;
          setNavigationOpen(false);
          if (!window.matchMedia?.(desktopQuery).matches) menuRef.current?.focus();
        }}
        onClick={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          if (
            event.target === event.currentTarget &&
            (event.clientX > rect.right || event.clientX < rect.left)
          ) {
            closeNavigation();
          }
        }}
        onTouchStart={(event) => {
          const touch = event.touches[0];
          swipeStart.current = { x: touch.clientX, y: touch.clientY };
        }}
        onTouchEnd={(event) => {
          const start = swipeStart.current;
          const touch = event.changedTouches[0];
          swipeStart.current = null;
          if (start && start.x - touch.clientX > 60 && Math.abs(touch.clientY - start.y) < 40)
            closeNavigation();
        }}
        onTouchCancel={() => {
          swipeStart.current = null;
        }}
      >
        {!desktop && (
          <>
            <Button
              variant="ghost"
              size="small"
              className="app-shell__close"
              onClick={closeNavigation}
            >
              Close navigation
            </Button>
            {sidebar({ closeNavigation })}
          </>
        )}
      </dialog>
    </div>
  );
}
