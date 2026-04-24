import type {
  ChartSelection,
  ChartSelectionController
} from '../../core/types/contracts';

function createSelectionSnapshot(
  orderedBarIds: string[] = [],
  selectedBarIds: string[] = []
): ChartSelection {
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

export function createContiguousBarSelectionController({
  orderedBarIds = []
}: {
  orderedBarIds?: string[];
} = {}): ChartSelectionController {
  let currentOrderedBarIds = [...orderedBarIds];
  let anchorBarId: string | null = null;
  let selectedBarIds: string[] = [];

  function setOrderedBarIds(nextOrderedBarIds: string[] = []) {
    currentOrderedBarIds = [...nextOrderedBarIds];
    selectedBarIds = currentOrderedBarIds.filter((barId) => selectedBarIds.includes(barId));
    if (!anchorBarId || !selectedBarIds.includes(anchorBarId)) {
      anchorBarId = selectedBarIds[0] || null;
    }
  }

  function clear() {
    anchorBarId = null;
    selectedBarIds = [];
    return getSelection();
  }

  function selectBar(barId: string, { extend = false }: { extend?: boolean } = {}) {
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
