export type ChartEntryMenuPlacement = 'anchored' | 'centered-dialog';

function readPixelCustomProperty(name: string): number {
  const value = window.getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  if (!value.endsWith('px')) return 0;
  const parsedValue = Number.parseFloat(value);
  return Number.isFinite(parsedValue) ? parsedValue : 0;
}

function getViewportSize(): { width: number; height: number } {
  const root = document.documentElement;
  const visualViewport = window.visualViewport;
  return {
    width: Math.max(
      window.innerWidth || 0,
      root.clientWidth || 0,
      visualViewport?.width || 0
    ),
    height: Math.max(
      window.innerHeight || 0,
      root.clientHeight || 0,
      visualViewport?.height || 0,
      readPixelCustomProperty('--home-stable-viewport-height')
    )
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(min, value), max);
}

export function positionChartEntryMenu(
  menu: HTMLElement,
  anchor: HTMLElement,
  placement: ChartEntryMenuPlacement = 'anchored'
): void {
  const anchorRect = anchor.getBoundingClientRect();
  const menuRect = menu.getBoundingClientRect();
  const viewport = getViewportSize();
  const margin = 8;
  const maxLeft = Math.max(margin, viewport.width - menuRect.width - margin);
  const maxTop = Math.max(margin, viewport.height - menuRect.height - margin);

  const left = placement === 'centered-dialog'
    ? clamp((viewport.width - menuRect.width) / 2, margin, maxLeft)
    : clamp(anchorRect.right - menuRect.width, margin, maxLeft);
  const top = placement === 'centered-dialog'
    ? clamp((viewport.height - menuRect.height) / 2, margin, maxTop)
    : clamp(anchorRect.bottom + 4, margin, maxTop);

  menu.style.left = `${Math.round(left)}px`;
  menu.style.top = `${Math.round(top)}px`;
}
