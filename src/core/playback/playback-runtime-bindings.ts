import type {
  PlaybackRuntime,
  PlaybackRuntimeBindings
} from '../types/contracts';

export function createPlaybackRuntimeBindings({
  playbackRuntime
}: {
  playbackRuntime: PlaybackRuntime;
}): PlaybackRuntimeBindings {
  if (!playbackRuntime || typeof playbackRuntime.ensurePlaybackController !== 'function') {
    throw new Error('A playback runtime is required.');
  }

  return {
    playbackRuntime,
    playbackController: playbackRuntime.ensurePlaybackController()
  };
}
