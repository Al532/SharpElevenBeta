type ChartOverlayOptions = {
  chartApp?: HTMLElement | null,
  chartTopOverlay?: HTMLElement | null,
  chartBottomOverlay?: HTMLElement | null
};

type CloseChartOverlayOptions = ChartOverlayOptions & {
  popovers?: (HTMLElement | null | undefined)[]
};

type BindChartLayoutObserversOptions = {
  sheetGrid?: HTMLElement | null,
  updateSheetGridGap?: () => void,
  applyOpticalPlacements?: () => void
};

type InitializeChartScreenOptions = {
  applyPersistedPlaybackSettings?: () => void,
  bindImportControls?: () => void,
  bindChartNavigationControls?: () => void,
  importDefaultFixtureLibrary?: () => Promise<unknown>,
  bindRuntimeControls?: () => void,
  bindOverlayControls?: () => void,
  bindLayoutObservers?: () => void,
  updateMixerOutputs?: () => void,
  renderFixture?: () => void,
  ensurePlaybackReady?: () => Promise<unknown>,
  syncPlaybackSettings?: () => Promise<unknown>,
  setTransportStatus?: (message: string) => void
};

/**
 * @param {(HTMLElement | null | undefined)[]} [popovers]
 * @returns {void}
 */
export function closeAllChartPopovers(popovers = []) {
  popovers.forEach((popover) => {
    if (popover) popover.setAttribute('hidden', '');
  });
}

/**
 * @param {HTMLElement | null | undefined} targetPopover
 * @param {(HTMLElement | null | undefined)[]} [popovers]
 * @returns {void}
 */
export function toggleChartPopover(targetPopover, popovers = []) {
  if (!targetPopover) return;
  const isOpen = !targetPopover.hidden;
  closeAllChartPopovers(popovers);
  if (!isOpen) {
    targetPopover.removeAttribute('hidden');
  }
}

/**
 * @param {ChartOverlayOptions} [options]
 * @returns {void}
 */
export function openChartOverlay({ chartApp, chartTopOverlay, chartBottomOverlay }: ChartOverlayOptions = {}) {
  chartApp?.classList.add('overlay-open');
  chartTopOverlay?.setAttribute('aria-hidden', 'false');
  chartBottomOverlay?.setAttribute('aria-hidden', 'false');
}

/**
 * @param {CloseChartOverlayOptions} [options]
 * @returns {void}
 */
export function closeChartOverlay({
  chartApp,
  chartTopOverlay,
  chartBottomOverlay,
  popovers = []
}: CloseChartOverlayOptions = {}) {
  chartApp?.classList.remove('overlay-open');
  chartTopOverlay?.setAttribute('aria-hidden', 'true');
  chartBottomOverlay?.setAttribute('aria-hidden', 'true');
  closeAllChartPopovers(popovers);
}

/**
 * @param {BindChartLayoutObserversOptions} [options]
 * @returns {void}
 */
export function bindChartLayoutObservers({
  sheetGrid,
  updateSheetGridGap,
  applyOpticalPlacements
}: BindChartLayoutObserversOptions = {}) {
  let lastInnerWidth = window.innerWidth;
  window.addEventListener('resize', () => {
    updateSheetGridGap?.();
    if (window.innerWidth !== lastInnerWidth) {
      lastInnerWidth = window.innerWidth;
      applyOpticalPlacements?.();
    }
  });

  if (typeof ResizeObserver !== 'undefined' && sheetGrid) {
    const sheetObserver = new ResizeObserver(() => { updateSheetGridGap?.(); });
    sheetObserver.observe(sheetGrid.closest('.chart-sheet-panel') || sheetGrid);
  }

  if (document.fonts?.ready) {
    document.fonts.ready.then(() => {
      applyOpticalPlacements?.();
    }).catch(() => {});
  }
}

/**
 * @param {InitializeChartScreenOptions} [options]
 * @returns {Promise<void>}
 */
export async function initializeChartScreen({
  applyPersistedPlaybackSettings,
  bindImportControls,
  bindChartNavigationControls,
  importDefaultFixtureLibrary,
  bindRuntimeControls,
  bindOverlayControls,
  bindLayoutObservers,
  updateMixerOutputs,
  renderFixture,
  ensurePlaybackReady,
  syncPlaybackSettings,
  setTransportStatus
}: InitializeChartScreenOptions = {}) {
  applyPersistedPlaybackSettings?.();
  bindImportControls?.();
  bindChartNavigationControls?.();
  await importDefaultFixtureLibrary?.();
  bindRuntimeControls?.();
  bindOverlayControls?.();
  bindLayoutObservers?.();
  updateMixerOutputs?.();
  renderFixture?.();
  try {
    await ensurePlaybackReady?.();
    await syncPlaybackSettings?.();
    setTransportStatus?.('Ready');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    setTransportStatus?.(`Playback bridge error: ${message}`);
  }
}
