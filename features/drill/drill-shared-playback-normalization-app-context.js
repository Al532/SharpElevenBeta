// @ts-check

/**
 * Groups the live shared-playback normalization helpers before they are folded
 * into the shared playback state context, so `app.js` no longer carries that
 * host/runtime normalization contract inline.
 *
 * @param {object} [options]
 * @returns {Record<string, any>}
 */
export function createDrillSharedPlaybackNormalizationAppContext(options = {}) {
  return { ...options };
}
