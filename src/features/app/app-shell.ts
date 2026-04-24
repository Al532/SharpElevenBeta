import type { AppMode } from '../../core/types/contracts';

import {
  loadCurrentAppMode,
  saveCurrentAppMode
} from '../../core/storage/app-state-storage.js';

/**
 * @param {HTMLAnchorElement | null | undefined} link
 * @param {boolean} isActive
 * @returns {void}
 */
function updateModeLinkState(link, isActive) {
  if (!link) return;
  link.classList.toggle('is-active', isActive);
  if (isActive) {
    link.setAttribute('aria-current', 'page');
  } else {
    link.removeAttribute('aria-current');
  }
}

type InitializeAppShellOptions = {
  mode?: AppMode,
  drillLink?: HTMLAnchorElement | null,
  chartLink?: HTMLAnchorElement | null,
  modeBadge?: HTMLElement | null
};

/**
 * @param {InitializeAppShellOptions} [options]
 * @returns {{ mode: AppMode, lastMode: AppMode }}
 */
export function initializeAppShell({
  mode = 'drill',
  drillLink,
  chartLink,
  modeBadge
}: InitializeAppShellOptions = {}) {
  const normalizedMode = saveCurrentAppMode(mode);
  const lastMode = loadCurrentAppMode();

  updateModeLinkState(drillLink, normalizedMode === 'drill');
  updateModeLinkState(chartLink, normalizedMode === 'chart');

  if (modeBadge) {
    modeBadge.textContent = normalizedMode === 'chart' ? 'Chart Mode' : 'Drill Mode';
  }

  return {
    mode: normalizedMode,
    lastMode
  };
}
