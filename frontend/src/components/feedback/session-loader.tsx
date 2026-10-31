export function SessionLoader() {
  return (
    <div
      role="status"
      aria-label="Loading authentication session"
      className="flex min-h-screen w-full items-center justify-center bg-surface-canvas p-4 text-primary"
    >
      <div className="flex flex-col items-center gap-3">
        <span
          className="ui-spinner size-8 animate-spin rounded-full border-2 border-action-primary border-r-transparent motion-reduce:animate-none"
          aria-hidden="true"
        />
        <p className="text-sm font-medium text-text-description">Loading authentication session...</p>
      </div>
    </div>
  );
}
