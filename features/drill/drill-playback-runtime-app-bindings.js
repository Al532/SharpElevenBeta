// @ts-check

/**
 * Groups the app-level bindings consumed by the drill playback runtime host
 * assembly before the shared host-binding normalization layer.
 *
 * @param {object} [options]
 * @returns {Record<string, any>}
 */
export function createDrillPlaybackRuntimeAppBindings(options = {}) {
  return { ...options };
}
