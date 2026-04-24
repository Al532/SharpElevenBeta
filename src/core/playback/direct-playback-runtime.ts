import type {
  DirectPlaybackControllerOptions,
  EmbeddedPatternPayload,
  PlaybackOperationResult,
  PlaybackRuntime,
  PlaybackRuntimeState,
  PlaybackSettings,
  PracticeSessionSpec
} from '../types/contracts';

import { createDirectPlaybackSessionAdapter } from './direct-playback-session-adapter.js';
import { createPlaybackRuntime } from './playback-runtime.js';

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

export function createDirectPlaybackRuntime(
  options: DirectPlaybackRuntimeOptions = {}
): PlaybackRuntime {
  return createPlaybackRuntime({
    adapter: createDirectPlaybackSessionAdapter(options)
  });
}
