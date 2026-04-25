import type {
  EmbeddedPatternPayload,
  EmbeddedPlaybackRuntimeState,
  PlaybackAssemblyProvider,
  PlaybackOperationResult,
  PlaybackRuntime,
  PublishedEmbeddedPlaybackAssemblyProvider
} from '../types/contracts';

import { createPlaybackAssemblyProvider } from './playback-assembly-provider.js';
import { createPublishedEmbeddedPlaybackAssembly } from './published-embedded-playback-assembly.js';

type PlaybackAssemblySource = {
  playbackRuntime: PlaybackRuntime;
  applyEmbeddedPattern?: (
    payload: EmbeddedPatternPayload
  ) => PlaybackOperationResult | Promise<PlaybackOperationResult>;
  getPlaybackState?: () => EmbeddedPlaybackRuntimeState;
};

function hasPublishedEmbeddedSourceShape(value: unknown): value is PlaybackAssemblySource {
  return Boolean(value && typeof value === 'object' && 'playbackRuntime' in value);
}

export function createPublishedEmbeddedPlaybackAssemblyProvider({
  targetWindow,
  readyEventName,
  playbackAssemblyProvider,
  createPlaybackAssembly
}: {
  targetWindow?: Window | null;
  readyEventName?: string;
  playbackAssemblyProvider?: PlaybackAssemblyProvider | null;
  createPlaybackAssembly?: () => PlaybackAssemblySource;
}): PublishedEmbeddedPlaybackAssemblyProvider {
  return createPlaybackAssemblyProvider({
    createAssembly() {
      const assembly: unknown = playbackAssemblyProvider?.getAssembly?.() || createPlaybackAssembly?.();
      if (!hasPublishedEmbeddedSourceShape(assembly) || !assembly.playbackRuntime) {
        throw new Error('A playback assembly or runtime factory is required.');
      }

      return createPublishedEmbeddedPlaybackAssembly({
        targetWindow,
        readyEventName,
        playbackRuntime: assembly.playbackRuntime,
        applyEmbeddedPattern: assembly.applyEmbeddedPattern,
        getPlaybackState: assembly.getPlaybackState
      });
    }
  }) as PublishedEmbeddedPlaybackAssemblyProvider;
}
