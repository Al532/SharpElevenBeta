// @ts-check

/** @typedef {import('../../core/types/contracts').ChartDocument} ChartDocument */
/** @typedef {import('../../core/types/contracts').ChartScreenState} ChartScreenState */
/** @typedef {import('../../core/types/contracts').ChartSelectionController} ChartSelectionController */
/** @typedef {import('../../core/types/contracts').PracticeSessionSpec} PracticeSessionSpec */

import {
  createPracticeSessionFromChartSelection
} from '../../chart/index.js';
import { renderChartSelectionState } from './chart-renderer.js';

/**
 * @param {{
 *   selectionController: ChartSelectionController,
 *   currentSelectionPracticeSession: PracticeSessionSpec | null,
 *   currentPracticeSession: PracticeSessionSpec | null
 * }} state
 * @returns {PracticeSessionSpec | null}
 */
export function getSelectedPracticeSession(state) {
  const selection = state.selectionController.getSelection();
  if (selection.barIds.length > 0 && state.currentSelectionPracticeSession) {
    return state.currentSelectionPracticeSession;
  }
  return state.currentPracticeSession;
}

/**
 * @param {{
 *   masterVolume?: HTMLInputElement | null,
 *   masterVolumeValue?: HTMLElement | null,
 *   bassVolume?: HTMLInputElement | null,
 *   bassVolumeValue?: HTMLElement | null,
 *   stringsVolume?: HTMLInputElement | null,
 *   stringsVolumeValue?: HTMLElement | null,
 *   drumsVolume?: HTMLInputElement | null,
 *   drumsVolumeValue?: HTMLElement | null
 * }} [options]
 * @returns {void}
 */
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

/**
 * @param {{
 *   state?: Pick<ChartScreenState, 'selectionController' | 'currentChartDocument' | 'currentSelectionPracticeSession'>,
 *   getTempo?: () => number
 * }} [options]
 * @returns {void}
 */
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

/**
 * @param {{
 *   state?: Pick<ChartScreenState, 'selectionController' | 'currentChartDocument' | 'currentSelectionPracticeSession' | 'currentPracticeSession'>,
 *   getTempo?: () => number,
 *   selectionSummaryElement?: HTMLElement | null,
 *   clearSelectionButton?: HTMLButtonElement | null,
 *   sendSelectionToDrillButton?: HTMLButtonElement | null,
 *   updateSelectionHighlights?: () => void
 * }} [options]
 * @returns {void}
 */
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
  renderChartSelectionState(/** @type {any} */ ({
    selectionSummaryElement,
    clearSelectionButton,
    sendSelectionToDrillButton,
    selectedBarIds: selection.barIds,
    hasSession: Boolean(getSelectedPracticeSession(state)),
    updateSelectionHighlights
  }));
}

/**
 * @param {{
 *   event?: MouseEvent,
 *   selectionController?: ChartSelectionController,
 *   renderSelectionState?: () => void
 * }} [options]
 * @returns {boolean}
 */
export function handleChartBarSelection({
  event,
  selectionController,
  renderSelectionState
} = {}) {
  const eventTarget = /** @type {HTMLElement | null | undefined} */ (event?.target instanceof HTMLElement ? event.target : null);
  const barCell = /** @type {HTMLElement | null | undefined} */ (eventTarget?.closest?.('.chart-bar-cell[data-bar-id]'));
  if (!barCell) return false;
  selectionController?.selectBar(barCell.dataset.barId, {
    extend: event.shiftKey
  });
  renderSelectionState?.();
  return true;
}
