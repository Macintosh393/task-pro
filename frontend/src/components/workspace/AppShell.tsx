import {
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentPropsWithRef,
  type ReactNode,
} from 'react';

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
    if (!navigationOpen || desktop) return;
    const root = document.documentElement;
    const alreadyLocked = root.classList.contains('overflow-hidden!');
    root.classList.add('overflow-hidden!');
    return () => {
      if (!alreadyLocked) root.classList.remove('overflow-hidden!');
    };
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
    <div className="app-shell flex h-dvh w-full overflow-hidden bg-surface-canvas text-primary">
      {desktop && (
        <aside
          ref={sidebarRef}
          tabIndex={-1}
          aria-label="Workspace navigation"
          className="app-shell__sidebar min-h-0 basis-[260px] grow-0 shrink-0 overflow-y-auto bg-surface-sidebar text-sidebar"
        >
          {sidebar({ closeNavigation })}
        </aside>
      )}
      <div className="app-shell__workspace flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="app-shell__header flex min-h-[60px] shrink-0 items-center gap-2 bg-surface-header px-5 py-2 min-[768px]:min-h-[68px] min-[768px]:px-8 min-[1440px]:px-6">
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
        <main className="app-shell__content min-h-0 min-w-0 flex-1 overflow-hidden px-5 pt-3.5 pb-5 min-[768px]:px-8 min-[768px]:pt-[26px] min-[768px]:pb-8 min-[1440px]:px-6 min-[1440px]:pt-2.5 min-[1440px]:pb-2">
          {children}
        </main>
      </div>
      {!desktop && (
        <div
          className="app-shell__swipe-edge fixed top-[60px] bottom-0 left-0 z-1 w-5 touch-pan-y min-[768px]:top-[68px]"
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
        className="app-shell__drawer fixed top-0 right-auto bottom-0 left-0 m-0 h-dvh max-h-none w-[min(225px,100vw-44px)] max-w-none overflow-y-auto overscroll-contain border-0 bg-surface-sidebar p-0 text-sidebar backdrop:bg-modal-backdrop open:flex open:flex-col min-[768px]:w-[260px]"
        onKeyDown={(event) => {
          if (event.key !== 'Tab' || event.defaultPrevented) return;
          const controls = Array.from(
            event.currentTarget.querySelectorAll<HTMLElement>(
              'a[href], button, input, select, textarea, summary, [tabindex], [contenteditable="true"]',
            ),
          ).filter(
            (element) =>
              element.tabIndex >= 0 &&
              !element.matches(':disabled, input[type="hidden"]') &&
              !element.closest('[hidden], [inert]') &&
              getComputedStyle(element).visibility === 'visible' &&
              element.getClientRects().length > 0,
          );
          const first = controls[0];
          const last = controls[controls.length - 1];
          if (
            event.shiftKey &&
            (document.activeElement === first ||
              !controls.includes(document.activeElement as HTMLElement))
          ) {
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
        {!desktop && sidebar({ closeNavigation })}
      </dialog>
    </div>
  );
}
