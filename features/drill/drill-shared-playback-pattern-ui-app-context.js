// @ts-check

/**
 * Groups the live shared-playback pattern UI bindings before they are folded
 * into the shared playback state context, so `app.js` no longer carries that
 * UI/runtime bridge contract inline.
 *
 * @param {object} [options]
 * @returns {Record<string, any>}
 */
export function createDrillSharedPlaybackPatternUiAppContext(options = {}) {
  return { ...options };
}
