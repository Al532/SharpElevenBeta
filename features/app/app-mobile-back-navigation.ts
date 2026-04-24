type MobileBackNavigationControllerOptions = {
  windowTarget?: Window;
  historyTarget?: History;
  canHandleBack?: () => boolean;
  handleBack?: () => boolean | void;
};

/**
 * Uses a synthetic history entry while dismissible UI is open so the browser
 * or Android back action closes that UI first.
 */
export function createMobileBackNavigationController({
  windowTarget = globalThis.window,
  historyTarget = globalThis.history,
  canHandleBack = () => false,
  handleBack = () => false
}: MobileBackNavigationControllerOptions = {}) {
  let isArmed = false;
  let ignoreNextPopState = false;

  function arm() {
    if (isArmed || !canHandleBack()) return;
    isArmed = true;
    historyTarget?.pushState?.(
      { ...(historyTarget.state || {}), __sharpElevenDismissibleBack: true },
      '',
      windowTarget?.location?.href
    );
  }

  function disarm({ rewindHistory = true }: { rewindHistory?: boolean } = {}) {
    if (!isArmed) return;
    isArmed = false;
    if (!rewindHistory) return;
    ignoreNextPopState = true;
    historyTarget?.back?.();
  }

  function sync() {
    if (canHandleBack()) {
      arm();
      return;
    }
    disarm();
  }

  function onPopState() {
    if (ignoreNextPopState) {
      ignoreNextPopState = false;
      return;
    }
    if (!isArmed) return;
    isArmed = false;
    const handled = handleBack();
    if (handled && canHandleBack()) {
      arm();
    }
  }

  windowTarget?.addEventListener?.('popstate', onPopState);

  return {
    arm,
    disarm,
    sync
  };
}
