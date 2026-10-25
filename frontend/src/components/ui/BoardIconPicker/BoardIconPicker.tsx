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
    <fieldset className="ui-choice-group" disabled={disabled}>
      <legend>{label}</legend>
      <div className="ui-choice-group__options">
        {boardIcons.map((icon) => (
          <label className="ui-choice ui-board-choice" key={icon}>
            <input
              type="radio"
              name={name ?? id}
              value={icon}
              checked={value === icon}
              onChange={() => onChange(icon)}
            />
            <Icon name={icon} size={18} />
            <span className="ui-visually-hidden">{boardLabels[icon]}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
