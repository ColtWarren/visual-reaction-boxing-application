/**
 * Cue — visual stimulus rendered on the training canvas.
 *
 * Step 4 (current): hardcoded red cue at left edge, vertically centered.
 *                   Represents "left hook → defend right" per MODE_SPECS.
 * Step 5+: will accept color and position props for dynamic rendering
 *          driven by the Stimulus Engine.
 *
 * Sizing: responsive — 120px on small phones, 150px at sm: breakpoint+
 *         (avoids dominating viewport on narrow devices like iPhone SE).
 * pointer-events-none: cue is visual output only; Step 6 input handler
 *                      will attach to <main> or document, not the cue.
 */
function Cue() {
  return (
    <div className="pointer-events-none absolute left-[5%] top-1/2 h-[120px] w-[120px] -translate-y-1/2 rounded-full bg-cue-red sm:h-[150px] sm:w-[150px]" />
  );
}

export default Cue;
