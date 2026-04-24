import type {
  DrillPlaybackAssemblyProvider,
  DrillPlaybackControllerOptions,
  EmbeddedPatternPayload,
  PlaybackOperationResult,
  PlaybackRuntimeState,
  PlaybackSettings
} from '../types/contracts';

import { createDrillPlaybackAssembly } from './drill-playback-assembly.js';
import { createPlaybackAssemblyProvider } from './playback-assembly-provider.js';

type CreateDrillPlaybackAssemblyProviderOptions = DrillPlaybackControllerOptions & {
  applyEmbeddedPattern?: (payload: EmbeddedPatternPayload) => PlaybackOperationResult,
  applyEmbeddedPlaybackSettings?: (settings: PlaybackSettings) => unknown,
  getEmbeddedPlaybackState?: () => Partial<PlaybackRuntimeState>
};

/**
 * Creates a memoized provider for the Drill playback assembly.
 *
 * @param {CreateDrillPlaybackAssemblyProviderOptions} [options]
 * @returns {DrillPlaybackAssemblyProvider}
 */
export function createDrillPlaybackAssemblyProvider(options: CreateDrillPlaybackAssemblyProviderOptions = {}) {
  return createPlaybackAssemblyProvider({
    createAssembly() {
      return createDrillPlaybackAssembly(options);
    }
  }) as DrillPlaybackAssemblyProvider;
}
