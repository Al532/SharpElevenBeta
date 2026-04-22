// @ts-check

/** @typedef {import('../types/contracts').PlaybackRuntime} PlaybackRuntime */
/** @typedef {import('../types/contracts').PlaybackRuntimeBindings} PlaybackRuntimeBindings */

/**
 * Materializes the shared runtime/controller pair in one place.
 * This keeps runtime assembly consistent across chart and drill consumers.
 *
 * @param {{ playbackRuntime: PlaybackRuntime }} options
 * @returns {PlaybackRuntimeBindings}
 */
export function createPlaybackRuntimeBindings({
  playbackRuntime
}) {
  if (!playbackRuntime || typeof playbackRuntime.ensurePlaybackController !== 'function') {
    throw new Error('A playback runtime is required.');
  }

  return {
    playbackRuntime,
    playbackController: playbackRuntime.ensurePlaybackController()
  };
}
