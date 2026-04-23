// @ts-check

/**
 * Groups the app-level bindings passed into the shared playback assembly
 * before the shared playback bindings normalization layer.
 *
 * @param {object} [options]
 * @returns {Record<string, any>}
 */
export function createDrillSharedPlaybackRuntimeAppBindings(options = {}) {
  return { ...options };
}
