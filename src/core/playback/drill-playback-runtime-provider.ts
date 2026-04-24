import type {
  DrillPlaybackControllerOptions,
  DrillPlaybackRuntimeProvider,
  EmbeddedPatternPayload,
  PlaybackOperationResult,
  PlaybackRuntimeState,
  PlaybackSettings
} from '../types/contracts';

import { createDrillPlaybackRuntime } from './drill-playback-runtime.js';
import { createPlaybackRuntimeProvider } from './playback-runtime-provider.js';

type DrillPlaybackRuntimeOptions = DrillPlaybackControllerOptions & {
  applyEmbeddedPattern?: (payload: EmbeddedPatternPayload) => PlaybackOperationResult;
  applyEmbeddedPlaybackSettings?: (settings: PlaybackSettings) => unknown;
  getEmbeddedPlaybackState?: () => Partial<PlaybackRuntimeState>;
};

export function createDrillPlaybackRuntimeProvider(
  options: DrillPlaybackRuntimeOptions = {}
): DrillPlaybackRuntimeProvider {
  return createPlaybackRuntimeProvider({
    createRuntime() {
      return createDrillPlaybackRuntime(options);
    }
  }) as DrillPlaybackRuntimeProvider;
}
