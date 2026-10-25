import { useId } from 'react';
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
    <fieldset className="ui-choice-group" disabled={disabled}>
      <legend>{label}</legend>
      <div className="ui-choice-group__options">
        {priorities.map((priority) => (
          <label className={`ui-choice ui-priority--${priority}`} key={priority}>
            <input
              type="radio"
              name={name ?? id}
              value={priority}
              checked={value === priority}
              onChange={() => onChange(priority)}
            />
            <span className="ui-priority-dot" aria-hidden="true" />
            <span className="ui-visually-hidden">{priorityLabels[priority]}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
