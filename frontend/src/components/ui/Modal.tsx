import { useEffect, useId, useRef, type ReactNode, type RefObject } from 'react';
import { Heading } from './Typography';
import { IconButton } from './IconButton';
export type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  initialFocusRef?: RefObject<HTMLElement | null>;
  closeLabel?: string;
};
/** Controlled native dialog: native top layer plus keyboard edge wrapping. */
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
      className="ui-modal"
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
      <div className="ui-modal__header">
        <Heading id={`${id}-title`} tabIndex={-1} data-modal-heading>
          {title}
        </Heading>
        <IconButton icon="close" variant="secondary" aria-label={closeLabel} onClick={onClose} />
      </div>
      {description && (
        <p id={`${id}-description`} className="ui-modal__description">
          {description}
        </p>
      )}
      {children}
    </dialog>
  );
}
