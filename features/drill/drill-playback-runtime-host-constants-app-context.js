// @ts-check

/**
 * Groups the live app-owned playback runtime constant bindings into the host app
 * context passed to the playback runtime assembly.
 *
 * @param {Record<string, any>} [options]
 * @returns {Record<string, any>}
 */
export function createDrillPlaybackRuntimeHostConstantsAppContext(options = {}) {
  return { ...options };
}
