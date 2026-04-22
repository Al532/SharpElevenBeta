// @ts-check

/** @typedef {import('../types/contracts').PlaybackBridge} PlaybackBridge */
/** @typedef {import('../types/contracts').PlaybackBridgeProvider} PlaybackBridgeProvider */

/**
 * Memoizes creation of a playback bridge behind a simple provider interface.
 * This gives higher-level consumers a stable seam for swapping bridge
 * implementations without changing controller orchestration code.
 *
 * @param {{ createBridge: () => PlaybackBridge }} options
 * @returns {PlaybackBridgeProvider}
 */
export function createPlaybackBridgeProvider({
  createBridge
}) {
  if (typeof createBridge !== 'function') {
    throw new Error('A bridge factory is required.');
  }

  /** @type {PlaybackBridge | null} */
  let bridge = null;

  return {
    getBridge() {
      if (bridge) return bridge;
      bridge = createBridge();
      return bridge;
    }
  };
}
