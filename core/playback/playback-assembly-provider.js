// @ts-check

/** @typedef {import('../types/contracts').PlaybackAssembly} PlaybackAssembly */
/** @typedef {import('../types/contracts').PlaybackAssemblyProvider} PlaybackAssemblyProvider */

/**
 * Memoizes creation of a playback assembly behind a provider interface.
 * This lets integration layers depend on a stable assembly seam instead of
 * calling concrete factories directly.
 *
 * @param {{ createAssembly: () => PlaybackAssembly }} options
 * @returns {PlaybackAssemblyProvider}
 */
export function createPlaybackAssemblyProvider({
  createAssembly
}) {
  if (typeof createAssembly !== 'function') {
    throw new Error('An assembly factory is required.');
  }

  /** @type {PlaybackAssembly | null} */
  let playbackAssembly = null;

  return {
    getAssembly() {
      if (playbackAssembly) return playbackAssembly;
      playbackAssembly = createAssembly();
      return playbackAssembly;
    }
  };
}
