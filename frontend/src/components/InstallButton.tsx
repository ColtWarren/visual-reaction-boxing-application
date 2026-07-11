import { useRef, useState } from 'react';
import type { InstallPromptState } from '../hooks/useInstallPrompt';
import { IosInstallTooltip } from './IosInstallTooltip';

interface InstallButtonProps {
  /** The shared install model from AppShell's single useInstallPrompt() call. */
  installPrompt: InstallPromptState;
}

/**
 * Install affordance in the sidebar bottom slot (Block 15). Presentational — it
 * never calls useInstallPrompt; AppShell owns the hook and threads the model in.
 *
 * Hidden entirely when there's nothing to offer: platform 'unsupported' (covers
 * installed + unsupported engines), or Chromium with no captured prompt yet.
 * Chromium click fires the native prompt; iOS click toggles the manual tooltip.
 */
export function InstallButton({ installPrompt }: InstallButtonProps) {
  const { platform, canTriggerInstall, triggerInstall } = installPrompt;
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  if (platform === 'unsupported') return null;
  if (platform === 'chromium' && !canTriggerInstall) return null;

  const handleClick = () => {
    if (platform === 'ios') {
      setTooltipOpen((open) => !open);
    } else {
      void triggerInstall();
    }
  };

  // Guards above have excluded 'unsupported' and chromium-without-prompt, so only
  // 'ios' and 'chromium' reach here — no third label case.
  const label = platform === 'ios' ? 'How to install' : 'Install app';

  return (
    <div className="relative px-3 py-2">
      <button
        ref={buttonRef}
        type="button"
        onClick={handleClick}
        aria-expanded={platform === 'ios' ? tooltipOpen : undefined}
        className="flex min-h-11 w-full items-center justify-center rounded-lg border border-rd-border-default px-3 text-sm font-medium text-rd-text-secondary transition-colors hover:bg-rd-bg-surface hover:text-rd-text-primary"
      >
        {label}
      </button>

      {platform === 'ios' && tooltipOpen && (
        <IosInstallTooltip
          onClose={() => setTooltipOpen(false)}
          returnFocusTo={buttonRef}
        />
      )}
    </div>
  );
}
