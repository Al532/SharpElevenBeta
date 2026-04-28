export const DEFAULT_SWING_RATIO = 2;
export const MIN_SWING_RATIO = 1;
export const MAX_SWING_RATIO = 3.5;
export const DEFAULT_SWING_TEMPO_BPM = 120;

export function normalizeSwingRatio(value, fallback = DEFAULT_SWING_RATIO) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return clampSwingRatio(fallback);
  }
  return clampSwingRatio(numericValue);
}

export function swingRatioToPercent(value) {
  return Math.round(getSwingOffbeatPositionBeats(value) * 100);
}

export function swingPercentToRatio(value, fallback = DEFAULT_SWING_RATIO) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return normalizeSwingRatio(fallback);
  }
  const normalizedPercent = Math.min(99.999, Math.max(50, numericValue)) / 100;
  return normalizeSwingRatio(normalizedPercent / (1 - normalizedPercent), fallback);
}

export function formatSwingPercentLabel(value) {
  return `${swingRatioToPercent(value)}%`;
}

export function getSwingOffbeatPositionBeats(swingRatio = DEFAULT_SWING_RATIO) {
  const normalizedRatio = normalizeSwingRatio(swingRatio);
  return normalizedRatio / (normalizedRatio + 1);
}

export function getSwingFirstSubdivisionDurationBeats(swingRatio = DEFAULT_SWING_RATIO) {
  return getSwingOffbeatPositionBeats(swingRatio);
}

export function getSwingSecondSubdivisionDurationBeats(swingRatio = DEFAULT_SWING_RATIO) {
  return 1 - getSwingOffbeatPositionBeats(swingRatio);
}

export function getDrumSwingRatioForTempoBpm(tempoBpm = DEFAULT_SWING_TEMPO_BPM) {
  const numericTempo = Number(tempoBpm);
  const resolvedTempo = Number.isFinite(numericTempo) ? numericTempo : DEFAULT_SWING_TEMPO_BPM;
  return normalizeSwingRatio(3 - (0.01 * (resolvedTempo - 60)));
}

export function getLightSwingRatioFromDrumSwingRatio(drumSwingRatio = DEFAULT_SWING_RATIO) {
  const normalizedDrumSwingRatio = normalizeSwingRatio(drumSwingRatio);
  return normalizeSwingRatio(1 + (0.55 * (normalizedDrumSwingRatio - 1)));
}

export function getLightSwingRatioForTempoBpm(tempoBpm = DEFAULT_SWING_TEMPO_BPM) {
  return getLightSwingRatioFromDrumSwingRatio(getDrumSwingRatioForTempoBpm(tempoBpm));
}

function clampSwingRatio(value) {
  return Math.min(MAX_SWING_RATIO, Math.max(MIN_SWING_RATIO, value));
}
