import type {
  EmbeddedPatternPayload,
  PlaybackOperationResult,
  PlaybackRuntimeState,
  PlaybackSettings,
  PracticePlaybackControllerOptions,
  PracticePlaybackRuntimeProvider
} from '../types/contracts';

import { createPlaybackRuntimeProvider } from './playback-runtime-provider.js';
import { createPracticePlaybackRuntime } from './practice-playback-runtime.js';

type PracticePlaybackRuntimeOptions = PracticePlaybackControllerOptions & {
  applyEmbeddedPattern?: (payload: EmbeddedPatternPayload) => PlaybackOperationResult;
  applyEmbeddedPlaybackSettings?: (settings: PlaybackSettings) => unknown;
  getEmbeddedPlaybackState?: () => Partial<PlaybackRuntimeState>;
};

export function createPracticePlaybackRuntimeProvider(
  options: PracticePlaybackRuntimeOptions = {}
): PracticePlaybackRuntimeProvider {
  return createPlaybackRuntimeProvider({
    createRuntime() {
      return createPracticePlaybackRuntime(options);
    }
  }) as PracticePlaybackRuntimeProvider;
}
