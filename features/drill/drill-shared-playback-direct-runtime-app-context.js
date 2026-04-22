// @ts-check

/**
 * Groups the live direct shared-playback runtime bindings before they are
 * folded into the shared playback state context.
 *
 * @param {object} [options]
 * @returns {Record<string, any>}
 */
export function createDrillSharedPlaybackDirectRuntimeAppContext(options = {}) {
  return { ...options };
}
