
import { createDrillSamplePreloadRuntime } from './drill-sample-preload-runtime.js';

type DrillSamplePreloadRuntimeOptions = Parameters<typeof createDrillSamplePreloadRuntime>[0];
type SamplePreloadPlaybackSettings = Pick<NonNullable<DrillSamplePreloadRuntimeOptions>, 'getBassPreloadRange' | 'getBassMidi' | 'getBeatsPerChord' | 'getChordsPerBar' | 'getCompingStyle' | 'getDrumsMode'>;
type SamplePreloadProgressionState = {
  getCurrentChords?: () => unknown[];
  getCurrentKey?: () => number | null;
  getCurrentVoicingPlan?: () => unknown[];
  getCurrentBassPlan?: () => unknown[];
  getNextChords?: () => unknown[];
  getNextKey?: () => number | null;
  getNextVoicingPlan?: () => unknown[];
  getNextBassPlan?: () => unknown[];
};
type SamplePreloadLoading = Pick<NonNullable<DrillSamplePreloadRuntimeOptions>, 'collectCompingSampleNotes' | 'loadSample' | 'loadPianoSampleList' | 'loadFileSample' | 'fetchArrayBufferFromUrl'>;
type SamplePreloadConstants = Pick<NonNullable<DrillSamplePreloadRuntimeOptions>, 'drumHihatSampleUrl' | 'drumRideSampleUrls' | 'drumModeHihats24' | 'drumModeFullSwing' | 'safePreloadMeasures'>;

type DrillSamplePreloadAppContextOptions = {
  playbackSettings?: SamplePreloadPlaybackSettings;
  progressionState?: SamplePreloadProgressionState;
  sampleLoading?: SamplePreloadLoading;
  constants?: SamplePreloadConstants;
};

/**
 * Creates the sample-preload runtime from grouped app concerns so `app.js`
 * does not need to assemble progression snapshots inline.
 *
 * @param {object} [options]
 * @param {object} [options.playbackSettings]
 * @param {object} [options.progressionState]
 * @param {object} [options.sampleLoading]
 * @param {object} [options.constants]
 */
export function createDrillSamplePreloadAppContext({
  playbackSettings = {},
  progressionState = {},
  sampleLoading = {},
  constants = {}
}: DrillSamplePreloadAppContextOptions = {}) {
  const options: DrillSamplePreloadRuntimeOptions = {
    getBassPreloadRange: playbackSettings.getBassPreloadRange,
    getBassMidi: playbackSettings.getBassMidi,
    getBeatsPerChord: playbackSettings.getBeatsPerChord,
    getChordsPerBar: playbackSettings.getChordsPerBar,
    getCompingStyle: playbackSettings.getCompingStyle,
    getDrumsMode: playbackSettings.getDrumsMode,
    getCurrentProgression: () => ({
      chords: progressionState.getCurrentChords?.(),
      key: progressionState.getCurrentKey?.(),
      voicingPlan: progressionState.getCurrentVoicingPlan?.(),
      bassPlan: progressionState.getCurrentBassPlan?.()
    }),
    getNextProgression: () => ({
      chords: progressionState.getNextChords?.(),
      key: progressionState.getNextKey?.(),
      voicingPlan: progressionState.getNextVoicingPlan?.(),
      bassPlan: progressionState.getNextBassPlan?.()
    }),
    collectCompingSampleNotes: sampleLoading.collectCompingSampleNotes,
    loadSample: sampleLoading.loadSample,
    loadPianoSampleList: sampleLoading.loadPianoSampleList,
    loadFileSample: sampleLoading.loadFileSample,
    fetchArrayBufferFromUrl: sampleLoading.fetchArrayBufferFromUrl,
    drumHihatSampleUrl: constants.drumHihatSampleUrl,
    drumRideSampleUrls: constants.drumRideSampleUrls,
    drumModeHihats24: constants.drumModeHihats24,
    drumModeFullSwing: constants.drumModeFullSwing,
    safePreloadMeasures: constants.safePreloadMeasures
  };
  return createDrillSamplePreloadRuntime(options);
}


