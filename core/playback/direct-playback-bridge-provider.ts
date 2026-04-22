import type {
  DirectPlaybackBridgeProvider,
  DirectPlaybackControllerOptions
} from '../types/contracts';

import { createRuntimePlaybackBridgeProvider } from './runtime-playback-bridge-provider.js';
import { createDirectPlaybackRuntimeProvider } from './direct-playback-runtime-provider.js';

export function createDirectPlaybackBridgeProvider(
  options: DirectPlaybackControllerOptions = {}
): DirectPlaybackBridgeProvider {
  return createRuntimePlaybackBridgeProvider({
    runtimeProvider: createDirectPlaybackRuntimeProvider(options)
  }) as DirectPlaybackBridgeProvider;
}
