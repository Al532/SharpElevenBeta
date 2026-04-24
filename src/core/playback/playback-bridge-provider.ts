import type {
  PlaybackBridge,
  PlaybackBridgeProvider
} from '../types/contracts';

export function createPlaybackBridgeProvider({
  createBridge
}: {
  createBridge: () => PlaybackBridge;
}): PlaybackBridgeProvider {
  if (typeof createBridge !== 'function') {
    throw new Error('A bridge factory is required.');
  }

  let bridge: PlaybackBridge | null = null;

  return {
    getBridge() {
      if (bridge) return bridge;
      bridge = createBridge();
      return bridge;
    }
  };
}
