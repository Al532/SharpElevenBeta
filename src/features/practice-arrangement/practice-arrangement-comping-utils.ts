export function weightedPick(weightMap) {
  const entries = Object.entries(weightMap)
    .map(([jump, weight]) => ({ jump: Number(jump), weight: Number(weight) }))
    .filter(entry => Number.isFinite(entry.jump) && Number.isFinite(entry.weight) && entry.weight > 0);
  if (entries.length === 0) return 3;

  const totalWeight = entries.reduce((sum, entry) => sum + entry.weight, 0);
  let cursor = Math.random() * totalWeight;
  for (const entry of entries) {
    cursor -= entry.weight;
    if (cursor <= 0) return entry.jump;
  }
  return entries[entries.length - 1].jump;
}

export function weightedPickExcludingJump(weightMap, excludedJump) {
  const filteredWeightMap = Object.fromEntries(
    Object.entries(weightMap || {}).filter(([jump]) => Number(jump) !== excludedJump)
  );
  return weightedPick(filteredWeightMap);
}

export function shuffleArray(values) {
  const clone = [...values];
  for (let i = clone.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [clone[i], clone[j]] = [clone[j], clone[i]];
  }
  return clone;
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function interpolateLinear(startValue, endValue, progress) {
  return startValue + ((endValue - startValue) * progress);
}

function getTempoInterpolationProgress(tempoBpm, startBpm = 150, endBpm = 250) {
  if (!Number.isFinite(tempoBpm)) return 0;
  if (tempoBpm <= startBpm) return 0;
  if (tempoBpm >= endBpm) return 1;
  return (tempoBpm - startBpm) / (endBpm - startBpm);
}

export function getInterpolatedNumber(baseValue, highTempoValue, tempoBpm, fallbackValue = 0) {
  const numericBaseValue = Number(baseValue);
  const safeBaseValue = Number.isFinite(numericBaseValue) ? numericBaseValue : fallbackValue;
  const numericHighTempoValue = Number(highTempoValue);
  if (!Number.isFinite(numericHighTempoValue)) return safeBaseValue;

  return interpolateLinear(
    safeBaseValue,
    numericHighTempoValue,
    getTempoInterpolationProgress(tempoBpm)
  );
}

export function getInterpolatedWeightMap(baseWeights, highTempoWeights, tempoBpm) {
  const progress = getTempoInterpolationProgress(tempoBpm);
  if (progress <= 0 || !highTempoWeights || typeof highTempoWeights !== 'object') {
    return baseWeights;
  }

  const merged = {};
  for (const [jump, baseWeight] of Object.entries(baseWeights || {})) {
    const numericBaseWeight = Number(baseWeight);
    if (!Number.isFinite(numericBaseWeight)) continue;

    if (Object.prototype.hasOwnProperty.call(highTempoWeights, jump)) {
      const numericHighWeight = Number(highTempoWeights[jump]);
      merged[jump] = Number.isFinite(numericHighWeight)
        ? interpolateLinear(numericBaseWeight, numericHighWeight, progress)
        : numericBaseWeight;
      continue;
    }

    merged[jump] = numericBaseWeight;
  }

  return merged;
}
