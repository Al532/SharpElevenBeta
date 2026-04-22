// @ts-check

import { createDrillAudioPlaybackRuntime } from './drill-audio-playback-runtime.js';

/**
 * Creates the audio-playback runtime from grouped app concerns so `app.js`
 * does not need to wire audio state and drum constants inline.
 *
 * @param {object} [options]
 * @param {object} [options.audioState]
 * @param {object} [options.audioHelpers]
 * @param {object} [options.playbackSettings]
 * @param {object} [options.constants]
 */
export function createDrillAudioPlaybackAppContext({
  audioState = {},
  audioHelpers = {},
  playbackSettings = {},
  constants = {}
} = {}) {
  return createDrillAudioPlaybackRuntime({
    getAudioContext: audioState.getAudioContext,
    setAudioContext: audioState.setAudioContext,
    getMixerNodes: audioState.getMixerNodes,
    setMixerNodes: audioState.setMixerNodes,
    createAudioContext: audioHelpers.createAudioContext,
    applyMixerSettings: audioHelpers.applyMixerSettings,
    sampleBuffers: audioState.sampleBuffers,
    trackScheduledSource: audioHelpers.trackScheduledSource,
    metronomeGainMultiplier: constants.metronomeGainMultiplier,
    drumsGainMultiplier: constants.drumsGainMultiplier,
    drumModeOff: constants.drumModeOff,
    drumModeMetronome24: constants.drumModeMetronome24,
    drumModeHihats24: constants.drumModeHihats24,
    drumModeFullSwing: constants.drumModeFullSwing,
    drumRideSampleUrls: constants.drumRideSampleUrls,
    getDrumsMode: playbackSettings.getDrumsMode,
    getSwingRatio: playbackSettings.getSwingRatio
  });
}
