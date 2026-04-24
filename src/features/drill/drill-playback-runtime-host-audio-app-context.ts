// @ts-check

/**
 * Groups the live app-owned playback runtime audio concerns into the host app
 * context passed to the playback runtime assembly.
 *
 * @param {Record<string, unknown>} [options]
 * @returns {Record<string, unknown>}
 */
export function createDrillPlaybackRuntimeHostAudioAppContext(options = {}) {
  return { ...options };
}
