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
  /** `compact` uses 32px targets so all eight icons fit one row of a 350px modal. */
  size?: 'default' | 'compact';
};

export function BoardIconPicker({
  value,
  onChange,
  name,
  label = 'Board icon',
  disabled,
  size = 'default',
}: BoardIconPickerProps) {
  const compact = size === 'compact';
  const id = useId();
  return (
    <fieldset className="m-0 min-w-0 border-0 p-0" disabled={disabled}>
      <legend className={cn('text-sm/[21px] font-medium', compact ? 'mb-2' : 'mb-1.5')}>
        {label}
      </legend>
      <div className={cn('flex flex-wrap', compact && '-mx-[7px]')}>
        {boardIcons.map((icon) => (
          <label
            className={cn(
              choiceStyles,
              compact && 'size-8',
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
