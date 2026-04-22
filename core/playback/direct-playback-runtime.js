// @ts-check

/** @typedef {import('../types/contracts').DirectPlaybackControllerOptions} DirectPlaybackControllerOptions */
/** @typedef {import('../types/contracts').PlaybackRuntime} PlaybackRuntime */

import { createDirectPlaybackSessionAdapter } from './direct-playback-session-adapter.js';
import { createPlaybackRuntime } from './playback-runtime.js';

/**
 * Creates the direct in-page playback runtime used by chart playback when it
 * no longer needs the hidden iframe bridge.
 *
 * This runtime now has its own session-adapter boundary so the future direct
 * chart backend can load a `PracticeSessionSpec` without pretending to be the
 * legacy embedded pattern API first. Existing consumers still work through the
 * fallback Drill adapter until direct session hooks are wired in.
 *
 * @param {DirectPlaybackControllerOptions & {
 *   loadDirectSession?: (sessionSpec: import('../types/contracts').PracticeSessionSpec | null, playbackSettings: import('../types/contracts').PlaybackSettings) => Promise<import('../types/contracts').PlaybackOperationResult | undefined> | import('../types/contracts').PlaybackOperationResult | undefined,
 *   updateDirectPlaybackSettings?: (playbackSettings: import('../types/contracts').PlaybackSettings, sessionSpec: import('../types/contracts').PracticeSessionSpec | null) => Promise<import('../types/contracts').PlaybackOperationResult | undefined> | import('../types/contracts').PlaybackOperationResult | undefined,
 *   getDirectPlaybackState?: () => Partial<import('../types/contracts').PlaybackRuntimeState> | null | undefined,
 *   applyEmbeddedPattern?: (payload: import('../types/contracts').EmbeddedPatternPayload) => import('../types/contracts').PlaybackOperationResult,
 *   applyEmbeddedPlaybackSettings?: (settings: import('../types/contracts').PlaybackSettings) => unknown,
 *   getEmbeddedPlaybackState?: () => Partial<import('../types/contracts').PlaybackRuntimeState>
 * }} [options]
 * @returns {PlaybackRuntime}
 */
export function createDirectPlaybackRuntime(options = {}) {
  return createPlaybackRuntime({
    adapter: createDirectPlaybackSessionAdapter(options)
  });
}
