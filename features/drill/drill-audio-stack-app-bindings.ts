// @ts-check

/** @import { DrillAudioStackLike } from './drill-audio-types.js' */

/**
 * Groups the app-level bindings passed into the shared drill audio stack
 * assembly while live runtime state remains in `app.js`.
 *
 * @param {object} [options]
 * @param {DrillAudioStackLike} [options]
 * @returns {DrillAudioStackLike}
 */
export function createDrillAudioStackAppBindings({
  audioRuntime = {},
  samplePreload = {},
  scheduledAudio = {},
  audioPlayback = {},
  samplePlayback = {}
} = {}) {
  return {
    audioRuntime,
    samplePreload,
    scheduledAudio,
    audioPlayback,
    samplePlayback
  };
}
