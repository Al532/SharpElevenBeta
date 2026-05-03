
import { createPracticePlaybackPreparationRuntime } from './practice-playback-preparation-runtime.js';
import type {
  PracticePlaybackResourcesHarmonyBindings,
  PracticePlaybackResourcesProgressionStateBindings,
  PracticePlaybackResourcesRuntimeBindings,
  PracticePlaybackResourcesSettingsBindings
} from './practice-playback-resources-types.js';

type CreatePracticePlaybackPreparationAppContextOptions = {
  harmony?: PracticePlaybackResourcesHarmonyBindings;
  progressionState?: PracticePlaybackResourcesProgressionStateBindings;
  playbackSettings?: PracticePlaybackResourcesSettingsBindings;
  runtime?: PracticePlaybackResourcesRuntimeBindings;
};

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
export function createPracticePlaybackPreparationAppContext({
  harmony = {},
  progressionState = {},
  playbackSettings = {},
  runtime = {}
}: CreatePracticePlaybackPreparationAppContextOptions = {}) {
  return createPracticePlaybackPreparationRuntime({
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
    getChordsPerBar: playbackSettings.getChordsPerBar,
    getCompingStyle: playbackSettings.getCompingStyle,
    getTempoBpm: playbackSettings.getTempoBpm,
    isWalkingBassEnabled: playbackSettings.isWalkingBassEnabled,
    getPlaybackFeelMode: playbackSettings.getPlaybackFeelMode,
    getSwingRatio: playbackSettings.getSwingRatio,
    getPlaybackEndingCue: playbackSettings.getPlaybackEndingCue,
    getCurrentBassPlan: progressionState.getCurrentBassPlan,
    setCurrentBassPlan: progressionState.setCurrentBassPlan,
    getNextPaddedChordsForBass: progressionState.getNextPaddedChordsForBass,
    getNextKeyForBass: progressionState.getNextKeyForBass,
    compingEngine: runtime.compingEngine,
    walkingBassGenerator: runtime.walkingBassGenerator
  });
}


