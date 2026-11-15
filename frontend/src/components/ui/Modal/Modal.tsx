import { useEffect, useId, useRef, type ReactNode, type RefObject } from 'react';
import { Heading } from '../Heading';
import { IconButton } from '../IconButton';
import { cn } from '../cn';
export type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  initialFocusRef?: RefObject<HTMLElement | null>;
  closeLabel?: string;
  variant?: 'default' | 'compact';
  closeDisabled?: boolean;
};
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  initialFocusRef,
  closeLabel = 'Close dialog',
  variant = 'default',
  closeDisabled = false,
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const id = useId();
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!open || !dialog) return;
    const previous = document.activeElement;
    dialog.showModal();
    const target = initialFocusRef?.current;
    if (target && dialog.contains(target)) target.focus();
    else dialog.querySelector<HTMLElement>('[data-modal-heading]')?.focus();
    return () => {
      dialog.close();
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus();
    };
  }, [open, initialFocusRef]);
  return (
    <dialog
      ref={dialogRef}
      className={cn(
        'ui-modal m-auto box-border max-h-[calc(100dvh-32px)] w-[min(480px,calc(100vw-32px))] max-w-none overflow-auto rounded-lg border border-control-border bg-surface-filters p-6 font-ui text-primary backdrop:bg-modal-backdrop [&_:focus-visible]:outline-(length:--focus-ring-width) [&_:focus-visible]:outline-solid [&_:focus-visible]:outline-focus-ring [&_:focus-visible]:outline-offset-(--focus-ring-offset)',
        variant === 'compact' &&
          'relative w-[min(400px,calc(100vw-40px))] border-border-filters p-[23px] shadow-[0_4px_8px_color-mix(in_srgb,var(--action-neutral)_5%,transparent)]',
      )}
      aria-labelledby={`${id}-title`}
      aria-describedby={description ? `${id}-description` : undefined}
      onCancel={(event) => {
        event.preventDefault();
        if (!closeDisabled) onClose();
      }}
      onKeyDown={(event) => {
        if (event.key !== 'Tab' || event.defaultPrevented) return;
        const dialog = event.currentTarget;
        const focusable = [
          ...dialog.querySelectorAll<HTMLElement>(
            'a[href], button, input, select, textarea, summary, [tabindex], [contenteditable="true"]',
          ),
        ].filter(
          (element) =>
            element.tabIndex >= 0 &&
            !element.matches(':disabled, input[type="hidden"]') &&
            !element.closest('[hidden], [inert]') &&
            getComputedStyle(element).visibility === 'visible' &&
            element.getClientRects().length > 0,
        );
        const first = focusable[0];
        const last = focusable.at(-1);
        const active = document.activeElement;
        if (!first) {
          event.preventDefault();
          dialog.querySelector<HTMLElement>('[data-modal-heading]')?.focus();
        } else if (
          event.shiftKey &&
          (active === first || !focusable.includes(active as HTMLElement))
        ) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && active === last) {
          event.preventDefault();
          first.focus();
        }
      }}
    >
      <div
        className={cn(
          'mb-4 flex items-start justify-between gap-4',
          variant === 'compact' && 'mb-6',
        )}
      >
        <Heading
          id={`${id}-title`}
          tabIndex={-1}
          data-modal-heading
          className={variant === 'compact' ? 'leading-normal' : undefined}
        >
          {title}
        </Heading>
        <IconButton
          icon="close"
          iconSize={18}
          variant="ghost"
          aria-label={closeLabel}
          onClick={onClose}
          disabled={closeDisabled}
          className={
            variant === 'compact'
              ? 'absolute top-0 right-0 size-11 min-h-11 border-0 text-primary'
              : undefined
          }
        />
      </div>
      {description && (
        <p
          id={`${id}-description`}
          className="mt-0 mb-4 text-sm/normal text-control-muted wrap-anywhere"
        >
          {description}
        </p>
      )}
      {children}
    </dialog>
  );
}
