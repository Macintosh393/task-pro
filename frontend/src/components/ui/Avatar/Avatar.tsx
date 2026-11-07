import { cn } from '../cn';
import { useState, type ComponentPropsWithRef } from 'react';
import { Icon } from '../Icon';

export type AvatarProps = ComponentPropsWithRef<'div'> & {
  src?: string;
  name: string;
  size?: 32 | 68;
};
export function Avatar({ src, name, size = 68, className = '', ...props }: AvatarProps) {
  const [failedSource, setFailedSource] = useState<string>();
  return (
    <div
      {...props}
      className={cn(
        'relative shrink-0 overflow-hidden rounded-lg bg-avatar-surface text-avatar-ink',
        size === 32 ? 'size-8' : 'size-[68px]',
        className,
      )}
    >
      {src && src !== failedSource ? (
        <img
          className="size-full object-cover"
          src={src}
          alt={name}
          onError={() => setFailedSource(src)}
        />
      ) : (
        <Icon
          name="avatar"
          size={68}
          label={name}
          className={
            size === 32
              ? 'absolute top-[9.412px] left-[2.824px] h-[36.559px] w-[26.237px]'
              : 'absolute top-5 left-1.5 h-[77.688px] w-[55.753px]'
          }
        />
      )}
    </div>
  );
}
