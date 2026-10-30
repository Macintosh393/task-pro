export const focusRing =
  'focus-visible:outline-(length:--focus-ring-width) focus-visible:outline-solid focus-visible:outline-focus-ring focus-visible:outline-offset-(--focus-ring-offset)';

export const fieldStyles = [
  'box-border w-full min-w-0 min-h-[49px] rounded-lg border border-control-border',
  'bg-field-surface px-4 py-[13px] font-ui text-sm/normal font-normal tracking-[-0.02em] text-primary shadow-field',
  'placeholder:text-control-muted placeholder:opacity-100',
  'enabled:focus:border-field-accent enabled:not-placeholder-shown:border-field-accent',
  'aria-invalid:border-text-error enabled:aria-invalid:focus:border-text-error enabled:aria-invalid:not-placeholder-shown:border-text-error',
  'disabled:cursor-not-allowed disabled:border-control-border disabled:bg-control-disabled-surface disabled:text-control-disabled-text',
  focusRing,
];

export const choiceStyles =
  'relative inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-md has-disabled:cursor-not-allowed has-disabled:opacity-60';

export const radioStyles = `peer absolute inset-0 m-0 size-full cursor-pointer appearance-none rounded-md disabled:cursor-not-allowed ${focusRing}`;
