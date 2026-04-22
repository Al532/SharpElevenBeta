// @ts-check

/**
 * Groups the app-level playback runtime host concerns into the runtime-host
 * assembly shape, so `app.js` stops owning that playback host contract inline.
 *
 * @param {object} [options]
 * @param {Record<string, any>} [options.dom]
 * @param {Record<string, any>} [options.runtimeState]
 * @param {Record<string, any>} [options.audioState]
 * @param {Record<string, any>} [options.preloadState]
 * @param {Record<string, any>} [options.playbackConstants]
 * @param {Record<string, any>} [options.runtimeHelpers]
 * @returns {{
 *   dom: Record<string, any>,
 *   state: Record<string, any>,
 *   audio: Record<string, any>,
 *   preload: Record<string, any>,
 *   constants: Record<string, any>,
 *   helpers: Record<string, any>
 * }}
 */
export function createDrillPlaybackRuntimeAppContextOptions({
  dom = {},
  runtimeState = {},
  audioState = {},
  preloadState = {},
  playbackConstants = {},
  runtimeHelpers = {}
} = {}) {
  return {
    dom,
    state: runtimeState,
    audio: audioState,
    preload: preloadState,
    constants: playbackConstants,
    helpers: runtimeHelpers
  };
}
