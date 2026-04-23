import type {
  ChartDocument,
  ChartScreenState,
  ChartSelectionController,
  PracticeSessionSpec
} from '../../core/types/contracts';

import { createPracticeSessionFromChartSelection } from '../../chart/index.js';
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
  getTempo
}: {
  state?: Pick<ChartScreenState, 'selectionController' | 'currentChartDocument' | 'currentSelectionPracticeSession'>;
  getTempo?: () => number;
} = {}): void {
  if (!state) return;
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
  sendSelectionToPracticeButton,
  updateSelectionHighlights
}: {
  state?: Pick<ChartScreenState, 'selectionController' | 'currentChartDocument' | 'currentSelectionPracticeSession' | 'currentPracticeSession'>;
  getTempo?: () => number;
  selectionSummaryElement?: HTMLElement | null;
  clearSelectionButton?: HTMLButtonElement | null;
  sendSelectionToPracticeButton?: HTMLButtonElement | null;
  updateSelectionHighlights?: () => void;
} = {}): void {
  if (!state) return;
  syncChartSelectionSession({
    state,
    getTempo
  });
  const selection = state.selectionController.getSelection();
  renderChartSelectionState({
    selectionSummaryElement,
    clearSelectionButton,
    sendSelectionToPracticeButton,
    selectedBarIds: selection.barIds,
    hasSession: Boolean(getSelectedPracticeSession(state)),
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
  const eventTarget = event?.target instanceof HTMLElement ? event.target : null;
  const barCell = eventTarget?.closest?.('.chart-bar-cell[data-bar-id]') as HTMLElement | null | undefined;
  if (!barCell) return false;
  selectionController?.selectBar(barCell.dataset.barId || '', {
    extend: Boolean(event?.shiftKey)
  });
  renderSelectionState?.();
  return true;
}
