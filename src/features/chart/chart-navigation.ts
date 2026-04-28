import type { ChartDocument } from '../../core/types/contracts';

export function getCurrentChartIndex(documents: ChartDocument[] = [], selectedId = ''): number {
  return documents.findIndex((document) => document.metadata.id === selectedId);
}

export function updateChartNavigationState({
  previousChartButton,
  nextChartButton,
  documents = [],
  selectedId = ''
}: {
  previousChartButton?: HTMLButtonElement | null;
  nextChartButton?: HTMLButtonElement | null;
  documents?: ChartDocument[];
  selectedId?: string;
} = {}): void {
  const currentIndex = getCurrentChartIndex(documents, selectedId);
  const hasCharts = documents.length > 0 && currentIndex >= 0;

  if (previousChartButton) {
    previousChartButton.disabled = !hasCharts || currentIndex <= 0;
  }
  if (nextChartButton) {
    nextChartButton.disabled = !hasCharts || currentIndex >= documents.length - 1;
  }
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  if (target instanceof HTMLInputElement) {
    return target.type !== 'range';
  }
  return Boolean(target.closest('input, textarea, select, [contenteditable="true"], [contenteditable=""], [role="textbox"]'));
}

export function createChartNavigationController({
  getDocuments,
  getSelectedId,
  setSelectedId,
  renderFixture,
  onAdjacentChartChange,
  previousChartButton,
  nextChartButton,
  sheetGrid,
  enableSwipeGestures = true
}: {
  getDocuments?: () => ChartDocument[];
  getSelectedId?: () => string;
  setSelectedId?: (id: string) => void;
  renderFixture?: () => void;
  onAdjacentChartChange?: (direction: number) => void;
  previousChartButton?: HTMLButtonElement | null;
  nextChartButton?: HTMLButtonElement | null;
  sheetGrid?: HTMLElement | null;
  enableSwipeGestures?: boolean;
} = {}) {
  const swipeGesture: {
    pointerId: number | null;
    startX: number;
    startY: number;
    active: boolean;
    horizontalLock: boolean;
  } = {
    pointerId: null,
    startX: 0,
    startY: 0,
    active: false,
    horizontalLock: false
  };

  function resetSwipeGesture() {
    swipeGesture.pointerId = null;
    swipeGesture.startX = 0;
    swipeGesture.startY = 0;
    swipeGesture.active = false;
    swipeGesture.horizontalLock = false;
  }

  function goToAdjacentChart(direction: number): boolean {
    const step = Number(direction);
    if (!Number.isFinite(step) || step === 0) return false;

    const documents = getDocuments?.() || [];
    const currentIndex = getCurrentChartIndex(documents, getSelectedId?.() || '');
    if (documents.length === 0 || currentIndex < 0) return false;

    const nextIndex = currentIndex + (step > 0 ? 1 : -1);
    if (nextIndex < 0 || nextIndex >= documents.length) return false;

    setSelectedId?.(documents[nextIndex].metadata.id);
    renderFixture?.();
    onAdjacentChartChange?.(step > 0 ? 1 : -1);
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

    if (enableSwipeGestures) {
      sheetGrid?.addEventListener('pointerdown', (event) => {
        if (event.pointerType !== 'touch' && event.pointerType !== 'pen') return;
        if (isEditableTarget(event.target)) return;
        swipeGesture.pointerId = event.pointerId;
        swipeGesture.startX = event.clientX;
        swipeGesture.startY = event.clientY;
        swipeGesture.active = true;
        swipeGesture.horizontalLock = false;
        sheetGrid.setPointerCapture?.(event.pointerId);
      });

      sheetGrid?.addEventListener('pointermove', (event) => {
        if (!swipeGesture.active || swipeGesture.pointerId !== event.pointerId) return;

        const deltaX = event.clientX - swipeGesture.startX;
        const deltaY = event.clientY - swipeGesture.startY;
        const absX = Math.abs(deltaX);
        const absY = Math.abs(deltaY);

        if (!swipeGesture.horizontalLock && absX >= 18 && absX > absY * 1.15) {
          swipeGesture.horizontalLock = true;
        }

        if (swipeGesture.horizontalLock) {
          event.preventDefault();
        }
      });

      sheetGrid?.addEventListener('pointerup', (event) => {
        if (!swipeGesture.active || swipeGesture.pointerId !== event.pointerId) return;

        const deltaX = event.clientX - swipeGesture.startX;
        const deltaY = event.clientY - swipeGesture.startY;
        const absX = Math.abs(deltaX);
        const absY = Math.abs(deltaY);

        if (absX >= 42 && absX > absY * 1.15) {
          goToAdjacentChart(deltaX < 0 ? 1 : -1);
        }
        sheetGrid.releasePointerCapture?.(event.pointerId);
        resetSwipeGesture();
      });

      sheetGrid?.addEventListener('pointercancel', (event) => {
        sheetGrid.releasePointerCapture?.(event.pointerId);
        resetSwipeGesture();
      });
    }
  }

  return {
    bind,
    goToAdjacentChart
  };
}
