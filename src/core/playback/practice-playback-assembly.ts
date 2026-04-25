import type {
  EmbeddedPatternPayload,
  PlaybackOperationResult,
  PlaybackRuntimeState,
  PlaybackSettings,
  PracticePlaybackAssembly,
  PracticePlaybackControllerOptions
} from '../types/contracts';

import { createPlaybackAssembly } from './playback-assembly.js';
import { createPracticePlaybackRuntimeProvider } from './practice-playback-runtime-provider.js';

type CreatePracticePlaybackAssemblyOptions = PracticePlaybackControllerOptions & {
  applyEmbeddedPattern?: (payload: EmbeddedPatternPayload) => PlaybackOperationResult,
  applyEmbeddedPlaybackSettings?: (settings: PlaybackSettings) => unknown,
  getEmbeddedPlaybackState?: () => Partial<PlaybackRuntimeState>
};

/**
 * Creates the full practice playback assembly: runtime plus memoized controller.
 *
 * @param {CreatePracticePlaybackAssemblyOptions} [options]
 * @returns {PracticePlaybackAssembly}
 */
export function createPracticePlaybackAssembly(options: CreatePracticePlaybackAssemblyOptions = {}) {
  const playbackRuntime = createPracticePlaybackRuntimeProvider(options).getRuntime();
  return createPlaybackAssembly({ playbackRuntime }) as PracticePlaybackAssembly;
}
