import type {
  EmbeddedPatternPayload,
  EmbeddedPlaybackApiClient,
  EmbeddedPlaybackRuntime,
  PlaybackRuntime,
  PlaybackSettings,
  PracticeSessionSpec
} from '../types/contracts';

import { createEmbeddedPlaybackSessionAdapter } from './embedded-playback-session-adapter.js';
import { createPlaybackRuntime } from './playback-runtime.js';

export function createEmbeddedPlaybackRuntime({
  apiClient,
  buildPatternPayload
}: {
  apiClient: EmbeddedPlaybackApiClient;
  buildPatternPayload: (
    sessionSpec: PracticeSessionSpec | null,
    playbackSettings: PlaybackSettings
  ) => EmbeddedPatternPayload;
}): EmbeddedPlaybackRuntime {
  const playbackRuntime = createPlaybackRuntime({
    adapter: createEmbeddedPlaybackSessionAdapter({
      apiClient,
      buildPatternPayload
    }),
    ensureReady() {
      return apiClient.ensureApi();
    }
  }) as PlaybackRuntime;

  return playbackRuntime as EmbeddedPlaybackRuntime;
}
