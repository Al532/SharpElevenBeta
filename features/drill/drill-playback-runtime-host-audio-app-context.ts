// @ts-check

/**
 * Groups the live app-owned playback runtime audio concerns into the host app
 * context passed to the playback runtime assembly.
 *
 * @param {Record<string, any>} [options]
 * @returns {Record<string, any>}
 */
export function createDrillPlaybackRuntimeHostAudioAppContext(options = {}) {
  return { ...options };
}
