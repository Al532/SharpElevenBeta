// @ts-check
/** @import { PlaybackAudioFacadeLike, PlaybackAudioStackLike } from './playback-audio-types.js' */

/**
 * Groups the app-level bindings passed into the drill audio runtime assembly.
 *
 * @param {{ audioStack?: PlaybackAudioStackLike, audioFacade?: PlaybackAudioFacadeLike, getCurrentTime?: () => number, defaultFadeDuration?: number }} [options]
 * @returns {{ audioStack?: PlaybackAudioStackLike, audioFacade?: PlaybackAudioFacadeLike, getCurrentTime?: () => number, defaultFadeDuration?: number }}
 */
export function createPlaybackAudioRuntimeAppBindings(options = {}) {
  return { ...options };
}
