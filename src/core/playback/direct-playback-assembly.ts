import type {
  DirectPlaybackAssembly,
  DirectPlaybackControllerOptions,
  EmbeddedPatternPayload,
  PlaybackOperationResult,
  PlaybackRuntimeState,
  PlaybackSettings
} from '../types/contracts';

import { createDirectPlaybackRuntimeProvider } from './direct-playback-runtime-provider.js';

type DirectPlaybackAssemblyOptions = DirectPlaybackControllerOptions & {
  applyEmbeddedPattern?: (payload: EmbeddedPatternPayload) => PlaybackOperationResult;
  applyEmbeddedPlaybackSettings?: (settings: PlaybackSettings) => unknown;
  getEmbeddedPlaybackState?: () => Partial<PlaybackRuntimeState>;
};

export function createDirectPlaybackAssembly(
  options: DirectPlaybackAssemblyOptions = {}
): DirectPlaybackAssembly {
  const playbackRuntime = createDirectPlaybackRuntimeProvider(options).getRuntime();
  return {
    playbackRuntime,
    playbackController: playbackRuntime.ensurePlaybackController()
  };
}
