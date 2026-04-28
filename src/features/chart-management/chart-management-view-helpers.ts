import type { ChartDocument } from '../../core/types/contracts.js';
import { getChartSourceRefs } from '../chart/chart-library.js';

export function setImportStatus(message: string, isError = false) {
  if (isError) console.error(message);
  else console.info(message);
}

export function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error || 'Unknown error');
}

export function pluralizeChartLabel(count: number) {
  return `chart${count === 1 ? '' : 's'}`;
}

export function createTextElement(tagName: string, className: string, textContent: string): HTMLElement {
  const element = document.createElement(tagName);
  element.className = className;
  element.textContent = textContent;
  return element;
}

export function createButton(label: string, className = 'home-primary-action'): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = className;
  button.textContent = label;
  return button;
}

export function createMetadataButton(label: string, onClick: (event: MouseEvent) => void): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'home-chart-entry-kebab';
  button.setAttribute('aria-label', label);
  button.addEventListener('pointerdown', (event) => event.stopPropagation());
  button.addEventListener('mousedown', (event) => event.stopPropagation());
  button.addEventListener('click', onClick);
  return button;
}

export function getChartSubtitle(document: ChartDocument): string {
  return typeof document.metadata.composer === 'string' ? document.metadata.composer.trim() : '';
}

export function updateChartEntrySubtitleVisibility(link: HTMLElement): void {
  const title = link.querySelector<HTMLElement>('.home-list-title');
  const meta = link.querySelector<HTMLElement>('.home-list-meta');
  if (!title || !meta) return;
  meta.hidden = true;
  const gapWidth = Number.parseFloat(getComputedStyle(link).columnGap || '0') || 0;
  meta.hidden = title.scrollWidth + gapWidth > link.clientWidth;
}

export function getDocumentSourceNames(document: ChartDocument): string[] {
  return getChartSourceRefs(document)
    .map((ref) => String(ref.name || '').trim())
    .filter(Boolean);
}
