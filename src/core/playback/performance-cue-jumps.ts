import type {
  ChartPerformanceCue,
  PracticeSessionSpec
} from '../types/contracts';

type PlaybackBarOffset = {
  bar: Record<string, unknown>;
  start: number;
  end: number;
};

function getPlaybackBarBeatCount(bar: Record<string, unknown> | null | undefined) {
  const beatSlots = Array.isArray(bar?.beatSlots) ? bar.beatSlots : [];
  const symbols = Array.isArray(bar?.symbols) ? bar.symbols : [];
  return Math.max(1, beatSlots.length || symbols.length || 1);
}

export function getPlaybackBarOffsets(bars: Array<Record<string, unknown>> = []): PlaybackBarOffset[] {
  let offset = 0;
  return bars.map((bar) => {
    const start = offset;
    const beatCount = getPlaybackBarBeatCount(bar);
    offset += beatCount;
    return {
      bar,
      start,
      end: start + beatCount
    };
  });
}

export function findPlaybackOffsetForBarIndex(
  offsets: PlaybackBarOffset[],
  barIndex: number,
  minimumOffset = 0
): PlaybackBarOffset | null {
  return offsets.find((entry) => Number(entry.bar?.index) === barIndex && entry.start >= minimumOffset) || null;
}

export function resolveRepeatExitCueJump(
  cue: ChartPerformanceCue | Record<string, unknown> | null | undefined,
  sessionSpec: PracticeSessionSpec | Record<string, unknown> | null | undefined,
  currentChordIdx = 0
) {
  const triggerBarIndex = Number(cue?.targetBarIndex);
  const playback = sessionSpec?.playback && typeof sessionSpec.playback === 'object'
    ? sessionSpec.playback as Record<string, unknown>
    : {};
  const performanceMap = playback.performanceMap && typeof playback.performanceMap === 'object'
    ? playback.performanceMap as Record<string, unknown>
    : {};
  const repeatRegions = Array.isArray(performanceMap.repeatRegions) ? performanceMap.repeatRegions : [];
  const repeatRegion = repeatRegions
    .map((region) => ({
      startBarIndex: Number(region?.startBarIndex),
      endBarIndex: Number(region?.endBarIndex)
    }))
    .find((region) => (
      Number.isFinite(region.startBarIndex)
      && Number.isFinite(region.endBarIndex)
      && triggerBarIndex >= region.startBarIndex
      && triggerBarIndex <= region.endBarIndex
    ));
  const bars = Array.isArray(playback.bars) ? playback.bars as Array<Record<string, unknown>> : [];
  if (!Number.isFinite(triggerBarIndex) || !repeatRegion || bars.length === 0) return null;

  const offsets = getPlaybackBarOffsets(bars);
  const triggerEntry = findPlaybackOffsetForBarIndex(offsets, triggerBarIndex, Math.max(0, currentChordIdx));
  if (!triggerEntry) return null;

  const exitEntry = offsets.find((entry) => {
    const barIndex = Number(entry.bar?.index);
    return (
      entry.start >= triggerEntry.end
      && Number.isFinite(barIndex)
      && (barIndex < repeatRegion.startBarIndex || barIndex > repeatRegion.endBarIndex)
    );
  });

  if (!exitEntry) return null;
  return {
    triggerStart: triggerEntry.end,
    targetStart: exitEntry.start,
    triggerBarIndex,
    targetBarIndex: Number(exitEntry.bar?.index)
  };
}

function getPlaybackPerformanceMap(
  sessionSpec: PracticeSessionSpec | Record<string, unknown> | null | undefined
) {
  const playback = sessionSpec?.playback && typeof sessionSpec.playback === 'object'
    ? sessionSpec.playback as Record<string, unknown>
    : {};
  return playback.performanceMap && typeof playback.performanceMap === 'object'
    ? playback.performanceMap as Record<string, unknown>
    : {};
}

function getCodaTargetBarIndexFromCuePoints(
  cue: ChartPerformanceCue | Record<string, unknown> | null | undefined,
  performanceMap: Record<string, unknown>
) {
  const triggerBarIndex = Number(cue?.targetBarIndex);
  const cuePoints = Array.isArray(performanceMap.cuePoints) ? performanceMap.cuePoints : [];
  const normalizedCuePoints = cuePoints
    .map((point) => ({ ...point, barIndex: Number(point?.barIndex) }))
    .filter((point) => point.type === 'coda' && Number.isFinite(point.barIndex));
  const targetPoint = normalizedCuePoints
    .filter((point) => Number.isFinite(triggerBarIndex) && point.barIndex > triggerBarIndex)
    .sort((a, b) => a.barIndex - b.barIndex)[0]
    || normalizedCuePoints.sort((a, b) => b.barIndex - a.barIndex)[0];
  return Number.isFinite(targetPoint?.barIndex) ? Number(targetPoint.barIndex) : null;
}

export function resolveCodaCueJump(
  cue: ChartPerformanceCue | Record<string, unknown> | null | undefined,
  sessionSpec: PracticeSessionSpec | Record<string, unknown> | null | undefined,
  currentChordIdx = 0
) {
  const performanceMap = getPlaybackPerformanceMap(sessionSpec);
  const codaGate = performanceMap.codaGate && typeof performanceMap.codaGate === 'object'
    ? performanceMap.codaGate as Record<string, unknown>
    : null;
  if (codaGate?.enabled === true) {
    const triggerStart = Number(codaGate.triggerEndChordIndex ?? codaGate.stopChordIndex);
    const targetStart = Number(codaGate.targetChordIndex ?? codaGate.stopChordIndex);
    if (!Number.isFinite(triggerStart) || !Number.isFinite(targetStart)) return null;
    if (triggerStart < Math.max(0, Number(currentChordIdx) || 0)) return null;
    return {
      triggerStart,
      targetStart,
      triggerBarIndex: Number(codaGate.triggerBarIndex ?? cue?.targetBarIndex ?? 0) || null,
      targetBarIndex: Number(codaGate.targetBarIndex ?? 0) || null
    };
  }

  const triggerBarIndex = Number(cue?.targetBarIndex);
  const codaBarIndex = getCodaTargetBarIndexFromCuePoints(cue, performanceMap);
  const playback = sessionSpec?.playback && typeof sessionSpec.playback === 'object'
    ? sessionSpec.playback as Record<string, unknown>
    : {};
  const bars = Array.isArray(playback.bars) ? playback.bars as Array<Record<string, unknown>> : [];
  if (!Number.isFinite(triggerBarIndex) || !Number.isFinite(codaBarIndex) || bars.length === 0) return null;

  const offsets = getPlaybackBarOffsets(bars);
  const triggerEntry = findPlaybackOffsetForBarIndex(offsets, triggerBarIndex, Math.max(0, currentChordIdx));
  const codaEntry = triggerEntry
    ? findPlaybackOffsetForBarIndex(offsets, codaBarIndex, triggerEntry.start)
    : null;
  if (!triggerEntry || !codaEntry) return null;

  return {
    triggerStart: codaEntry.start === triggerEntry.start ? triggerEntry.start : triggerEntry.end,
    targetStart: codaEntry.start,
    triggerBarIndex,
    targetBarIndex: Number(codaEntry.bar?.index)
  };
}
