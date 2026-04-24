// @ts-check

/**
 * Groups the live playback-runtime helper bindings before they are folded into
 * the playback host state context, so `app.js` no longer carries the large
 * runtime-helper contract inline.
 *
 * @param {object} [options]
 * @returns {Record<string, unknown>}
 */
export function createDrillPlaybackRuntimeHostHelpersAppContext(options = {}) {
  return { ...options };
}
