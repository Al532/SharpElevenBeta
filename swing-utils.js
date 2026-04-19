export const DEFAULT_SWING_RATIO = 2 / 3;
export const MIN_SWING_RATIO = 0.5;
export const MAX_SWING_RATIO = 0.75;

export function normalizeSwingRatio(value, fallback = DEFAULT_SWING_RATIO) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return clampSwingRatio(fallback);
  }
  return clampSwingRatio(numericValue);
}

export function swingRatioToPercent(value) {
  return Math.round(normalizeSwingRatio(value) * 100);
}

export function swingPercentToRatio(value, fallback = DEFAULT_SWING_RATIO) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return normalizeSwingRatio(fallback);
  }
  return normalizeSwingRatio(numericValue / 100);
}

export function formatSwingPercentLabel(value) {
  return `${swingRatioToPercent(value)}%`;
}

export function getSwingOffbeatPositionBeats(swingRatio = DEFAULT_SWING_RATIO) {
  return normalizeSwingRatio(swingRatio);
}

export function getSwingFirstSubdivisionDurationBeats(swingRatio = DEFAULT_SWING_RATIO) {
  return getSwingOffbeatPositionBeats(swingRatio);
}

export function getSwingSecondSubdivisionDurationBeats(swingRatio = DEFAULT_SWING_RATIO) {
  return 1 - getSwingOffbeatPositionBeats(swingRatio);
}

function clampSwingRatio(value) {
  return Math.min(MAX_SWING_RATIO, Math.max(MIN_SWING_RATIO, value));
}
