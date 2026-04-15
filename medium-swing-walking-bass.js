import voicingConfig from './voicing-config.js';

const {
  GUIDE_TONES,
  COLOR_TONES,
  DOMINANT_COLOR_TONES,
  DOMINANT_GUIDE_TONES = {},
  DOMINANT_DEFAULT_QUALITY_MAJOR = {},
  DOMINANT_DEFAULT_QUALITY_MINOR = {},
  DOMINANT_QUALITY_ALIASES = {},
  QUALITY_CATEGORY_ALIASES = {}
} = voicingConfig;

const INTERVAL_SEMITONES = {
  '1': 0,
  b9: 1, '9': 2, '#9': 3,
  b3: 3, '3': 4,
  '4': 5,
  '#11': 6, b5: 6, '5': 7,
  '#5': 8, b13: 8, '6': 9, '13': 9, bb7: 9,
  b7: 10, '7': 11
};

const VELOCITY_NEUTRAL = 100;
const VELOCITY_STRONG = 112;
const VELOCITY_ARRIVAL = 127;
const MAX_SEARCH_CANDIDATES = 10;
const LEAP_REPEAT_EFFECT_THRESHOLD = 5;
const LEAP_REPEAT_OFFSET_BEATS = 2 / 3;
const LEAP_REPEAT_EFFECT_PROBABILITY = 0.1;
const LEAP_REPEAT_VELOCITY_DROP = 28;

function mod12(value) {
  return ((value % 12) + 12) % 12;
}

function resolveIntervalValue(interval) {
  if (typeof interval === 'number') return interval;
  if (typeof interval === 'string' && interval in INTERVAL_SEMITONES) {
    return INTERVAL_SEMITONES[interval];
  }
  throw new Error(`Unknown interval in walking bass config: ${interval}`);
}

function resolveIntervalList(intervals) {
  return (intervals || []).map(resolveIntervalValue);
}

function classifyQuality(quality) {
  const normalizedQuality = String(quality || '')
    .replace(/â–³/g, '△')
    .toLowerCase();
  for (const [category, aliases] of Object.entries(QUALITY_CATEGORY_ALIASES)) {
    if (normalizedQuality === String(category).toLowerCase()) return category;
    if ((aliases || []).map((alias) => String(alias).toLowerCase()).includes(normalizedQuality)) return category;
  }
  if (normalizedQuality.startsWith('13')) return 'dom';
  if (normalizedQuality.startsWith('7')) return 'dom';
  return null;
}

function resolveDominantQuality(chord, quality, isMinor) {
  if (quality !== '7') return quality;
  const defaults = isMinor ? DOMINANT_DEFAULT_QUALITY_MINOR : DOMINANT_DEFAULT_QUALITY_MAJOR;
  if (chord.modifier) return '13';
  return defaults[chord.roman] || '13';
}

function chordIdentity(chord) {
  return [
    chord.semitones,
    chord.bassSemitones ?? chord.semitones,
    chord.qualityMajor,
    chord.qualityMinor
  ].join('|');
}

function enumerateMidiForPitchClass(pitchClass, low, high) {
  const values = [];
  for (let midi = low; midi <= high; midi++) {
    if (mod12(midi) === pitchClass) values.push(midi);
  }
  return values;
}

function buildRankPool(rootPitchClass, pitchClasses, rank, source, low, high) {
  const uniquePitchClasses = [...new Set(pitchClasses.map(mod12))];
  const result = [];
  for (const pitchClass of uniquePitchClasses) {
    const midiValues = enumerateMidiForPitchClass(pitchClass, low, high);
    for (const midi of midiValues) {
      result.push({
        midi,
        pitchClass,
        rank,
        source,
        rootPitchClass
      });
    }
  }
  return result;
}

function buildChordPools(chord, key, isMinor, low, high) {
  const quality = isMinor ? chord.qualityMinor : chord.qualityMajor;
  const qualityCategory = classifyQuality(quality);
  if (!qualityCategory) {
    return null;
  }

  const rootPitchClass = mod12(key + chord.semitones);
  const bassPitchClass = mod12(key + (chord.bassSemitones ?? chord.semitones));
  const fifthInterval = qualityCategory === 'm7b5' || qualityCategory === 'dim7' ? 6 : 7;
  const fifthPitchClass = mod12(rootPitchClass + fifthInterval);

  let guideIntervals = [];
  let colorIntervals = [];
  if (qualityCategory === 'dom') {
    const dominantQuality = resolveDominantQuality(chord, quality, isMinor);
    guideIntervals = resolveIntervalList(DOMINANT_GUIDE_TONES[dominantQuality] || GUIDE_TONES.dom);
    colorIntervals = resolveIntervalList(DOMINANT_COLOR_TONES[dominantQuality] || DOMINANT_COLOR_TONES['13']);
  } else {
    guideIntervals = resolveIntervalList(GUIDE_TONES[qualityCategory] || []);
    colorIntervals = resolveIntervalList(COLOR_TONES[qualityCategory] || []);
  }

  const guidePitchClasses = guideIntervals.map((interval) => mod12(rootPitchClass + interval));
  const minorSeventhPitchClasses = guideIntervals
    .filter((interval) => {
      const normalized = mod12(interval);
      return normalized === 10 || interval === 'b7';
    })
    .map((interval) => mod12(rootPitchClass + interval));
  const colorPitchClasses = colorIntervals.map((interval) => mod12(rootPitchClass + interval));
  const rank1PitchClasses = [];
  const noteDescriptors = [
    { source: 'bass', pitchClass: bassPitchClass },
    { source: 'root', pitchClass: rootPitchClass },
    { source: 'fifth', pitchClass: fifthPitchClass }
  ];

  const rank1 = [];
  const seenRank1 = new Set();
  const addRank1PitchClass = (pitchClass, source) => {
    const normalized = mod12(pitchClass);
    if (seenRank1.has(normalized)) return;
    seenRank1.add(normalized);
    rank1.push(...buildRankPool(rootPitchClass, [normalized], 'rank1', source, low, high));
    rank1PitchClasses.push(normalized);
  };

  addRank1PitchClass(noteDescriptors[0].pitchClass, 'bass');
  if (rootPitchClass !== bassPitchClass) {
    addRank1PitchClass(rootPitchClass, 'root');
  }
  addRank1PitchClass(fifthPitchClass, 'fifth');

  const rank1PitchClassSet = new Set(rank1PitchClasses.map(mod12));
  const rank2Entries = [];
  const seenRank2 = new Set();
  const addRank2PitchClass = (pitchClass, source) => {
    const normalized = mod12(pitchClass);
    if (rank1PitchClassSet.has(normalized) || seenRank2.has(normalized)) return;
    seenRank2.add(normalized);
    rank2Entries.push(...buildRankPool(rootPitchClass, [normalized], 'rank2', source, low, high));
  };

  guidePitchClasses.forEach((pitchClass) => addRank2PitchClass(pitchClass, 'guide'));
  colorPitchClasses.forEach((pitchClass) => addRank2PitchClass(pitchClass, 'color'));
  const rank2 = rank2Entries;

  return {
    bassPitchClass,
    rootPitchClass,
    minorSeventhPitchClasses: [...new Set(minorSeventhPitchClasses)],
    rank1,
    rank2
  };
}

function appendSpans(spans, chords, beatsPerChord, key, isMinor, low, high, startBeat = 0) {
  for (let index = 0; index < chords.length; index++) {
    const chord = chords[index];
    const lastSpan = spans[spans.length - 1];
    if (
      lastSpan
      && lastSpan.key === key
      && lastSpan.isMinor === isMinor
      && chordIdentity(lastSpan.chord) === chordIdentity(chord)
    ) {
      lastSpan.slotCount += 1;
      lastSpan.durationBeats += beatsPerChord;
      continue;
    }
    const pools = buildChordPools(chord, key, isMinor, low, high);
    if (!pools) continue;
    spans.push({
      chord,
      key,
      isMinor,
      pools,
      startBeat: startBeat + index * beatsPerChord,
      durationBeats: beatsPerChord,
      slotCount: 1
    });
  }
  return spans;
}

function chooseNearestMidi(candidates, referenceMidi, preferredPitchClass = null) {
  if (!candidates.length) return null;
  const sorted = [...candidates].sort((left, right) => {
    const leftDistance = Math.abs(left.midi - referenceMidi);
    const rightDistance = Math.abs(right.midi - referenceMidi);
    if (leftDistance !== rightDistance) return leftDistance - rightDistance;
    if (preferredPitchClass !== null) {
      const leftPreferred = left.pitchClass === preferredPitchClass ? 0 : 1;
      const rightPreferred = right.pitchClass === preferredPitchClass ? 0 : 1;
      if (leftPreferred !== rightPreferred) return leftPreferred - rightPreferred;
    }
    return left.midi - right.midi;
  });
  return sorted[0];
}

function getFirstSpanBassCandidate(span, previousEvent, pendingTargetMidi) {
  const bassCandidates = span.pools.rank1.filter((candidate) => candidate.source === 'bass');
  if (pendingTargetMidi !== null && pendingTargetMidi !== undefined) {
    const directMatch = bassCandidates.find((candidate) => candidate.midi === pendingTargetMidi);
    if (directMatch) return directMatch;
  }
  if (previousEvent?.midi !== undefined) {
    return chooseNearestMidi(bassCandidates, previousEvent.midi, span.pools.bassPitchClass);
  }
  return bassCandidates[0] || null;
}

function notePreference(candidate) {
  return 0;
}

function withVelocity(event, isSpanStart = false, isForcedResolution = false) {
  let velocity = VELOCITY_NEUTRAL;
  if (isSpanStart || isForcedResolution) {
    velocity = VELOCITY_ARRIVAL;
  } else if (event.rank === 'rank1') {
    velocity = VELOCITY_STRONG;
  }
  return {
    ...event,
    velocity
  };
}

function chooseLeapRepeatMidi(currentEvent, nextEvent, low, high) {
  const octaveOptions = [currentEvent.midi - 12, currentEvent.midi + 12]
    .filter((midi) => midi >= low && midi <= high)
    .map((midi) => ({
      midi,
      distanceToNext: Math.abs(nextEvent.midi - midi)
    }))
    .sort((left, right) => left.distanceToNext - right.distanceToNext || left.midi - right.midi);

  if (!octaveOptions.length || Math.random() >= 0.5) {
    return currentEvent.midi;
  }

  return octaveOptions[0].midi;
}

function applyLeapRepeatEffect(events, low, high) {
  if (!Array.isArray(events) || events.length < 2) return events;

  const embellished = [];
  const effectedMeasures = new Set();
  let lastEffectBeat = null;
  for (let index = 0; index < events.length; index += 1) {
    const currentEvent = events[index];
    const nextEvent = events[index + 1] || null;
    const measureIndex = Math.floor(currentEvent.timeBeats / 4);
    let shouldApplyEffect = false;

    if (nextEvent) {
      const intervalToNext = Math.abs(nextEvent.midi - currentEvent.midi);
      shouldApplyEffect = intervalToNext >= LEAP_REPEAT_EFFECT_THRESHOLD
        && Math.floor(currentEvent.timeBeats) === Math.floor(nextEvent.timeBeats - 1)
        && !effectedMeasures.has(measureIndex)
        && (lastEffectBeat === null || Math.abs(currentEvent.timeBeats - lastEffectBeat) > 1.001)
        && Math.random() < LEAP_REPEAT_EFFECT_PROBABILITY;
    }

    embellished.push({
      ...currentEvent,
      durationBeats: shouldApplyEffect ? LEAP_REPEAT_OFFSET_BEATS : currentEvent.durationBeats
    });

    if (!shouldApplyEffect) continue;

    const effectMidi = chooseLeapRepeatMidi(currentEvent, nextEvent, low, high);
    effectedMeasures.add(measureIndex);
    lastEffectBeat = currentEvent.timeBeats;
    embellished.push({
      timeBeats: currentEvent.timeBeats + LEAP_REPEAT_OFFSET_BEATS,
      durationBeats: 1 - LEAP_REPEAT_OFFSET_BEATS,
      midi: effectMidi,
      velocity: Math.max(1, currentEvent.velocity - LEAP_REPEAT_VELOCITY_DROP),
      rank: currentEvent.rank,
      source: effectMidi === currentEvent.midi ? 'repeat-effect' : 'octave-repeat-effect',
      targetMidi: null
    });
  }

  return embellished;
}

function classifyResolvedRank(pools, midi) {
  const pitchClass = mod12(midi);
  if (pools.rank1.some((candidate) => candidate.pitchClass === pitchClass)) return 'rank1';
  if (pools.rank2.some((candidate) => candidate.pitchClass === pitchClass)) return 'rank2';
  return 'rank1';
}

function boundaryAllowsStructuralCandidate(candidate, currentSpan, nextSpan) {
  if (!nextSpan) return true;
  const nextBassCandidates = nextSpan.pools.rank1.filter((nextCandidate) => nextCandidate.source === 'bass');
  if (candidate.rank === 'rank2') {
    return nextBassCandidates.some((nextCandidate) => {
      const distance = Math.abs(nextCandidate.midi - candidate.midi);
      return distance >= 1 && distance <= 2;
    });
  }
  const isCurrentBass = candidate.pitchClass === currentSpan.pools.bassPitchClass;
  if (isCurrentBass) return true;
  return nextBassCandidates.some((nextCandidate) => Math.abs(nextCandidate.midi - candidate.midi) <= 2);
}

function supportsContinuousChromaticLead(candidate, nextSpan, beatsRemainingInSpan) {
  if (!nextSpan || candidate.rank !== 'approach' || beatsRemainingInSpan < 2) return false;
  const nextBassCandidates = nextSpan.pools.rank1.filter((nextCandidate) => nextCandidate.source === 'bass');
  return nextBassCandidates.some((nextBass) => {
    const candidateDistance = nextBass.midi - candidate.midi;
    const targetDistance = nextBass.midi - candidate.targetMidi;
    if (Math.abs(candidateDistance) > beatsRemainingInSpan) return false;
    if (Math.abs(targetDistance) > beatsRemainingInSpan - 1) return false;
    if (candidateDistance === 0 || targetDistance === 0) return true;
    return Math.sign(candidateDistance) === Math.sign(targetDistance)
      && Math.abs(targetDistance) < Math.abs(candidateDistance);
  });
}

function sourcePreference(candidate, isFinalBeat, isPreparationWindow, favorsContinuousChromaticLead) {
  if (candidate.rank === 'approach') {
    if (isFinalBeat) return 0;
    return favorsContinuousChromaticLead ? 0 : 4;
  }
  if (isFinalBeat) {
    if (candidate.source === 'bass') return 0;
    if (candidate.source === 'root') return 1;
    if (candidate.source === 'fifth') return 2;
    if (candidate.source === 'guide') return 3;
    return 4;
  }
  if (isPreparationWindow) {
    if (candidate.source === 'guide') return 0;
    if (candidate.source === 'color') return 1;
    if (candidate.source === 'fifth') return 2;
    if (candidate.source === 'root') return 3;
    if (candidate.source === 'bass') return 4;
    return 5;
  }
  if (candidate.source === 'fifth') return 0;
  if (candidate.source === 'root') return 1;
  if (candidate.source === 'bass') return 2;
  if (candidate.source === 'guide') return 3;
  if (candidate.source === 'color') return 4;
  return 5;
}

function rankPreference(candidate, isFinalBeat, isPreparationWindow, favorsContinuousChromaticLead) {
  if (isFinalBeat) {
    if (candidate.rank === 'rank1') return 0;
    if (candidate.rank === 'rank2') return 1;
    return 2;
  }
  if (isPreparationWindow) {
    if (candidate.rank === 'approach') return favorsContinuousChromaticLead ? 0 : 2;
    if (candidate.rank === 'rank2') return 1;
    if (candidate.rank === 'rank1') return 0;
    return 3;
  }
  if (candidate.rank === 'rank1') return 0;
  if (candidate.rank === 'rank2') return 1;
  if (candidate.rank === 'approach') return favorsContinuousChromaticLead ? 1 : 2;
  return 3;
}

function getDirection(interval) {
  if (interval > 0) return 1;
  if (interval < 0) return -1;
  return 0;
}

function directionalPenalty(candidate, previousMidi, events) {
  const recentNotes = [...events.map((event) => event.midi), previousMidi].slice(-4);
  if (recentNotes.length < 2) return 0;

  const candidateInterval = candidate.midi - previousMidi;
  const candidateDirection = getDirection(candidateInterval);
  if (candidateDirection === 0) return 0;

  let penalty = 0;
  for (let index = 1; index < recentNotes.length; index++) {
    const interval = recentNotes[index] - recentNotes[index - 1];
    const direction = getDirection(interval);
    if (direction === 0) continue;

    const absInterval = Math.abs(interval);
    if (absInterval >= 5 && absInterval <= 8) continue;

    const prefersSameDirection = absInterval <= 4;
    const isPreferredDirection = prefersSameDirection
      ? candidateDirection === direction
      : candidateDirection !== direction;

    if (!isPreferredDirection) {
      penalty += 1;
    }
  }

  return penalty;
}

function recentChromaticRunIntervals(previousMidi, events) {
  const notes = [...events.map((event) => event.midi), previousMidi].slice(-4);
  if (notes.length < 2) return { direction: 0, intervalCount: 0 };

  let direction = 0;
  let intervalCount = 0;
  for (let index = notes.length - 1; index > 0; index--) {
    const interval = notes[index] - notes[index - 1];
    const stepDirection = getDirection(interval);
    if (Math.abs(interval) !== 1 || stepDirection === 0) break;
    if (direction === 0) {
      direction = stepDirection;
      intervalCount = 1;
      continue;
    }
    if (stepDirection !== direction) break;
    intervalCount += 1;
  }

  return { direction, intervalCount };
}

function continuousChromaticRunBonus(candidate, previousMidi, events, nextSpan, beatsRemainingInSpan) {
  const interval = candidate.midi - previousMidi;
  const direction = getDirection(interval);
  if (Math.abs(interval) !== 1 || direction === 0) return 0;

  const recentRun = recentChromaticRunIntervals(previousMidi, events);
  let bonus = 0;

  if (recentRun.intervalCount >= 1 && recentRun.direction === direction) {
    bonus += 4;
    if (recentRun.intervalCount >= 2) {
      bonus += 2;
    }
  }

  if (!nextSpan) return bonus;

  const nextBassCandidates = nextSpan.pools.rank1.filter((nextCandidate) => nextCandidate.source === 'bass');
  const canReachNextBassChromatically = nextBassCandidates.some((nextBass) => {
    const distance = nextBass.midi - candidate.midi;
    if (distance === 0) return false;
    if (Math.sign(distance) !== direction) return false;
    return Math.abs(distance) <= beatsRemainingInSpan;
  });

  if (canReachNextBassChromatically) {
    bonus += 6;
  }

  return bonus;
}

function respectsMinorSeventhRule(candidate, previousMidi, currentSpan) {
  if (!currentSpan?.pools?.minorSeventhPitchClasses?.length) return true;
  const previousPitchClass = mod12(previousMidi);
  if (!currentSpan.pools.minorSeventhPitchClasses.includes(previousPitchClass)) return true;

  const interval = candidate.midi - previousMidi;
  return interval <= -1 && interval >= -3;
}

function nextBassAnticipationPenalty(candidate, nextSpan, isFinalBeat) {
  if (!nextSpan || candidate.rank === 'approach') return 0;
  const nextBassPitchClasses = new Set(
    nextSpan.pools.rank1
      .filter((nextCandidate) => nextCandidate.source === 'bass')
      .map((nextCandidate) => nextCandidate.pitchClass)
  );
  if (!nextBassPitchClasses.has(candidate.pitchClass)) return 0;
  return isFinalBeat ? 2 : 6;
}

function respectsThreeNoteWindowRange(candidate, previousMidi, events) {
  const eventNotes = events.map((event) => event.midi);
  const recentNotes = eventNotes.length && eventNotes[eventNotes.length - 1] === previousMidi
    ? eventNotes
    : [...eventNotes, previousMidi];
  if (recentNotes.length < 2) return true;

  const lastTwoNotes = recentNotes.slice(-2);
  const window = [...lastTwoNotes, candidate.midi];
  const minMidi = Math.min(...window);
  const maxMidi = Math.max(...window);
  return (maxMidi - minMidi) <= 12;
}

function candidatePenaltyScore(candidate, previousMidi, previousPitchClass, isFinalBeat, isPreparationWindow, playedMidis, favorsContinuousChromaticLead, events, nextSpan, currentSpan) {
  const distance = Math.abs(candidate.midi - previousMidi);
  const repeatMidiPenalty = candidate.midi === previousMidi ? (isFinalBeat ? 5 : 16) : 0;
  const repeatPitchPenalty = candidate.pitchClass === previousPitchClass ? (isFinalBeat ? 1 : 4) : 0;
  const playedMidiPenalty = playedMidis.has(candidate.midi) ? 2 : 0;
  const contourPenalty = directionalPenalty(candidate, previousMidi, events);
  const chromaticRunBonus = continuousChromaticRunBonus(candidate, previousMidi, events, nextSpan, currentSpan.durationBeats - events.length);
  const anticipationPenalty = nextBassAnticipationPenalty(candidate, nextSpan, isFinalBeat);
  const leapPenalty = distance > 7 ? 4 : 0;
  const rankPenalty = rankPreference(candidate, isFinalBeat, isPreparationWindow, favorsContinuousChromaticLead);
  const sourcePenalty = sourcePreference(candidate, isFinalBeat, isPreparationWindow, favorsContinuousChromaticLead);
  return (
    repeatMidiPenalty * 5
    + repeatPitchPenalty * 3
    + playedMidiPenalty * 2
    + contourPenalty * 2
    - chromaticRunBonus * 2
    + anticipationPenalty * 2
    + leapPenalty
    + rankPenalty * 3
    + sourcePenalty * 2
    + notePreference(candidate)
  );
}

function orderCandidatesWeighted(candidates, scoreForCandidate) {
  const pool = [...candidates];
  const ordered = [];

  while (pool.length) {
    const weightedPool = pool.map((candidate) => {
      const score = Math.max(0, scoreForCandidate(candidate));
      return {
        candidate,
        weight: 1 / (1 + score)
      };
    });
    const totalWeight = weightedPool.reduce((sum, entry) => sum + entry.weight, 0);
    let threshold = Math.random() * totalWeight;
    let selectedIndex = 0;

    for (let index = 0; index < weightedPool.length; index++) {
      threshold -= weightedPool[index].weight;
      if (threshold <= 0) {
        selectedIndex = index;
        break;
      }
    }

    ordered.push(weightedPool[selectedIndex].candidate);
    pool.splice(selectedIndex, 1);
  }

  return ordered;
}

function recentConjunctRunIntervals(previousMidi, events) {
  const notes = [...events.map((event) => event.midi), previousMidi].slice(-4);
  if (notes.length < 2) return { direction: 0, intervalCount: 0 };

  let direction = 0;
  let intervalCount = 0;
  for (let index = notes.length - 1; index > 0; index--) {
    const interval = notes[index] - notes[index - 1];
    const stepDirection = getDirection(interval);
    const absInterval = Math.abs(interval);
    if ((absInterval !== 1 && absInterval !== 2) || stepDirection === 0) break;
    if (direction === 0) {
      direction = stepDirection;
      intervalCount = 1;
      continue;
    }
    if (stepDirection !== direction) break;
    intervalCount += 1;
  }

  return { direction, intervalCount };
}

function isExtendedChromaticApproach(previousEvent, approachMidi, targetMidi, events, isFinalBeat) {
  if (isFinalBeat) return true;

  const approachInterval = approachMidi - previousEvent.midi;
  const resolutionInterval = targetMidi - approachMidi;
  if (Math.abs(approachInterval) !== 1 || Math.abs(resolutionInterval) !== 1) return false;

  const approachDirection = getDirection(approachInterval);
  const resolutionDirection = getDirection(resolutionInterval);
  if (approachDirection === 0 || resolutionDirection === 0 || approachDirection !== resolutionDirection) {
    return false;
  }

  const recentRun = recentConjunctRunIntervals(previousEvent.midi, events);
  return recentRun.intervalCount >= 1 && recentRun.direction === approachDirection;
}

function buildApproachCandidates(targetCandidates, previousEvent, nextSpan, events, isFinalBeat) {
  const approaches = [];
  const seen = new Set();
  for (const target of targetCandidates) {
    const targetForSort = previousEvent?.midi ?? target.midi;
    const stepCandidates = [target.midi - 1, target.midi + 1];
    for (const midi of stepCandidates) {
      if (Math.abs(midi - previousEvent.midi) > 12) continue;
      if (!isExtendedChromaticApproach(previousEvent, midi, target.midi, events, isFinalBeat)) continue;
      const pitchClass = mod12(midi);
      const key = `${midi}:${target.midi}`;
      if (seen.has(key)) continue;
      seen.add(key);
      approaches.push({
        midi,
        pitchClass,
        rank: 'approach',
        source: 'approach',
        targetMidi: target.midi,
        targetRank: target.rank,
        boundaryToNextSpan: Boolean(nextSpan)
      });
    }
    approaches.sort((left, right) => {
      const leftDistance = Math.abs(left.midi - targetForSort);
      const rightDistance = Math.abs(right.midi - targetForSort);
      if (leftDistance !== rightDistance) return leftDistance - rightDistance;
      const leftBelowPenalty = left.midi < target.midi ? 0 : 1;
      const rightBelowPenalty = right.midi < target.midi ? 0 : 1;
      if (leftBelowPenalty !== rightBelowPenalty) return leftBelowPenalty - rightBelowPenalty;
      return left.midi - right.midi;
    });
  }
  return approaches;
}

function getDirectStructuralCandidates(previousEvent, currentSpan) {
  const allStructuralCandidates = [...currentSpan.pools.rank1, ...currentSpan.pools.rank2];
  if (previousEvent.rank === 'rank1') {
    return allStructuralCandidates.filter((candidate) => {
      const distance = Math.abs(candidate.midi - previousEvent.midi);
      return distance <= 12 && distance !== 11;
    });
  }
  return allStructuralCandidates.filter((candidate) => Math.abs(candidate.midi - previousEvent.midi) <= 2);
}

function getApproachTargets(previousEvent, currentSpan, nextSpan, isFinalBeat, beatsRemainingInSpan) {
  if (isFinalBeat && nextSpan) {
    const nextBassCandidates = nextSpan.pools.rank1.filter((candidate) => candidate.source === 'bass');
    return nextBassCandidates.filter((candidate) => Math.abs(candidate.midi - previousEvent.midi) <= 2);
  }

  const structuralTargets = getDirectStructuralCandidates(previousEvent, currentSpan);
  return structuralTargets;
}

function getCandidateEvents(previousEvent, currentSpan, nextSpan, isFinalBeat, beatIndex, events) {
  const beatsRemainingInSpan = currentSpan.durationBeats - beatIndex;
  const isPreparationWindow = Boolean(nextSpan) && beatsRemainingInSpan <= 2;
  const requireRank1AtMeasureStart = isInternalMeasureStart(currentSpan, beatIndex);
  const playedMidis = new Set(events.map((event) => event.midi));
  const structuralCandidates = getDirectStructuralCandidates(previousEvent, currentSpan)
    .filter((candidate) => !requireRank1AtMeasureStart || candidate.rank === 'rank1')
    .filter((candidate) => !isFinalBeat || boundaryAllowsStructuralCandidate(candidate, currentSpan, nextSpan));
  const approachTargets = requireRank1AtMeasureStart
    ? []
    : getApproachTargets(previousEvent, currentSpan, nextSpan, isFinalBeat, beatsRemainingInSpan);
  const approachCandidates = buildApproachCandidates(approachTargets, previousEvent, isFinalBeat ? nextSpan : null, events, isFinalBeat);

  const candidates = [...structuralCandidates, ...approachCandidates]
    .filter((candidate) =>
      isHardLegalCandidate(candidate, previousEvent, currentSpan, nextSpan, isFinalBeat, events)
    );

  const orderedCandidates = orderCandidatesWeighted(candidates, (candidate) => candidatePenaltyScore(
      candidate,
      previousEvent.midi,
      previousEvent.pitchClass,
      isFinalBeat,
      isPreparationWindow,
      playedMidis,
      supportsContinuousChromaticLead(candidate, nextSpan, beatsRemainingInSpan),
      events,
      nextSpan,
      currentSpan
    ));
  return orderedCandidates.slice(0, MAX_SEARCH_CANDIDATES);
}

function isHardLegalCandidate(candidate, previousEvent, currentSpan, nextSpan, isFinalBeat, events) {
  const isExactRepeat = previousEvent && candidate.midi === previousEvent.midi;
  return candidate.midi >= currentSpan.low
    && candidate.midi <= currentSpan.high
    && (!isExactRepeat || candidate.rank === 'rank1')
    && (!isFinalBeat || boundaryAllowsStructuralCandidate(candidate, currentSpan, nextSpan))
    && respectsMinorSeventhRule(candidate, previousEvent.midi, currentSpan)
    && respectsThreeNoteWindowRange(candidate, previousEvent.midi, events);
}

function isInternalMeasureStart(span, beatIndex) {
  return span.durationBeats > 4 && beatIndex > 0 && beatIndex % 4 === 0;
}

function buildForcedResolutionEvent(previousEvent, currentSpan, isSpanStart = false) {
  const rank = classifyResolvedRank(currentSpan.pools, previousEvent.targetMidi);
  return withVelocity({
    midi: previousEvent.targetMidi,
    pitchClass: mod12(previousEvent.targetMidi),
    rank,
    source: rank === 'rank1' ? 'resolution' : 'color',
    targetMidi: null
  }, isSpanStart, true);
}

function isLegalForcedResolution(previousEvent, resolutionEvent, currentSpan, nextSpan, isFinalBeat, beatIndex) {
  if (previousEvent.rank !== 'approach') return true;

  const resolutionDistance = Math.abs(resolutionEvent.midi - previousEvent.midi);
  if (resolutionDistance > 1) return false;
  if (isInternalMeasureStart(currentSpan, beatIndex) && resolutionEvent.rank !== 'rank1') return false;

  if (isFinalBeat) {
    if (resolutionEvent.rank === 'approach') return false;
    if (!boundaryAllowsStructuralCandidate(resolutionEvent, currentSpan, nextSpan)) return false;
  }

  return true;
}

function searchSpanEvents(span, nextSpan, previousEvent, beatIndex, events) {
  if (beatIndex >= span.durationBeats) {
    return events;
  }

  const isFinalBeat = beatIndex === span.durationBeats - 1;
  if (previousEvent.rank === 'approach') {
    const resolutionEvent = buildForcedResolutionEvent(previousEvent, span);
    if (!isLegalForcedResolution(previousEvent, resolutionEvent, span, nextSpan, isFinalBeat, beatIndex)) {
      return null;
    }
    return searchSpanEvents(
      span,
      nextSpan,
      resolutionEvent,
      beatIndex + 1,
      [...events, resolutionEvent]
    );
  }

  const candidates = getCandidateEvents(previousEvent, span, nextSpan, isFinalBeat, beatIndex, events);
  for (const candidate of candidates) {
    const nextEvent = withVelocity(candidate);
    const result = searchSpanEvents(
      span,
      nextSpan,
      nextEvent,
      beatIndex + 1,
      [...events, nextEvent]
    );
    if (result) return result;
  }

  if (isFinalBeat && nextSpan) {
    const fallbackBass = chooseNearestMidi(
      span.pools.rank1
        .filter((candidate) => candidate.source === 'bass')
        .filter((candidate) => isHardLegalCandidate(candidate, previousEvent, span, nextSpan, isFinalBeat, events)),
      previousEvent.midi,
      span.pools.bassPitchClass
    );
    if (fallbackBass) {
      return [...events, withVelocity(fallbackBass)];
    }
  }

  const fallbackCandidate = chooseNearestMidi(
    getDirectStructuralCandidates(previousEvent, span)
      .filter((candidate) => isHardLegalCandidate(candidate, previousEvent, span, nextSpan, isFinalBeat, events)),
    previousEvent.midi
  );
  if (!fallbackCandidate) return null;

  return searchSpanEvents(
    span,
    nextSpan,
    withVelocity(fallbackCandidate),
    beatIndex + 1,
    [...events, withVelocity(fallbackCandidate)]
  );
}

export function createMediumSwingWalkingBassGenerator({ constants = {} } = {}) {
  const { BASS_LOW = 28, BASS_HIGH = 48 } = constants;

  function buildLine({
    chords = [],
    key = 0,
    beatsPerChord = 1,
    isMinor = false,
    nextChords = [],
    nextKey = key,
    nextIsMinor = isMinor
  } = {}) {
    const currentTotalBeats = chords.length * beatsPerChord;
    const spans = appendSpans([], chords, beatsPerChord, key, isMinor, BASS_LOW, BASS_HIGH, 0);
    appendSpans(spans, nextChords, beatsPerChord, nextKey, nextIsMinor, BASS_LOW, BASS_HIGH, currentTotalBeats);
    const preparedSpans = spans.map((span) => ({ ...span, low: BASS_LOW, high: BASS_HIGH }));
    const events = [];
    let previousEvent = null;
    let pendingTargetMidi = null;

    preparedSpans.forEach((span, spanIndex) => {
      const nextSpan = preparedSpans[spanIndex + 1] || null;
      const firstCandidate = getFirstSpanBassCandidate(span, previousEvent, pendingTargetMidi);
      if (!firstCandidate) return;

      const firstEvent = withVelocity({
        ...firstCandidate,
        targetMidi: null
      }, true);
      const spanEvents = [firstEvent];
      const searchedTail = searchSpanEvents(span, nextSpan, firstEvent, 1, spanEvents);
      const resolvedSpanEvents = searchedTail || spanEvents;
      const startBeat = span.startBeat;

      resolvedSpanEvents.forEach((event, eventIndex) => {
        const absoluteTimeBeats = startBeat + eventIndex;
        if (absoluteTimeBeats >= currentTotalBeats) return;
        events.push({
          timeBeats: absoluteTimeBeats,
          durationBeats: 1,
          midi: event.midi,
          velocity: event.velocity,
          rank: event.rank,
          source: event.source,
          targetMidi: event.targetMidi ?? null
        });
      });

      previousEvent = resolvedSpanEvents[resolvedSpanEvents.length - 1];
      pendingTargetMidi = previousEvent?.rank === 'approach' ? previousEvent.targetMidi : null;
    });

    return applyLeapRepeatEffect(events, BASS_LOW, BASS_HIGH);
  }

  return {
    buildLine
  };
}
