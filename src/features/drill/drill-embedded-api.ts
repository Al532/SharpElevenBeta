import type {
  EmbeddedPatternPayload,
  EmbeddedPlaybackApi,
  EmbeddedPlaybackRuntimeState,
  PlaybackOperationResult,
  PlaybackRuntime,
  PlaybackSessionController
} from '../../core/types/contracts';

import { createEmbeddedPlaybackApi as createCoreEmbeddedPlaybackApi } from '../../core/playback/embedded-playback-api.js';

export function createEmbeddedPlaybackApi({
  playbackRuntime,
  playbackController,
  applyEmbeddedPattern,
  getPlaybackState
}: {
  playbackRuntime?: PlaybackRuntime;
  playbackController?: PlaybackSessionController;
  applyEmbeddedPattern?: (
    payload: EmbeddedPatternPayload
  ) => PlaybackOperationResult | Promise<PlaybackOperationResult>;
  getPlaybackState?: () => EmbeddedPlaybackRuntimeState;
} = {}): EmbeddedPlaybackApi {
  return createCoreEmbeddedPlaybackApi({
    playbackRuntime,
    playbackController,
    applyEmbeddedPattern,
    getPlaybackState
  });
}
