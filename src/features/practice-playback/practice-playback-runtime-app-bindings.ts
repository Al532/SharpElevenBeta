// @ts-check

/**
 * Groups the app-level bindings passed into the Practice playback runtime host
 * assembly before the shared host-binding normalization layer.
 *
 * @param {object} [options]
 * @returns {Record<string, unknown>}
 */
export function createPracticePlaybackRuntimeAppBindings(options = {}) {
  return { ...options };
}
