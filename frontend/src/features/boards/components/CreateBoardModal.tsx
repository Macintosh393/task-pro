import { useForm } from '@tanstack/react-form';
import { useEffect, useRef, useState, type RefObject } from 'react';
import {
  BoardBackgroundPicker,
  BoardIconPicker,
  Button,
  FormField,
  Input,
  Modal,
} from '../../../components/ui';
import { useCreateBoard } from '../hooks/use-create-board';
import type { Board } from '../types';
import { createBoardDefaults, createBoardSchema } from '../validation/create-board.schema';

export interface CreateBoardModalProps {
  open: boolean;
  userId: string;
  onClose: () => void;
  onCreated: (board: Board) => void;
}

export function CreateBoardModal({ open, userId, onClose, onCreated }: CreateBoardModalProps) {
  const titleRef = useRef<HTMLInputElement>(null);
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New board"
      size="compact"
      initialFocusRef={titleRef}
    >
      {open && <CreateBoardForm userId={userId} titleRef={titleRef} onCreated={onCreated} />}
    </Modal>
  );
}

function serverErrorMessage(error: unknown): string {
  const message = (error as { response?: { data?: { message?: unknown } } })?.response?.data
    ?.message;
  if (Array.isArray(message) && message.length > 0) return message.join(', ');
  if (typeof message === 'string' && message) return message;
  return 'Could not create the board. Please try again.';
}

function firstErrorMessage(errors: readonly unknown[]): string | undefined {
  const error = errors[0];
  if (!error) return undefined;
  if (typeof error === 'string') return error;
  return (error as { message?: string }).message;
}

interface CreateBoardFormProps {
  userId: string;
  titleRef: RefObject<HTMLInputElement | null>;
  onCreated: (board: Board) => void;
}

function CreateBoardForm({ userId, titleRef, onCreated }: CreateBoardFormProps) {
  const createBoard = useCreateBoard(userId);
  const [serverError, setServerError] = useState<string | null>(null);
  // Closing the modal while the request is pending keeps the new board in the list,
  // but must not redirect the user away from what they are doing now.
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const form = useForm({
    defaultValues: createBoardDefaults,
    validators: { onChange: createBoardSchema, onSubmit: createBoardSchema },
    onSubmit: async ({ value }) => {
      setServerError(null);
      try {
        const board = await createBoard.mutateAsync(createBoardSchema.parse(value));
        if (mounted.current) onCreated(board);
      } catch (error) {
        if (mounted.current) setServerError(serverErrorMessage(error));
      }
    },
  });

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void form.handleSubmit();
      }}
      className="flex flex-col"
    >
      {serverError && (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-action-danger bg-action-danger/10 p-3 text-xs font-medium wrap-anywhere text-action-danger"
        >
          {serverError}
        </div>
      )}
      <form.Subscribe selector={(state) => state.submissionAttempts > 0}>
        {(submitted) => (
          <form.Field name="title">
            {(field) => {
              const error =
                field.state.meta.isTouched || submitted
                  ? firstErrorMessage(field.state.meta.errors)
                  : undefined;
              return (
                <FormField label="Title" labelClassName="sr-only" error={error}>
                  <Input
                    ref={titleRef}
                    name={field.name}
                    placeholder="Title"
                    autoComplete="off"
                    maxLength={255}
                    value={field.state.value}
                    onChange={(event) => field.handleChange(event.target.value)}
                    onBlur={field.handleBlur}
                  />
                </FormField>
              );
            }}
          </form.Field>
        )}
      </form.Subscribe>
      <div className="mt-6">
        <form.Field name="icon">
          {(field) => (
            <BoardIconPicker
              name="board-icon"
              label="Icons"
              size="compact"
              value={field.state.value}
              onChange={field.handleChange}
            />
          )}
        </form.Field>
      </div>
      <div className="mt-6">
        <form.Field name="background">
          {(field) => (
            <BoardBackgroundPicker
              name="board-background"
              value={field.state.value}
              onChange={field.handleChange}
            />
          )}
        </form.Field>
      </div>
      <form.Subscribe selector={(state) => state.isSubmitting}>
        {(isSubmitting) => (
          <Button
            type="submit"
            fullWidth
            leadingIcon="boxed-plus"
            loading={isSubmitting}
            className="mt-10"
          >
            Create
          </Button>
        )}
      </form.Subscribe>
    </form>
  );
}
