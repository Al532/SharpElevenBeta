export function clampNumber(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function getMean(values) {
  return values.length > 0
    ? values.reduce((total, value) => total + value, 0) / values.length
    : 0;
}

export function clampTokenOffset(rawLeft, rawRight, offset, leftBound, rightBound, maxOffsetPx) {
  const minOffset = Math.max(-maxOffsetPx, leftBound - rawLeft);
  const maxOffset = Math.min(maxOffsetPx, rightBound - rawRight);
  return clampNumber(offset, minOffset, maxOffset);
}

export function scoreGlobalTokenOffsets(rawLefts, rawRights, targetOffsets, boundaryMinOffsets, boundaryMaxOffsets, minGap) {
  const offsetMean = getMean(targetOffsets);
  const span = Math.max(1, Math.max(...rawRights) - Math.min(...rawLefts));
  const collisionWeight = 18;
  const targetWeight = 0.65;
  const balanceWeight = 0.08;
  const boundaryWeight = 5;

  return (candidateOffsets) => {
    let score = 0;
    for (let index = 0; index < candidateOffsets.length; index += 1) {
      const offset = candidateOffsets[index];
      const targetDelta = offset - targetOffsets[index];
      const balanceDelta = offset - offsetMean;
      score += targetDelta * targetDelta * targetWeight;
      score += balanceDelta * balanceDelta * balanceWeight;

      if (offset < boundaryMinOffsets[index]) {
        const overflow = boundaryMinOffsets[index] - offset;
        score += overflow * overflow * boundaryWeight;
      } else if (offset > boundaryMaxOffsets[index]) {
        const overflow = offset - boundaryMaxOffsets[index];
        score += overflow * overflow * boundaryWeight;
      }
    }

    for (let index = 0; index < candidateOffsets.length - 1; index += 1) {
      const right = rawRights[index] + candidateOffsets[index];
      const nextLeft = rawLefts[index + 1] + candidateOffsets[index + 1];
      const overlap = Math.max(0, right - nextLeft + minGap);
      score += overlap * overlap * collisionWeight;
    }

    for (let leftIndex = 0; leftIndex < candidateOffsets.length - 2; leftIndex += 1) {
      for (let rightIndex = leftIndex + 2; rightIndex < candidateOffsets.length; rightIndex += 1) {
        const right = rawRights[leftIndex] + candidateOffsets[leftIndex];
        const nextLeft = rawLefts[rightIndex] + candidateOffsets[rightIndex];
        const overlap = Math.max(0, right - nextLeft + minGap);
        score += overlap * overlap * collisionWeight * 0.35;
      }
    }

    const occupiedLeft = Math.min(...rawLefts.map((left, index) => left + candidateOffsets[index]));
    const occupiedRight = Math.max(...rawRights.map((right, index) => right + candidateOffsets[index]));
    const occupiedWidth = Math.max(0, occupiedRight - occupiedLeft);
    if (occupiedWidth > span) {
      const overflow = occupiedWidth - span;
      score += overflow * overflow * 0.02;
    }

    return score;
  };
}

export function solveGlobalTokenOffsets(
  rawLefts,
  rawRights,
  targetOffsets,
  hardMinOffsets,
  hardMaxOffsets,
  boundaryMinOffsets,
  boundaryMaxOffsets,
  minGap
) {
  const count = targetOffsets.length;
  if (count === 0) return [];

  const scoreOffsets = scoreGlobalTokenOffsets(rawLefts, rawRights, targetOffsets, boundaryMinOffsets, boundaryMaxOffsets, minGap);
  const offsets = targetOffsets.map((offset, index) => clampNumber(offset, hardMinOffsets[index], hardMaxOffsets[index]));
  const maxRange = Math.max(
    1,
    ...offsets.map((offset, index) => Math.max(Math.abs(offset - hardMinOffsets[index]), Math.abs(hardMaxOffsets[index] - offset)))
  );
  let currentScore = scoreOffsets(offsets);
  let step = Math.max(0.5, Math.min(maxRange, (Math.max(...rawRights) - Math.min(...rawLefts)) / Math.max(2, count)));

  const readCandidateTargets = (index) => {
    const candidates = [
      offsets[index],
      targetOffsets[index],
      boundaryMinOffsets[index],
      boundaryMaxOffsets[index],
      hardMinOffsets[index],
      hardMaxOffsets[index]
    ];
    if (index > 0) {
      candidates.push(rawRights[index - 1] + offsets[index - 1] + minGap - rawLefts[index]);
    }
    if (index < count - 1) {
      candidates.push(rawLefts[index + 1] + offsets[index + 1] - minGap - rawRights[index]);
    }
    return candidates.map((candidate) => clampNumber(candidate, hardMinOffsets[index], hardMaxOffsets[index]));
  };

  while (step >= 0.25) {
    let improved = false;
    for (let pass = 0; pass < count * 2; pass += 1) {
      for (let index = 0; index < count; index += 1) {
        let bestOffset = offsets[index];
        let bestScore = currentScore;
        const candidates = [
          ...readCandidateTargets(index),
          offsets[index] - step,
          offsets[index] + step,
          offsets[index] - (step / 2),
          offsets[index] + (step / 2)
        ];

        candidates.forEach((candidate) => {
          const nextOffset = clampNumber(candidate, hardMinOffsets[index], hardMaxOffsets[index]);
          if (Math.abs(nextOffset - offsets[index]) < 0.01) return;
          const nextOffsets = [...offsets];
          nextOffsets[index] = nextOffset;
          const nextScore = scoreOffsets(nextOffsets);
          if (nextScore + 0.001 < bestScore) {
            bestOffset = nextOffset;
            bestScore = nextScore;
          }
        });

        if (bestScore + 0.001 < currentScore) {
          offsets[index] = bestOffset;
          currentScore = bestScore;
          improved = true;
        }
      }
    }

    if (!improved) step /= 2;
  }

  return offsets;
}

export function getWidthFactorFromCompressionScale(scale) {
  return scale > 0 && scale < 1 ? 1 / scale : 1;
}

export function getRowResizeWeightsFromFactors(factors, minSpreadFactor, maxSpreadFactor) {
  if (factors.length === 0) return [];

  const normalizedFactors = factors.map((factor) => Math.max(1, factor));
  const averageFactor = normalizedFactors.reduce((sum, factor) => sum + factor, 0) / normalizedFactors.length || 1;
  const relativeWeights = normalizedFactors.map((factor) => factor / averageFactor);
  const spreadFactor = Math.max(...relativeWeights);
  if (spreadFactor < minSpreadFactor) return normalizedFactors.map(() => 1);

  const spreadDelta = spreadFactor - 1;
  const maxSpreadDelta = maxSpreadFactor - 1;
  if (maxSpreadDelta <= 0) return normalizedFactors.map(() => 1);

  const scale = spreadDelta > maxSpreadDelta && spreadDelta > 0
    ? maxSpreadDelta / spreadDelta
    : 1;

  return relativeWeights.map((weight) => 1 + ((weight - 1) * scale));
}
