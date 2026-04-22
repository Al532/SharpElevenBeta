// @ts-check

/** @typedef {import('../types/contracts').EmbeddedPlaybackAssembly} EmbeddedPlaybackAssembly */
/** @typedef {import('../types/contracts').EmbeddedPlaybackRuntimeState} EmbeddedPlaybackRuntimeState */
/** @typedef {import('../types/contracts').PlaybackRuntime} PlaybackRuntime */

import { createEmbeddedPlaybackAssembly } from './embedded-playback-assembly.js';
import { publishEmbeddedPlaybackGlobals } from './embedded-playback-globals.js';

/**
 * Creates and publishes the embedded playback surface in one place.
 * This centralizes the legacy API/global publication used by the embedded Drill
 * host while keeping the shared playback runtime boundary explicit.
 *
 * @param {{
 *   targetWindow?: Window | null,
 *   readyEventName?: string,
 *   playbackRuntime: PlaybackRuntime,
 *   applyEmbeddedPattern?: (payload: import('../types/contracts').EmbeddedPatternPayload) => import('../types/contracts').PlaybackOperationResult | Promise<import('../types/contracts').PlaybackOperationResult>,
 *   getPlaybackState?: () => EmbeddedPlaybackRuntimeState
 * }} options
 * @returns {EmbeddedPlaybackAssembly}
 */
export function createPublishedEmbeddedPlaybackAssembly({
  targetWindow = window,
  readyEventName = 'jpt-drill-api-ready',
  playbackRuntime,
  applyEmbeddedPattern,
  getPlaybackState
}) {
  const assembly = createEmbeddedPlaybackAssembly({
    playbackRuntime,
    applyEmbeddedPattern,
    getPlaybackState
  });

  publishEmbeddedPlaybackGlobals({
    targetWindow,
    embeddedApi: assembly.embeddedApi,
    playbackRuntime: assembly.playbackRuntime,
    playbackController: assembly.playbackController,
    readyEventName
  });

  return assembly;
}
