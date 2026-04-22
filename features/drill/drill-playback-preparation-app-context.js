// @ts-check

import { createDrillPlaybackPreparationRuntime } from './drill-playback-preparation-runtime.js';

/**
 * Creates the comping/bass preparation runtime from grouped app concerns so
 * `app.js` can pass a smaller, more durable boundary.
 *
 * @param {object} [options]
 * @param {object} [options.harmony]
 * @param {object} [options.progressionState]
 * @param {object} [options.playbackSettings]
 * @param {object} [options.runtime]
 */
export function createDrillPlaybackPreparationAppContext({
  harmony = {},
  progressionState = {},
  playbackSettings = {},
  runtime = {}
} = {}) {
  return createDrillPlaybackPreparationRuntime({
    getPlayedChordQuality: harmony.getPlayedChordQuality,
    getVoicingPlanForProgression: harmony.getVoicingPlanForProgression,
    getVoicing: harmony.getVoicing,
    getNextKeyValue: progressionState.getNextKeyValue,
    getNextPaddedChords: progressionState.getNextPaddedChords,
    getNextVoicingPlan: progressionState.getNextVoicingPlan,
    getNextCompingPlan: progressionState.getNextCompingPlan,
    getIsMinorMode: playbackSettings.getIsMinorMode,
    setCurrentCompingPlan: progressionState.setCurrentCompingPlan,
    setNextCompingPlan: progressionState.setNextCompingPlan,
    getPaddedChords: progressionState.getPaddedChords,
    getCurrentKey: progressionState.getCurrentKey,
    getCurrentVoicingPlan: progressionState.getCurrentVoicingPlan,
    getBeatsPerChord: playbackSettings.getBeatsPerChord,
    getCompingStyle: playbackSettings.getCompingStyle,
    getTempoBpm: playbackSettings.getTempoBpm,
    isWalkingBassEnabled: playbackSettings.isWalkingBassEnabled,
    getSwingRatio: playbackSettings.getSwingRatio,
    getCurrentBassPlan: progressionState.getCurrentBassPlan,
    setCurrentBassPlan: progressionState.setCurrentBassPlan,
    getNextPaddedChordsForBass: progressionState.getNextPaddedChordsForBass,
    getNextKeyForBass: progressionState.getNextKeyForBass,
    compingEngine: runtime.compingEngine,
    walkingBassGenerator: runtime.walkingBassGenerator
  });
}
