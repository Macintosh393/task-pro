import { cva } from 'class-variance-authority';
import { cn } from '../cn';
import { choiceStyles, radioStyles } from '../control-styles';
import { useId } from 'react';
const priorityVariants = cva(choiceStyles, {
  variants: {
    priority: {
      none: '[--priority-color:var(--priority-none)]',
      low: '[--priority-color:var(--priority-low)]',
      medium: '[--priority-color:var(--priority-medium)]',
      high: '[--priority-color:var(--priority-high)]',
    },
  },
});
const priorities = ['none', 'low', 'medium', 'high'] as const;
export type Priority = (typeof priorities)[number];
const priorityLabels = { none: 'Without priority', low: 'Low', medium: 'Medium', high: 'High' };
export type PriorityControlProps = {
  value: Priority;
  onChange: (value: Priority) => void;
  name?: string;
  label?: string;
  disabled?: boolean;
};

export function PriorityControl({
  value,
  onChange,
  name,
  label = 'Priority',
  disabled,
}: PriorityControlProps) {
  const id = useId();
  return (
    <fieldset className="m-0 min-w-0 border-0 p-0" disabled={disabled}>
      <legend className="mb-1.5 text-sm/[21px] font-medium">{label}</legend>
      <div className="flex flex-wrap">
        {priorities.map((priority) => (
          <label className={cn(priorityVariants({ priority }))} key={priority}>
            <input
              type="radio"
              className={radioStyles}
              name={name ?? id}
              value={priority}
              checked={value === priority}
              onChange={() => onChange(priority)}
            />
            <span
              className="pointer-events-none grid size-3.5 place-items-center rounded-full bg-(--priority-color) peer-checked:border peer-checked:border-(--priority-color) peer-checked:bg-transparent peer-checked:after:size-2 peer-checked:after:rounded-full peer-checked:after:bg-(--priority-color)"
              aria-hidden="true"
            />
            <span className="sr-only">{priorityLabels[priority]}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
