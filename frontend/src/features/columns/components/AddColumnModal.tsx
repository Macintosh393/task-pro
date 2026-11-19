import { useForm } from '@tanstack/react-form';
import { useEffect, useRef, useState, type RefObject } from 'react';
import { Button, FormField, Input, Modal } from '../../../components/ui';
import { firstErrorMessage, serverErrorMessage } from '../../../lib/form-errors';
import { useCreateColumn } from '../hooks/use-create-column';
import type { Column } from '../types';
import { createColumnDefaults, createColumnSchema } from '../validation/create-column.schema';

export interface AddColumnModalProps {
  open: boolean;
  userId: string;
  boardId: string;
  onClose: () => void;
  onCreated: (column: Column) => void;
}

export function AddColumnModal({ open, userId, boardId, onClose, onCreated }: AddColumnModalProps) {
  const titleRef = useRef<HTMLInputElement>(null);
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add column"
      size="compact"
      initialFocusRef={titleRef}
    >
      {open && (
        <AddColumnForm
          userId={userId}
          boardId={boardId}
          titleRef={titleRef}
          onCreated={onCreated}
        />
      )}
    </Modal>
  );
}

interface AddColumnFormProps {
  userId: string;
  boardId: string;
  titleRef: RefObject<HTMLInputElement | null>;
  onCreated: (column: Column) => void;
}

function AddColumnForm({ userId, boardId, titleRef, onCreated }: AddColumnFormProps) {
  const createColumn = useCreateColumn(userId, boardId);
  const [serverError, setServerError] = useState<string | null>(null);
  // Closing the modal while the request is pending still adds the column to the board,
  // but onCreated must not fire for a form the user already dismissed.
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const form = useForm({
    defaultValues: createColumnDefaults,
    validators: { onChange: createColumnSchema, onSubmit: createColumnSchema },
    onSubmit: async ({ value }) => {
      setServerError(null);
      try {
        const column = await createColumn.mutateAsync(createColumnSchema.parse(value));
        if (mounted.current) onCreated(column);
      } catch (error) {
        if (mounted.current) {
          setServerError(serverErrorMessage(error, 'Could not add the column. Please try again.'));
        }
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
      <form.Subscribe selector={(state) => state.isSubmitting}>
        {(isSubmitting) => (
          <Button
            type="submit"
            fullWidth
            leadingIcon="boxed-plus"
            loading={isSubmitting}
            className="mt-6"
          >
            Add
          </Button>
        )}
      </form.Subscribe>
    </form>
  );
}
