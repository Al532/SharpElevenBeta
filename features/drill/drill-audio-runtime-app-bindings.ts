// @ts-check
/** @import { DrillAudioFacadeLike, DrillAudioStackLike } from './drill-audio-types.js' */

/**
 * Groups the app-level bindings passed into the drill audio runtime assembly.
 *
 * @param {{ audioStack?: DrillAudioStackLike, audioFacade?: DrillAudioFacadeLike, getCurrentTime?: () => number, defaultFadeDuration?: number }} [options]
 * @returns {{ audioStack?: DrillAudioStackLike, audioFacade?: DrillAudioFacadeLike, getCurrentTime?: () => number, defaultFadeDuration?: number }}
 */
export function createDrillAudioRuntimeAppBindings(options = {}) {
  return { ...options };
}
