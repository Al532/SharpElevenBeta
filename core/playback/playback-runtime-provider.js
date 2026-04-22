// @ts-check

/** @typedef {import('../types/contracts').PlaybackRuntime} PlaybackRuntime */
/** @typedef {import('../types/contracts').PlaybackRuntimeProvider} PlaybackRuntimeProvider */

/**
 * Memoizes creation of a playback runtime behind a provider interface.
 * This gives higher-level assemblies a stable seam for swapping runtime
 * implementations without changing their orchestration.
 *
 * @param {{ createRuntime: () => PlaybackRuntime }} options
 * @returns {PlaybackRuntimeProvider}
 */
export function createPlaybackRuntimeProvider({
  createRuntime
}) {
  if (typeof createRuntime !== 'function') {
    throw new Error('A runtime factory is required.');
  }

  /** @type {PlaybackRuntime | null} */
  let playbackRuntime = null;

  return {
    getRuntime() {
      if (playbackRuntime) return playbackRuntime;
      playbackRuntime = createRuntime();
      return playbackRuntime;
    }
  };
}
