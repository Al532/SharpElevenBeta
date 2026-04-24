// @ts-nocheck

/**
 * @param {object} [options]
 * @param {(chord: any, isMinor: boolean, nextChord?: any | null) => string} [options.getPlayedChordQuality]
 * @param {(chords: any[], key: number, isMinor: boolean) => any[] | null | undefined} [options.getVoicingPlanForProgression]
 * @param {(key: number, chord: any, isMinor: boolean, nextChord?: any | null) => any} [options.getVoicing]
 * @param {() => number | null} [options.getNextKeyValue]
 * @param {() => any[] | null} [options.getNextPaddedChords]
 * @param {() => any[] | null} [options.getNextVoicingPlan]
 * @param {() => unknown} [options.getNextCompingPlan]
 * @param {() => boolean} [options.getIsMinorMode]
 * @param {(value: unknown) => void} [options.setCurrentCompingPlan]
 * @param {(value: unknown) => void} [options.setNextCompingPlan]
 * @param {() => any[]} [options.getPaddedChords]
 * @param {() => number} [options.getCurrentKey]
 * @param {() => any[]} [options.getCurrentVoicingPlan]
 * @param {() => number} [options.getBeatsPerChord]
 * @param {() => string} [options.getCompingStyle]
 * @param {() => number} [options.getTempoBpm]
 * @param {() => boolean} [options.isWalkingBassEnabled]
 * @param {() => number} [options.getSwingRatio]
 * @param {() => any[] | null} [options.getCurrentBassPlan]
 * @param {(value: any[]) => void} [options.setCurrentBassPlan]
 * @param {() => any[]} [options.getNextPaddedChordsForBass]
 * @param {() => number | null} [options.getNextKeyForBass]
 * @param {any} [options.compingEngine]
 * @param {any} [options.walkingBassGenerator]
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
} = {}) {
  function getNextDifferentChord(chords, startIdx) {
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

  function getVoicingAtIndex(chords, key, chordIdx, isMinor) {
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

  function rebuildPreparedCompingPlans(previousKey = getCurrentKey(), currentHasIncomingAnticipation = false, currentPreviousTailBeats = null) {
    const beatsPerChord = getBeatsPerChord();
    const isMinor = getIsMinorMode();
    const { currentPlan, nextPlan } = compingEngine.buildPreparedPlans({
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
    });
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


