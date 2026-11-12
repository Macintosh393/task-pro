import { useId } from 'react';
import { cn } from '../cn';
import { radioStyles } from '../control-styles';
import { Icon } from '../Icon';
import bg01 from '../../../assets/board-backgrounds/picker/bg-01.png';
import bg02 from '../../../assets/board-backgrounds/picker/bg-02.png';
import bg03 from '../../../assets/board-backgrounds/picker/bg-03.png';
import bg04 from '../../../assets/board-backgrounds/picker/bg-04.png';
import bg05 from '../../../assets/board-backgrounds/picker/bg-05.png';
import bg06 from '../../../assets/board-backgrounds/picker/bg-06.png';
import bg07 from '../../../assets/board-backgrounds/picker/bg-07.png';
import bg08 from '../../../assets/board-backgrounds/picker/bg-08.png';
import bg09 from '../../../assets/board-backgrounds/picker/bg-09.png';
import bg10 from '../../../assets/board-backgrounds/picker/bg-10.png';
import bg11 from '../../../assets/board-backgrounds/picker/bg-11.png';
import bg12 from '../../../assets/board-backgrounds/picker/bg-12.png';
import bg13 from '../../../assets/board-backgrounds/picker/bg-13.png';
import bg14 from '../../../assets/board-backgrounds/picker/bg-14.png';
import bg15 from '../../../assets/board-backgrounds/picker/bg-15.png';

const boardBackgrounds = [
  'none',
  'bg-01',
  'bg-02',
  'bg-03',
  'bg-04',
  'bg-05',
  'bg-06',
  'bg-07',
  'bg-08',
  'bg-09',
  'bg-10',
  'bg-11',
  'bg-12',
  'bg-13',
  'bg-14',
  'bg-15',
] as const;
export type BoardBackground = (typeof boardBackgrounds)[number];

const previews: Record<Exclude<BoardBackground, 'none'>, string> = {
  'bg-01': bg01,
  'bg-02': bg02,
  'bg-03': bg03,
  'bg-04': bg04,
  'bg-05': bg05,
  'bg-06': bg06,
  'bg-07': bg07,
  'bg-08': bg08,
  'bg-09': bg09,
  'bg-10': bg10,
  'bg-11': bg11,
  'bg-12': bg12,
  'bg-13': bg13,
  'bg-14': bg14,
  'bg-15': bg15,
};

const backgroundLabel = (background: BoardBackground) =>
  background === 'none' ? 'No background' : `Background ${Number(background.slice(3))}`;

export type BoardBackgroundPickerProps = {
  value: BoardBackground;
  onChange: (value: BoardBackground) => void;
  name?: string;
  label?: string;
  disabled?: boolean;
};

export function BoardBackgroundPicker({
  value,
  onChange,
  name,
  label = 'Background',
  disabled,
}: BoardBackgroundPickerProps) {
  const id = useId();
  return (
    <fieldset className="m-0 min-w-0 border-0 p-0" disabled={disabled}>
      <legend className="mb-3.5 text-sm/[21px] font-medium">{label}</legend>
      <div className="grid w-max max-w-full grid-cols-[repeat(8,28px)] gap-1">
        {boardBackgrounds.map((background) => (
          <label
            className={cn(
              'relative inline-flex size-7 shrink-0 cursor-pointer rounded-md',
              'has-disabled:cursor-not-allowed has-disabled:opacity-60',
              'has-checked:after:pointer-events-none has-checked:after:absolute has-checked:after:-inset-0.5 has-checked:after:rounded-lg has-checked:after:border-2 has-checked:after:border-field-accent',
            )}
            key={background}
          >
            <input
              type="radio"
              className={radioStyles}
              name={name ?? id}
              value={background}
              checked={value === background}
              onChange={() => onChange(background)}
            />
            {background === 'none' ? (
              <span className="pointer-events-none flex size-7 items-center justify-center rounded-md bg-surface-canvas text-primary/10">
                <Icon name="picture" size={16} />
              </span>
            ) : (
              <img
                src={previews[background]}
                alt=""
                width={28}
                height={28}
                draggable={false}
                className="pointer-events-none size-7 rounded-md object-cover"
              />
            )}
            <span className="sr-only">{backgroundLabel(background)}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
