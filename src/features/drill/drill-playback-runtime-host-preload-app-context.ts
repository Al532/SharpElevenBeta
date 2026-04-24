// @ts-check

/**
 * Groups the live app-owned playback runtime preload bindings into the host app
 * context passed to the playback runtime assembly.
 *
 * @param {Record<string, unknown>} [options]
 * @returns {Record<string, unknown>}
 */
export function createDrillPlaybackRuntimeHostPreloadAppContext(options = {}) {
  return { ...options };
}
