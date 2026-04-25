import type {
  EmbeddedPatternPayload,
  PlaybackOperationResult,
  PlaybackRuntimeState,
  PlaybackSettings,
  PracticePlaybackAssemblyProvider,
  PracticePlaybackControllerOptions
} from '../types/contracts';

import { createPlaybackAssemblyProvider } from './playback-assembly-provider.js';
import { createPracticePlaybackAssembly } from './practice-playback-assembly.js';

type CreatePracticePlaybackAssemblyProviderOptions = PracticePlaybackControllerOptions & {
  applyEmbeddedPattern?: (payload: EmbeddedPatternPayload) => PlaybackOperationResult,
  applyEmbeddedPlaybackSettings?: (settings: PlaybackSettings) => unknown,
  getEmbeddedPlaybackState?: () => Partial<PlaybackRuntimeState>
};

/**
 * Creates a memoized provider for the practice playback assembly.
 *
 * @param {CreatePracticePlaybackAssemblyProviderOptions} [options]
 * @returns {PracticePlaybackAssemblyProvider}
 */
export function createPracticePlaybackAssemblyProvider(options: CreatePracticePlaybackAssemblyProviderOptions = {}) {
  return createPlaybackAssemblyProvider({
    createAssembly() {
      return createPracticePlaybackAssembly(options);
    }
  }) as PracticePlaybackAssemblyProvider;
}
