type PracticeArrangementVoicingChord = {
  semitones?: number;
  bassSemitones?: number;
  modifier?: string;
  roman?: string;
  qualityMajor?: string;
  qualityMinor?: string;
  [key: string]: unknown;
};

type PracticeArrangementVoicingShape = {
  bassNote: number;
  guideTones: number[];
  colorTones: number[];
};

type PracticeArrangementVoicingPriorityPayload = {
  chord: PracticeArrangementVoicingChord;
  quality: string;
  nextChord?: PracticeArrangementVoicingChord | null;
  nextQuality?: string;
  resolutionSemitones?: number | null;
};

type PracticeArrangementVoicingRuntimeOptions = {
  qualityCategoryAliases?: Record<string, string[]>;
  dominantDefaultQualityMajor?: Record<string, string>;
  dominantDefaultQualityMinor?: Record<string, string>;
  colorTones?: Record<string, Array<string | number>>;
  dominantColorTones?: Record<string, Array<string | number>>;
  guideTones?: Record<string, Array<string | number>>;
  dominantGuideTones?: Record<string, Array<string | number>>;
  intervalSemitones?: Record<string, number>;
  violinLow?: number;
  violinHigh?: number;
  celloLow?: number;
  guideToneLow?: number;
  guideToneHigh?: number;
  applyContextualQualityRules?: (chord: PracticeArrangementVoicingChord, quality: string) => string;
  applyPriorityDominantResolutionRules?: (payload: PracticeArrangementVoicingPriorityPayload) => string;
  getCurrentPaddedChords?: () => PracticeArrangementVoicingChord[] | null;
  getCurrentKey?: () => number | null;
  getCurrentVoicingPlan?: () => PracticeArrangementVoicingShape[] | null;
  getNextPaddedChords?: () => PracticeArrangementVoicingChord[] | null;
  getNextKeyValue?: () => number | null;
  getNextVoicingPlan?: () => PracticeArrangementVoicingShape[] | null;
};

/**
 * @param {object} [options]
 * @param {Record<string, string[]>} [options.qualityCategoryAliases]
 * @param {Record<string, string>} [options.dominantDefaultQualityMajor]
 * @param {Record<string, string>} [options.dominantDefaultQualityMinor]
 * @param {Record<string, unknown>} [options.colorTones]
 * @param {Record<string, unknown>} [options.dominantColorTones]
 * @param {Record<string, unknown>} [options.guideTones]
 * @param {Record<string, unknown>} [options.dominantGuideTones]
 * @param {Record<string, number>} [options.intervalSemitones]
 * @param {number} [options.violinLow]
 * @param {number} [options.violinHigh]
 * @param {number} [options.celloLow]
 * @param {number} [options.guideToneLow]
 * @param {number} [options.guideToneHigh]
 * @param {(chord: PracticeArrangementVoicingChord, quality: string) => string} [options.applyContextualQualityRules]
 * @param {(payload: {
 *   chord: PracticeArrangementVoicingChord,
 *   quality: string,
 *   nextChord?: PracticeArrangementVoicingChord | null,
 *   nextQuality?: string,
 *   resolutionSemitones?: number | null
 * }) => string} [options.applyPriorityDominantResolutionRules]
 * @param {() => PracticeArrangementVoicingChord[] | null} [options.getCurrentPaddedChords]
 * @param {() => number | null} [options.getCurrentKey]
 * @param {() => PracticeArrangementVoicingShape[] | null} [options.getCurrentVoicingPlan]
 * @param {() => PracticeArrangementVoicingChord[] | null} [options.getNextPaddedChords]
 * @param {() => number | null} [options.getNextKeyValue]
 * @param {() => PracticeArrangementVoicingShape[] | null} [options.getNextVoicingPlan]
 */
export function createPracticeArrangementVoicingRuntime({
  qualityCategoryAliases = {},
  dominantDefaultQualityMajor = {},
  dominantDefaultQualityMinor = {},
  colorTones = {},
  dominantColorTones = {},
  guideTones = {},
  dominantGuideTones = {},
  intervalSemitones = {},
  violinLow = 56,
  violinHigh = 84,
  celloLow = 37,
  guideToneLow = 49,
  guideToneHigh = 60,
  applyContextualQualityRules = (_chord, quality) => quality,
  applyPriorityDominantResolutionRules = ({ quality }) => quality,
  getCurrentPaddedChords = () => null,
  getCurrentKey = () => null,
  getCurrentVoicingPlan = () => null,
  getNextPaddedChords = () => null,
  getNextKeyValue = () => null,
  getNextVoicingPlan = () => null
}: PracticeArrangementVoicingRuntimeOptions = {}) {
  const VOICING_RANDOMIZATION_CHANCE = 0.3;
  const VOICING_BOUNDARY_RANDOMIZATION_CHANCE = 0.3;
  const VOICING_RANDOM_TOP_SLACK = 1;
  const VOICING_RANDOM_BOUNDARY_SLACK = 2;
  const VOICING_RANDOM_CENTER_SLACK = 5;
  const VOICING_RANDOM_SUM_SLACK = 10;
  const VOICING_RANDOM_INNER_SLACK = 6;

  function classifyQuality(quality: string) {
    for (const [category, aliases] of Object.entries(qualityCategoryAliases)) {
      if (quality === category) return category;
      if ((aliases || []).includes(quality)) return category;
    }
    if (quality.startsWith('13')) return 'dom';
    if (quality.startsWith('9')) return 'dom';
    if (quality.startsWith('7')) return 'dom';
    return null;
  }

  function resolveDominantQuality(chord: PracticeArrangementVoicingChord, quality: string, isMinor: boolean) {
    if (quality !== '7') return quality;
    const defaults = isMinor ? dominantDefaultQualityMinor : dominantDefaultQualityMajor;
    if (chord.modifier) return '13';
    return defaults[chord.roman] || '13';
  }

  function getCanonicalChordQuality(chord: PracticeArrangementVoicingChord | null | undefined, isMinor: boolean) {
    if (!chord) return '';
    return isMinor ? chord.qualityMinor : chord.qualityMajor;
  }

  function getPlayedChordQuality(chord: PracticeArrangementVoicingChord, isMinor: boolean, nextChord: PracticeArrangementVoicingChord | null = null) {
    const canonicalQuality = getCanonicalChordQuality(chord, isMinor);
    if (!canonicalQuality) return '';
    const contextualQuality = applyContextualQualityRules(chord, canonicalQuality);
    const nextCanonicalQuality = getCanonicalChordQuality(nextChord, isMinor);
    const nextContextualQuality = nextCanonicalQuality
      ? applyContextualQualityRules(nextChord, nextCanonicalQuality)
      : '';
    const prioritizedQuality = applyPriorityDominantResolutionRules({
      chord,
      quality: contextualQuality,
      nextChord,
      nextQuality: nextContextualQuality,
      resolutionSemitones: nextChord
        ? ((nextChord.semitones ?? 0) - (chord.semitones ?? 0) + 12) % 12
        : null
    });
    if (prioritizedQuality !== contextualQuality) return prioritizedQuality;
    if (classifyQuality(contextualQuality) !== 'dom') return contextualQuality;
    return resolveDominantQuality(chord, contextualQuality, isMinor);
  }

  function resolveIntervalValue(interval: string | number) {
    if (typeof interval === 'number') return interval;
    if (typeof interval === 'string' && interval in intervalSemitones) {
      return intervalSemitones[interval] as number;
    }
    throw new Error(`Unknown interval in voicing config: ${interval}`);
  }

  function resolveIntervalList(intervals: Array<string | number> | null | undefined) {
    return (intervals || []).map(resolveIntervalValue);
  }

  function buildChordVoicingBase(
    rootPitchClass,
    qualityCategory,
    colorToneIntervals,
    guideToneIntervals = null,
    bassPitchClass = rootPitchClass
  ) {
    let bassNote = bassPitchClass;
    while (bassNote < celloLow) bassNote += 12;

    const guideIntervals = resolveIntervalList(guideToneIntervals || guideTones[qualityCategory]);
    const nextGuideTones = guideIntervals.map((interval) => {
      const pitchClass = (rootPitchClass + interval) % 12;
      return pitchClass === 0 ? 60 : 48 + pitchClass;
    });

    const bassMatchesGuideIndex = nextGuideTones.findIndex((midi) => (midi % 12) === bassPitchClass);
    if (bassMatchesGuideIndex !== -1) {
      let rootGuideReplacement = rootPitchClass;
      while (rootGuideReplacement <= bassNote || rootGuideReplacement < guideToneLow) rootGuideReplacement += 12;
      while (rootGuideReplacement > guideToneHigh) rootGuideReplacement -= 12;
      if (rootGuideReplacement < guideToneLow) rootGuideReplacement += 12;
      nextGuideTones[bassMatchesGuideIndex] = rootGuideReplacement;
    }
    const uniqueGuideTones = [...new Set(nextGuideTones)];
    const topGuide = Math.max(...uniqueGuideTones);

    const colorPitchClasses = [...new Set(
      colorToneIntervals.map((interval) => (rootPitchClass + interval) % 12)
    )];
    if (bassPitchClass !== rootPitchClass && bassMatchesGuideIndex === -1 && !colorPitchClasses.includes(rootPitchClass)) {
      colorPitchClasses.push(rootPitchClass);
    }

    return {
      bassNote,
      guideTones: uniqueGuideTones,
      colorPitchClasses,
      topGuide
    };
  }

  function getCandidateMidisForPitchClass(pitchClass, minExclusive, low = violinLow, high = violinHigh) {
    const midis = [];
    let midi = pitchClass;
    while (midi <= minExclusive || midi < low) midi += 12;
    while (midi <= high) {
      midis.push(midi);
      midi += 12;
    }
    return midis;
  }

  function getGapFillCandidates(lowerNote, upperNote, colorPitchClasses, existingNotes) {
    const candidates = [];
    const seen = new Set();

    for (const pitchClass of colorPitchClasses) {
      let midi = pitchClass;
      while (midi <= lowerNote || midi < violinLow) midi += 12;
      while (midi < upperNote && midi <= violinHigh) {
        if (!existingNotes.has(midi) && !seen.has(midi)) {
          candidates.push(midi);
          seen.add(midi);
        }
        midi += 12;
      }
    }

    return candidates;
  }

  function pickBestGapFill(lowerNote, upperNote, candidates) {
    if (!candidates.length) return null;
    const midpoint = (lowerNote + upperNote) / 2;

    return candidates.slice().sort((left, right) => {
      const leftLargestGap = Math.max(left - lowerNote, upperNote - left);
      const rightLargestGap = Math.max(right - lowerNote, upperNote - right);
      if (leftLargestGap !== rightLargestGap) return leftLargestGap - rightLargestGap;

      const leftMidDistance = Math.abs(left - midpoint);
      const rightMidDistance = Math.abs(right - midpoint);
      if (leftMidDistance !== rightMidDistance) return leftMidDistance - rightMidDistance;

      return left - right;
    })[0];
  }

  function fillVoicingUpperGaps(guideTonesInput, colorTonesInput, colorPitchClasses) {
    const augmentedColorTones = [...colorTonesInput];

    while (true) {
      const upperNotes = [...guideTonesInput, ...augmentedColorTones].sort((a, b) => a - b);
      let widestGap = null;

      for (let index = 1; index < upperNotes.length; index++) {
        const lowerNote = upperNotes[index - 1];
        const upperNote = upperNotes[index];
        const gap = upperNote - lowerNote;
        if (gap > 12 && (!widestGap || gap > widestGap.gap)) {
          widestGap = { lowerNote, upperNote, gap };
        }
      }

      if (!widestGap) {
        return augmentedColorTones.sort((a, b) => a - b);
      }

      const existingNotes = new Set(upperNotes);
      const fillCandidates = getGapFillCandidates(
        widestGap.lowerNote,
        widestGap.upperNote,
        colorPitchClasses,
        existingNotes
      );
      const filler = pickBestGapFill(widestGap.lowerNote, widestGap.upperNote, fillCandidates);
      if (filler === null) {
        return null;
      }

      augmentedColorTones.push(filler);
    }
  }

  function getVoicingTopNote(voicing) {
    if (!voicing?.colorTones?.length) {
      return Math.max(voicing?.bassNote || -Infinity, ...(voicing?.guideTones || []));
    }
    return voicing.colorTones[voicing.colorTones.length - 1];
  }

  function sumNotes(notes) {
    return notes.reduce((total, note) => total + note, 0);
  }

  function enumerateChordVoicingCandidates(
    rootPitchClass,
    qualityCategory,
    colorToneIntervals,
    guideToneIntervals = null,
    bassPitchClass = rootPitchClass
  ) {
    const base = buildChordVoicingBase(
      rootPitchClass,
      qualityCategory,
      colorToneIntervals,
      guideToneIntervals,
      bassPitchClass
    );
    const { bassNote, guideTones: nextGuideTones, colorPitchClasses, topGuide } = base;
    if (colorPitchClasses.length === 0) {
      return [{ bassNote, guideTones: nextGuideTones, colorTones: [] }];
    }

    const colorToneOptions = colorPitchClasses.map((pc) => getCandidateMidisForPitchClass(pc, topGuide));
    if (colorToneOptions.some((options) => options.length === 0)) {
      return [];
    }

    const candidateMap = new Map();
    const current = new Array(colorToneOptions.length);

    function visitOption(optionIndex) {
      if (optionIndex >= colorToneOptions.length) {
        const colorTones = [...current].sort((a, b) => a - b);
        const filledColorTones = fillVoicingUpperGaps(nextGuideTones, colorTones, colorPitchClasses);
        if (!filledColorTones) {
          return;
        }
        const key = filledColorTones.join(',');
        if (!candidateMap.has(key)) {
          candidateMap.set(key, { bassNote, guideTones: nextGuideTones, colorTones: filledColorTones });
        }
        return;
      }

      for (const midi of colorToneOptions[optionIndex]) {
        current[optionIndex] = midi;
        visitOption(optionIndex + 1);
      }
    }

    visitOption(0);

    return [...candidateMap.values()].sort((left, right) => {
      const topDiff = getVoicingTopNote(left) - getVoicingTopNote(right);
      if (topDiff !== 0) return topDiff;
      const sumDiff = sumNotes(left.colorTones) - sumNotes(right.colorTones);
      if (sumDiff !== 0) return sumDiff;
      return left.colorTones.join(',').localeCompare(right.colorTones.join(','));
    });
  }

  function computeChordVoicing(
    rootPitchClass,
    qualityCategory,
    colorToneIntervals,
    guideToneIntervals = null,
    bassPitchClass = rootPitchClass
  ) {
    return enumerateChordVoicingCandidates(
      rootPitchClass,
      qualityCategory,
      colorToneIntervals,
      guideToneIntervals,
      bassPitchClass
    )[0] || null;
  }

  function getVoicingUpperSpan(voicing) {
    const upperNotes = [...(voicing?.guideTones || []), ...(voicing?.colorTones || [])].sort((a, b) => a - b);
    if (upperNotes.length < 2) return 0;
    return upperNotes[upperNotes.length - 1] - upperNotes[0];
  }

  function getVoicingInnerMovement(fromVoicing, toVoicing) {
    if (!fromVoicing?.colorTones?.length || !toVoicing?.colorTones?.length) return 0;

    const fromNotes = [...fromVoicing.colorTones].sort((a, b) => a - b);
    const toNotes = [...toVoicing.colorTones].sort((a, b) => a - b);
    const limit = Math.min(fromNotes.length, toNotes.length);
    let movement = 0;

    for (let index = 0; index < limit; index++) {
      movement += Math.abs(toNotes[index] - fromNotes[index]);
    }

    if (fromNotes.length === toNotes.length) return movement;

    const longerNotes = fromNotes.length > toNotes.length ? fromNotes : toNotes;
    const shorterNotes = fromNotes.length > toNotes.length ? toNotes : fromNotes;
    const fallbackNote = shorterNotes.length > 0
      ? shorterNotes[shorterNotes.length - 1]
      : getVoicingTopNote(fromNotes.length > toNotes.length ? toVoicing : fromVoicing);

    for (let index = limit; index < longerNotes.length; index++) {
      movement += Math.abs(longerNotes[index] - fallbackNote);
    }

    return movement;
  }

  function createVoicingSlot(chord, key, isMinor, segment = 'current', nextChord = null) {
    if (!chord) {
      return { chord: null, key, segment, candidateSet: [null] };
    }

    const quality = getPlayedChordQuality(chord, isMinor, nextChord);
    const qualityCategory = classifyQuality(quality);
    if (!qualityCategory) {
      return { chord, key, segment, candidateSet: [null] };
    }

    const rootPitchClass = (key + chord.semitones) % 12;
    const bassPitchClass = (key + (chord.bassSemitones ?? chord.semitones)) % 12;
    let colorIntervals;
    let guideIntervals = null;
    if (qualityCategory === 'dom') {
      colorIntervals = resolveIntervalList(dominantColorTones[quality] || dominantColorTones['13']);
      guideIntervals = dominantGuideTones[quality] || null;
    } else {
      colorIntervals = resolveIntervalList(colorTones[qualityCategory] || []);
    }

    const candidateSet = enumerateChordVoicingCandidates(
      rootPitchClass,
      qualityCategory,
      colorIntervals,
      guideIntervals,
      bassPitchClass
    );

    return {
      chord,
      key,
      segment,
      candidateSet: candidateSet.length > 0 ? candidateSet : [null]
    };
  }

  function compareVoicingPathScores(left, right) {
    if (!left) return 1;
    if (!right) return -1;
    if (left.totalTopMovement !== right.totalTopMovement) return left.totalTopMovement - right.totalTopMovement;
    if (left.totalBoundaryCenterDistance !== right.totalBoundaryCenterDistance) return left.totalBoundaryCenterDistance - right.totalBoundaryCenterDistance;
    if (left.totalBoundaryTopMovement !== right.totalBoundaryTopMovement) return left.totalBoundaryTopMovement - right.totalBoundaryTopMovement;
    if (left.totalUpperSpan !== right.totalUpperSpan) return right.totalUpperSpan - left.totalUpperSpan;
    if (left.totalTopSum !== right.totalTopSum) return left.totalTopSum - right.totalTopSum;
    if (left.totalInnerMovement !== right.totalInnerMovement) return left.totalInnerMovement - right.totalInnerMovement;
    return left.signature.localeCompare(right.signature);
  }

  function compareLegacyVoicingPathScores(left, right) {
    if (!left) return 1;
    if (!right) return -1;
    if (left.totalTopMovement !== right.totalTopMovement) return left.totalTopMovement - right.totalTopMovement;
    if (left.totalTopSum !== right.totalTopSum) return left.totalTopSum - right.totalTopSum;
    return left.signature.localeCompare(right.signature);
  }

  function isVoicingScoreNearBest(score, bestScore) {
    if (!score || !bestScore) return false;
    return score.totalTopMovement <= bestScore.totalTopMovement + VOICING_RANDOM_TOP_SLACK
      && score.totalBoundaryCenterDistance <= bestScore.totalBoundaryCenterDistance + VOICING_RANDOM_CENTER_SLACK
      && score.totalBoundaryTopMovement <= bestScore.totalBoundaryTopMovement + VOICING_RANDOM_BOUNDARY_SLACK
      && score.totalTopSum <= bestScore.totalTopSum + VOICING_RANDOM_SUM_SLACK
      && score.totalInnerMovement <= bestScore.totalInnerMovement + VOICING_RANDOM_INNER_SLACK;
  }

  function getVoicingScorePenalty(score, bestScore) {
    if (!score || !bestScore) return Infinity;
    return (score.totalTopMovement - bestScore.totalTopMovement) * 6
      + (score.totalBoundaryCenterDistance - bestScore.totalBoundaryCenterDistance) * 2
      + (score.totalBoundaryTopMovement - bestScore.totalBoundaryTopMovement) * 4
      + Math.max(0, bestScore.totalUpperSpan - score.totalUpperSpan) * 0.75
      + (score.totalTopSum - bestScore.totalTopSum) * 0.25
      + (score.totalInnerMovement - bestScore.totalInnerMovement) * 0.5;
  }

  function pickWeightedRandomScore(scores, bestScore) {
    let totalWeight = 0;
    const weightedScores = scores.map((score) => {
      const penalty = Math.max(0, getVoicingScorePenalty(score, bestScore));
      const weight = 1 / (1 + penalty);
      totalWeight += weight;
      return { score, weight };
    });

    if (totalWeight <= 0) return bestScore;

    let cursor = Math.random() * totalWeight;
    for (const entry of weightedScores) {
      cursor -= entry.weight;
      if (cursor <= 0) return entry.score;
    }

    return weightedScores[weightedScores.length - 1]?.score || bestScore;
  }

  function pickVoicingScore(scores, randomizationChance = VOICING_RANDOMIZATION_CHANCE) {
    const availableScores = scores.filter(Boolean);
    if (availableScores.length === 0) return null;

    let bestScore = availableScores[0];
    for (let index = 1; index < availableScores.length; index++) {
      if (compareVoicingPathScores(availableScores[index], bestScore) < 0) {
        bestScore = availableScores[index];
      }
    }

    const shortlist = availableScores.filter((score) => isVoicingScoreNearBest(score, bestScore));
    if (shortlist.length <= 1 || Math.random() >= randomizationChance) {
      return bestScore;
    }

    return pickWeightedRandomScore(shortlist, bestScore);
  }

  function buildVoicingPlanForSlots(slots) {
    if (!Array.isArray(slots) || slots.length === 0) return [];

    const candidatesByIndex = slots.map((slot) => slot?.candidateSet?.length ? slot.candidateSet : [null]);
    const topCenter = Math.round((violinLow + violinHigh) / 2);

    let previousScores = candidatesByIndex[0].map((candidate) => ({
      candidate,
      totalTopMovement: 0,
      totalBoundaryTopMovement: 0,
      totalBoundaryCenterDistance: candidate ? Math.abs(getVoicingTopNote(candidate) - topCenter) : 0,
      totalUpperSpan: candidate ? getVoicingUpperSpan(candidate) : 0,
      totalTopSum: candidate ? getVoicingTopNote(candidate) : 0,
      totalInnerMovement: 0,
      prevIndex: -1,
      signature: candidate?.colorTones?.join(',') || ''
    }));

    const scoreRows = [previousScores];

    for (let rowIndex = 1; rowIndex < candidatesByIndex.length; rowIndex++) {
      const rowCandidates = candidatesByIndex[rowIndex];
      const crossesBoundary = slots[rowIndex - 1]?.segment !== slots[rowIndex]?.segment;
      const nextScores = rowCandidates.map((candidate) => {
        const candidateScores = [];
        for (let prevIndex = 0; prevIndex < previousScores.length; prevIndex++) {
          const prevScore = previousScores[prevIndex];
          const prevCandidate = prevScore.candidate;
          const rawTopMovement = candidate && prevCandidate
            ? Math.abs(getVoicingTopNote(candidate) - getVoicingTopNote(prevCandidate))
            : 0;
          const inPatternTopMovement = crossesBoundary ? 0 : rawTopMovement;
          const boundaryTopMovement = crossesBoundary ? rawTopMovement : 0;
          const boundaryCenterDistance = crossesBoundary && candidate
            ? Math.abs(getVoicingTopNote(candidate) - topCenter)
            : 0;
          const innerMovement = candidate && prevCandidate
            ? getVoicingInnerMovement(prevCandidate, candidate)
            : 0;
          candidateScores.push({
            candidate,
            totalTopMovement: prevScore.totalTopMovement + inPatternTopMovement,
            totalBoundaryTopMovement: prevScore.totalBoundaryTopMovement + boundaryTopMovement,
            totalBoundaryCenterDistance: prevScore.totalBoundaryCenterDistance + boundaryCenterDistance,
            totalUpperSpan: prevScore.totalUpperSpan + (candidate ? getVoicingUpperSpan(candidate) : 0),
            totalTopSum: prevScore.totalTopSum + (candidate ? getVoicingTopNote(candidate) : 0),
            totalInnerMovement: prevScore.totalInnerMovement + innerMovement,
            prevIndex,
            signature: `${prevScore.signature}|${candidate?.colorTones?.join(',') || ''}`
          });
        }
        const randomizationChance = crossesBoundary
          ? VOICING_BOUNDARY_RANDOMIZATION_CHANCE
          : VOICING_RANDOMIZATION_CHANCE;
        return pickVoicingScore(candidateScores, randomizationChance);
      });

      scoreRows.push(nextScores);
      previousScores = nextScores;
    }

    const bestFinalScore = pickVoicingScore(previousScores);
    let bestFinalIndex = previousScores.findIndex((score) => score === bestFinalScore);
    const plan = new Array(slots.length);
    for (let rowIndex = scoreRows.length - 1, candidateIndex = bestFinalIndex; rowIndex >= 0; rowIndex--) {
      const score = scoreRows[rowIndex][candidateIndex];
      plan[rowIndex] = score.candidate;
      candidateIndex = score.prevIndex;
    }

    return plan;
  }

  function buildLegacyVoicingPlan(chords, key, isMinor) {
    if (!Array.isArray(chords) || chords.length === 0) return [];

    const candidatesByIndex = chords.map((chord, index) => createVoicingSlot(chord, key, isMinor, 'current', chords[index + 1] || null).candidateSet);
    let previousScores = candidatesByIndex[0].map((candidate) => ({
      candidate,
      totalTopMovement: 0,
      totalTopSum: candidate ? getVoicingTopNote(candidate) : 0,
      prevIndex: -1,
      signature: candidate?.colorTones?.join(',') || ''
    }));

    const scoreRows = [previousScores];
    for (let rowIndex = 1; rowIndex < candidatesByIndex.length; rowIndex++) {
      const rowCandidates = candidatesByIndex[rowIndex];
      const nextScores = rowCandidates.map((candidate) => {
        let bestScore = null;
        for (let prevIndex = 0; prevIndex < previousScores.length; prevIndex++) {
          const prevScore = previousScores[prevIndex];
          const topMovement = candidate && prevScore.candidate
            ? Math.abs(getVoicingTopNote(candidate) - getVoicingTopNote(prevScore.candidate))
            : 0;
          const candidateScore = {
            candidate,
            totalTopMovement: prevScore.totalTopMovement + topMovement,
            totalTopSum: prevScore.totalTopSum + (candidate ? getVoicingTopNote(candidate) : 0),
            prevIndex,
            signature: `${prevScore.signature}|${candidate?.colorTones?.join(',') || ''}`
          };
          if (!bestScore || compareLegacyVoicingPathScores(candidateScore, bestScore) < 0) {
            bestScore = candidateScore;
          }
        }
        return bestScore;
      });
      scoreRows.push(nextScores);
      previousScores = nextScores;
    }

    let bestFinalIndex = 0;
    for (let index = 1; index < previousScores.length; index++) {
      if (compareLegacyVoicingPathScores(previousScores[index], previousScores[bestFinalIndex]) < 0) {
        bestFinalIndex = index;
      }
    }

    const plan = new Array(chords.length);
    for (let rowIndex = scoreRows.length - 1, candidateIndex = bestFinalIndex; rowIndex >= 0; rowIndex--) {
      const score = scoreRows[rowIndex][candidateIndex];
      plan[rowIndex] = score.candidate;
      candidateIndex = score.prevIndex;
    }

    return plan;
  }

  function isVoiceLeadingV2Enabled() {
    return true;
  }

  function buildVoicingPlan(chords, key, isMinor) {
    if (!Array.isArray(chords) || chords.length === 0) return [];
    if (!isVoiceLeadingV2Enabled()) {
      return buildLegacyVoicingPlan(chords, key, isMinor);
    }
    const slots = chords.map((chord, index) => createVoicingSlot(chord, key, isMinor, 'current', chords[index + 1] || null));
    return buildVoicingPlanForSlots(slots);
  }

  function getVoicing(key, chord, isMinor, nextChord = null) {
    const quality = getPlayedChordQuality(chord, isMinor, nextChord);
    const category = classifyQuality(quality);
    if (!category) return null;

    const rootPitchClass = (key + chord.semitones) % 12;
    const bassPitchClass = (key + (chord.bassSemitones ?? chord.semitones)) % 12;
    let colorIntervals;
    let guideIntervals = null;
    if (category === 'dom') {
      colorIntervals = resolveIntervalList(dominantColorTones[quality] || dominantColorTones['13']);
      guideIntervals = dominantGuideTones[quality] || null;
    } else {
      colorIntervals = resolveIntervalList(colorTones[category] || []);
    }

    return computeChordVoicing(rootPitchClass, category, colorIntervals, guideIntervals, bassPitchClass);
  }

  function getVoicingPlanForProgression(chords, key) {
    if (chords === getCurrentPaddedChords() && key === getCurrentKey()) {
      return getCurrentVoicingPlan();
    }
    if (chords === getNextPaddedChords() && key === getNextKeyValue()) {
      return getNextVoicingPlan();
    }
    return null;
  }

  return {
    classifyQuality,
    getPlayedChordQuality,
    createVoicingSlot,
    buildVoicingPlanForSlots,
    buildLegacyVoicingPlan,
    buildVoicingPlan,
    getVoicing,
    getVoicingPlanForProgression
  };
}


