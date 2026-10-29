import { useEffect, useId, useRef, type ReactNode, type RefObject } from 'react';
import { Heading } from '../Heading';
import { IconButton } from '../IconButton';
export type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  initialFocusRef?: RefObject<HTMLElement | null>;
  closeLabel?: string;
};
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  initialFocusRef,
  closeLabel = 'Close dialog',
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
      className="ui-modal m-auto box-border max-h-[calc(100dvh-32px)] w-[min(480px,calc(100vw-32px))] max-w-none overflow-auto rounded-lg border border-control-border bg-surface-filters p-6 font-ui text-primary backdrop:bg-modal-backdrop [&_:focus-visible]:outline-2 [&_:focus-visible]:outline-solid [&_:focus-visible]:outline-focus-ring [&_:focus-visible]:outline-offset-2"
      aria-labelledby={`${id}-title`}
      aria-describedby={description ? `${id}-description` : undefined}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
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
      <div className="mb-4 flex items-start justify-between gap-4">
        <Heading id={`${id}-title`} tabIndex={-1} data-modal-heading>
          {title}
        </Heading>
        <IconButton
          icon="close"
          iconSize={18}
          variant="ghost"
          aria-label={closeLabel}
          onClick={onClose}
        />
      </div>
      {description && (
        <p id={`${id}-description`} className="mt-0 mb-4 text-sm text-control-muted wrap-anywhere">
          {description}
        </p>
      )}
      {children}
    </dialog>
  );
}
