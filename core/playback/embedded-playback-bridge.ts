import type {
  EmbeddedPlaybackBridge,
  EmbeddedPlaybackBridgeOptions
} from '../types/contracts';

import { createEmbeddedPlaybackApiClient } from './embedded-playback-api-client.js';
import { createEmbeddedPlaybackRuntime } from './embedded-playback-runtime.js';
import { createPlaybackAssembly } from './playback-assembly.js';

export function createEmbeddedPlaybackBridge({
  getTargetWindow,
  getHostFrame,
  readyEventName,
  timeoutMs,
  buildPatternPayload
}: EmbeddedPlaybackBridgeOptions): EmbeddedPlaybackBridge {
  const apiClient = createEmbeddedPlaybackApiClient({
    getTargetWindow,
    getHostFrame,
    readyEventName,
    timeoutMs
  });
  const playbackRuntime = createEmbeddedPlaybackRuntime({
    apiClient,
    buildPatternPayload
  });
  return createPlaybackAssembly({
    playbackRuntime,
    createExtensions() {
      return {
        apiClient
      };
    }
  }) as EmbeddedPlaybackBridge;
}
