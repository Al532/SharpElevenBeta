import type { SetlistDragItem, SetlistDropTarget } from './chart-management-types.js';

export function getDraggedLibraryChartId(event: DragEvent, fallbackChartId = ''): string {
  const payload = event.dataTransfer?.getData('text/plain') || '';
  if (payload.startsWith('chart:')) return payload.slice('chart:'.length);
  return fallbackChartId;
}

export function hasDraggedLibraryChart({
  draggedSetlistOrderIndex,
  draggedSetlistItem,
  draggedLibraryChartId
}: {
  draggedSetlistOrderIndex: number | null;
  draggedSetlistItem: SetlistDragItem | null;
  draggedLibraryChartId: string;
}): boolean {
  if (draggedSetlistOrderIndex !== null || draggedSetlistItem) return false;
  return Boolean(draggedLibraryChartId);
}

export function getSetlistDropTargetAtPoint(clientX: number, clientY: number): SetlistDropTarget | null {
  const element = document.elementFromPoint(clientX, clientY);
  const target = element instanceof HTMLElement ? element.closest<HTMLElement>('[data-setlist-drop-id]') : null;
  if (!target) return null;
  const setlistId = target.dataset.setlistDropId || '';
  if (!setlistId) return null;
  const rawIndex = target.dataset.setlistDropIndex;
  const index = rawIndex === undefined ? undefined : Number(rawIndex);
  return Number.isFinite(index) ? { setlistId, index } : { setlistId };
}

function findSetlistChildList(setlistId: string): HTMLElement | undefined {
  return Array.from(document.querySelectorAll<HTMLElement>('[data-setlist-child-list-id]'))
    .find((element) => element.dataset.setlistChildListId === setlistId);
}

function findSetlistDropRow(setlistId: string, index: number): HTMLElement | undefined {
  return Array.from(document.querySelectorAll<HTMLElement>('[data-setlist-drop-index]'))
    .find((element) => element.dataset.setlistDropId === setlistId && Number(element.dataset.setlistDropIndex) === index);
}

export function clearSetlistDropPreview() {
  document.querySelectorAll('.has-drop-preview-before, .has-drop-preview-end').forEach((element) => {
    element.classList.remove('has-drop-preview-before', 'has-drop-preview-end');
  });
}

export function clearSetlistOrderPreview() {
  document.querySelectorAll('.has-setlist-order-preview-before').forEach((element) => {
    element.classList.remove('has-setlist-order-preview-before');
  });
}

export function showSetlistOrderPreview(index: number) {
  clearSetlistOrderPreview();
  Array.from(document.querySelectorAll<HTMLElement>('[data-setlist-order-index]'))
    .find((element) => Number(element.dataset.setlistOrderIndex) === index)
    ?.classList.add('has-setlist-order-preview-before');
}

export function showSetlistDropPreview(target: SetlistDropTarget | null) {
  clearSetlistDropPreview();
  if (!target) return;
  if (Number.isFinite(target.index)) {
    findSetlistDropRow(target.setlistId, target.index as number)?.classList.add('has-drop-preview-before');
  } else {
    findSetlistChildList(target.setlistId)?.classList.add('has-drop-preview-end');
  }
}
