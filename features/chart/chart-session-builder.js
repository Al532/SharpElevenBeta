import {
  createPracticePlaybackBarsFromChartEntries,
  createPracticeSessionSpec
} from '../../core/models/practice-session.js';
import { createChartPlaybackPlanFromDocument } from '../../chart/chart-interpreter.js';
import { createChartDocument } from '../../chart/chart-types.js';

function buildSelectionTitle(baseTitle, startIndex, endIndex) {
  if (!Number.isFinite(startIndex) || !Number.isFinite(endIndex)) {
    return baseTitle || 'Chart selection';
  }
  if (startIndex === endIndex) {
    return `${baseTitle} - bar ${startIndex}`;
  }
  return `${baseTitle} - bars ${startIndex}-${endIndex}`;
}

function createSelectionMetadata(selectedBars = [], fallbackSelection = {}) {
  const startIndex = selectedBars[0]?.index ?? null;
  const endIndex = selectedBars[selectedBars.length - 1]?.index ?? null;
  return {
    startBarId: fallbackSelection?.startBarId || selectedBars[0]?.id || null,
    endBarId: fallbackSelection?.endBarId || selectedBars[selectedBars.length - 1]?.id || null,
    barIds: selectedBars.map((bar) => bar.id),
    startBarIndex: startIndex,
    endBarIndex: endIndex
  };
}

export function createSelectedChartDocument(chartDocument, selectedBarIds = []) {
  const selectedBars = (chartDocument?.bars || []).filter((bar) => selectedBarIds.includes(bar.id));
  return createChartDocument({
    metadata: {
      ...(chartDocument?.metadata || {}),
      barCount: selectedBars.length
    },
    source: chartDocument?.source || {},
    sections: chartDocument?.sections || [],
    bars: selectedBars,
    layout: null
  });
}

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
  return createPracticeSessionSpec({
    id: `${chartDocument?.metadata?.id || 'chart'}-${source}`,
    source,
    title,
    tempo: Number(tempo || chartDocument?.metadata?.tempo || 120),
    timeSignature: chartDocument?.metadata?.primaryTimeSignature || playbackPlan?.timeSignature || '',
    playback: { bars },
    display: {
      sourceKey: chartDocument?.metadata?.sourceKey || '',
      displayKey: chartDocument?.metadata?.displayKey || chartDocument?.metadata?.sourceKey || '',
      composer: chartDocument?.metadata?.composer || '',
      style: chartDocument?.metadata?.styleReference || chartDocument?.metadata?.style || ''
    },
    selection,
    origin
  });
}

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

export function createPracticeSessionFromChartDocument(chartDocument, options = {}) {
  const playbackPlan = options.playbackPlan || createChartPlaybackPlanFromDocument(chartDocument);
  return createPracticeSessionFromChartDocumentWithPlaybackPlan(chartDocument, playbackPlan, options);
}

export function createPracticeSessionFromSelectedChartDocument(selectedChartDocument, options = {}) {
  const playbackPlan = options.playbackPlan || createChartPlaybackPlanFromDocument(selectedChartDocument);
  const selectedBars = selectedChartDocument?.bars || [];
  const selection = createSelectionMetadata(selectedBars, options.selection || {});
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
