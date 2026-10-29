import { cn } from '../cn';
import { choiceStyles, radioStyles } from '../control-styles';
import { useId } from 'react';
import { Icon } from '../Icon';
const boardIcons = [
  'project',
  'star',
  'loading',
  'puzzle',
  'container',
  'lightning',
  'colors',
  'hexagon',
] as const;
export type BoardIcon = (typeof boardIcons)[number];
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
    <fieldset className="ui-choice-group m-0 min-w-0 border-0 p-0" disabled={disabled}>
      <legend className="mb-1.5 text-sm/[21px] font-medium">{label}</legend>
      <div className="flex flex-wrap">
        {boardIcons.map((icon) => (
          <label
            className={cn(
              choiceStyles,
              'text-control-muted has-checked:text-primary has-checked:after:pointer-events-none has-checked:after:absolute has-checked:after:inset-[3px] has-checked:after:rounded-md has-checked:after:border has-checked:after:border-field-accent',
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
