import type {
  EmbeddedPatternPayload,
  EmbeddedPlaybackApi,
  EmbeddedPlaybackRuntimeState,
  PlaybackOperationResult,
  PlaybackRuntime,
  PlaybackSessionController,
  PublishedEmbeddedPlaybackAssemblyProvider
} from '../../core/types/contracts';

import { bootstrapEmbeddedPlaybackApi } from '../../core/playback/embedded-playback-bootstrap.js';

export function bootstrapEmbeddedPlaybackBridge({
  playbackRuntime,
  playbackController,
  applyEmbeddedPattern,
  queuePerformanceCue,
  getPlaybackState,
  publishedPlaybackAssemblyProvider
}: {
  playbackRuntime?: PlaybackRuntime;
  playbackController?: PlaybackSessionController;
  applyEmbeddedPattern?: (payload: EmbeddedPatternPayload) => PlaybackOperationResult;
  queuePerformanceCue?: (cue: any) => PlaybackOperationResult;
  getPlaybackState?: () => EmbeddedPlaybackRuntimeState;
  publishedPlaybackAssemblyProvider?: PublishedEmbeddedPlaybackAssemblyProvider | null;
} = {}): EmbeddedPlaybackApi {
  return bootstrapEmbeddedPlaybackApi({
    playbackRuntime,
    playbackController,
    applyEmbeddedPattern,
    queuePerformanceCue,
    getPlaybackState,
    publishedPlaybackAssemblyProvider
  });
}
