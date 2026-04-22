// @ts-check

/** @typedef {import('../../core/types/contracts').ChartSelection} ChartSelection */
/** @typedef {import('../../core/types/contracts').ChartSelectionController} ChartSelectionController */

/**
 * @param {string[]} [orderedBarIds]
 * @param {string[]} [selectedBarIds]
 * @returns {ChartSelection}
 */
function createSelectionSnapshot(orderedBarIds = [], selectedBarIds = []) {
  const normalizedSelectedBarIds = orderedBarIds.filter((barId) => selectedBarIds.includes(barId));
  if (normalizedSelectedBarIds.length === 0) {
    return {
      startBarId: null,
      endBarId: null,
      barIds: []
    };
  }

  return {
    startBarId: normalizedSelectedBarIds[0],
    endBarId: normalizedSelectedBarIds[normalizedSelectedBarIds.length - 1],
    barIds: normalizedSelectedBarIds
  };
}

/**
 * @param {{ orderedBarIds?: string[] }} [options]
 * @returns {ChartSelectionController}
 */
export function createContiguousBarSelectionController({
  orderedBarIds = []
} = {}) {
  let currentOrderedBarIds = [...orderedBarIds];
  let anchorBarId = null;
  let selectedBarIds = [];

  function setOrderedBarIds(nextOrderedBarIds = []) {
    currentOrderedBarIds = [...nextOrderedBarIds];
    selectedBarIds = currentOrderedBarIds.filter((barId) => selectedBarIds.includes(barId));
    if (!selectedBarIds.includes(anchorBarId)) {
      anchorBarId = selectedBarIds[0] || null;
    }
  }

  function clear() {
    anchorBarId = null;
    selectedBarIds = [];
    return getSelection();
  }

  function selectBar(barId, { extend = false } = {}) {
    if (!barId || !currentOrderedBarIds.includes(barId)) {
      return clear();
    }

    if (!extend || !anchorBarId || !currentOrderedBarIds.includes(anchorBarId)) {
      anchorBarId = barId;
      selectedBarIds = [barId];
      return getSelection();
    }

    const startIndex = currentOrderedBarIds.indexOf(anchorBarId);
    const endIndex = currentOrderedBarIds.indexOf(barId);
    const sliceStart = Math.min(startIndex, endIndex);
    const sliceEnd = Math.max(startIndex, endIndex);
    selectedBarIds = currentOrderedBarIds.slice(sliceStart, sliceEnd + 1);
    return getSelection();
  }

  function getSelection() {
    return createSelectionSnapshot(currentOrderedBarIds, selectedBarIds);
  }

  return {
    setOrderedBarIds,
    clear,
    selectBar,
    getSelection
  };
}
