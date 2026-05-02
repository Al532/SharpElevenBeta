// @ts-check

/** @import { PlaybackAudioStackLike } from './playback-audio-types.js' */

/**
 * Groups the app-level bindings passed into the shared playback audio stack
 * assembly while live runtime state remains in `app.js`.
 *
 * @param {object} [options]
 * @param {PlaybackAudioStackLike} [options]
 * @returns {PlaybackAudioStackLike}
 */
export function createPlaybackAudioStackAppBindings({
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
