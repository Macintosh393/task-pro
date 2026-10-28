import { Avatar, type AvatarProps } from '../Avatar';
import { Icon } from '../Icon';

export type AvatarUploadProps = AvatarProps & {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
  uploadLabel?: string;
};
/** File selection only. The consumer owns validation, preview and persistence. */
export function AvatarUpload({
  onFileSelect,
  disabled = false,
  uploadLabel = 'Upload avatar',
  ...props
}: AvatarUploadProps) {
  return (
    <div className="ui-avatar-upload">
      <Avatar {...props} />
      <label className="ui-avatar-upload__action">
        <input
          type="file"
          accept="image/*"
          aria-label={uploadLabel}
          disabled={disabled}
          onChange={(event) => {
            const file = event.currentTarget.files?.[0];
            event.currentTarget.value = '';
            if (file) onFileSelect(file);
          }}
        />
        <span className="ui-avatar-upload__tile">
          <Icon name="plus" size={10} />
        </span>
      </label>
    </div>
  );
}
