import type {
  EmbeddedPatternPayload,
  EmbeddedPlaybackApi,
  EmbeddedPlaybackRuntimeState,
  PlaybackOperationResult,
  PlaybackRuntime,
  PlaybackSessionController
} from '../../core/types/contracts';

import { createEmbeddedPlaybackApi } from '../../core/playback/embedded-playback-api.js';

export function createEmbeddedDrillApi({
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
  return createEmbeddedPlaybackApi({
    playbackRuntime,
    playbackController,
    applyEmbeddedPattern,
    getPlaybackState
  });
}

export const createEmbeddedPlaybackApiBridge = createEmbeddedDrillApi;
