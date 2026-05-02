import type {
  ChartDocument,
  ChartPlaybackPlan,
  ChartSelection,
  PracticeSessionDisplay,
  PracticeSessionOrigin,
  PracticeSessionSelection,
  PracticeSessionSpec
} from '../../core/types/contracts';

import {
  createPracticePlaybackEndingCueFromBars,
  createPracticePlaybackBarsFromChartEntries,
  createPracticeSessionSpec
} from '../../core/models/practice-session.js';
import { createChartPlaybackPlanFromDocument } from '../../../chart/chart-interpreter.js';
import { createChartPerformanceMap } from '../../../chart/chart-performance.js';
import { transposeChordSymbol, transposeKeySymbol } from '../../../chart/chart-harmony.js';
import { createChartDocument } from '../../../chart/chart-types.js';

function getPlaybackBarBeatCount(bar: { beatSlots?: unknown[]; symbols?: unknown[] } | null | undefined): number {
  return Math.max(1, bar?.beatSlots?.length || bar?.symbols?.length || 1);
}

function getPlaybackChordIndexForEntry(
  bars: Array<{ beatSlots?: unknown[]; symbols?: unknown[] }>,
  entryIndex: number
): number {
  const safeEntryIndex = Math.max(0, Math.min(bars.length, Math.round(Number(entryIndex) || 0)));
  return bars.slice(0, safeEntryIndex).reduce((total, bar) => total + getPlaybackBarBeatCount(bar), 0);
}

function applyCodaGateToPerformanceMap(
  performanceMap: Record<string, unknown>,
  playbackPlan: ChartPlaybackPlan,
  bars: Array<{ index?: number; beatSlots?: unknown[]; symbols?: unknown[] }>
) {
  const codaGate = playbackPlan?.navigation?.codaGate as Record<string, unknown> | null | undefined;
  if (!codaGate || typeof codaGate !== 'object') return performanceMap;

  const stopEntryIndex = Number(codaGate.stopEntryIndex);
  const triggerEntryIndex = Number.isFinite(Number(codaGate.triggerEntryIndex))
    ? Number(codaGate.triggerEntryIndex)
    : stopEntryIndex;
  if (!Number.isInteger(stopEntryIndex) || stopEntryIndex < 0 || stopEntryIndex > bars.length) {
    return performanceMap;
  }

  const safeTriggerEntryIndex = Number.isInteger(triggerEntryIndex)
    ? Math.max(0, Math.min(bars.length, triggerEntryIndex))
    : stopEntryIndex;
  const triggerBar = bars[safeTriggerEntryIndex] || bars[stopEntryIndex] || null;
  const stopChordIndex = getPlaybackChordIndexForEntry(bars, stopEntryIndex);
  const triggerChordIndex = getPlaybackChordIndexForEntry(bars, safeTriggerEntryIndex);
  const triggerEndChordIndex = safeTriggerEntryIndex < stopEntryIndex
    ? triggerChordIndex + getPlaybackBarBeatCount(triggerBar)
    : stopChordIndex;

  return {
    ...performanceMap,
    codaGate: {
      enabled: true,
      stopEntryIndex,
      triggerEntryIndex: safeTriggerEntryIndex,
      stopChordIndex,
      triggerChordIndex,
      triggerEndChordIndex,
      targetChordIndex: stopChordIndex,
      triggerBarIndex: Number(triggerBar?.index ?? codaGate.targetBarIndex ?? 0) || null,
      targetBarIndex: Number(codaGate.targetBarIndex ?? bars[stopEntryIndex]?.index ?? 0) || null
    }
  };
}

function buildSelectionTitle(baseTitle: string, startIndex: number | null, endIndex: number | null): string {
  if (!Number.isFinite(startIndex) || !Number.isFinite(endIndex)) {
    return baseTitle || 'Chart selection';
  }
  if (startIndex === endIndex) {
    return `${baseTitle} - bar ${startIndex}`;
  }
  return `${baseTitle} - bars ${startIndex}-${endIndex}`;
}

function createSelectionMetadata(
  selectedBars: Array<{ id: string; index: number }> = [],
  fallbackSelection: ChartSelection | Record<string, never> = {}
): PracticeSessionSelection {
  const fallbackSelectionRecord = fallbackSelection as Partial<ChartSelection>;
  const normalizedFallbackSelection: ChartSelection = {
    barIds: Array.isArray(fallbackSelectionRecord?.barIds) ? fallbackSelectionRecord.barIds : [],
    startBarId: 'startBarId' in fallbackSelectionRecord ? fallbackSelectionRecord.startBarId ?? null : null,
    endBarId: 'endBarId' in fallbackSelectionRecord ? fallbackSelectionRecord.endBarId ?? null : null
  };
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

export function createSelectedChartDocument(
  chartDocument: ChartDocument,
  selectedBarIds: string[] = []
): ChartDocument {
  const selectedBars = (chartDocument?.bars || []).filter((bar) => selectedBarIds.includes(bar.id));
  const nextChartDocument: ChartDocument = {
    schemaVersion: chartDocument?.schemaVersion || '1.0.0',
    metadata: {
      id: chartDocument?.metadata?.id || '',
      title: chartDocument?.metadata?.title || '',
      composer: chartDocument?.metadata?.composer || '',
      style: chartDocument?.metadata?.style || '',
      styleReference: chartDocument?.metadata?.styleReference || '',
      sourceKey: chartDocument?.metadata?.sourceKey || '',
      displayKey: chartDocument?.metadata?.displayKey || '',
      primaryTimeSignature: chartDocument?.metadata?.primaryTimeSignature || '',
      tempo: chartDocument?.metadata?.tempo || 0,
      barCount: selectedBars.length
    },
    source: chartDocument?.source || {},
    sections: chartDocument?.sections || [],
    bars: selectedBars,
    layout: null
  };
  return createChartDocument(nextChartDocument) as ChartDocument;
}

export function createPracticeSessionFromChartPlaybackPlan({
  chartDocument,
  playbackPlan,
  source,
  title,
  tempo,
  transposition = 0,
  selection = null,
  origin = null
}: {
  chartDocument: ChartDocument;
  playbackPlan: ChartPlaybackPlan;
  source: string;
  title: string;
  tempo?: number;
  transposition?: number;
  selection?: PracticeSessionSelection | null;
  origin?: PracticeSessionOrigin | null;
}): PracticeSessionSpec {
  const transposeSemitones = Number.isFinite(Number(transposition)) ? Number(transposition) : 0;
  const bars = createPracticePlaybackBarsFromChartEntries(
    playbackPlan?.entries || [],
    chartDocument?.metadata?.primaryTimeSignature || playbackPlan?.timeSignature || ''
  ).map((bar) => ({
    ...bar,
    symbols: (bar.symbols || []).map((symbol) => transposeChordSymbol(symbol, transposeSemitones)),
    beatSlots: (bar.beatSlots || []).map((symbol) => transposeChordSymbol(symbol, transposeSemitones))
  }));
  const endingCue = createPracticePlaybackEndingCueFromBars(bars);
  const displayKey = transposeKeySymbol(
    chartDocument?.metadata?.displayKey || chartDocument?.metadata?.sourceKey || '',
    transposeSemitones
  );
  const display: PracticeSessionDisplay = {
    sourceKey: chartDocument?.metadata?.sourceKey || '',
    displayKey: displayKey || chartDocument?.metadata?.displayKey || chartDocument?.metadata?.sourceKey || '',
    composer: chartDocument?.metadata?.composer || '',
    style: chartDocument?.metadata?.styleReference || chartDocument?.metadata?.style || ''
  };
  const performanceMap = applyCodaGateToPerformanceMap(
    createChartPerformanceMap(chartDocument, playbackPlan?.navigation || {}) as Record<string, unknown>,
    playbackPlan,
    bars
  ) as PracticeSessionSpec['playback']['performanceMap'];
  return createPracticeSessionSpec({
    id: `${chartDocument?.metadata?.id || 'chart'}-${source}`,
    source,
    title,
    tempo: Number(tempo || chartDocument?.metadata?.tempo || 120),
    timeSignature: chartDocument?.metadata?.primaryTimeSignature || playbackPlan?.timeSignature || '',
    playback: {
      bars,
      endingCue,
      performanceMap
    },
    display,
    selection,
    origin
  });
}

export function createPracticeSessionFromChartDocumentWithPlaybackPlan(
  chartDocument: ChartDocument,
  playbackPlan: ChartPlaybackPlan,
  options: { tempo?: number; transposition?: number } = {}
): PracticeSessionSpec {
  return createPracticeSessionFromChartPlaybackPlan({
    chartDocument,
    playbackPlan,
    source: 'chart',
    title: chartDocument?.metadata?.title || 'Chart',
    tempo: options.tempo,
    transposition: options.transposition,
    origin: {
      chartId: chartDocument?.metadata?.id || '',
      mode: 'chart-document'
    }
  });
}

export function createPracticeSessionFromChartDocument(
  chartDocument: ChartDocument,
  options: { playbackPlan?: ChartPlaybackPlan; tempo?: number; transposition?: number } = {}
): PracticeSessionSpec {
  const playbackPlan = options.playbackPlan || createChartPlaybackPlanFromDocument(chartDocument) as ChartPlaybackPlan;
  return createPracticeSessionFromChartDocumentWithPlaybackPlan(chartDocument, playbackPlan, options);
}

export function createPracticeSessionFromSelectedChartDocument(
  selectedChartDocument: ChartDocument,
  options: {
    playbackPlan?: ChartPlaybackPlan;
    title?: string;
    tempo?: number;
    transposition?: number;
    selection?: ChartSelection | Record<string, never>;
    origin?: PracticeSessionOrigin;
  } = {}
): PracticeSessionSpec {
  const playbackPlan = options.playbackPlan || createChartPlaybackPlanFromDocument(selectedChartDocument) as ChartPlaybackPlan;
  const selectedBars = selectedChartDocument?.bars || [];
  const selection = createSelectionMetadata(selectedBars, options.selection || {});
  return createPracticeSessionFromChartPlaybackPlan({
    chartDocument: selectedChartDocument,
    playbackPlan,
    source: 'chart-selection',
    title: options.title || buildSelectionTitle(selectedChartDocument?.metadata?.title || 'Chart', selection.startBarIndex, selection.endBarIndex),
    tempo: options.tempo,
    transposition: options.transposition,
    selection,
    origin: options.origin || {
      chartId: selectedChartDocument?.metadata?.id || '',
      sourceKey: selectedChartDocument?.metadata?.sourceKey || '',
      mode: 'chart-selection'
    }
  });
}

export function createPracticeSessionFromChartSelection(
  chartDocument: ChartDocument,
  selection: ChartSelection,
  options: { tempo?: number; transposition?: number } = {}
): PracticeSessionSpec {
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
