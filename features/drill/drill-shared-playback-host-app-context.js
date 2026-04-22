// @ts-check

/**
 * Groups the live host-facing shared-playback bindings before they are folded
 * into the embedded/direct shared-playback state context, so `app.js` no
 * longer carries that large host contract inline.
 *
 * @param {object} [options]
 * @returns {Record<string, any>}
 */
export function createDrillSharedPlaybackHostAppContext(options = {}) {
  return { ...options };
}
