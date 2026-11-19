import { cn } from '../cn';
import { choiceStyles, radioStyles } from '../control-styles';
import { useId } from 'react';
import { Icon } from '../Icon';
import { boardIcons, type BoardIcon } from './board-icons';
export type { BoardIcon };
const boardLabels = {
  project: 'Project',
  star: 'Star',
  loading: 'Loading',
  puzzle: 'Puzzle',
  container: 'Container',
  lightning: 'Lightning',
  colors: 'Colors',
  hexagon: 'Hexagon',
};
export type BoardIconPickerProps = {
  value: BoardIcon;
  onChange: (value: BoardIcon) => void;
  name?: string;
  label?: string;
  disabled?: boolean;
};

export function BoardIconPicker({
  value,
  onChange,
  name,
  label = 'Board icon',
  disabled,
}: BoardIconPickerProps) {
  const id = useId();
  return (
    <fieldset className="m-0 min-w-0 border-0 p-0" disabled={disabled}>
      <legend className="mb-3.5 text-sm/[21px] font-medium">{label}</legend>
      <div className="flex flex-wrap gap-1">
        {boardIcons.map((icon) => (
          <label
            className={cn(
              choiceStyles,
              'size-7 text-control-muted has-checked:text-primary has-checked:after:pointer-events-none has-checked:after:absolute has-checked:after:-inset-0.5 has-checked:after:rounded-lg has-checked:after:border-2 has-checked:after:border-field-accent',
            )}
            key={icon}
          >
            <input
              type="radio"
              className={radioStyles}
              name={name ?? id}
              value={icon}
              checked={value === icon}
              onChange={() => onChange(icon)}
            />
            <Icon name={icon} size={18} />
            <span className="sr-only">{boardLabels[icon]}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
