// @ts-check

/** @typedef {import('../../core/types/contracts').ChartDocument} ChartDocument */

/**
 * @param {ChartDocument[]} [documents]
 * @param {string} [selectedId]
 * @returns {number}
 */
export function getCurrentChartIndex(documents = [], selectedId = '') {
  return documents.findIndex((document) => document.metadata.id === selectedId);
}

/**
 * @param {{
 *   previousChartButton?: HTMLButtonElement | null,
 *   nextChartButton?: HTMLButtonElement | null,
 *   documents?: ChartDocument[],
 *   selectedId?: string
 * }} [options]
 * @returns {void}
 */
export function updateChartNavigationState({
  previousChartButton,
  nextChartButton,
  documents = [],
  selectedId = ''
} = {}) {
  const currentIndex = getCurrentChartIndex(documents, selectedId);
  const hasCharts = documents.length > 0 && currentIndex >= 0;

  if (previousChartButton) {
    previousChartButton.disabled = !hasCharts || currentIndex <= 0;
  }
  if (nextChartButton) {
    nextChartButton.disabled = !hasCharts || currentIndex >= documents.length - 1;
  }
}

/**
 * @param {EventTarget | null} target
 * @returns {boolean}
 */
function isEditableTarget(target) {
  if (!(target instanceof Element)) return false;
  if (target instanceof HTMLInputElement) {
    return target.type !== 'range';
  }
  return Boolean(target.closest('input, textarea, select, [contenteditable="true"], [contenteditable=""], [role="textbox"]'));
}

/**
 * @param {{
 *   getDocuments?: () => ChartDocument[],
 *   getSelectedId?: () => string,
 *   setSelectedId?: (id: string) => void,
 *   renderFixture?: () => void,
 *   previousChartButton?: HTMLButtonElement | null,
 *   nextChartButton?: HTMLButtonElement | null,
 *   sheetGrid?: HTMLElement | null
 * }} [options]
 * @returns {{ bind: () => void, goToAdjacentChart: (direction: number) => boolean }}
 */
export function createChartNavigationController({
  getDocuments,
  getSelectedId,
  setSelectedId,
  renderFixture,
  previousChartButton,
  nextChartButton,
  sheetGrid
} = {}) {
  const swipeGesture = {
    pointerId: null,
    startX: 0,
    startY: 0,
    active: false
  };

  function resetSwipeGesture() {
    swipeGesture.pointerId = null;
    swipeGesture.startX = 0;
    swipeGesture.startY = 0;
    swipeGesture.active = false;
  }

  function goToAdjacentChart(direction) {
    const step = Number(direction);
    if (!Number.isFinite(step) || step === 0) return false;

    const documents = getDocuments?.() || [];
    const currentIndex = getCurrentChartIndex(documents, getSelectedId?.() || '');
    if (documents.length === 0 || currentIndex < 0) return false;

    const nextIndex = currentIndex + (step > 0 ? 1 : -1);
    if (nextIndex < 0 || nextIndex >= documents.length) return false;

    setSelectedId?.(documents[nextIndex].metadata.id);
    renderFixture?.();
    return true;
  }

  function bind() {
    previousChartButton?.addEventListener('click', () => {
      goToAdjacentChart(-1);
    });
    nextChartButton?.addEventListener('click', () => {
      goToAdjacentChart(1);
    });

    document.addEventListener('keydown', (event) => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
      if (isEditableTarget(event.target)) return;
      if (event.key === 'ArrowLeft') {
        if (goToAdjacentChart(-1)) event.preventDefault();
      } else if (event.key === 'ArrowRight') {
        if (goToAdjacentChart(1)) event.preventDefault();
      }
    });

    sheetGrid?.addEventListener('pointerdown', (event) => {
      if (event.pointerType !== 'touch' && event.pointerType !== 'pen') return;
      swipeGesture.pointerId = event.pointerId;
      swipeGesture.startX = event.clientX;
      swipeGesture.startY = event.clientY;
      swipeGesture.active = true;
    });

    sheetGrid?.addEventListener('pointerup', (event) => {
      if (!swipeGesture.active || swipeGesture.pointerId !== event.pointerId) return;

      const deltaX = event.clientX - swipeGesture.startX;
      const deltaY = event.clientY - swipeGesture.startY;
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      if (absX >= 56 && absX > absY * 1.35) {
        goToAdjacentChart(deltaX < 0 ? 1 : -1);
      }
      resetSwipeGesture();
    });

    sheetGrid?.addEventListener('pointercancel', resetSwipeGesture);
  }

  return {
    bind,
    goToAdjacentChart
  };
}
