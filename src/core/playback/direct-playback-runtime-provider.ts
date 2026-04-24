import type {
  DirectPlaybackControllerOptions,
  DirectPlaybackRuntimeProvider,
  EmbeddedPatternPayload,
  PlaybackOperationResult,
  PlaybackRuntimeState,
  PlaybackSettings,
  PracticeSessionSpec
} from '../types/contracts';

import { createPlaybackRuntimeProvider } from './playback-runtime-provider.js';
import { createDirectPlaybackRuntime } from './direct-playback-runtime.js';

type DirectPlaybackRuntimeOptions = DirectPlaybackControllerOptions & {
  loadDirectSession?: (
    sessionSpec: PracticeSessionSpec | null,
    playbackSettings: PlaybackSettings
  ) => Promise<PlaybackOperationResult | undefined> | PlaybackOperationResult | undefined;
  updateDirectPlaybackSettings?: (
    playbackSettings: PlaybackSettings,
    sessionSpec: PracticeSessionSpec | null
  ) => Promise<PlaybackOperationResult | undefined> | PlaybackOperationResult | undefined;
  getDirectPlaybackState?: () => Partial<PlaybackRuntimeState> | null | undefined;
  applyEmbeddedPattern?: (payload: EmbeddedPatternPayload) => PlaybackOperationResult;
  applyEmbeddedPlaybackSettings?: (settings: PlaybackSettings) => unknown;
  getEmbeddedPlaybackState?: () => Partial<PlaybackRuntimeState>;
};

export function createDirectPlaybackRuntimeProvider(
  options: DirectPlaybackRuntimeOptions = {}
): DirectPlaybackRuntimeProvider {
  return createPlaybackRuntimeProvider({
    createRuntime() {
      return createDirectPlaybackRuntime(options);
    }
  }) as DirectPlaybackRuntimeProvider;
}
