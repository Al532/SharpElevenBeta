// @ts-check

/** @typedef {import('../types/contracts').PlaybackRuntime} PlaybackRuntime */
/** @typedef {import('../types/contracts').PlaybackSessionAdapter} PlaybackSessionAdapter */
/** @typedef {import('../types/contracts').PlaybackSessionController} PlaybackSessionController */

import { createPlaybackSessionController } from './playback-session-controller.js';

/**
 * Creates a shared playback runtime around a session adapter.
 * This is the stable runtime boundary that higher-level consumers should target.
 *
 * @param {{
 *   adapter: PlaybackSessionAdapter,
 *   ensureReady?: () => Promise<unknown>
 * }} options
 * @returns {PlaybackRuntime}
 */
export function createPlaybackRuntime({
  adapter,
  ensureReady = async () => {}
}) {
  /** @type {PlaybackSessionController | null} */
  let playbackController = null;

  /** @returns {PlaybackSessionController} */
  function ensurePlaybackController() {
    if (playbackController) return playbackController;
    playbackController = createPlaybackSessionController({ adapter });
    return playbackController;
  }

  return {
    ensureReady,
    ensurePlaybackController,
    getRuntimeState() {
      return ensurePlaybackController().getState().runtime || null;
    }
  };
}
