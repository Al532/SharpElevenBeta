// @ts-check

/**
 * Groups the live embedded shared-playback runtime bindings before they are
 * folded into the shared playback state context.
 *
 * @param {object} [options]
 * @returns {Record<string, any>}
 */
export function createDrillSharedPlaybackEmbeddedRuntimeAppContext(options = {}) {
  return { ...options };
}
