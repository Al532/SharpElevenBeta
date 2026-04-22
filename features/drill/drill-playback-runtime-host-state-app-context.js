// @ts-check

/**
 * Groups the app-owned playback runtime host concerns into the live state
 * shape consumed by `createDrillPlaybackRuntimeHostAppContext`, so `app.js`
 * no longer carries that large scheduler/transport contract inline.
 *
 * @param {object} [options]
 * @param {Record<string, any>} [options.runtimeState]
 * @param {Record<string, any>} [options.audioState]
 * @param {Record<string, any>} [options.preloadState]
 * @param {Record<string, any>} [options.playbackConstants]
 * @param {Record<string, any>} [options.runtimeHelpers]
 * @returns {{
 *   runtimeState: Record<string, any>,
 *   audioState: Record<string, any>,
 *   preloadState: Record<string, any>,
 *   playbackConstants: Record<string, any>,
 *   runtimeHelpers: Record<string, any>
 * }}
 */
export function createDrillPlaybackRuntimeHostStateAppContext({
  runtimeState = {},
  audioState = {},
  preloadState = {},
  playbackConstants = {},
  runtimeHelpers = {}
} = {}) {
  return {
    runtimeState,
    audioState,
    preloadState,
    playbackConstants,
    runtimeHelpers
  };
}
