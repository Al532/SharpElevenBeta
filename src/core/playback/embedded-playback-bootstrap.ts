

import { createPublishedEmbeddedPlaybackAssemblyProvider } from './published-embedded-playback-assembly-provider.js';
import type {
  EmbeddedPatternPayload,
  EmbeddedPlaybackApi,
  EmbeddedPlaybackRuntimeState,
  PlaybackOperationResult,
  PlaybackRuntime,
  PlaybackSessionController,
  PublishedEmbeddedPlaybackAssemblyProvider
} from '../types/contracts';

type BootstrapEmbeddedPlaybackApiOptions = {
  playbackRuntime?: PlaybackRuntime,
  playbackController?: PlaybackSessionController,
  applyEmbeddedPattern?: (payload: EmbeddedPatternPayload) => PlaybackOperationResult | Promise<PlaybackOperationResult>,
  getPlaybackState?: () => EmbeddedPlaybackRuntimeState,
  publishedPlaybackAssemblyProvider?: PublishedEmbeddedPlaybackAssemblyProvider | null
};

/**
 * Publishes the embedded playback API surface from either an existing runtime,
 * an existing controller, or a caller-supplied published assembly provider.
 * This keeps the legacy global publication pipeline in `core/playback`.
 *
 * @param {BootstrapEmbeddedPlaybackApiOptions} [options]
 * @returns {EmbeddedPlaybackApi}
 */
export function bootstrapEmbeddedPlaybackApi({
  playbackRuntime,
  playbackController,
  applyEmbeddedPattern,
  getPlaybackState,
  publishedPlaybackAssemblyProvider
}: BootstrapEmbeddedPlaybackApiOptions = {}) {
  if (publishedPlaybackAssemblyProvider) {
    return publishedPlaybackAssemblyProvider.getAssembly().embeddedApi;
  }

  const resolvedPlaybackRuntime = playbackRuntime || (playbackController
    ? {
        ensureReady: async () => undefined,
        ensurePlaybackController: () => playbackController,
        getRuntimeState: () => playbackController.getState().runtime
      }
    : null);

  if (!resolvedPlaybackRuntime) {
    throw new Error('A playback runtime or controller is required.');
  }

  return (publishedPlaybackAssemblyProvider
    || createPublishedEmbeddedPlaybackAssemblyProvider({
      createPlaybackAssembly() {
        return {
          playbackRuntime: resolvedPlaybackRuntime,
          playbackController: resolvedPlaybackRuntime.ensurePlaybackController(),
          applyEmbeddedPattern,
          getPlaybackState
        };
      }
    })
  ).getAssembly().embeddedApi;
}


