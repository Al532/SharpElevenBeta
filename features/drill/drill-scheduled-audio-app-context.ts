// @ts-nocheck

import { createDrillScheduledAudioRuntime } from './drill-scheduled-audio-runtime.js';

/**
 * Creates the scheduled-audio runtime from grouped app concerns so `app.js`
 * does not have to wire comping shutdown and fade defaults inline.
 *
 * @param {object} [options]
 * @param {object} [options.audioState]
 * @param {object} [options.audioHelpers]
 * @param {object} [options.constants]
 */
export function createDrillScheduledAudioAppContext({
  audioState = {},
  audioHelpers = {},
  constants = {}
} = {}) {
  return createDrillScheduledAudioRuntime({
    getAudioContext: audioState.getAudioContext,
    stopActiveComping: audioHelpers.stopActiveComping,
    getDefaultFadeDuration: constants.getDefaultFadeDuration
  });
}


