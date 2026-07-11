import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Non-standard Chromium event fired before the install mini-infobar. Not in TS's
 * DOM lib, so declare it (plus the matching WindowEventMap entries) here — that
 * gives `addEventListener('beforeinstallprompt', …)` a correctly-typed event and
 * keeps the hook cast-free. Scoped to a `declare global` because the file is a
 * module (it exports the hook).
 */
declare global {
  interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[];
    readonly userChoice: Promise<{
      outcome: 'accepted' | 'dismissed';
      platform: string;
    }>;
    prompt(): Promise<void>;
  }
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
    appinstalled: Event;
  }
}

/** Which install affordance the current browser can offer. */
export type InstallPlatform = 'ios' | 'chromium' | 'unsupported';

export interface InstallPromptState {
  /**
   * 'chromium' → native prompt available (gated by canTriggerInstall);
   * 'ios' → no native prompt, show the manual Share-sheet tooltip;
   * 'unsupported' → nothing to offer. Resolves to 'unsupported' once the app is
   * detected as installed, so the button hides on both branches.
   */
  platform: InstallPlatform;
  /** True only while a captured beforeinstallprompt is available to fire. */
  canTriggerInstall: boolean;
  /** Fire the captured Chromium prompt (no-op on ios/unsupported). */
  triggerInstall: () => Promise<void>;
}

/** iPhone/iPod, real iPads, and iPadOS 13+ masquerading as desktop Safari. */
function detectPlatform(): InstallPlatform {
  const ua = navigator.userAgent;
  const isIOS =
    /iP(hone|ad|od)/.test(ua) ||
    // iPadOS 13+ reports as MacIntel; the touch-point count disambiguates it
    // from an actual Mac (which reports 0).
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (isIOS) return 'ios';
  // Capability check: only Chromium browsers expose this hook. Firefox / desktop
  // Safari lack it, so they fall through to 'unsupported' and the button hides.
  if ('onbeforeinstallprompt' in window) return 'chromium';
  return 'unsupported';
}

/** Installed iff running in a standalone/fullscreen display mode (any engine). */
function isInstalled(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    navigator.standalone === true
  );
}

/**
 * Install-affordance model (Block 15). Owned once by AppShell and threaded down
 * to the InstallButton — the button itself never calls this hook.
 *
 * Installed-state flips ONLY on real signals: the `appinstalled` event and the
 * standalone display-mode media query. It never flips on the user *accepting*
 * the prompt dialog (acceptance ≠ installation completing), so userChoice is
 * deliberately not consulted. Once installed, `platform` becomes 'unsupported'.
 */
export function useInstallPrompt(): InstallPromptState {
  const [platform] = useState<InstallPlatform>(detectPlatform);
  const [installed, setInstalled] = useState<boolean>(isInstalled);
  const [canTriggerInstall, setCanTriggerInstall] = useState(false);
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const onBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      // Suppress the default mini-infobar; we drive install from our own button.
      e.preventDefault();
      deferredPrompt.current = e;
      setCanTriggerInstall(true);
    };
    const onAppInstalled = () => {
      deferredPrompt.current = null;
      setCanTriggerInstall(false);
      setInstalled(true); // real signal
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onAppInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onAppInstalled);
    };
  }, []);

  useEffect(() => {
    // Launching the installed app flips display-mode to standalone — treat that
    // transition as the same real "installed" signal.
    const mq = window.matchMedia('(display-mode: standalone)');
    const onChange = (e: MediaQueryListEvent) => {
      if (e.matches) setInstalled(true);
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const triggerInstall = useCallback(async () => {
    const prompt = deferredPrompt.current;
    // Clear BEFORE prompting: the deferred event is single-use, so dropping it up
    // front guarantees we never re-fire a consumed prompt, and the button hides
    // again until a fresh beforeinstallprompt arrives.
    deferredPrompt.current = null;
    setCanTriggerInstall(false);
    if (!prompt) return;
    await prompt.prompt();
    // userChoice is intentionally ignored — see the installed-state note above.
  }, []);

  return {
    platform: installed ? 'unsupported' : platform,
    canTriggerInstall,
    triggerInstall,
  };
}
