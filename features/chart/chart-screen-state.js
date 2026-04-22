import {
  createPracticeSessionFromChartSelection
} from '../../chart/index.js';
import { renderChartSelectionState } from './chart-renderer.js';

export function getSelectedPracticeSession(state) {
  const selection = state.selectionController.getSelection();
  if (selection.barIds.length > 0 && state.currentSelectionPracticeSession) {
    return state.currentSelectionPracticeSession;
  }
  return state.currentPracticeSession;
}

export function updateChartMixerOutputs({
  masterVolume,
  masterVolumeValue,
  bassVolume,
  bassVolumeValue,
  stringsVolume,
  stringsVolumeValue,
  drumsVolume,
  drumsVolumeValue
} = {}) {
  if (masterVolumeValue && masterVolume) {
    masterVolumeValue.textContent = `${masterVolume.value}%`;
  }
  if (bassVolumeValue && bassVolume) {
    bassVolumeValue.textContent = `${bassVolume.value}%`;
  }
  if (stringsVolumeValue && stringsVolume) {
    stringsVolumeValue.textContent = `${stringsVolume.value}%`;
  }
  if (drumsVolumeValue && drumsVolume) {
    drumsVolumeValue.textContent = `${drumsVolume.value}%`;
  }
}

export function syncChartSelectionSession({
  state,
  getTempo
} = {}) {
  const selection = state.selectionController.getSelection();
  state.currentSelectionPracticeSession = selection.barIds.length > 0 && state.currentChartDocument
    ? createPracticeSessionFromChartSelection(state.currentChartDocument, selection, {
        tempo: getTempo?.()
      })
    : null;
}

export function renderChartSelectionUi({
  state,
  getTempo,
  selectionSummaryElement,
  clearSelectionButton,
  sendSelectionToDrillButton,
  updateSelectionHighlights
} = {}) {
  syncChartSelectionSession({
    state,
    getTempo
  });
  const selection = state.selectionController.getSelection();
  renderChartSelectionState({
    selectionSummaryElement,
    clearSelectionButton,
    sendSelectionToDrillButton,
    selectedBarIds: selection.barIds,
    hasSession: Boolean(getSelectedPracticeSession(state)),
    updateSelectionHighlights
  });
}

export function handleChartBarSelection({
  event,
  selectionController,
  renderSelectionState
} = {}) {
  const barCell = event?.target?.closest?.('.chart-bar-cell[data-bar-id]');
  if (!barCell) return false;
  selectionController?.selectBar(barCell.dataset.barId, {
    extend: event.shiftKey
  });
  renderSelectionState?.();
  return true;
}
