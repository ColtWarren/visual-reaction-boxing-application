/**
 * Step 13 Block 2 — Settings route placeholder. Real content arrives in
 * Block 8. First consumer (with AboutView) of the Block 0b --rd-* color
 * tokens, so the bg-rd and text-rd utilities begin emitting from here.
 */
export function SettingsView() {
  return (
    <div className="min-h-dvh w-full bg-rd-bg-base p-8 text-rd-text-primary">
      <h1 className="text-2xl">Settings</h1>
      <p className="text-rd-text-muted">Content arrives in Block 8.</p>
    </div>
  );
}
