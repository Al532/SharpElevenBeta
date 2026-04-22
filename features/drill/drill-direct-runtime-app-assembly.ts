import type {
  DirectPlaybackControllerOptions,
  EmbeddedPatternPayload,
  PlaybackOperationResult,
  PlaybackRuntimeState,
  PlaybackSettings
} from '../../core/types/contracts';

import { createDirectDrillRuntimeAppContextOptions } from './drill-direct-runtime-app-context.js';

export function createDrillDirectRuntimeAppAssembly({
  embedded = {},
  playbackRuntime = {},
  playbackState = {},
  transportActions = {}
}: {
  embedded?: {
    applyEmbeddedPattern?: (payload: Partial<EmbeddedPatternPayload>) => PlaybackOperationResult;
    applyEmbeddedPlaybackSettings?: (settings: PlaybackSettings) => unknown;
    getEmbeddedPlaybackState?: () => Partial<PlaybackRuntimeState> | null | undefined;
  };
  playbackRuntime?: Record<string, any>;
  playbackState?: Record<string, any>;
  transportActions?: Record<string, any>;
} = {}): DirectPlaybackControllerOptions {
  return createDirectDrillRuntimeAppContextOptions({
    applyEmbeddedPattern: embedded.applyEmbeddedPattern,
    applyEmbeddedPlaybackSettings: embedded.applyEmbeddedPlaybackSettings,
    getEmbeddedPlaybackState: embedded.getEmbeddedPlaybackState,
    playbackRuntime,
    playbackState,
    transportActions
  });
}
