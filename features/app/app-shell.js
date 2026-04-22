import {
  loadCurrentAppMode,
  saveCurrentAppMode
} from '../../core/storage/app-state-storage.js';

function updateModeLinkState(link, isActive) {
  if (!link) return;
  link.classList.toggle('is-active', isActive);
  if (isActive) {
    link.setAttribute('aria-current', 'page');
  } else {
    link.removeAttribute('aria-current');
  }
}

export function initializeAppShell({
  mode = 'drill',
  drillLink,
  chartLink,
  modeBadge
} = {}) {
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
