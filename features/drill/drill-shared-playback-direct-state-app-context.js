// @ts-check

/**
 * Groups the live app-level shared playback direct-state bindings into the context
 * object consumed by the shared playback state assembly.
 *
 * @param {Record<string, any>} [options]
 * @returns {Record<string, any>}
 */
export function createDrillSharedPlaybackDirectStateAppContext(options = {}) {
  return { ...options };
}
