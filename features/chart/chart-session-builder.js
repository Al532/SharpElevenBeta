// @ts-check

/** @typedef {import('../../core/types/contracts').ChartSelection} ChartSelection */
/** @typedef {import('../../core/types/contracts').ChartDocument} ChartDocument */
/** @typedef {import('../../core/types/contracts').ChartPlaybackPlan} ChartPlaybackPlan */
/** @typedef {import('../../core/types/contracts').PracticeSessionDisplay} PracticeSessionDisplay */
/** @typedef {import('../../core/types/contracts').PracticeSessionOrigin} PracticeSessionOrigin */
/** @typedef {import('../../core/types/contracts').PracticeSessionSpec} PracticeSessionSpec */

import {
  createPracticePlaybackBarsFromChartEntries,
  createPracticeSessionSpec
} from '../../core/models/practice-session.js';
import { createChartPlaybackPlanFromDocument } from '../../chart/chart-interpreter.js';
import { createChartDocument } from '../../chart/chart-types.js';

/**
 * @param {string} baseTitle
 * @param {number | null} startIndex
 * @param {number | null} endIndex
 * @returns {string}
 */
function buildSelectionTitle(baseTitle, startIndex, endIndex) {
  if (!Number.isFinite(startIndex) || !Number.isFinite(endIndex)) {
    return baseTitle || 'Chart selection';
  }
  if (startIndex === endIndex) {
    return `${baseTitle} - bar ${startIndex}`;
  }
  return `${baseTitle} - bars ${startIndex}-${endIndex}`;
}

/**
 * @param {Array<{ id: string, index: number }>} [selectedBars]
 * @param {ChartSelection | {}} [fallbackSelection]
 * @returns {import('../../core/types/contracts').PracticeSessionSelection}
 */
function createSelectionMetadata(selectedBars = [], fallbackSelection = /** @type {ChartSelection | {}} */ ({})) {
  const fallbackSelectionRecord = /** @type {any} */ (fallbackSelection);
  const normalizedFallbackSelection = /** @type {ChartSelection} */ ({
    barIds: Array.isArray(fallbackSelectionRecord?.barIds) ? fallbackSelectionRecord.barIds : [],
    startBarId: 'startBarId' in fallbackSelectionRecord ? fallbackSelectionRecord.startBarId : null,
    endBarId: 'endBarId' in fallbackSelectionRecord ? fallbackSelectionRecord.endBarId : null
  });
  const startIndex = selectedBars[0]?.index ?? null;
  const endIndex = selectedBars[selectedBars.length - 1]?.index ?? null;
  return {
    startBarId: normalizedFallbackSelection.startBarId || selectedBars[0]?.id || null,
    endBarId: normalizedFallbackSelection.endBarId || selectedBars[selectedBars.length - 1]?.id || null,
    barIds: selectedBars.map((bar) => bar.id),
    startBarIndex: startIndex,
    endBarIndex: endIndex
  };
}

/**
 * @param {ChartDocument} chartDocument
 * @param {string[]} [selectedBarIds]
 * @returns {ChartDocument}
 */
export function createSelectedChartDocument(chartDocument, selectedBarIds = []) {
  const selectedBars = (chartDocument?.bars || []).filter((bar) => selectedBarIds.includes(bar.id));
  const nextChartDocument = /** @type {ChartDocument} */ ({
    metadata: {
      ...(chartDocument?.metadata || {}),
      barCount: selectedBars.length
    },
    source: chartDocument?.source || {},
    sections: chartDocument?.sections || [],
    bars: selectedBars,
    layout: null
  });
  return /** @type {ChartDocument} */ (createChartDocument(nextChartDocument));
}

/**
 * @param {{
 *   chartDocument: ChartDocument,
 *   playbackPlan: ChartPlaybackPlan,
 *   source: string,
 *   title: string,
 *   tempo?: number,
 *   selection?: import('../../core/types/contracts').PracticeSessionSelection | null,
 *   origin?: PracticeSessionOrigin | null
 * }} options
 * @returns {PracticeSessionSpec}
 */
export function createPracticeSessionFromChartPlaybackPlan({
  chartDocument,
  playbackPlan,
  source,
  title,
  tempo,
  selection = null,
  origin = null
}) {
  const bars = createPracticePlaybackBarsFromChartEntries(playbackPlan?.entries || []);
  const display = /** @type {PracticeSessionDisplay} */ ({
    sourceKey: chartDocument?.metadata?.sourceKey || '',
    displayKey: chartDocument?.metadata?.displayKey || chartDocument?.metadata?.sourceKey || '',
    composer: chartDocument?.metadata?.composer || '',
    style: chartDocument?.metadata?.styleReference || chartDocument?.metadata?.style || ''
  });
  return createPracticeSessionSpec({
    id: `${chartDocument?.metadata?.id || 'chart'}-${source}`,
    source,
    title,
    tempo: Number(tempo || chartDocument?.metadata?.tempo || 120),
    timeSignature: chartDocument?.metadata?.primaryTimeSignature || playbackPlan?.timeSignature || '',
    playback: { bars },
    display,
    selection,
    origin
  });
}

/**
 * @param {ChartDocument} chartDocument
 * @param {ChartPlaybackPlan} playbackPlan
 * @param {{ tempo?: number }} [options]
 * @returns {PracticeSessionSpec}
 */
export function createPracticeSessionFromChartDocumentWithPlaybackPlan(chartDocument, playbackPlan, options = {}) {
  return createPracticeSessionFromChartPlaybackPlan({
    chartDocument,
    playbackPlan,
    source: 'chart',
    title: chartDocument?.metadata?.title || 'Chart',
    tempo: options.tempo,
    origin: {
      chartId: chartDocument?.metadata?.id || '',
      mode: 'chart-document'
    }
  });
}

/**
 * @param {ChartDocument} chartDocument
 * @param {{ playbackPlan?: ChartPlaybackPlan, tempo?: number }} [options]
 * @returns {PracticeSessionSpec}
 */
export function createPracticeSessionFromChartDocument(chartDocument, options = {}) {
  const playbackPlan = /** @type {ChartPlaybackPlan} */ (options.playbackPlan || createChartPlaybackPlanFromDocument(chartDocument));
  return createPracticeSessionFromChartDocumentWithPlaybackPlan(chartDocument, playbackPlan, options);
}

/**
 * @param {ChartDocument} selectedChartDocument
 * @param {{
 *   playbackPlan?: ChartPlaybackPlan,
 *   title?: string,
 *   tempo?: number,
 *   selection?: ChartSelection | {},
 *   origin?: PracticeSessionOrigin
 * }} [options]
 * @returns {PracticeSessionSpec}
 */
export function createPracticeSessionFromSelectedChartDocument(selectedChartDocument, options = {}) {
  const playbackPlan = /** @type {ChartPlaybackPlan} */ (options.playbackPlan || createChartPlaybackPlanFromDocument(selectedChartDocument));
  const selectedBars = selectedChartDocument?.bars || [];
  const selection = createSelectionMetadata(selectedBars, options.selection || /** @type {ChartSelection | {}} */ ({}));
  return createPracticeSessionFromChartPlaybackPlan({
    chartDocument: selectedChartDocument,
    playbackPlan,
    source: 'chart-selection',
    title: options.title || buildSelectionTitle(selectedChartDocument?.metadata?.title || 'Chart', selection.startBarIndex, selection.endBarIndex),
    tempo: options.tempo,
    selection,
    origin: options.origin || {
      chartId: selectedChartDocument?.metadata?.id || '',
      sourceKey: selectedChartDocument?.metadata?.sourceKey || '',
      mode: 'chart-selection'
    }
  });
}

/**
 * @param {ChartDocument} chartDocument
 * @param {ChartSelection} selection
 * @param {{ tempo?: number }} [options]
 * @returns {PracticeSessionSpec}
 */
export function createPracticeSessionFromChartSelection(chartDocument, selection, options = {}) {
  const selectedBarIds = Array.isArray(selection?.barIds) ? selection.barIds : [];
  const selectedDocument = createSelectedChartDocument(chartDocument, selectedBarIds);
  return createPracticeSessionFromSelectedChartDocument(selectedDocument, {
    ...options,
    title: buildSelectionTitle(
      chartDocument?.metadata?.title || selectedDocument?.metadata?.title || 'Chart',
      selectedDocument?.bars?.[0]?.index ?? null,
      selectedDocument?.bars?.[selectedDocument.bars.length - 1]?.index ?? null
    ),
    selection,
    origin: {
      chartId: chartDocument?.metadata?.id || '',
      sourceKey: chartDocument?.metadata?.sourceKey || '',
      mode: 'chart-selection'
    }
  });
}
