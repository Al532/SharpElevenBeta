import type {
  ChartDocument,
  ChartPerformance,
  ChartPerformanceCue,
  ChartPerformanceMap,
  ChartPerformancePanelMode,
  ChartPerformanceRepeatMode,
  ChartSimplePerformanceState,
  RichChartBar
} from '../src/core/types/contracts';

import { CHART_DOCUMENT_SCHEMA_VERSION } from './chart-types.js';

export const DEFAULT_CHART_SIMPLE_PERFORMANCE: ChartSimplePerformanceState = Object.freeze({
  mode: 'infinite',
  repeatMode: 'infinite'
});

const DEFAULT_PERFORMANCE_NAME = 'Performance';
const LAST_CHORUS_CUE_TYPES = new Set(['arm_coda', 'last_chorus']);

function normalizeObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function normalizeString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : (value == null ? fallback : String(value));
}

export function normalizeChartPerformanceRepeatMode(value: unknown): ChartPerformanceRepeatMode {
  return value === 'finite' ? 'finite' : 'infinite';
}

export function normalizeChartPerformancePanelMode(value: unknown): ChartPerformancePanelMode {
  if (value === 'once' || value === 'performance') return value;
  if (value === 'finite') return 'once';
  return 'infinite';
}

export function normalizeChartSimplePerformanceState(
  value: unknown
): ChartSimplePerformanceState {
  const safeValue = normalizeObject(value);
  const mode = normalizeChartPerformancePanelMode(safeValue.mode || safeValue.repeatMode);
  return {
    mode,
    repeatMode: mode === 'once' ? 'finite' : 'infinite'
  };
}

export function getChartSimplePerformanceLabel(
  state: ChartSimplePerformanceState | null | undefined
): string {
  const mode = normalizeChartPerformancePanelMode(state?.mode || state?.repeatMode);
  if (mode === 'performance') return 'Perf';
  return mode === 'once' ? '1x' : '∞';
}

export function resolveChartPerformanceRepeatState({
  activePerformance = null,
  simplePerformance = DEFAULT_CHART_SIMPLE_PERFORMANCE
}: {
  activePerformance?: ChartPerformance | null;
  simplePerformance?: ChartSimplePerformanceState | null | undefined;
} = {}): { repeatMode: ChartPerformanceRepeatMode; repeatCount: number; infinite: boolean } {
  if (activePerformance && activePerformance.active !== false) {
    const repeatMode = normalizeChartPerformanceRepeatMode(activePerformance.repeatMode);
    const repeatCount = Number.isFinite(Number(activePerformance.repeatCount))
      ? Math.max(1, Math.min(15, Math.round(Number(activePerformance.repeatCount))))
      : 1;
    return {
      repeatMode,
      repeatCount,
      infinite: repeatMode === 'infinite'
    };
  }

  const normalizedSimplePerformance = normalizeChartSimplePerformanceState(simplePerformance);
  const repeatMode = normalizedSimplePerformance.repeatMode;
  return {
    repeatMode,
    repeatCount: 1,
    infinite: repeatMode === 'infinite'
  };
}

export function createDefaultChartPerformance(
  chartDocument: ChartDocument | null | undefined,
  options: Partial<ChartPerformance> = {}
): ChartPerformance {
  const chartId = normalizeString(options.chartId || chartDocument?.metadata?.id, 'chart');
  const timestamp = normalizeString(options.updatedAt, new Date().toISOString());
  return {
    schemaVersion: CHART_DOCUMENT_SCHEMA_VERSION,
    id: normalizeString(options.id, `${chartId}-performance-default`),
    chartId,
    name: normalizeString(options.name, DEFAULT_PERFORMANCE_NAME),
    active: options.active !== false,
    repeatMode: normalizeChartPerformanceRepeatMode(options.repeatMode || 'finite'),
    repeatCount: Number.isFinite(Number(options.repeatCount))
      ? Math.max(1, Math.min(15, Math.round(Number(options.repeatCount))))
      : 1,
    cues: normalizeChartPerformanceCues(options.cues),
    updatedAt: timestamp
  };
}

function normalizeChartPerformanceCues(value: unknown): ChartPerformanceCue[] {
  if (!Array.isArray(value)) return [];
  let hasLastChorusCue = false;
  return value.flatMap((rawCue) => {
    const cue = normalizeObject(rawCue) as ChartPerformanceCue;
    if (!cue.id || !cue.type) return [];
    if (LAST_CHORUS_CUE_TYPES.has(String(cue.type))) {
      if (hasLastChorusCue) return [];
      hasLastChorusCue = true;
      return [{
        ...JSON.parse(JSON.stringify(cue)),
        type: 'arm_coda',
        boundary: cue.boundary || 'next_coda_jump'
      }];
    }
    return [JSON.parse(JSON.stringify(cue))];
  });
}

export function markExecutedChartPerformanceCuesConsumed(
  cues: ChartPerformanceCue[] = [],
  currentBarIndex: number
): { cues: ChartPerformanceCue[]; changed: boolean } {
  const playbackBarIndex = Number(currentBarIndex);
  if (!Number.isFinite(playbackBarIndex) || playbackBarIndex <= 0) {
    return { cues, changed: false };
  }

  let changed = false;
  const nextCues = cues.map((cue) => {
    if (cue.status !== 'armed') return cue;
    const targetBarIndex = Number(cue.targetBarIndex || 0);
    if (!targetBarIndex || playbackBarIndex < targetBarIndex) return cue;
    changed = true;
    return {
      ...cue,
      status: 'consumed',
      consumedAtBarIndex: playbackBarIndex
    };
  });

  return {
    cues: changed ? nextCues : cues,
    changed
  };
}

export function restoreConsumedChartPerformanceCues(
  cues: ChartPerformanceCue[] = []
): { cues: ChartPerformanceCue[]; changed: boolean } {
  let changed = false;
  const nextCues = cues.map((cue) => {
    if (cue.status !== 'consumed') return cue;
    changed = true;
    return {
      ...cue,
      status: 'idle',
      targetBarIndex: null,
      armedAtBarIndex: null,
      consumedAtBarIndex: null
    };
  });

  return {
    cues: changed ? nextCues : cues,
    changed
  };
}

export function normalizeChartPerformance(
  value: unknown,
  chartDocument: ChartDocument | null | undefined
): ChartPerformance | null {
  const safeValue = normalizeObject(value);
  const chartId = normalizeString(chartDocument?.metadata?.id);
  if (!safeValue.id && !safeValue.chartId) return null;
  if (chartId && safeValue.chartId && String(safeValue.chartId) !== chartId) return null;
  return createDefaultChartPerformance(chartDocument, {
    ...safeValue,
    chartId: normalizeString(safeValue.chartId, chartId)
  });
}

function buildRepeatRanges(bars: RichChartBar[] = []): Array<{ startIndex: number; endIndex: number }> {
  const stack: number[] = [];
  const ranges: Array<{ startIndex: number; endIndex: number }> = [];

  for (const [index, bar] of bars.entries()) {
    if ((bar.flags || []).includes('repeat_start_barline')) stack.push(index);
    if ((bar.flags || []).includes('repeat_end_barline')) {
      const startIndex = stack.pop();
      if (Number.isInteger(startIndex)) ranges.push({ startIndex, endIndex: index });
    }
  }

  return ranges;
}

function directiveTypes(bar: RichChartBar | null | undefined): string[] {
  return (bar?.directives || [])
    .map((directive) => normalizeString(directive?.type))
    .filter(Boolean);
}

function hasVampDirective(bar: RichChartBar | null | undefined): boolean {
  return directiveTypes(bar).some((type) => type === 'open_vamp' || type === 'vamp_instruction');
}

export function createChartPerformanceMap(
  chartDocument: ChartDocument | null | undefined,
  navigation: Record<string, unknown> = {}
): ChartPerformanceMap {
  const bars = (chartDocument?.bars || []) as RichChartBar[];
  const repeatRanges = buildRepeatRanges(bars);
  const repeatRegions = repeatRanges.map(({ startIndex, endIndex }) => {
    const rangeBars = bars.slice(startIndex, endIndex + 1);
    const firstBar = bars[startIndex];
    const lastBar = bars[endIndex];
    return {
      id: `repeat-${firstBar?.id || startIndex}-${lastBar?.id || endIndex}`,
      kind: 'repeat',
      startBarId: firstBar?.id || '',
      endBarId: lastBar?.id || '',
      startBarIndex: Number(firstBar?.index || startIndex + 1),
      endBarIndex: Number(lastBar?.index || endIndex + 1),
      isVamp: rangeBars.some(hasVampDirective)
    };
  });

  const sectionBoundaries = bars
    .filter((bar, index) => index === 0 || (bar.sectionId && bar.sectionId !== bars[index - 1]?.sectionId))
    .map((bar) => ({
      barId: bar.id,
      barIndex: bar.index,
      sectionId: bar.sectionId,
      sectionLabel: bar.sectionLabel
    }));

  const cuePoints = bars.flatMap((bar) => {
    const points = [];
    if ((bar.flags || []).includes('coda')) {
      points.push({ type: 'coda', barId: bar.id, barIndex: bar.index });
    }
    for (const type of directiveTypes(bar)) {
      if (type === 'dc_on_cue' || type === 'dc_al_coda' || type === 'ds_al_coda') {
        points.push({ type, barId: bar.id, barIndex: bar.index });
      }
    }
    return points;
  });

  return {
    schemaVersion: CHART_DOCUMENT_SCHEMA_VERSION,
    chartId: normalizeString(chartDocument?.metadata?.id),
    chartTitle: normalizeString(chartDocument?.metadata?.title),
    repeatRegions,
    cuePoints,
    sectionBoundaries,
    navigation: {
      segnoIndex: Number.isInteger(navigation.segnoIndex) ? Number(navigation.segnoIndex) : null,
      codaIndex: Number.isInteger(navigation.codaIndex) ? Number(navigation.codaIndex) : null
    }
  };
}
