import rawVoicingConfig from '../../core/music/voicing-config.js';
import {
  applyContextualQualityRules,
  applyPriorityDominantResolutionRules
} from '../../core/music/harmony-context.js';
import {
  DEFAULT_SWING_RATIO,
  getSwingFirstSubdivisionDurationBeats,
  getSwingSecondSubdivisionDurationBeats,
} from '../../core/music/swing-utils.js';
import { getMetricBeatStrengths } from '../../core/music/meter.js';

type PracticeArrangementWalkingBassVoicingConfig = {
  GUIDE_TONES?: Record<string, unknown>;
  COLOR_TONES?: Record<string, unknown>;
  DOMINANT_COLOR_TONES?: Record<string, unknown>;
  DOMINANT_GUIDE_TONES?: Record<string, unknown>;
  DOMINANT_DEFAULT_QUALITY_MAJOR?: Record<string, string>;
  DOMINANT_DEFAULT_QUALITY_MINOR?: Record<string, string>;
  DOMINANT_QUALITY_ALIASES?: Record<string, unknown>;
  QUALITY_CATEGORY_ALIASES?: Record<string, string[]>;
};

const voicingConfig = rawVoicingConfig as PracticeArrangementWalkingBassVoicingConfig;
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
const QUALITY_CATEGORY_ALIASES_TYPED = QUALITY_CATEGORY_ALIASES as Record<string, string[]>;

const INTERVAL_SEMITONES = {
  '1': 0,
  b9: 1, '9': 2, '#9': 3,
  b3: 3, '3': 4,
  '4': 5,
  '#11': 6, b5: 6, '5': 7,
  '#5': 8, b6: 8, b13: 8, '6': 9, '13': 9, bb7: 9,
  b7: 10, '7': 11
};

const VELOCITY_NEUTRAL = 100;
const VELOCITY_STRONG = 112;
const VELOCITY_ARRIVAL = 127;
const MAX_SEARCH_CANDIDATES = 10;
const REPEATED_NOTE_EFFECT_THRESHOLD = 5;
const REPEATED_NOTE_EFFECT_PROBABILITY = 0.1;
const REPEATED_NOTE_VELOCITY_DROP = 28;
const ANTICIPATION_EFFECT_PROBABILITY = 0.2;
const FIRST_BEAT_ANTICIPATION_EFFECT_PROBABILITY = 0.05;
const ANTICIPATION_EFFECT_MIN_DESCENDING_INTERVAL = 5;
const ANTICIPATION_EFFECT_VELOCITY_BOOST = 20;

// Basic pitch and chord utilities

function mod12(value) {
  return ((value % 12) + 12) % 12;
}

function isNoChord(chord) {
  return Boolean(chord?.noChord || chord?.inputType === 'no-chord');
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
    .replace(/Ã¢â€“Â³/g, 'â–³')
    .toLowerCase();
  for (const [category, aliases] of Object.entries(QUALITY_CATEGORY_ALIASES_TYPED)) {
    if (normalizedQuality === String(category).toLowerCase()) return category;
    if ((aliases || []).map((alias) => String(alias).toLowerCase()).includes(normalizedQuality)) return category;
  }
  if (normalizedQuality.startsWith('13')) return 'dom';
  if (normalizedQuality.startsWith('9')) return 'dom';
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
  if (isNoChord(chord)) return 'NC';
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

function buildChordPools(chord, key, isMinor, low, high, nextChord = null) {
  const quality = isMinor ? chord.qualityMinor : chord.qualityMajor;
  const qualityCategory = classifyQuality(quality);
  if (!qualityCategory) {
    return null;
  }

  const rootPitchClass = mod12(key + chord.semitones);
  const bassPitchClass = mod12(key + (chord.bassSemitones ?? chord.semitones));
  const perfectFifthPitchClass = mod12(rootPitchClass + 7);

  let guideIntervals = [];
  let colorIntervals = [];
  if (qualityCategory === 'dom') {
    const nextQuality = nextChord
      ? applyContextualQualityRules(nextChord, isMinor ? nextChord.qualityMinor : nextChord.qualityMajor)
      : '';
    const prioritizedQuality = applyPriorityDominantResolutionRules({
      chord,
      quality,
      nextChord,
      nextQuality,
      resolutionSemitones: nextChord
        ? mod12((nextChord.semitones ?? 0) - (chord.semitones ?? 0))
        : null
    });
    const dominantQuality = prioritizedQuality !== quality
      ? prioritizedQuality
      : resolveDominantQuality(chord, quality, isMinor);
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
  const chordContainsThirteenth = qualityCategory !== 'dim7'
    && [...guideIntervals, ...colorIntervals]
      .some((interval) => interval === '13' || interval === 9);
  const chordPitchClasses = new Set([
    rootPitchClass,
    ...guidePitchClasses,
    ...colorPitchClasses
  ]);
  const chordContainsPerfectFifth = chordPitchClasses.has(perfectFifthPitchClass);
  const shouldAddPerfectFifthToRank1 = chordContainsPerfectFifth || chordContainsThirteenth;
  const rank1PitchClasses = [];
  const noteDescriptors = [
    { source: 'bass', pitchClass: bassPitchClass },
    { source: 'root', pitchClass: rootPitchClass }
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
  if (shouldAddPerfectFifthToRank1) {
    addRank1PitchClass(perfectFifthPitchClass, 'fifth');
  }

  const rank1PitchClassSet = new Set(rank1PitchClasses.map(mod12));
  const rank2Entries = [];
  const seenRank2 = new Set();
  const addRank2PitchClass = (pitchClass, source) => {
    const normalized = mod12(pitchClass);
    if (rank1PitchClassSet.has(normalized) || seenRank2.has(normalized)) return;
    seenRank2.add(normalized);
    rank2Entries.push(...buildRankPool(rootPitchClass, [normalized], 'rank2', source, low, high));
  };
  const rank2PitchClassSet = new Set();
  guidePitchClasses.forEach((pitchClass) => addRank2PitchClass(pitchClass, 'guide'));
  rank2Entries.forEach((entry) => rank2PitchClassSet.add(entry.pitchClass));
  const rank3Entries = [];
  const seenRank3 = new Set();
  const addRank3PitchClass = (pitchClass, source) => {
    const normalized = mod12(pitchClass);
    if (rank1PitchClassSet.has(normalized) || rank2PitchClassSet.has(normalized) || seenRank3.has(normalized)) return;
    seenRank3.add(normalized);
    rank3Entries.push(...buildRankPool(rootPitchClass, [normalized], 'rank3', source, low, high));
  };
  colorPitchClasses.forEach((pitchClass) => addRank3PitchClass(pitchClass, 'color'));
  const rank2 = rank2Entries;
  const rank3 = rank3Entries;

  return {
    bassPitchClass,
    rootPitchClass,
    minorSeventhPitchClasses: [...new Set(minorSeventhPitchClasses)],
    rank1,
    rank2,
    rank3
  };
}

// Span preparation

function appendSpans(spans, chords, beatsPerChord, key, isMinor, low, high, startBeat = 0) {
  for (let index = 0; index < chords.length; index++) {
    const chord = chords[index];
    if (isNoChord(chord)) continue;
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
    const pools = buildChordPools(chord, key, isMinor, low, high, chords[index + 1] || null);
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

function getFirstSpanBassCandidate(span, nextSpan, previousEvent, pendingTargetMidi) {
  const isSingleBeatSpan = span.durationBeats === 1;
  const bassCandidates = span.pools.rank1.filter((candidate) => candidate.source === 'bass');

  if (!isSingleBeatSpan) {
    if (pendingTargetMidi !== null && pendingTargetMidi !== undefined) {
      const directBassMatch = bassCandidates.find((candidate) => candidate.midi === pendingTargetMidi);
      if (directBassMatch) return directBassMatch;
    }
    if (previousEvent?.midi !== undefined) {
      return chooseNearestMidi(bassCandidates, previousEvent.midi, span.pools.bassPitchClass);
    }
    return bassCandidates[0] || null;
  }

  if (pendingTargetMidi !== null && pendingTargetMidi !== undefined) {
    const directMatch = bassCandidates.find((candidate) => candidate.midi === pendingTargetMidi);
    if (directMatch) return directMatch;
  }
  if (previousEvent?.midi !== undefined) {
    const bassCandidatesThatPrepareNext = bassCandidates.filter((candidate) =>
      boundaryAllowsStructuralCandidate(candidate, span, nextSpan)
      && respectsThreeNoteWindowRange(candidate, previousEvent.midi, [])
    );

    return chooseNearestMidi(
      bassCandidatesThatPrepareNext.length ? bassCandidatesThatPrepareNext : bassCandidates,
      previousEvent.midi,
      span.pools.bassPitchClass
    );
  }
  return bassCandidates[0] || null;
}

// Line ornaments and articulation

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

function chooseRepeatedNoteMidi(currentEvent, nextEvent, low, high) {
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

function applyRepeatedNoteEffect(events, low, high, swingRatio = DEFAULT_SWING_RATIO, beatsPerBar = 4) {
  if (!Array.isArray(events) || events.length < 2) return events;

  const embellished = [];
  const effectedMeasures = new Set();
  let lastEffectBeat = null;
  const repeatedNoteOffsetBeats = getSwingFirstSubdivisionDurationBeats(swingRatio);
  const repeatedNoteTailBeats = getSwingSecondSubdivisionDurationBeats(swingRatio);
  for (let index = 0; index < events.length; index += 1) {
    const currentEvent = events[index];
    const nextEvent = events[index + 1] || null;
    const measureIndex = Math.floor(currentEvent.timeBeats / Math.max(1, beatsPerBar));
    let shouldApplyEffect = false;

    if (nextEvent) {
      const intervalToNext = Math.abs(nextEvent.midi - currentEvent.midi);
      shouldApplyEffect = intervalToNext >= REPEATED_NOTE_EFFECT_THRESHOLD
        && Math.floor(currentEvent.timeBeats) === Math.floor(nextEvent.timeBeats - 1)
        && !effectedMeasures.has(measureIndex)
        && (lastEffectBeat === null || Math.abs(currentEvent.timeBeats - lastEffectBeat) > 1.001)
        && Math.random() < REPEATED_NOTE_EFFECT_PROBABILITY;
    }

    embellished.push({
      ...currentEvent,
      durationBeats: shouldApplyEffect ? repeatedNoteOffsetBeats : currentEvent.durationBeats
    });

    if (!shouldApplyEffect) continue;

    const effectMidi = chooseRepeatedNoteMidi(currentEvent, nextEvent, low, high);
    effectedMeasures.add(measureIndex);
    lastEffectBeat = currentEvent.timeBeats;
    embellished.push({
      timeBeats: currentEvent.timeBeats + repeatedNoteOffsetBeats,
      durationBeats: repeatedNoteTailBeats,
      midi: effectMidi,
      velocity: Math.max(1, currentEvent.velocity - REPEATED_NOTE_VELOCITY_DROP),
      rank: currentEvent.rank,
      source: effectMidi === currentEvent.midi ? 'repeated-note' : 'repeated-note-octave',
      targetMidi: null
    });
  }

  return embellished;
}

function isWholeBeat(value) {
  return Math.abs(value - Math.round(value)) < 0.001;
}

function getMeasureBeatPosition(timeBeats, beatsPerBar = 4) {
  const normalizedBeatsPerBar = Math.max(1, Number(beatsPerBar) || 4);
  return ((Math.round(timeBeats) % normalizedBeatsPerBar) + normalizedBeatsPerBar) % normalizedBeatsPerBar;
}

export function getAnticipationEligibleBeatPairKind(leftEvent, rightEvent, beatsPerBar = 4) {
  if (!leftEvent || !rightEvent) return null;
  if (!isWholeBeat(leftEvent.timeBeats) || !isWholeBeat(rightEvent.timeBeats)) return null;
  if (Math.abs((rightEvent.timeBeats - leftEvent.timeBeats) - 1) > 0.001) return null;

  const normalizedBeatsPerBar = Math.max(1, Number(beatsPerBar) || 4);
  const strengths = getMetricBeatStrengths(normalizedBeatsPerBar);
  const leftBeatPosition = getMeasureBeatPosition(leftEvent.timeBeats, normalizedBeatsPerBar);
  const rightBeatPosition = getMeasureBeatPosition(rightEvent.timeBeats, normalizedBeatsPerBar);
  const isStrongToWeakPair = strengths[leftBeatPosition] === 'strong' && strengths[rightBeatPosition] === 'weak';
  if (isStrongToWeakPair) return 'strong-to-weak';

  const isFirstBeatAnticipationPair = rightBeatPosition === 0
    && strengths[leftBeatPosition] === 'weak'
    && strengths[rightBeatPosition] === 'strong';
  if (isFirstBeatAnticipationPair) return 'first-beat';

  return null;
}

export function isAnticipationEligibleBeatPair(leftEvent, rightEvent, beatsPerBar = 4) {
  return getAnticipationEligibleBeatPairKind(leftEvent, rightEvent, beatsPerBar) !== null;
}

export function isFirstBeatAnticipationEligibleBeatPair(leftEvent, rightEvent, beatsPerBar = 4) {
  return getAnticipationEligibleBeatPairKind(leftEvent, rightEvent, beatsPerBar) === 'first-beat';
}

function isAtBeat(value, targetBeat) {
  return Number.isFinite(value)
    && Number.isFinite(targetBeat)
    && Math.abs(value - targetBeat) < 0.001;
}

function getOnbeatEndingTargetBeat(endingCue) {
  if (!endingCue || endingCue.style !== 'onbeat_long') return null;
  const targetBeat = Number(endingCue.targetBeat ?? endingCue.targetChordIndex);
  if (!Number.isFinite(targetBeat) || targetBeat <= 0) return null;
  return targetBeat;
}

function applyAnticipationToEventPair(events, index, anticipationEffectStepBeats, sourceSuffix) {
  const currentEvent = events[index];
  const nextEvent = events[index + 1];
  const anticipatedStart = nextEvent.timeBeats - anticipationEffectStepBeats;
  const currentAvailableDuration = anticipatedStart - currentEvent.timeBeats;
  if (currentAvailableDuration <= 0) return false;

  const nextFollowingEvent = events[index + 2] || null;
  const nextNaturalEnd = nextFollowingEvent
    ? nextFollowingEvent.timeBeats
    : (nextEvent.timeBeats + (Number.isFinite(nextEvent.durationBeats) ? nextEvent.durationBeats : 1));
  const anticipatedDuration = nextNaturalEnd - anticipatedStart;
  if (anticipatedDuration <= 0) return false;

  currentEvent.durationBeats = currentAvailableDuration;
  nextEvent.timeBeats = anticipatedStart;
  nextEvent.durationBeats = anticipatedDuration;
  nextEvent.velocity = Math.min(
    VELOCITY_ARRIVAL,
    (Number(nextEvent.velocity) || VELOCITY_NEUTRAL) + ANTICIPATION_EFFECT_VELOCITY_BOOST
  );
  nextEvent.source = `${nextEvent.source}-${sourceSuffix}`;
  return true;
}

export function applyAnticipationEffect(events, swingRatio = DEFAULT_SWING_RATIO, beatsPerBar = 4, {
  endingCue = null
} = {}) {
  if (!Array.isArray(events) || events.length < 2) return events;

  const anticipated = events.map((event) => ({ ...event }));
  const anticipationEffectStepBeats = getSwingSecondSubdivisionDurationBeats(swingRatio);
  const onbeatEndingTargetBeat = getOnbeatEndingTargetBeat(endingCue);

  for (let index = 0; index < anticipated.length - 1; index += 1) {
    const currentEvent = anticipated[index];
    const nextEvent = anticipated[index + 1];
    const beatPairKind = getAnticipationEligibleBeatPairKind(currentEvent, nextEvent, beatsPerBar);
    if (beatPairKind !== 'strong-to-weak') continue;
    if (isAtBeat(Number(nextEvent.timeBeats), onbeatEndingTargetBeat)) continue;

    const descendingInterval = currentEvent.midi - nextEvent.midi;
    if (descendingInterval < ANTICIPATION_EFFECT_MIN_DESCENDING_INTERVAL) continue;
    if (Math.random() >= ANTICIPATION_EFFECT_PROBABILITY) continue;

    applyAnticipationToEventPair(anticipated, index, anticipationEffectStepBeats, 'anticipation');
  }

  return anticipated;
}

export function applyFirstBeatAnticipationEffect(events, swingRatio = DEFAULT_SWING_RATIO, beatsPerBar = 4, {
  endingCue = null
} = {}) {
  if (!Array.isArray(events) || events.length < 2) return events;

  const anticipated = events.map((event) => ({ ...event }));
  const anticipationEffectStepBeats = getSwingSecondSubdivisionDurationBeats(swingRatio);
  const onbeatEndingTargetBeat = getOnbeatEndingTargetBeat(endingCue);

  for (let index = 0; index < anticipated.length - 1; index += 1) {
    const currentEvent = anticipated[index];
    const nextEvent = anticipated[index + 1];
    if (!isFirstBeatAnticipationEligibleBeatPair(currentEvent, nextEvent, beatsPerBar)) continue;
    if (isAtBeat(Number(nextEvent.timeBeats), onbeatEndingTargetBeat)) continue;
    if (Math.random() >= FIRST_BEAT_ANTICIPATION_EFFECT_PROBABILITY) continue;

    applyAnticipationToEventPair(anticipated, index, anticipationEffectStepBeats, 'first-beat-anticipation');
  }

  return anticipated;
}

const REPEATED_NOTE_EFFECT_MAX_BPM = 170;
const ANTICIPATION_EFFECT_MAX_BPM = 190;
const FIRST_BEAT_ANTICIPATION_EFFECT_MAX_BPM = 170;

type PracticeArrangementWalkingBassConstants = {
  BASS_LOW?: number;
  BASS_HIGH?: number;
};

type PracticeArrangementBassFeelMode = 'four' | 'two';

function classifyResolvedRank(pools, midi) {
  const pitchClass = mod12(midi);
  if (pools.rank1.some((candidate) => candidate.pitchClass === pitchClass)) return 'rank1';
  if (pools.rank2.some((candidate) => candidate.pitchClass === pitchClass)) return 'rank2';
  if (pools.rank3.some((candidate) => candidate.pitchClass === pitchClass)) return 'rank3';
  return 'rank1';
}

function boundaryAllowsStructuralCandidate(candidate, currentSpan, nextSpan) {
  if (!nextSpan) return true;
  const nextBassCandidates = nextSpan.pools.rank1.filter((nextCandidate) => nextCandidate.source === 'bass');
  if (candidate.rank === 'rank3') {
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

function sourcePreference(candidate, context) {
  const { isFinalBeat, isPreparationWindow, favorsContinuousChromaticLead } = context;
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
  if (candidate.source === 'guide') return 0;
  if (candidate.source === 'color') return 1;
  if (candidate.source === 'fifth') return 2;
  if (candidate.source === 'root') return 3;
  if (candidate.source === 'bass') return 4;
  return 5;
}

function rankPreference(candidate, context) {
  const { isFinalBeat, isPreparationWindow, favorsContinuousChromaticLead } = context;
  if (isFinalBeat) {
    if (candidate.rank === 'rank1') return 0;
    if (candidate.rank === 'rank2') return 1;
    if (candidate.rank === 'rank3') return 2;
    return 3;
  }
  if (isPreparationWindow) {
    if (candidate.rank === 'approach') return favorsContinuousChromaticLead ? 0 : 2;
    if (candidate.rank === 'rank1') return 0;
    if (candidate.rank === 'rank2') return 1;
    if (candidate.rank === 'rank3') return 2;
    return 4;
  }
  if (candidate.rank === 'rank1') return 0;
  if (candidate.rank === 'rank2') return 1;
  if (candidate.rank === 'rank3') return 2;
  if (candidate.rank === 'approach') return favorsContinuousChromaticLead ? 1 : 3;
  return 4;
}

function getDirection(interval) {
  if (interval > 0) return 1;
  if (interval < 0) return -1;
  return 0;
}

function getConjunctMotion(interval, allowOctaveEquivalent = true) {
  const direction = getDirection(interval);
  if (direction === 0) return null;

  const absInterval = Math.abs(interval);
  const mod12Interval = absInterval % 12;
  const normalizedAbsInterval = allowOctaveEquivalent
    ? Math.min(
      absInterval,
      mod12Interval === 0 ? 12 : 12 - mod12Interval,
      mod12Interval === 0 ? 12 : mod12Interval
    )
    : absInterval;

  if (normalizedAbsInterval !== 1 && normalizedAbsInterval !== 2) return null;
  return { direction, size: normalizedAbsInterval };
}

function getRecentMidiHistory(previousMidi, events) {
  const eventNotes = events.map((event) => event.midi);
  return eventNotes.length && eventNotes[eventNotes.length - 1] === previousMidi
    ? eventNotes
    : [...eventNotes, previousMidi];
}

function directionalPenalty(candidate, previousMidi, events) {
  const recentNotes = getRecentMidiHistory(previousMidi, events).slice(-4);
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

function recentConjunctRunIntervals(previousMidi, events, allowOctaveEquivalent = true) {
  const notes = getRecentMidiHistory(previousMidi, events).slice(-4);
  if (notes.length < 2) return { direction: 0, intervalCount: 0 };

  let direction = 0;
  let intervalCount = 0;
  for (let index = notes.length - 1; index > 0; index--) {
    const motion = getConjunctMotion(notes[index] - notes[index - 1], allowOctaveEquivalent);
    if (!motion) break;
    if (direction === 0) {
      direction = motion.direction;
      intervalCount = 1;
      continue;
    }
    if (motion.direction !== direction) break;
    intervalCount += 1;
  }

  return { direction, intervalCount };
}

function continuousConjunctRunBonus(candidate, previousMidi, events, nextSpan, beatsRemainingInSpan) {
  const beatIndex = events.length;
  const allowOctaveEquivalent = beatIndex === 1;
  const motion = getConjunctMotion(candidate.midi - previousMidi, allowOctaveEquivalent);
  if (!motion) return 0;

  const recentRun = recentConjunctRunIntervals(previousMidi, events, allowOctaveEquivalent);
  let bonus = 0;

  if (recentRun.intervalCount >= 1 && recentRun.direction === motion.direction) {
    bonus += 4;
    if (recentRun.intervalCount >= 2) {
      bonus += 4;
    }
    if (recentRun.intervalCount >= 3) {
      bonus += 3 * (recentRun.intervalCount - 2);
    }
  }

  if (!nextSpan) return bonus;

  const nextBassCandidates = nextSpan.pools.rank1.filter((nextCandidate) => nextCandidate.source === 'bass');
  const canReachNextBassConjunctly = nextBassCandidates.some((nextBass) => {
    const distance = nextBass.midi - candidate.midi;
    if (distance === 0) return false;
    if (Math.sign(distance) !== motion.direction) return false;
    return Math.abs(distance) <= beatsRemainingInSpan;
  });

  if (canReachNextBassConjunctly) {
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

function nextBassAnticipationPenalty(candidate, nextSpan, beatsRemainingInSpan, maxLookaheadBeats = 4) {
  if (!nextSpan || candidate.rank === 'approach') return 0;
  const nextBassPitchClasses = new Set(
    nextSpan.pools.rank1
      .filter((nextCandidate) => nextCandidate.source === 'bass')
      .map((nextCandidate) => nextCandidate.pitchClass)
  );
  if (!nextBassPitchClasses.has(candidate.pitchClass)) return 0;

  const distanceToNextBass = Math.max(1, beatsRemainingInSpan);
  if (distanceToNextBass > maxLookaheadBeats) return 0;
  const proximityPenalty = maxLookaheadBeats - distanceToNextBass + 1;
  const spoilerPenalty = distanceToNextBass > 1 ? proximityPenalty * 2 : proximityPenalty;
  return spoilerPenalty;
}

function nextBassConvergenceBonus(candidate, previousMidi, nextSpan, beatsRemainingInSpan) {
  if (!nextSpan || candidate.rank === 'approach') return 0;
  const candidateMotion = candidate.midi - previousMidi;
  const candidateDirection = getDirection(candidateMotion);
  if (candidateDirection === 0) return 0;

  const nextBassCandidates = nextSpan.pools.rank1.filter((nextCandidate) => nextCandidate.source === 'bass');
  let bestBonus = 0;

  nextBassCandidates.forEach((nextBass) => {
    if (candidate.pitchClass === nextBass.pitchClass) return;
    const previousDistance = Math.abs(nextBass.midi - previousMidi);
    const candidateDistance = Math.abs(nextBass.midi - candidate.midi);
    const improvement = previousDistance - candidateDistance;
    if (improvement <= 0) return;

    const targetDirection = getDirection(nextBass.midi - candidate.midi);
    if (targetDirection !== 0 && targetDirection !== candidateDirection) return;

    const proximityBonus = Math.max(0, 5 - Math.min(4, beatsRemainingInSpan));
    const reachabilityBonus = candidateDistance <= beatsRemainingInSpan * 2 ? 2 : 0;
    bestBonus = Math.max(bestBonus, improvement + proximityBonus + reachabilityBonus);
  });

  return bestBonus;
}

function futureNeighborPreparationBonus(candidate, previousMidi, nextSpan, beatsRemainingInSpan) {
  if (!nextSpan || candidate.rank === 'approach' || beatsRemainingInSpan > 3) return 0;
  const motion = getConjunctMotion(candidate.midi - previousMidi);
  if (!motion) return 0;

  const nextBassCandidates = nextSpan.pools.rank1.filter((nextCandidate) => nextCandidate.source === 'bass');
  let bestBonus = 0;

  nextBassCandidates.forEach((nextBass) => {
    const neighborMidis = [nextBass.midi - 1, nextBass.midi + 1, nextBass.midi - 2, nextBass.midi + 2];
    neighborMidis.forEach((neighborMidi) => {
      const distanceToNeighbor = neighborMidi - candidate.midi;
      if (distanceToNeighbor === 0) return;
      if (getDirection(distanceToNeighbor) !== motion.direction) return;
      if (Math.abs(distanceToNeighbor) > Math.max(1, beatsRemainingInSpan - 1) * 2) return;
      bestBonus = Math.max(bestBonus, 3 + Math.max(0, 4 - Math.abs(distanceToNeighbor)));
    });
  });

  return bestBonus;
}

function terminalResolutionBonus(candidate, previousMidi, nextSpan, beatsRemainingInSpan) {
  if (!nextSpan || candidate.rank === 'approach' || beatsRemainingInSpan > 3) return 0;
  const motion = getConjunctMotion(candidate.midi - previousMidi, false);
  if (!motion) return 0;

  const nextBassCandidates = nextSpan.pools.rank1.filter((nextCandidate) => nextCandidate.source === 'bass');
  let bestBonus = 0;

  nextBassCandidates.forEach((nextBass) => {
    const distanceToTarget = nextBass.midi - candidate.midi;
    if (distanceToTarget === 0) return;
    if (getDirection(distanceToTarget) !== motion.direction) return;

    const absDistance = Math.abs(distanceToTarget);
    if (absDistance > beatsRemainingInSpan * 2) return;

    const closenessBonus = Math.max(0, beatsRemainingInSpan * 2 - absDistance + 1);
    const neighborBonus = absDistance <= 2 ? 3 : 0;
    bestBonus = Math.max(bestBonus, closenessBonus + neighborBonus);
  });

  return bestBonus;
}

function recoveryLineBonus(candidate, previousMidi, events, nextSpan) {
  if (!nextSpan || !events.length) return 0;
  const lastEvent = events[events.length - 1];
  const previousInterval = previousMidi - lastEvent.midi;
  const motion = getConjunctMotion(candidate.midi - previousMidi, false);
  if (!motion || Math.abs(previousInterval) <= 2) return 0;

  const nextBassCandidates = nextSpan.pools.rank1.filter((nextCandidate) => nextCandidate.source === 'bass');
  const improvesTowardTarget = nextBassCandidates.some((nextBass) => {
    const previousDistance = Math.abs(nextBass.midi - previousMidi);
    const candidateDistance = Math.abs(nextBass.midi - candidate.midi);
    return candidateDistance < previousDistance && getDirection(nextBass.midi - candidate.midi) === motion.direction;
  });

  return improvesTowardTarget ? 4 : 0;
}

function getRank2DirectionalLimit(previousMidi, currentSpan) {
  const rank1AndRank2Midis = [
    ...new Set([
      ...((currentSpan?.pools?.rank1 || []).map((candidate) => candidate.midi)),
      ...((currentSpan?.pools?.rank2 || []).map((candidate) => candidate.midi))
    ])
  ]
    .sort((left, right) => left - right);
  let downwardLimit = 2;
  let upwardLimit = 2;

  for (let index = rank1AndRank2Midis.length - 1; index >= 0; index -= 1) {
    if (rank1AndRank2Midis[index] < previousMidi) {
      downwardLimit = Math.max(2, previousMidi - rank1AndRank2Midis[index]);
      break;
    }
  }
  for (let index = 0; index < rank1AndRank2Midis.length; index += 1) {
    if (rank1AndRank2Midis[index] > previousMidi) {
      upwardLimit = Math.max(2, rank1AndRank2Midis[index] - previousMidi);
      break;
    }
  }

  return { downwardLimit, upwardLimit };
}

function respectsThreeNoteWindowRange(candidate, previousMidi, events) {
  const recentNotes = getRecentMidiHistory(previousMidi, events);
  if (recentNotes.length < 2) return true;

  const lastTwoNotes = recentNotes.slice(-2);
  const window = [...lastTwoNotes, candidate.midi];
  const minMidi = Math.min(...window);
  const maxMidi = Math.max(...window);
  return (maxMidi - minMidi) <= 12;
}

function recentPlayedMidiPenalty(candidateMidi, previousMidi, events, maxLookbackBeats = 4) {
  const recentNotes = getRecentMidiHistory(previousMidi, events);
  const lookbackNotes = recentNotes.slice(-maxLookbackBeats);

  return lookbackNotes.reduce((penalty, midi, index) => {
    if (midi !== candidateMidi) return penalty;
    const recencyWeight = index + 1;
    return penalty + recencyWeight;
  }, 0);
}

function disjunctMotionPenalty(candidate, previousMidi, events, currentSpan) {
  const interval = candidate.midi - previousMidi;
  const absInterval = Math.abs(interval);
  if (absInterval <= 2) return 0;

  const beatIndex = events.length;
  let penalty = 0;

  if (absInterval >= 10) {
    penalty += 8;
  } else if (absInterval >= 7) {
    penalty += 5;
  } else if (absInterval >= 5) {
    penalty += 3;
  } else {
    penalty += 1;
  }

  if (beatIndex >= 2) {
    penalty += 3;
  } else if (beatIndex >= 1) {
    penalty += 1;
  }

  const recentRun = recentConjunctRunIntervals(previousMidi, events, false);
  if (recentRun.intervalCount >= 1) {
    penalty += 2 + recentRun.intervalCount;
  }

  if (candidate.source === 'fifth' || candidate.source === 'bass') {
    penalty += 1;
  }

  if (currentSpan?.durationBeats >= 4 && beatIndex >= currentSpan.durationBeats - 2) {
    penalty += 2;
  }

  return penalty;
}

function brokenLinePenalty(candidate, previousMidi, events) {
  const recentRun = recentConjunctRunIntervals(previousMidi, events, false);
  if (recentRun.intervalCount < 2) return 0;

  const motion = getConjunctMotion(candidate.midi - previousMidi, false);
  if (!motion) return 3 + recentRun.intervalCount;
  if (motion.direction !== recentRun.direction) return 2 + recentRun.intervalCount;
  return 0;
}

function getBeatsRemainingInSpan(currentSpan, beatIndex) {
  return currentSpan.durationBeats - beatIndex;
}

function createSelectionContext(previousEvent, currentSpan, nextSpan, beatIndex, events) {
  const beatsRemainingInSpan = getBeatsRemainingInSpan(currentSpan, beatIndex);
  const isFinalBeat = beatIndex === currentSpan.durationBeats - 1;
  const isPreparationWindow = Boolean(nextSpan) && beatsRemainingInSpan <= 2;
  return {
    previousEvent,
    previousMidi: previousEvent.midi,
    previousPitchClass: previousEvent.pitchClass,
    currentSpan,
    nextSpan,
    beatIndex,
    beatsRemainingInSpan,
    isFinalBeat,
    isPreparationWindow,
    events
  };
}

function candidatePenaltyScore(candidate, context) {
  const {
    previousMidi,
    previousPitchClass,
    currentSpan,
    nextSpan,
    beatsRemainingInSpan,
    isFinalBeat,
    isPreparationWindow,
    events
  } = context;
  const favorsContinuousChromaticLead = supportsContinuousChromaticLead(candidate, nextSpan, beatsRemainingInSpan);
  const distance = Math.abs(candidate.midi - previousMidi);
  const repeatMidiPenalty = candidate.midi === previousMidi ? (isFinalBeat ? 5 : 16) : 0;
  const repeatPitchPenalty = candidate.pitchClass === previousPitchClass ? (isFinalBeat ? 1 : 4) : 0;
  const playedMidiPenalty = recentPlayedMidiPenalty(candidate.midi, previousMidi, events);
  const contourPenalty = directionalPenalty(candidate, previousMidi, events);
  const conjunctRunBonus = continuousConjunctRunBonus(candidate, previousMidi, events, nextSpan, beatsRemainingInSpan);
  const anticipationPenalty = nextBassAnticipationPenalty(candidate, nextSpan, beatsRemainingInSpan);
  const nextBassGravityBonus = nextBassConvergenceBonus(candidate, previousMidi, nextSpan, beatsRemainingInSpan);
  const terminalBonus = terminalResolutionBonus(candidate, previousMidi, nextSpan, beatsRemainingInSpan);
  const futureNeighborBonus = futureNeighborPreparationBonus(candidate, previousMidi, nextSpan, beatsRemainingInSpan);
  const recoveryBonus = recoveryLineBonus(candidate, previousMidi, events, nextSpan);
  const disjunctPenalty = disjunctMotionPenalty(candidate, previousMidi, events, currentSpan);
  const lineBreakPenalty = brokenLinePenalty(candidate, previousMidi, events);
  const leapPenalty = distance > 7 ? 4 : 0;
  const preferenceContext = {
    isFinalBeat,
    isPreparationWindow,
    favorsContinuousChromaticLead
  };
  const rankPenalty = rankPreference(candidate, preferenceContext);
  const sourcePenalty = sourcePreference(candidate, preferenceContext);
  const rankPenaltyWeight = beatsRemainingInSpan <= 3 ? 2 : 3;
  return (
    repeatMidiPenalty * 5
    + repeatPitchPenalty * 3
    + playedMidiPenalty * 2
    + contourPenalty * 2
    + disjunctPenalty * 2
    + lineBreakPenalty * 2
    - conjunctRunBonus * 2
    - nextBassGravityBonus * 2
    - terminalBonus * 2
    - futureNeighborBonus * 2
    - recoveryBonus * 2
    + anticipationPenalty * 3
    + leapPenalty
    + rankPenalty * rankPenaltyWeight
    + sourcePenalty
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
  const allStructuralCandidates = [...currentSpan.pools.rank1, ...currentSpan.pools.rank2, ...currentSpan.pools.rank3];
  if (previousEvent.rank === 'rank1') {
    return allStructuralCandidates.filter((candidate) => {
      const distance = Math.abs(candidate.midi - previousEvent.midi);
      return distance <= 12 && distance !== 11;
    });
  }
  if (previousEvent.rank === 'rank2') {
    const { downwardLimit, upwardLimit } = getRank2DirectionalLimit(previousEvent.midi, currentSpan);
    return allStructuralCandidates.filter((candidate) => {
      const interval = candidate.midi - previousEvent.midi;
      if (interval === 0) return true;
      if (interval > 0) return interval <= upwardLimit;
      return Math.abs(interval) <= downwardLimit;
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

function getCandidateEvents(selectionContext) {
  const {
    previousEvent,
    currentSpan,
    nextSpan,
    beatIndex,
    beatsRemainingInSpan,
    isFinalBeat,
    events
  } = selectionContext;
  const requireRank1AtMeasureStart = isInternalMeasureStart(currentSpan, beatIndex);
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

  const orderedCandidates = orderCandidatesWeighted(candidates, (candidate) =>
    candidatePenaltyScore(candidate, selectionContext)
  );
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
    source: rank === 'rank1' ? 'resolution' : (rank === 'rank2' ? 'guide' : 'color'),
    targetMidi: null
  }, isSpanStart, true);
}

function normalizeBassFeelMode(value): PracticeArrangementBassFeelMode {
  return value === 'two' ? 'two' : 'four';
}

function getStrongBeatPositions(beatsPerBar = 4) {
  return getMetricBeatStrengths(Math.max(1, Number(beatsPerBar) || 4))
    .map((strength, beatIndex) => strength === 'strong' ? beatIndex : null)
    .filter((beatIndex) => beatIndex !== null);
}

function twoFeelCandidateScore(candidate, previousEvent) {
  if (!previousEvent?.midi) return 0;
  const distance = Math.abs(candidate.midi - previousEvent.midi);
  const samePitchClass = candidate.pitchClass === mod12(previousEvent.midi);
  const exactRepeatPenalty = candidate.midi === previousEvent.midi ? 10 : 0;
  const samePitchClassPenalty = samePitchClass ? 6 : 0;
  const octaveOrWiderPenalty = distance >= 12 ? 8 + ((distance - 11) * 1.5) : 0;
  return exactRepeatPenalty
    + samePitchClassPenalty
    + octaveOrWiderPenalty
    + (distance * 0.25);
}

function getTwoFeelCandidate(span, beatPosition, previousEvent, { forceBassArrival = false } = {}) {
  const rank1Candidates = span.pools.rank1 || [];
  const firstStrongBeatCandidates = beatPosition === 0
    ? rank1Candidates.filter((candidate) => candidate.source === 'bass')
    : rank1Candidates;
  const bassArrivalCandidates = forceBassArrival
    ? rank1Candidates.filter((candidate) => candidate.source === 'bass')
    : [];
  const candidates = bassArrivalCandidates.length
    ? bassArrivalCandidates
    : (firstStrongBeatCandidates.length ? firstStrongBeatCandidates : rank1Candidates);
  if (!candidates.length) return null;
  if (!previousEvent?.midi) {
    const preferred = beatPosition === 0
      ? candidates.find((candidate) => candidate.source === 'bass')
      : candidates.find((candidate) => candidate.source === 'root' || candidate.source === 'bass');
    return preferred || candidates[0];
  }
  if (beatPosition !== 0) {
    return orderCandidatesWeighted(candidates, (candidate) =>
      twoFeelCandidateScore(candidate, previousEvent)
    )[0] || null;
  }
  return chooseNearestMidi(candidates, previousEvent.midi, span.pools.bassPitchClass);
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

  const selectionContext = createSelectionContext(previousEvent, span, nextSpan, beatIndex, events);
  const candidates = getCandidateEvents(selectionContext);
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
  return null;
}

// Public generator API

export function createWalkingBassGenerator({ constants = {} }: { constants?: PracticeArrangementWalkingBassConstants } = {}) {
  const { BASS_LOW = 28, BASS_HIGH = 48 } = constants;

  function buildPreparedSpans(chords, beatsPerChord, key, isMinor, nextChords, nextKey, nextIsMinor) {
    const currentTotalBeats = chords.length * beatsPerChord;
    const spans = appendSpans([], chords, beatsPerChord, key, isMinor, BASS_LOW, BASS_HIGH, 0);
    appendSpans(spans, nextChords, beatsPerChord, nextKey, nextIsMinor, BASS_LOW, BASS_HIGH, currentTotalBeats);
    return {
      currentTotalBeats,
      preparedSpans: spans.map((span) => ({ ...span, low: BASS_LOW, high: BASS_HIGH }))
    };
  }

  function buildSpanEvents(span, nextSpan, previousEvent, pendingTargetMidi) {
    const firstCandidate = getFirstSpanBassCandidate(span, nextSpan, previousEvent, pendingTargetMidi);
    if (!firstCandidate) return null;

    const firstEvent = withVelocity({
      ...firstCandidate,
      targetMidi: null
    }, true);
    const seededEvents = [firstEvent];
    return searchSpanEvents(span, nextSpan, firstEvent, 1, seededEvents) || seededEvents;
  }

  function appendSpanEventsToLine(events, resolvedSpanEvents, startBeat, currentTotalBeats) {
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
  }

  function appendTwoFeelSpanEventsToLine(events, span, currentTotalBeats, beatsPerBar, previousEvent) {
    const normalizedBeatsPerBar = Math.max(1, Number(beatsPerBar) || 4);
    const strongBeatPositions = new Set(getStrongBeatPositions(normalizedBeatsPerBar));
    let nextPreviousEvent = previousEvent;
    for (let beatIndex = 0; beatIndex < span.durationBeats; beatIndex += 1) {
      const absoluteTimeBeats = span.startBeat + beatIndex;
      if (absoluteTimeBeats >= currentTotalBeats) break;
      const beatPosition = getMeasureBeatPosition(absoluteTimeBeats, normalizedBeatsPerBar);
      const isHarmonyChange = beatIndex === 0;
      if (!strongBeatPositions.has(beatPosition) && !isHarmonyChange) continue;
      const candidate = getTwoFeelCandidate(span, beatPosition, nextPreviousEvent, {
        forceBassArrival: isHarmonyChange && beatPosition !== 0
      });
      if (!candidate) continue;
      const event = withVelocity({
        ...candidate,
        targetMidi: null
      }, beatPosition === 0 || isHarmonyChange);
      events.push({
        timeBeats: absoluteTimeBeats,
        durationBeats: 1,
        midi: event.midi,
        velocity: event.velocity,
        rank: event.rank,
        source: event.source,
        targetMidi: null
      });
      nextPreviousEvent = event;
    }
    return nextPreviousEvent;
  }

  function stretchTwoFeelDurations(events, currentTotalBeats) {
    return events.map((event, index) => {
      const nextEvent = events[index + 1] || null;
      const durationBeats = nextEvent
        ? Math.max(0.1, nextEvent.timeBeats - event.timeBeats)
        : Math.max(0.1, currentTotalBeats - event.timeBeats);
      return {
        ...event,
        durationBeats
      };
    });
  }

  function applyLineOrnaments(events, swingRatio = DEFAULT_SWING_RATIO, tempoBpm = 120, beatsPerBar = 4, endingCue = null) {
    const allowRepeatedNoteEffect = !(Number.isFinite(tempoBpm) && tempoBpm >= REPEATED_NOTE_EFFECT_MAX_BPM + 1);
    const allowAnticipationEffect = !(Number.isFinite(tempoBpm) && tempoBpm >= ANTICIPATION_EFFECT_MAX_BPM + 1);
    const allowFirstBeatAnticipationEffect = !(Number.isFinite(tempoBpm) && tempoBpm >= FIRST_BEAT_ANTICIPATION_EFFECT_MAX_BPM + 1);

    const embellishedEvents = allowRepeatedNoteEffect
      ? applyRepeatedNoteEffect(events, BASS_LOW, BASS_HIGH, swingRatio, beatsPerBar)
      : events;
    const anticipatedEvents = allowAnticipationEffect
      ? applyAnticipationEffect(embellishedEvents, swingRatio, beatsPerBar, { endingCue })
      : embellishedEvents;
    return allowFirstBeatAnticipationEffect
      ? applyFirstBeatAnticipationEffect(anticipatedEvents, swingRatio, beatsPerBar, { endingCue })
      : anticipatedEvents;
  }

  function buildLine({
    chords = [],
    key = 0,
    beatsPerChord = 1,
    beatsPerBar = 4,
    tempoBpm = 120,
    isMinor = false,
    initialPendingTargetMidi = null,
    nextChords = [],
    nextKey = key,
    nextIsMinor = isMinor,
    swingRatio = DEFAULT_SWING_RATIO,
    endingCue = null,
    bassFeel = 'four'
  } = {}) {
    const currentNoChordWindows = Array.isArray(chords)
      ? chords
          .map((chord, index) => isNoChord(chord)
            ? {
                startBeat: index * beatsPerChord,
                endBeat: (index + 1) * beatsPerChord,
              }
            : null)
          .filter(Boolean)
      : [];
    const { currentTotalBeats, preparedSpans } = buildPreparedSpans(
      chords,
      beatsPerChord,
      key,
      isMinor,
      nextChords,
      nextKey,
      nextIsMinor
    );
    const events = [];
    let previousEvent = null;
    let pendingTargetMidi = initialPendingTargetMidi;
    const feelMode = normalizeBassFeelMode(bassFeel);

    preparedSpans.forEach((span, spanIndex) => {
      const nextSpan = preparedSpans[spanIndex + 1] || null;
      if (feelMode === 'two') {
        previousEvent = appendTwoFeelSpanEventsToLine(events, span, currentTotalBeats, beatsPerBar, previousEvent);
        pendingTargetMidi = null;
        return;
      }
      const resolvedSpanEvents = buildSpanEvents(span, nextSpan, previousEvent, pendingTargetMidi);
      if (!resolvedSpanEvents) return;

      appendSpanEventsToLine(events, resolvedSpanEvents, span.startBeat, currentTotalBeats);

      previousEvent = resolvedSpanEvents[resolvedSpanEvents.length - 1];
      pendingTargetMidi = previousEvent?.rank === 'approach' ? previousEvent.targetMidi : null;
    });

    const resolvedEvents = feelMode === 'two'
      ? stretchTwoFeelDurations(events, currentTotalBeats)
      : applyLineOrnaments(events, swingRatio, tempoBpm, beatsPerBar, endingCue);

    return resolvedEvents
      .filter((event) => !currentNoChordWindows.some((window) =>
        event.timeBeats >= window.startBeat
        && event.timeBeats < window.endBeat
      ));
  }

  return {
    buildLine
  };
}

export const createMediumSwingWalkingBassGenerator = createWalkingBassGenerator;

