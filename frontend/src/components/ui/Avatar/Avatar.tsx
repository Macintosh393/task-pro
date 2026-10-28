import { useState, type ComponentPropsWithRef } from 'react';
import { Icon } from '../Icon';

export type AvatarProps = ComponentPropsWithRef<'div'> & { src?: string; name: string };
export function Avatar({ src, name, className = '', ...props }: AvatarProps) {
  const [failedSource, setFailedSource] = useState<string>();
  return (
    <div {...props} className={`ui-avatar ${className}`}>
      {src && src !== failedSource ? (
        <img src={src} alt={name} onError={() => setFailedSource(src)} />
      ) : (
        <Icon name="avatar" size={68} label={name} className="ui-avatar__placeholder" />
      )}
    </div>
  );
}
