// @ts-check

/** @typedef {import('../types/contracts').PracticePlaybackBridgeProvider} PracticePlaybackBridgeProvider */
/** @typedef {import('../types/contracts').PracticePlaybackControllerOptions} PracticePlaybackControllerOptions */

import { createPracticePlaybackRuntimeProvider } from './practice-playback-runtime-provider.js';
import { createRuntimePlaybackBridgeProvider } from './runtime-playback-bridge-provider.js';

/**
 * Creates a playback bridge provider backed by the in-page practice runtime.
 *
 * @param {PracticePlaybackControllerOptions} [options]
 * @returns {PracticePlaybackBridgeProvider}
 */
export function createPracticePlaybackBridgeProvider(options = {}) {
  return /** @type {PracticePlaybackBridgeProvider} */ (
    createRuntimePlaybackBridgeProvider({
      runtimeProvider: createPracticePlaybackRuntimeProvider(options)
    })
  );
}
