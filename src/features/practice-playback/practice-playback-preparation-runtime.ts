import type {
  PracticePlaybackBassPlan,
  PracticePlaybackCompingPlan,
  PracticePlaybackResourceChord,
  PracticePlaybackResourcesCompingEngine,
  PracticePlaybackResourcesWalkingBassGenerator
} from './practice-playback-resources-types.js';

type PracticePlaybackPreparationRuntimeOptions = {
  getPlayedChordQuality?: (
    chord: PracticePlaybackResourceChord,
    isMinor: boolean,
    nextChord?: PracticePlaybackResourceChord | null
  ) => string;
  getVoicingPlanForProgression?: (
    chords: PracticePlaybackResourceChord[],
    key: number,
    isMinor: boolean
  ) => unknown[] | null | undefined;
  getVoicing?: (
    key: number,
    chord: PracticePlaybackResourceChord,
    isMinor: boolean,
    nextChord?: PracticePlaybackResourceChord | null
  ) => unknown;
  getNextKeyValue?: () => number | null;
  getNextPaddedChords?: () => PracticePlaybackResourceChord[] | null;
  getNextVoicingPlan?: () => unknown[] | null;
  getNextCompingPlan?: () => PracticePlaybackCompingPlan;
  getIsMinorMode?: () => boolean;
  setCurrentCompingPlan?: (value: PracticePlaybackCompingPlan) => void;
  setNextCompingPlan?: (value: PracticePlaybackCompingPlan) => void;
  getPaddedChords?: () => PracticePlaybackResourceChord[];
  getCurrentKey?: () => number;
  getCurrentVoicingPlan?: () => unknown[];
  getBeatsPerChord?: () => number;
  getCompingStyle?: () => string;
  getTempoBpm?: () => number;
  isWalkingBassEnabled?: () => boolean;
  getSwingRatio?: () => number;
  getCurrentBassPlan?: () => PracticePlaybackBassPlan;
  setCurrentBassPlan?: (value: PracticePlaybackBassPlan) => void;
  getNextPaddedChordsForBass?: () => PracticePlaybackResourceChord[];
  getNextKeyForBass?: () => number | null;
  compingEngine?: PracticePlaybackResourcesCompingEngine;
  walkingBassGenerator?: PracticePlaybackResourcesWalkingBassGenerator | null;
};

/**
 * @param {object} [options]
 * @param {(chord: PracticePlaybackResourceChord, isMinor: boolean, nextChord?: PracticePlaybackResourceChord | null) => string} [options.getPlayedChordQuality]
 * @param {(chords: PracticePlaybackResourceChord[], key: number, isMinor: boolean) => unknown[] | null | undefined} [options.getVoicingPlanForProgression]
 * @param {(key: number, chord: PracticePlaybackResourceChord, isMinor: boolean, nextChord?: PracticePlaybackResourceChord | null) => unknown} [options.getVoicing]
 * @param {() => number | null} [options.getNextKeyValue]
 * @param {() => PracticePlaybackResourceChord[] | null} [options.getNextPaddedChords]
 * @param {() => unknown[] | null} [options.getNextVoicingPlan]
 * @param {() => PracticePlaybackCompingPlan} [options.getNextCompingPlan]
 * @param {() => boolean} [options.getIsMinorMode]
 * @param {(value: PracticePlaybackCompingPlan) => void} [options.setCurrentCompingPlan]
 * @param {(value: PracticePlaybackCompingPlan) => void} [options.setNextCompingPlan]
 * @param {() => PracticePlaybackResourceChord[]} [options.getPaddedChords]
 * @param {() => number} [options.getCurrentKey]
 * @param {() => unknown[]} [options.getCurrentVoicingPlan]
 * @param {() => number} [options.getBeatsPerChord]
 * @param {() => string} [options.getCompingStyle]
 * @param {() => number} [options.getTempoBpm]
 * @param {() => boolean} [options.isWalkingBassEnabled]
 * @param {() => number} [options.getSwingRatio]
 * @param {() => PracticePlaybackBassPlan | null} [options.getCurrentBassPlan]
 * @param {(value: PracticePlaybackBassPlan) => void} [options.setCurrentBassPlan]
 * @param {() => PracticePlaybackResourceChord[]} [options.getNextPaddedChordsForBass]
 * @param {() => number | null} [options.getNextKeyForBass]
 * @param {PracticePlaybackResourcesCompingEngine} [options.compingEngine]
 * @param {PracticePlaybackResourcesWalkingBassGenerator | null} [options.walkingBassGenerator]
 */
export function createPracticePlaybackPreparationRuntime({
  getPlayedChordQuality = () => '',
  getVoicingPlanForProgression = () => null,
  getVoicing = () => null,
  getNextKeyValue = () => null,
  getNextPaddedChords = () => null,
  getNextVoicingPlan = () => null,
  getNextCompingPlan = () => null,
  getIsMinorMode = () => false,
  setCurrentCompingPlan = () => {},
  setNextCompingPlan = () => {},
  getPaddedChords = () => [],
  getCurrentKey = () => 0,
  getCurrentVoicingPlan = () => [],
  getBeatsPerChord = () => 1,
  getCompingStyle = () => 'off',
  getTempoBpm = () => 120,
  isWalkingBassEnabled = () => false,
  getSwingRatio = () => 0,
  getCurrentBassPlan = () => [],
  setCurrentBassPlan = () => {},
  getNextPaddedChordsForBass = () => [],
  getNextKeyForBass = () => null,
  compingEngine,
  walkingBassGenerator = null
}: PracticePlaybackPreparationRuntimeOptions = {}) {
  function getNextDifferentChord(chords: PracticePlaybackResourceChord[], startIdx: number) {
    const chord = chords[startIdx];
    if (!chord) return null;
    const playedMajor = getPlayedChordQuality(chord, false, chords[startIdx + 1] || null);
    const playedMinor = getPlayedChordQuality(chord, true, chords[startIdx + 1] || null);

    for (let index = startIdx + 1; index < chords.length; index++) {
      const candidate = chords[index];
      const candidatePlayedMajor = getPlayedChordQuality(candidate, false, chords[index + 1] || null);
      const candidatePlayedMinor = getPlayedChordQuality(candidate, true, chords[index + 1] || null);
      if (candidate.semitones !== chord.semitones
          || (candidate.bassSemitones ?? candidate.semitones) !== (chord.bassSemitones ?? chord.semitones)
          || candidatePlayedMajor !== playedMajor
          || candidatePlayedMinor !== playedMinor) {
        return candidate;
      }
    }

    return null;
  }

  function getVoicingAtIndex(chords: PracticePlaybackResourceChord[], key: number, chordIdx: number, isMinor: boolean) {
    const chord = chords[chordIdx];
    if (!chord) return null;
    const plannedVoicing = getVoicingPlanForProgression(chords, key, isMinor)?.[chordIdx];
    if (plannedVoicing) return plannedVoicing;
    return getVoicing(key, chord, isMinor, chords[chordIdx + 1] || null);
  }

  function getPreparedNextProgression() {
    const nextKeyValue = getNextKeyValue();
    const nextPaddedChords = getNextPaddedChords();
    if (nextKeyValue === null || !nextPaddedChords) return null;
    return {
      key: nextKeyValue,
      chords: nextPaddedChords,
      voicingPlan: getNextVoicingPlan(),
      compingPlan: getNextCompingPlan(),
      isMinor: getIsMinorMode()
    };
  }

  function rebuildPreparedCompingPlans(
    previousKey = getCurrentKey(),
    currentHasIncomingAnticipation = false,
    currentPreviousTailBeats: number | null = null
  ) {
    const beatsPerChord = getBeatsPerChord();
    const isMinor = getIsMinorMode();
    const { currentPlan, nextPlan } = compingEngine?.buildPreparedPlans({
      style: getCompingStyle(),
      previousKey,
      currentHasIncomingAnticipation,
      currentPreviousTailBeats,
      current: {
        chords: getPaddedChords(),
        key: getCurrentKey(),
        isMinor,
        voicingPlan: getCurrentVoicingPlan(),
        beatsPerChord
      },
      next: {
        chords: getNextPaddedChords(),
        key: getNextKeyValue(),
        isMinor,
        voicingPlan: getNextVoicingPlan(),
        beatsPerChord
      }
    }) || { currentPlan: null, nextPlan: null };
    setCurrentCompingPlan(currentPlan);
    setNextCompingPlan(nextPlan);
  }

  function ensureWalkingBassGenerator() {
    return Promise.resolve(walkingBassGenerator);
  }

  function buildPreparedBassPlan(initialPendingTargetMidi = null) {
    if (!isWalkingBassEnabled() || !walkingBassGenerator) {
      setCurrentBassPlan([]);
      return getCurrentBassPlan();
    }

    const nextKey = getNextKeyForBass();
    const nextChords = getNextPaddedChordsForBass();
    const currentBassPlan = walkingBassGenerator.buildLine({
      chords: getPaddedChords(),
      key: getCurrentKey(),
      beatsPerChord: getBeatsPerChord(),
      tempoBpm: getTempoBpm(),
      isMinor: getIsMinorMode(),
      initialPendingTargetMidi,
      nextChords,
      nextKey: nextKey ?? getCurrentKey(),
      nextIsMinor: getIsMinorMode(),
      swingRatio: getSwingRatio()
    });
    setCurrentBassPlan(currentBassPlan);
    return currentBassPlan;
  }

  return {
    getNextDifferentChord,
    getVoicingAtIndex,
    getPreparedNextProgression,
    rebuildPreparedCompingPlans,
    ensureWalkingBassGenerator,
    buildPreparedBassPlan
  };
}


