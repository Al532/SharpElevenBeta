// @ts-check

/**
 * Maps the live app-owned playback runtime state/audio/helpers into the
 * grouped app-context shape consumed by the playback runtime host assembly.
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
 *   runtimeState: Record<string, any>,
 *   audioState: Record<string, any>,
 *   preloadState: Record<string, any>,
 *   playbackConstants: Record<string, any>,
 *   runtimeHelpers: Record<string, any>
 * }}
 */
export function createDrillPlaybackRuntimeHostAppContext({
  dom = {},
  runtimeState = {},
  audioState = {},
  preloadState = {},
  playbackConstants = {},
  runtimeHelpers = {}
} = {}) {
  return {
    dom,
    runtimeState,
    audioState,
    preloadState,
    playbackConstants,
    runtimeHelpers
  };
}
