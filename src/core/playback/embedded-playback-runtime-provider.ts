import type {
  EmbeddedPatternPayload,
  EmbeddedPlaybackApiClient,
  EmbeddedPlaybackRuntimeProvider,
  PlaybackSettings,
  PracticeSessionSpec
} from '../types/contracts';

import { createEmbeddedPlaybackRuntime } from './embedded-playback-runtime.js';
import { createPlaybackRuntimeProvider } from './playback-runtime-provider.js';

export function createEmbeddedPlaybackRuntimeProvider({
  apiClient,
  buildPatternPayload
}: {
  apiClient: EmbeddedPlaybackApiClient;
  buildPatternPayload: (
    sessionSpec: PracticeSessionSpec | null,
    playbackSettings: PlaybackSettings
  ) => EmbeddedPatternPayload;
}): EmbeddedPlaybackRuntimeProvider {
  return createPlaybackRuntimeProvider({
    createRuntime() {
      return createEmbeddedPlaybackRuntime({
        apiClient,
        buildPatternPayload
      });
    }
  }) as EmbeddedPlaybackRuntimeProvider;
}
