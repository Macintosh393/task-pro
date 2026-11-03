export function WorkspaceBoard() {
  return (
    <section
      className="workspace-board flex h-full min-h-0 min-w-0 flex-col"
      aria-label="Board workspace"
    >
      <div className="workspace-board__heading shrink-0 pb-[26px] min-[1440px]:pb-2">
        <h1 className="m-0 text-sm/6 font-medium wrap-anywhere min-[768px]:text-lg/7">
          Your workspace
        </h1>
      </div>
      <div
        className="workspace-canvas min-h-0 min-w-0 flex-1 overflow-auto overscroll-x-contain focus-visible:outline-(length:--focus-ring-width) focus-visible:outline-solid focus-visible:outline-focus-ring focus-visible:outline-offset-[-2px]"
        tabIndex={0}
        role="region"
        aria-label="Board canvas"
      >
        <p className="workspace-empty m-auto max-w-[480px] py-6 text-[14px] text-text-description">
          Your boards and projects will appear here.
        </p>
      </div>
    </section>
  );
}
