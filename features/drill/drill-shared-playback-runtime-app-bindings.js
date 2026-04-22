// @ts-check

/**
 * Groups the app-level bindings consumed by the shared playback assembly before
 * the shared playback bindings normalization layer.
 *
 * @param {object} [options]
 * @returns {Record<string, any>}
 */
export function createDrillSharedPlaybackRuntimeAppBindings(options = {}) {
  return { ...options };
}
