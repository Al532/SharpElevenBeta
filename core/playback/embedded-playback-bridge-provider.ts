import type {
  EmbeddedPlaybackBridgeOptions,
  EmbeddedPlaybackBridgeProvider
} from '../types/contracts';

import { createEmbeddedPlaybackApiClient } from './embedded-playback-api-client.js';
import { createEmbeddedPlaybackRuntimeProvider } from './embedded-playback-runtime-provider.js';
import { createRuntimePlaybackBridgeProvider } from './runtime-playback-bridge-provider.js';

export function createEmbeddedPlaybackBridgeProvider({
  getTargetWindow,
  getHostFrame,
  readyEventName,
  timeoutMs,
  buildPatternPayload
}: EmbeddedPlaybackBridgeOptions): EmbeddedPlaybackBridgeProvider {
  const apiClient = createEmbeddedPlaybackApiClient({
    getTargetWindow,
    getHostFrame,
    readyEventName,
    timeoutMs
  });
  const runtimeProvider = createEmbeddedPlaybackRuntimeProvider({
    apiClient,
    buildPatternPayload
  });

  return createRuntimePlaybackBridgeProvider({
    runtimeProvider,
    createExtensions() {
      return {
        apiClient
      };
    }
  }) as EmbeddedPlaybackBridgeProvider;
}
