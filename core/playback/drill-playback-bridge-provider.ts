// @ts-check

/** @typedef {import('../types/contracts').DrillPlaybackBridgeProvider} DrillPlaybackBridgeProvider */
/** @typedef {import('../types/contracts').DrillPlaybackControllerOptions} DrillPlaybackControllerOptions */

import { createDrillPlaybackRuntimeProvider } from './drill-playback-runtime-provider.js';
import { createRuntimePlaybackBridgeProvider } from './runtime-playback-bridge-provider.js';

/**
 * Creates a direct playback bridge provider backed by the in-page runtime.
 * This is the non-iframe replacement path for chart playback once both modes
 * can share the same runtime backend directly.
 *
 * @param {DrillPlaybackControllerOptions} [options]
 * @returns {DrillPlaybackBridgeProvider}
 */
export function createDrillPlaybackBridgeProvider(options = {}) {
  return /** @type {DrillPlaybackBridgeProvider} */ (
    createRuntimePlaybackBridgeProvider({
      runtimeProvider: createDrillPlaybackRuntimeProvider(options)
    })
  );
}
