import { Avatar, type AvatarProps } from '../Avatar';
import { Icon } from '../Icon';

export type AvatarUploadProps = AvatarProps & {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
  uploadLabel?: string;
};
export function AvatarUpload({
  onFileSelect,
  disabled = false,
  uploadLabel = 'Upload avatar',
  ...props
}: AvatarUploadProps) {
  return (
    <div className="ui-avatar-upload relative w-[68px] pb-5">
      <Avatar {...props} />
      <label className="group/upload absolute top-11 left-3 grid size-11 place-items-center rounded-md has-focus-visible:outline-2 has-focus-visible:outline-solid has-focus-visible:outline-focus-ring has-focus-visible:outline-offset-2">
        <input
          type="file"
          className="absolute inset-0 size-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
          accept="image/*"
          aria-label={uploadLabel}
          disabled={disabled}
          onChange={(event) => {
            const file = event.currentTarget.files?.[0];
            event.currentTarget.value = '';
            if (file) onFileSelect(file);
          }}
        />
        <span className="pointer-events-none grid size-6 place-items-center rounded-md bg-avatar-add-surface text-avatar-add-ink group-has-disabled/upload:bg-control-disabled-surface group-has-disabled/upload:text-control-disabled-text">
          <Icon name="plus" size={10} />
        </span>
      </label>
    </div>
  );
}
