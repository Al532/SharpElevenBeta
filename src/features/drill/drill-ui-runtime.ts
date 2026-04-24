type SocialShareLinkElement = HTMLElement & {
  dataset: DOMStringMap & { shareNetwork?: string };
};

type InitializeSocialShareLinksOptions = {
  selector?: string;
  onShareClick?: (network: string | undefined, link: SocialShareLinkElement) => void;
};

type InitializeKeyPickerUiOptions = {
  keyPicker?: (HTMLElement & { open?: boolean }) | null;
  keyPickerBackdrop?: HTMLElement | null;
  closeKeyPickerButton?: HTMLElement | null;
  selectedKeysSummary?: HTMLElement | null;
  setKeyPickerOpen?: (isOpen: boolean) => void;
  stopPlaybackIfRunning?: () => void;
  restoreAllKeysIfNoneSelectedOnClose?: () => void;
};

type InitializeHarmonyDisplayObserversOptions = {
  fitHarmonyDisplay?: () => void;
  chordDisplay?: Element | null;
  nextChordDisplay?: Element | null;
  displayColumns?: Element | null;
};

export function initializeSocialShareLinks({
  selector = '.social-share-link[data-share-network]',
  onShareClick
}: InitializeSocialShareLinksOptions = {}) {
  const shareLinks = Array.from(document.querySelectorAll<SocialShareLinkElement>(selector));
  if (!shareLinks.length) return;

  shareLinks.forEach((link) => {
    const network = link.dataset.shareNetwork;
    link.addEventListener('click', () => {
      onShareClick?.(network, link);
    });
  });
}

export function initializeKeyPickerUi({
  keyPicker,
  keyPickerBackdrop,
  closeKeyPickerButton,
  selectedKeysSummary,
  setKeyPickerOpen,
  stopPlaybackIfRunning,
  restoreAllKeysIfNoneSelectedOnClose
}: InitializeKeyPickerUiOptions = {}) {
  closeKeyPickerButton?.addEventListener('click', () => {
    setKeyPickerOpen?.(false);
  });

  keyPickerBackdrop?.addEventListener('click', () => {
    setKeyPickerOpen?.(false);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || !keyPicker?.open) return;
    setKeyPickerOpen?.(false);
    selectedKeysSummary?.focus();
  });

  keyPicker?.addEventListener('toggle', () => {
    const isOpen = Boolean(keyPicker?.open);
    document.body.classList.toggle('key-picker-open', isOpen);
    if (isOpen) {
      stopPlaybackIfRunning?.();
      window.requestAnimationFrame(() => {
        closeKeyPickerButton?.focus();
      });
      return;
    }
    restoreAllKeysIfNoneSelectedOnClose?.();
  });
}

export function initializeHarmonyDisplayObservers({
  fitHarmonyDisplay,
  chordDisplay,
  nextChordDisplay,
  displayColumns
}: InitializeHarmonyDisplayObserversOptions = {}) {
  window.addEventListener('resize', fitHarmonyDisplay);

  if (document.fonts?.ready) {
    document.fonts.ready.then(() => {
      fitHarmonyDisplay?.();
    }).catch(() => {});
  }

  if (typeof ResizeObserver !== 'undefined') {
    const harmonyDisplayResizeObserver = new ResizeObserver(() => {
      fitHarmonyDisplay?.();
    });

    [chordDisplay, nextChordDisplay, displayColumns]
      .filter(Boolean)
      .forEach((element) => harmonyDisplayResizeObserver.observe(element));
  }

  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', fitHarmonyDisplay);
  }
}

