
import { createPlaybackSamplePlaybackRuntime } from './playback-sample-playback-runtime.js';

type PlaybackSamplePlaybackRuntimeOptions = Parameters<typeof createPlaybackSamplePlaybackRuntime>[0];
type SamplePlaybackAudioState = Pick<NonNullable<PlaybackSamplePlaybackRuntimeOptions>, 'getAudioContext' | 'sampleBuffers'>;
type SamplePlaybackAudioHelpers = Pick<NonNullable<PlaybackSamplePlaybackRuntimeOptions>, 'getMixerDestination' | 'trackScheduledSource' | 'loadSample' | 'getPianoFadeProfile'>;
type SamplePlaybackState = Pick<NonNullable<PlaybackSamplePlaybackRuntimeOptions>, 'getActiveNoteGain' | 'setActiveNoteGain' | 'setActiveNoteFadeOut'>;
type SamplePlaybackConstants = Pick<NonNullable<PlaybackSamplePlaybackRuntimeOptions>, 'noteFadeout' | 'bassNoteAttack' | 'bassNoteOverlap' | 'bassNoteRelease' | 'bassGainReleaseTimeConstant' | 'chordFadeBefore' | 'chordFadeDuration' | 'bassGain' | 'stringLoopStart' | 'stringLoopEnd' | 'stringLoopCrossfade'>;

type PlaybackSamplePlaybackAppContextOptions = {
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
export function createPlaybackSamplePlaybackAppContext({
  audioState = {},
  audioHelpers = {},
  playbackState = {},
  constants = {}
}: PlaybackSamplePlaybackAppContextOptions = {}) {
  const options: PlaybackSamplePlaybackRuntimeOptions = {
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
  return createPlaybackSamplePlaybackRuntime(options);
}


