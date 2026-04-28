import type { SetlistDragItem, SetlistDropTarget } from './chart-management-types.js';

export function getDraggedLibraryChartId(event: DragEvent, fallbackChartId = ''): string {
  const payload = event.dataTransfer?.getData('text/plain') || '';
  if (payload.startsWith('chart:')) return payload.slice('chart:'.length);
  return fallbackChartId;
}

export function hasDraggedLibraryChart({
  draggedSetlistItem,
  draggedLibraryChartId
}: {
  draggedSetlistItem: SetlistDragItem | null;
  draggedLibraryChartId: string;
}): boolean {
  if (draggedSetlistItem) return false;
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
  if (!Number.isFinite(index)) return { setlistId };

  const bounds = target.getBoundingClientRect();
  const insertAfter = clientY > bounds.top + bounds.height / 2;
  return { setlistId, index: (index as number) + (insertAfter ? 1 : 0) };
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

export function showSetlistDropPreview(target: SetlistDropTarget | null) {
  clearSetlistDropPreview();
  if (!target) return;
  if (Number.isFinite(target.index)) {
    const dropRow = findSetlistDropRow(target.setlistId, target.index as number);
    if (dropRow) dropRow.classList.add('has-drop-preview-before');
    else findSetlistChildList(target.setlistId)?.classList.add('has-drop-preview-end');
  } else {
    findSetlistChildList(target.setlistId)?.classList.add('has-drop-preview-end');
  }
}
