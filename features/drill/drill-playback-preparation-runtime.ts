import type {
  DrillPlaybackBassPlan,
  DrillPlaybackCompingPlan,
  DrillPlaybackResourceChord,
  DrillPlaybackResourcesCompingEngine,
  DrillPlaybackResourcesWalkingBassGenerator
} from './drill-playback-resources-types.js';

type DrillPlaybackPreparationRuntimeOptions = {
  getPlayedChordQuality?: (
    chord: DrillPlaybackResourceChord,
    isMinor: boolean,
    nextChord?: DrillPlaybackResourceChord | null
  ) => string;
  getVoicingPlanForProgression?: (
    chords: DrillPlaybackResourceChord[],
    key: number,
    isMinor: boolean
  ) => unknown[] | null | undefined;
  getVoicing?: (
    key: number,
    chord: DrillPlaybackResourceChord,
    isMinor: boolean,
    nextChord?: DrillPlaybackResourceChord | null
  ) => unknown;
  getNextKeyValue?: () => number | null;
  getNextPaddedChords?: () => DrillPlaybackResourceChord[] | null;
  getNextVoicingPlan?: () => unknown[] | null;
  getNextCompingPlan?: () => DrillPlaybackCompingPlan;
  getIsMinorMode?: () => boolean;
  setCurrentCompingPlan?: (value: DrillPlaybackCompingPlan) => void;
  setNextCompingPlan?: (value: DrillPlaybackCompingPlan) => void;
  getPaddedChords?: () => DrillPlaybackResourceChord[];
  getCurrentKey?: () => number;
  getCurrentVoicingPlan?: () => unknown[];
  getBeatsPerChord?: () => number;
  getCompingStyle?: () => string;
  getTempoBpm?: () => number;
  isWalkingBassEnabled?: () => boolean;
  getSwingRatio?: () => number;
  getCurrentBassPlan?: () => DrillPlaybackBassPlan;
  setCurrentBassPlan?: (value: DrillPlaybackBassPlan) => void;
  getNextPaddedChordsForBass?: () => DrillPlaybackResourceChord[];
  getNextKeyForBass?: () => number | null;
  compingEngine?: DrillPlaybackResourcesCompingEngine;
  walkingBassGenerator?: DrillPlaybackResourcesWalkingBassGenerator | null;
};

/**
 * @param {object} [options]
 * @param {(chord: DrillPlaybackResourceChord, isMinor: boolean, nextChord?: DrillPlaybackResourceChord | null) => string} [options.getPlayedChordQuality]
 * @param {(chords: DrillPlaybackResourceChord[], key: number, isMinor: boolean) => unknown[] | null | undefined} [options.getVoicingPlanForProgression]
 * @param {(key: number, chord: DrillPlaybackResourceChord, isMinor: boolean, nextChord?: DrillPlaybackResourceChord | null) => unknown} [options.getVoicing]
 * @param {() => number | null} [options.getNextKeyValue]
 * @param {() => DrillPlaybackResourceChord[] | null} [options.getNextPaddedChords]
 * @param {() => unknown[] | null} [options.getNextVoicingPlan]
 * @param {() => DrillPlaybackCompingPlan} [options.getNextCompingPlan]
 * @param {() => boolean} [options.getIsMinorMode]
 * @param {(value: DrillPlaybackCompingPlan) => void} [options.setCurrentCompingPlan]
 * @param {(value: DrillPlaybackCompingPlan) => void} [options.setNextCompingPlan]
 * @param {() => DrillPlaybackResourceChord[]} [options.getPaddedChords]
 * @param {() => number} [options.getCurrentKey]
 * @param {() => unknown[]} [options.getCurrentVoicingPlan]
 * @param {() => number} [options.getBeatsPerChord]
 * @param {() => string} [options.getCompingStyle]
 * @param {() => number} [options.getTempoBpm]
 * @param {() => boolean} [options.isWalkingBassEnabled]
 * @param {() => number} [options.getSwingRatio]
 * @param {() => DrillPlaybackBassPlan | null} [options.getCurrentBassPlan]
 * @param {(value: DrillPlaybackBassPlan) => void} [options.setCurrentBassPlan]
 * @param {() => DrillPlaybackResourceChord[]} [options.getNextPaddedChordsForBass]
 * @param {() => number | null} [options.getNextKeyForBass]
 * @param {DrillPlaybackResourcesCompingEngine} [options.compingEngine]
 * @param {DrillPlaybackResourcesWalkingBassGenerator | null} [options.walkingBassGenerator]
 */
export function createDrillPlaybackPreparationRuntime({
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
}: DrillPlaybackPreparationRuntimeOptions = {}) {
  function getNextDifferentChord(chords: DrillPlaybackResourceChord[], startIdx: number) {
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

  function getVoicingAtIndex(chords: DrillPlaybackResourceChord[], key: number, chordIdx: number, isMinor: boolean) {
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


