// @ts-check

/** @typedef {import('../types/contracts').PlaybackAssemblyProvider} PlaybackAssemblyProvider */
/** @typedef {import('../types/contracts').PublishedEmbeddedPlaybackAssemblyProvider} PublishedEmbeddedPlaybackAssemblyProvider */
/** @typedef {import('../types/contracts').PlaybackRuntime} PlaybackRuntime */

import { createPlaybackAssemblyProvider } from './playback-assembly-provider.js';
import { createPublishedEmbeddedPlaybackAssembly } from './published-embedded-playback-assembly.js';

/**
 * Memoizes creation and publication of the embedded playback assembly.
 * This keeps the legacy global publication behind a provider seam so feature
 * modules do not need to orchestrate embedded API publication directly.
 *
 * @param {{
 *   targetWindow?: Window | null,
 *   readyEventName?: string,
 *   legacyReadyEventName?: string | null,
 *   playbackAssemblyProvider?: PlaybackAssemblyProvider | null,
 *   createPlaybackAssembly?: () => {
 *     playbackRuntime: PlaybackRuntime,
 *     applyEmbeddedPattern?: (payload: import('../types/contracts').EmbeddedPatternPayload) => import('../types/contracts').PlaybackOperationResult | Promise<import('../types/contracts').PlaybackOperationResult>,
 *     getPlaybackState?: () => import('../types/contracts').EmbeddedPlaybackRuntimeState
 *   }
 * }} options
 * @returns {PublishedEmbeddedPlaybackAssemblyProvider}
 */
export function createPublishedEmbeddedPlaybackAssemblyProvider({
  targetWindow,
  readyEventName,
  legacyReadyEventName,
  playbackAssemblyProvider,
  createPlaybackAssembly
}) {
  return /** @type {PublishedEmbeddedPlaybackAssemblyProvider} */ (
    createPlaybackAssemblyProvider({
      createAssembly() {
        const assembly = /** @type {{
          playbackRuntime: PlaybackRuntime,
          applyEmbeddedPattern?: (payload: import('../types/contracts').EmbeddedPatternPayload) => import('../types/contracts').PlaybackOperationResult | Promise<import('../types/contracts').PlaybackOperationResult>,
          getPlaybackState?: () => import('../types/contracts').EmbeddedPlaybackRuntimeState
        } | null | undefined} */ (
          playbackAssemblyProvider?.getAssembly?.() || createPlaybackAssembly?.()
        );
        if (!assembly?.playbackRuntime) {
          throw new Error('A playback assembly or runtime factory is required.');
        }

        return createPublishedEmbeddedPlaybackAssembly({
          targetWindow,
          readyEventName,
          legacyReadyEventName,
          playbackRuntime: assembly.playbackRuntime,
          applyEmbeddedPattern: assembly.applyEmbeddedPattern,
          getPlaybackState: assembly.getPlaybackState
        });
      }
    })
  );
}
