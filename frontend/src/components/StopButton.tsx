interface StopButtonProps {
  onClick: () => void;
}

/**
 * Shared Stop control for the in-session top bar (RunningView + RestView).
 * Consolidates the styling that previously drifted between RunningView's inline
 * button and RestView's STOP_BUTTON_CLASS/STYLE constants (audit B.3).
 *
 * `pointer-events-auto` + `z-30` keep it the topmost hit-test target above the
 * pointer-events-none TopBar container and the z-10 touch zones, so a Stop tap
 * is never classified as a defense. `stopPropagation` on pointerdown is
 * defensive (belt-and-suspenders, MC3). Native <button> → Enter/Space work.
 */
export function StopButton({ onClick }: StopButtonProps) {
  return (
    <button
      type="button"
      data-testid="top-bar-stop"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={onClick}
      className="pointer-events-auto z-30 rounded-lg border border-rd-border-subtle bg-rd-bg-elevated/80 px-4 py-2 text-sm font-medium uppercase tracking-wider text-rd-text-primary backdrop-blur-sm"
    >
      Stop
    </button>
  );
}
