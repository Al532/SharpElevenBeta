
import { createDrillSamplePlaybackRuntime } from './drill-sample-playback-runtime.js';

type DrillSamplePlaybackRuntimeOptions = Parameters<typeof createDrillSamplePlaybackRuntime>[0];
type SamplePlaybackAudioState = Pick<NonNullable<DrillSamplePlaybackRuntimeOptions>, 'getAudioContext' | 'sampleBuffers'>;
type SamplePlaybackAudioHelpers = Pick<NonNullable<DrillSamplePlaybackRuntimeOptions>, 'getMixerDestination' | 'trackScheduledSource' | 'loadSample' | 'getPianoFadeProfile'>;
type SamplePlaybackState = Pick<NonNullable<DrillSamplePlaybackRuntimeOptions>, 'getActiveNoteGain' | 'setActiveNoteGain' | 'setActiveNoteFadeOut'>;
type SamplePlaybackConstants = Pick<NonNullable<DrillSamplePlaybackRuntimeOptions>, 'noteFadeout' | 'bassNoteAttack' | 'bassNoteOverlap' | 'bassNoteRelease' | 'bassGainReleaseTimeConstant' | 'chordFadeBefore' | 'chordFadeDuration' | 'bassGain' | 'stringLoopStart' | 'stringLoopEnd' | 'stringLoopCrossfade'>;

type DrillSamplePlaybackAppContextOptions = {
  audioState?: SamplePlaybackAudioState;
  audioHelpers?: SamplePlaybackAudioHelpers;
  playbackState?: SamplePlaybackState;
  constants?: SamplePlaybackConstants;
};

/**
 * Creates the note/sample playback runtime from grouped app concerns so
 * `app.js` can pass a smaller audio boundary.
 *
 * @param {object} [options]
 * @param {object} [options.audioState]
 * @param {object} [options.audioHelpers]
 * @param {object} [options.playbackState]
 * @param {object} [options.constants]
 */
export function createDrillSamplePlaybackAppContext({
  audioState = {},
  audioHelpers = {},
  playbackState = {},
  constants = {}
}: DrillSamplePlaybackAppContextOptions = {}) {
  const options: DrillSamplePlaybackRuntimeOptions = {
    getAudioContext: audioState.getAudioContext,
    sampleBuffers: audioState.sampleBuffers,
    getMixerDestination: audioHelpers.getMixerDestination,
    trackScheduledSource: audioHelpers.trackScheduledSource,
    loadSample: audioHelpers.loadSample,
    getActiveNoteGain: playbackState.getActiveNoteGain,
    setActiveNoteGain: playbackState.setActiveNoteGain,
    setActiveNoteFadeOut: playbackState.setActiveNoteFadeOut,
    getPianoFadeProfile: audioHelpers.getPianoFadeProfile,
    noteFadeout: constants.noteFadeout,
    bassNoteAttack: constants.bassNoteAttack,
    bassNoteOverlap: constants.bassNoteOverlap,
    bassNoteRelease: constants.bassNoteRelease,
    bassGainReleaseTimeConstant: constants.bassGainReleaseTimeConstant,
    chordFadeBefore: constants.chordFadeBefore,
    chordFadeDuration: constants.chordFadeDuration,
    bassGain: constants.bassGain,
    stringLoopStart: constants.stringLoopStart,
    stringLoopEnd: constants.stringLoopEnd,
    stringLoopCrossfade: constants.stringLoopCrossfade
  };
  return createDrillSamplePlaybackRuntime(options);
}


