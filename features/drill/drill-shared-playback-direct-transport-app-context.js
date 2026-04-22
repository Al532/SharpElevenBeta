// @ts-check

/**
 * Groups the live direct shared-playback transport actions before they are
 * folded into the shared playback state context.
 *
 * @param {object} [options]
 * @returns {Record<string, any>}
 */
export function createDrillSharedPlaybackDirectTransportAppContext(options = {}) {
  return { ...options };
}
