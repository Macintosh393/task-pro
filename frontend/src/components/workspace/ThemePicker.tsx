import { useEffect, useId, useRef, useState, useSyncExternalStore } from 'react';
import { Button } from '../ui';

const themes = ['light', 'dark', 'violet'] as const;
type Theme = (typeof themes)[number];
function getTheme(): Theme {
  const value = document.documentElement.dataset.theme;
  return themes.find((theme) => theme === value) ?? 'dark';
}
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  return () => observer.disconnect();
}

export function ThemePicker() {
  const theme = useSyncExternalStore(subscribe, getTheme);
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const container = useRef<HTMLDivElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    menu.current?.querySelector<HTMLElement>('[aria-checked="true"]')?.focus();
    const dismiss = (event: PointerEvent) => {
      if (!container.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', dismiss);
    return () => document.removeEventListener('pointerdown', dismiss);
  }, [open]);

  function close() {
    setOpen(false);
    trigger.current?.focus();
  }

  return (
    <div
      ref={container}
      className="relative shrink-0"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && open) {
          event.preventDefault();
          event.stopPropagation();
          close();
        }
      }}
    >
      <Button
        ref={trigger}
        variant="ghost"
        size="small"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen(!open)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            if (open) menu.current?.querySelector<HTMLElement>('[aria-checked="true"]')?.focus();
            else setOpen(true);
          }
        }}
        className="gap-1 border-0 px-0 text-primary/80 enabled:hover:text-primary"
      >
        Theme
        <span
          aria-hidden="true"
          className="size-4 bg-current [mask-image:url(/src/assets/workspace/chevron-down.svg)] [mask-position:center] [mask-size:contain] [mask-repeat:no-repeat]"
        />
      </Button>
      {open && (
        <div
          ref={menu}
          id={id}
          role="menu"
          aria-label="Theme"
          className="absolute top-full right-0 z-20 w-[100px] rounded-lg border border-field-accent bg-surface-filters px-4 py-[15px] shadow-field [html[data-theme=violet]_&]:border-avatar-surface"
          onKeyDown={(event) => {
            if (event.key === 'Tab') {
              if (event.shiftKey) event.preventDefault();
              close();
              return;
            }
            const items = Array.from(
              event.currentTarget.querySelectorAll<HTMLButtonElement>('button'),
            );
            const index = items.indexOf(document.activeElement as HTMLButtonElement);
            let next: number;
            if (event.key === 'ArrowDown') next = (index + 1) % items.length;
            else if (event.key === 'ArrowUp') next = (index + items.length - 1) % items.length;
            else if (event.key === 'Home') next = 0;
            else if (event.key === 'End') next = items.length - 1;
            else return;
            event.preventDefault();
            items[next]?.focus();
          }}
        >
          {themes.map((value) => (
            <Button
              key={value}
              variant="ghost"
              size="small"
              role="menuitemradio"
              aria-checked={theme === value}
              tabIndex={theme === value ? 0 : -1}
              className="min-h-[25px] w-full justify-start rounded-sm border-0 p-0 leading-[21px] font-normal aria-checked:text-icon-action-active aria-checked:underline aria-checked:decoration-2 aria-checked:underline-offset-4 [html[data-theme=light]_&]:aria-checked:text-primary"
              onClick={() => {
                document.documentElement.dataset.theme = value;
                close();
              }}
            >
              {value[0].toUpperCase() + value.slice(1)}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
