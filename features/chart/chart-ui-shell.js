export function closeAllChartPopovers(popovers = []) {
  popovers.forEach((popover) => {
    if (popover) popover.setAttribute('hidden', '');
  });
}

export function toggleChartPopover(targetPopover, popovers = []) {
  if (!targetPopover) return;
  const isOpen = !targetPopover.hidden;
  closeAllChartPopovers(popovers);
  if (!isOpen) {
    targetPopover.removeAttribute('hidden');
  }
}

export function openChartOverlay({ chartApp, chartTopOverlay, chartBottomOverlay } = {}) {
  chartApp?.classList.add('overlay-open');
  chartTopOverlay?.setAttribute('aria-hidden', 'false');
  chartBottomOverlay?.setAttribute('aria-hidden', 'false');
}

export function closeChartOverlay({
  chartApp,
  chartTopOverlay,
  chartBottomOverlay,
  popovers = []
} = {}) {
  chartApp?.classList.remove('overlay-open');
  chartTopOverlay?.setAttribute('aria-hidden', 'true');
  chartBottomOverlay?.setAttribute('aria-hidden', 'true');
  closeAllChartPopovers(popovers);
}

export function bindChartLayoutObservers({
  sheetGrid,
  updateSheetGridGap,
  applyOpticalPlacements
} = {}) {
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
  syncDrillPlaybackSettings,
  setTransportStatus
} = {}) {
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
    await syncDrillPlaybackSettings?.();
    setTransportStatus?.('Ready');
  } catch (error) {
    setTransportStatus?.(`Drill bridge error: ${error.message}`);
  }
}
