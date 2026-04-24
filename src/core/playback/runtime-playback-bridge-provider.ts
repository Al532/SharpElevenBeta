import type {
  PlaybackBridge,
  PlaybackRuntimeBindings,
  PlaybackRuntimeProvider,
  RuntimePlaybackBridgeProvider
} from '../types/contracts';

import { createPlaybackAssembly } from './playback-assembly.js';
import { createPlaybackBridgeProvider } from './playback-bridge-provider.js';

export function createRuntimePlaybackBridgeProvider({
  runtimeProvider,
  createExtensions
}: {
  runtimeProvider: PlaybackRuntimeProvider;
  createExtensions?: (bindings: PlaybackRuntimeBindings) => Record<string, unknown>;
}): RuntimePlaybackBridgeProvider {
  if (!runtimeProvider || typeof runtimeProvider.getRuntime !== 'function') {
    throw new Error('A playback runtime provider is required.');
  }

  return createPlaybackBridgeProvider({
    createBridge() {
      return createPlaybackAssembly({
        playbackRuntime: runtimeProvider.getRuntime(),
        createExtensions
      }) as PlaybackBridge;
    }
  }) as RuntimePlaybackBridgeProvider;
}
