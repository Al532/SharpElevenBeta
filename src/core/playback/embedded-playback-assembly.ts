import type {
  EmbeddedPatternPayload,
  EmbeddedPlaybackApi,
  EmbeddedPlaybackAssembly,
  EmbeddedPlaybackRuntimeState,
  PlaybackOperationResult,
  PlaybackRuntime,
  ChartPerformanceCue
} from '../types/contracts';

import { createEmbeddedPlaybackApi } from './embedded-playback-api.js';
import { createPlaybackAssembly } from './playback-assembly.js';

export function createEmbeddedPlaybackAssembly({
  playbackRuntime,
  applyEmbeddedPattern,
  queuePerformanceCue,
  getPlaybackState
}: {
  playbackRuntime: PlaybackRuntime;
  applyEmbeddedPattern?: (
    payload: EmbeddedPatternPayload
  ) => PlaybackOperationResult | Promise<PlaybackOperationResult>;
  queuePerformanceCue?: (cue: ChartPerformanceCue) => PlaybackOperationResult | Promise<PlaybackOperationResult>;
  getPlaybackState?: () => EmbeddedPlaybackRuntimeState;
}): EmbeddedPlaybackAssembly {
  if (!playbackRuntime || typeof playbackRuntime.ensurePlaybackController !== 'function') {
    throw new Error('A playback runtime is required.');
  }

  return createPlaybackAssembly({
    playbackRuntime,
    createExtensions({ playbackController }) {
      const embeddedApi: EmbeddedPlaybackApi = createEmbeddedPlaybackApi({
        playbackRuntime,
        playbackController,
        applyEmbeddedPattern,
        queuePerformanceCue,
        getPlaybackState
      });

      return {
        embeddedApi
      };
    }
  }) as unknown as EmbeddedPlaybackAssembly;
}
