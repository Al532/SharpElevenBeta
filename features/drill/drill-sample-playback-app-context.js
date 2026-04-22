// @ts-check

import { createDrillSamplePlaybackRuntime } from './drill-sample-playback-runtime.js';

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
} = {}) {
  return createDrillSamplePlaybackRuntime({
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
  });
}
