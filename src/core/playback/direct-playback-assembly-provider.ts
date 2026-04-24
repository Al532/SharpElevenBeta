import type {
  DirectPlaybackAssemblyProvider,
  DirectPlaybackControllerOptions,
  EmbeddedPatternPayload,
  PlaybackOperationResult,
  PlaybackRuntimeState,
  PlaybackSettings
} from '../types/contracts';

import { createPlaybackAssemblyProvider } from './playback-assembly-provider.js';
import { createDirectPlaybackAssembly } from './direct-playback-assembly.js';

type DirectPlaybackAssemblyOptions = DirectPlaybackControllerOptions & {
  applyEmbeddedPattern?: (payload: EmbeddedPatternPayload) => PlaybackOperationResult;
  applyEmbeddedPlaybackSettings?: (settings: PlaybackSettings) => unknown;
  getEmbeddedPlaybackState?: () => Partial<PlaybackRuntimeState>;
};

export function createDirectPlaybackAssemblyProvider(
  options: DirectPlaybackAssemblyOptions = {}
): DirectPlaybackAssemblyProvider {
  return createPlaybackAssemblyProvider({
    createAssembly() {
      return createDirectPlaybackAssembly(options);
    }
  }) as DirectPlaybackAssemblyProvider;
}
