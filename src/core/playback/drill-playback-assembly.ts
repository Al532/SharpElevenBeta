import type {
  DrillPlaybackAssembly,
  DrillPlaybackControllerOptions,
  EmbeddedPatternPayload,
  PlaybackOperationResult,
  PlaybackRuntimeState,
  PlaybackSettings
} from '../types/contracts';

import { createDrillPlaybackRuntimeProvider } from './drill-playback-runtime-provider.js';
import { createPlaybackAssembly } from './playback-assembly.js';

type CreateDrillPlaybackAssemblyOptions = DrillPlaybackControllerOptions & {
  applyEmbeddedPattern?: (payload: EmbeddedPatternPayload) => PlaybackOperationResult,
  applyEmbeddedPlaybackSettings?: (settings: PlaybackSettings) => unknown,
  getEmbeddedPlaybackState?: () => Partial<PlaybackRuntimeState>
};

/**
 * Creates the full Drill playback assembly: runtime plus memoized controller.
 * This gives Drill the same kind of dedicated core-level factory that chart now
 * has for its embedded bridge.
 *
 * @param {CreateDrillPlaybackAssemblyOptions} [options]
 * @returns {DrillPlaybackAssembly}
 */
export function createDrillPlaybackAssembly(options: CreateDrillPlaybackAssemblyOptions = {}) {
  const playbackRuntime = createDrillPlaybackRuntimeProvider(options).getRuntime();
  return createPlaybackAssembly({ playbackRuntime });
}
