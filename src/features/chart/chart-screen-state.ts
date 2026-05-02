import type {
  ChartDocument,
  ChartScreenState,
  ChartSelectionController,
  PracticeSessionSpec
} from '../../core/types/contracts';

import { createPracticeSessionFromChartSelection } from '../../../chart/index.js';
import { renderChartSelectionState } from './chart-renderer.js';

export function getSelectedPracticeSession(state: {
  selectionController: ChartSelectionController;
  currentSelectionPracticeSession: PracticeSessionSpec | null;
  currentPracticeSession: PracticeSessionSpec | null;
}): PracticeSessionSpec | null {
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
}: {
  masterVolume?: HTMLInputElement | null;
  masterVolumeValue?: HTMLElement | null;
  bassVolume?: HTMLInputElement | null;
  bassVolumeValue?: HTMLElement | null;
  stringsVolume?: HTMLInputElement | null;
  stringsVolumeValue?: HTMLElement | null;
  drumsVolume?: HTMLInputElement | null;
  drumsVolumeValue?: HTMLElement | null;
} = {}): void {
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
  getTempo,
  getTransposition
}: {
  state?: Pick<ChartScreenState, 'selectionController' | 'currentChartDocument' | 'currentSelectionPracticeSession'>;
  getTempo?: () => number;
  getTransposition?: () => number;
} = {}): void {
  if (!state) return;
  const selection = state.selectionController.getSelection();
  state.currentSelectionPracticeSession = selection.barIds.length > 0 && state.currentChartDocument
    ? createPracticeSessionFromChartSelection(state.currentChartDocument, selection, {
        tempo: getTempo?.(),
        transposition: getTransposition?.() || 0
      })
    : null;
}

export function renderChartSelectionUi({
  state,
  getTempo,
  getTransposition,
  selectionSummaryElement,
  clearSelectionButton,
  sendSelectionToPracticeButton,
  isSelectionLocked,
  updateSelectionHighlights
}: {
  state?: Pick<ChartScreenState, 'selectionController' | 'currentChartDocument' | 'currentSelectionPracticeSession' | 'currentPracticeSession'>;
  getTempo?: () => number;
  getTransposition?: () => number;
  selectionSummaryElement?: HTMLElement | null;
  clearSelectionButton?: HTMLButtonElement | null;
  sendSelectionToPracticeButton?: HTMLButtonElement | null;
  isSelectionLocked?: boolean;
  updateSelectionHighlights?: () => void;
} = {}): void {
  if (!state) return;
  syncChartSelectionSession({
    state,
    getTempo,
    getTransposition
  });
  const selection = state.selectionController.getSelection();
  renderChartSelectionState({
    selectionSummaryElement,
    clearSelectionButton,
    sendSelectionToPracticeButton,
    selectedBarIds: selection.barIds,
    hasSession: Boolean(getSelectedPracticeSession(state)),
    isSelectionLocked,
    updateSelectionHighlights
  } as any);
}

export function handleChartBarSelection({
  event,
  selectionController,
  renderSelectionState
}: {
  event?: MouseEvent;
  selectionController?: ChartSelectionController;
  renderSelectionState?: () => void;
} = {}): boolean {
  const eventTarget = event?.target instanceof Element ? event.target : null;
  const closestBarCell = eventTarget?.closest?.('.chart-bar-cell[data-bar-id]');
  const barCell = closestBarCell instanceof HTMLElement ? closestBarCell : null;
  if (!barCell) return false;
  selectionController?.selectBar(barCell.dataset.barId || '', {
    extend: Boolean(event?.shiftKey)
  });
  renderSelectionState?.();
  return true;
}
