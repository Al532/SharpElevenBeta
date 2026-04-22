// @ts-check

/** @typedef {import('../types/contracts').EmbeddedPlaybackAssembly} EmbeddedPlaybackAssembly */
/** @typedef {import('../types/contracts').EmbeddedPlaybackRuntimeState} EmbeddedPlaybackRuntimeState */
/** @typedef {import('../types/contracts').PlaybackRuntime} PlaybackRuntime */

import { createEmbeddedPlaybackAssembly } from './embedded-playback-assembly.js';
import { publishEmbeddedPlaybackGlobals } from './embedded-playback-globals.js';
import {
  LEGACY_DRILL_API_READY_EVENT,
  PLAYBACK_API_READY_EVENT
} from './embedded-playback-identifiers.js';

/**
 * Creates and publishes the embedded playback surface in one place.
 * This centralizes the legacy API/global publication used by the embedded
 * host while keeping the shared playback runtime boundary explicit.
 *
 * @param {{
 *   targetWindow?: Window | null,
 *   readyEventName?: string,
 *   legacyReadyEventName?: string | null,
 *   playbackRuntime: PlaybackRuntime,
 *   applyEmbeddedPattern?: (payload: import('../types/contracts').EmbeddedPatternPayload) => import('../types/contracts').PlaybackOperationResult | Promise<import('../types/contracts').PlaybackOperationResult>,
 *   getPlaybackState?: () => EmbeddedPlaybackRuntimeState
 * }} options
 * @returns {EmbeddedPlaybackAssembly}
 */
export function createPublishedEmbeddedPlaybackAssembly({
  targetWindow = window,
  readyEventName = PLAYBACK_API_READY_EVENT,
  legacyReadyEventName = LEGACY_DRILL_API_READY_EVENT,
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
    readyEventName,
    legacyReadyEventName
  });

  return assembly;
}
