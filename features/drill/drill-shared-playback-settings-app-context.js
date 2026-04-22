// @ts-check

/**
 * Groups the live shared-playback settings bindings before they are folded
 * into the shared playback state context, so `app.js` no longer carries that
 * playback-settings bridge contract inline.
 *
 * @param {object} [options]
 * @returns {Record<string, any>}
 */
export function createDrillSharedPlaybackSettingsAppContext(options = {}) {
  return { ...options };
}
