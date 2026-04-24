// @ts-check

/** @typedef {import('../../core/types/contracts').ChartSelectionController} ChartSelectionController */

const LONG_PRESS_MS = 380;
const TAP_TRIGGER_DISTANCE_PX = 28;
const LONG_PRESS_CANCEL_DISTANCE_PX = 18;
const SWIPE_LOCK_DISTANCE_PX = 18;
const SWIPE_TRIGGER_DISTANCE_PX = 42;
const SWIPE_DIRECTION_RATIO = 1.15;

/**
 * @param {EventTarget | null} target
 * @returns {Element | null}
 */
function getTargetElement(target) {
  if (target instanceof Element) return target;
  if (target instanceof Node) return target.parentElement;
  return null;
}

/**
 * @param {TouchEvent} event
 * @returns {Touch | null}
 */
function getPrimaryTouch(event) {
  return event.changedTouches?.[0] || event.touches?.[0] || null;
}

/**
 * @param {EventTarget | null} target
 * @returns {boolean}
 */
function isEditableTarget(target) {
  const element = getTargetElement(target);
  if (!(element instanceof Element)) return false;
  if (element instanceof HTMLInputElement) {
    return element.type !== 'range';
  }
  return Boolean(element.closest('input, textarea, select, [contenteditable="true"], [contenteditable=""], [role="textbox"]'));
}

/**
 * @param {EventTarget | null} target
 * @returns {HTMLElement | null}
 */
function getBarCellFromTarget(target) {
  const element = getTargetElement(target);
  if (!(element instanceof HTMLElement)) return null;
  return element.closest('.chart-bar-cell[data-bar-id]');
}

/**
 * @param {number} x
 * @param {number} y
 * @returns {HTMLElement | null}
 */
function getBarCellFromPoint(x, y) {
  const element = document.elementFromPoint(x, y);
  if (!(element instanceof HTMLElement)) return null;
  return element.closest('.chart-bar-cell[data-bar-id]');
}

/**
 * @param {EventTarget | null} target
 * @returns {boolean}
 */
function isChartTapTarget(target) {
  const element = getTargetElement(target);
  if (!(element instanceof Element)) return false;
  return Boolean(element.closest('#sheet-grid, .chart-sheet-grid, .chart-sheet-panel, .chart-bar-cell'));
}

/**
 * @param {{
 *   sheetGrid?: HTMLElement | null,
 *   selectionController?: ChartSelectionController,
 *   renderSelectionState?: () => void,
 *   openOverlay?: () => void,
 *   goToAdjacentChart?: (direction: number) => boolean
 * }} [options]
 * @returns {{ bind: () => void }}
 */
export function createChartGestureController({
  sheetGrid,
  selectionController,
  renderSelectionState,
  hasActiveSelection,
  clearSelection,
  openOverlay,
  goToAdjacentChart
} = {}) {
  const gesture = {
    pointerId: null,
    pointerType: '',
    startX: 0,
    startY: 0,
    startBarId: '',
    lastSelectedBarId: '',
    mode: 'idle',
    moved: false,
    longPressTimer: null,
    suppressClickUntil: 0,
    suppressTapUntil: 0,
    touchStartX: 0,
    touchStartY: 0,
    touchMoved: false,
    touchStartedInChart: false
  };

  function clearLongPressTimer() {
    if (gesture.longPressTimer === null) return;
    window.clearTimeout(gesture.longPressTimer);
    gesture.longPressTimer = null;
  }

  function releasePointerCapture() {
    if (!sheetGrid || gesture.pointerId === null) return;
    if (sheetGrid.hasPointerCapture?.(gesture.pointerId)) {
      sheetGrid.releasePointerCapture(gesture.pointerId);
    }
  }

  function resetGesture() {
    clearLongPressTimer();
    releasePointerCapture();
    gesture.pointerId = null;
    gesture.pointerType = '';
    gesture.startX = 0;
    gesture.startY = 0;
    gesture.startBarId = '';
    gesture.lastSelectedBarId = '';
    gesture.mode = 'idle';
    gesture.moved = false;
    gesture.touchStartX = 0;
    gesture.touchStartY = 0;
    gesture.touchMoved = false;
    gesture.touchStartedInChart = false;
  }

  function renderSelection() {
    renderSelectionState?.();
  }

  function suppressNextClick(durationMs = 500) {
    gesture.suppressClickUntil = Date.now() + durationMs;
  }

  function suppressTapFallback(durationMs = 500) {
    gesture.suppressTapUntil = Date.now() + durationMs;
  }

  function startSelection(barId) {
    if (!barId) return false;
    selectionController?.selectBar(barId);
    gesture.mode = 'selecting';
    gesture.lastSelectedBarId = barId;
    gesture.touchMoved = true;
    suppressTapFallback();
    renderSelection();
    return true;
  }

  function extendSelectionAtPoint(clientX, clientY) {
    if (gesture.mode !== 'selecting') return;
    const barCell = getBarCellFromPoint(clientX, clientY);
    const barId = barCell?.dataset.barId || '';
    if (!barId || barId === gesture.lastSelectedBarId) return;
    selectionController?.selectBar(barId, { extend: true });
    gesture.lastSelectedBarId = barId;
    renderSelection();
  }

  function bind() {
    sheetGrid?.addEventListener('contextmenu', (event) => {
      if (getBarCellFromTarget(event.target)) {
        event.preventDefault();
      }
    });

    sheetGrid?.addEventListener('pointerdown', (event) => {
      if (!event.isPrimary || event.button !== 0) return;
      if (isEditableTarget(event.target)) return;
      const barCell = getBarCellFromTarget(event.target);

      gesture.pointerId = event.pointerId;
      gesture.pointerType = event.pointerType;
      gesture.startX = event.clientX;
      gesture.startY = event.clientY;
      gesture.startBarId = barCell?.dataset.barId || '';
      gesture.lastSelectedBarId = gesture.startBarId;
      gesture.mode = 'pending';
      gesture.moved = false;

      sheetGrid.setPointerCapture?.(event.pointerId);

      gesture.longPressTimer = window.setTimeout(() => {
        gesture.longPressTimer = null;
        if (gesture.mode !== 'pending') return;
        startSelection(gesture.startBarId);
      }, LONG_PRESS_MS);
    });

    sheetGrid?.addEventListener('pointermove', (event) => {
      if (gesture.pointerId !== event.pointerId) return;

      const deltaX = event.clientX - gesture.startX;
      const deltaY = event.clientY - gesture.startY;
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      if (gesture.mode === 'pending' && absX >= SWIPE_LOCK_DISTANCE_PX && absX > absY * SWIPE_DIRECTION_RATIO) {
        clearLongPressTimer();
        gesture.mode = 'swiping';
        gesture.moved = true;
      }

      if (gesture.mode === 'pending' && Math.max(absX, absY) > LONG_PRESS_CANCEL_DISTANCE_PX) {
        clearLongPressTimer();
        gesture.moved = true;
      }

      if (gesture.mode === 'swiping') {
        event.preventDefault();
        return;
      }

      if (gesture.mode === 'selecting') {
        event.preventDefault();
        extendSelectionAtPoint(event.clientX, event.clientY);
      }
    });

    sheetGrid?.addEventListener('pointerup', (event) => {
      if (gesture.pointerId !== event.pointerId) return;

      const deltaX = event.clientX - gesture.startX;
      const deltaY = event.clientY - gesture.startY;
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      if (gesture.mode === 'swiping') {
        if (absX >= SWIPE_TRIGGER_DISTANCE_PX && absX > absY * SWIPE_DIRECTION_RATIO) {
          goToAdjacentChart?.(deltaX < 0 ? 1 : -1);
        }
        suppressNextClick();
        resetGesture();
        return;
      }

      if (gesture.mode === 'selecting') {
        extendSelectionAtPoint(event.clientX, event.clientY);
        suppressNextClick();
        resetGesture();
        return;
      }

      if (gesture.mode === 'pending' && Math.max(absX, absY) <= TAP_TRIGGER_DISTANCE_PX) {
        suppressNextClick();
        if (hasActiveSelection?.()) {
          clearSelection?.();
        } else {
          openOverlay?.();
        }
      }

      resetGesture();
    });

    sheetGrid?.addEventListener('pointercancel', (event) => {
      if (gesture.pointerId !== event.pointerId) return;
      resetGesture();
    });

    document.addEventListener('click', (event) => {
      if (Date.now() < gesture.suppressClickUntil) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation?.();
        return;
      }
      if (isEditableTarget(event.target)) return;
      if (!isChartTapTarget(event.target)) return;
      if (hasActiveSelection?.()) {
        clearSelection?.();
      } else {
        openOverlay?.();
      }
      suppressNextClick();
    }, true);

    document.addEventListener('touchstart', (event) => {
      gesture.touchStartedInChart = isChartTapTarget(event.target);
      if (!gesture.touchStartedInChart) return;
      const touch = getPrimaryTouch(event);
      if (!touch) return;
      gesture.touchStartX = touch.clientX;
      gesture.touchStartY = touch.clientY;
      gesture.touchMoved = false;
    }, { passive: true, capture: true });

    document.addEventListener('touchmove', (event) => {
      if (!gesture.touchStartedInChart) return;
      const touch = getPrimaryTouch(event);
      if (!touch) return;
      if (Math.max(
        Math.abs(touch.clientX - gesture.touchStartX),
        Math.abs(touch.clientY - gesture.touchStartY)
      ) > TAP_TRIGGER_DISTANCE_PX) {
        gesture.touchMoved = true;
      }
    }, { passive: true, capture: true });

    document.addEventListener('touchend', (event) => {
      if (Date.now() < gesture.suppressClickUntil) return;
      if (Date.now() < gesture.suppressTapUntil) return;
      if (gesture.mode !== 'idle' && gesture.mode !== 'pending') return;
      if (!gesture.touchStartedInChart) return;
      if (gesture.touchMoved) return;
      if (isEditableTarget(event.target)) return;
      if (hasActiveSelection?.()) {
        clearSelection?.();
      } else {
        openOverlay?.();
      }
      suppressNextClick();
      gesture.touchStartedInChart = false;
    }, true);
  }

  return {
    bind
  };
}
