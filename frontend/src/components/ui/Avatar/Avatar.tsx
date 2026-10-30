import { cn } from '../cn';
import { useState, type ComponentPropsWithRef } from 'react';
import { Icon } from '../Icon';

export type AvatarProps = ComponentPropsWithRef<'div'> & { src?: string; name: string };
export function Avatar({ src, name, className = '', ...props }: AvatarProps) {
  const [failedSource, setFailedSource] = useState<string>();
  return (
    <div
      {...props}
      className={cn(
        'relative size-[68px] shrink-0 overflow-hidden rounded-lg bg-avatar-surface text-avatar-ink',
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
          className="absolute top-5 left-1.5 h-[77.688px] w-[55.753px]"
        />
      )}
    </div>
  );
}
