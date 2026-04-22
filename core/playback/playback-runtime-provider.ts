import type {
  PlaybackRuntime,
  PlaybackRuntimeProvider
} from '../types/contracts';

export function createPlaybackRuntimeProvider({
  createRuntime
}: {
  createRuntime: () => PlaybackRuntime;
}): PlaybackRuntimeProvider {
  if (typeof createRuntime !== 'function') {
    throw new Error('A runtime factory is required.');
  }

  let playbackRuntime: PlaybackRuntime | null = null;

  return {
    getRuntime() {
      if (playbackRuntime) return playbackRuntime;
      playbackRuntime = createRuntime();
      return playbackRuntime;
    }
  };
}
