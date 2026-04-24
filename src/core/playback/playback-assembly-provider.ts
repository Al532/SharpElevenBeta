import type {
  PlaybackAssembly,
  PlaybackAssemblyProvider
} from '../types/contracts';

export function createPlaybackAssemblyProvider({
  createAssembly
}: {
  createAssembly: () => PlaybackAssembly;
}): PlaybackAssemblyProvider {
  if (typeof createAssembly !== 'function') {
    throw new Error('An assembly factory is required.');
  }

  let playbackAssembly: PlaybackAssembly | null = null;

  return {
    getAssembly() {
      if (playbackAssembly) return playbackAssembly;
      playbackAssembly = createAssembly();
      return playbackAssembly;
    }
  };
}
