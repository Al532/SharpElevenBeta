import type {
  PlaybackRuntime,
  PlaybackSessionAdapter,
  PlaybackSessionController
} from '../types/contracts';

import { createPlaybackSessionController } from './playback-session-controller.js';

export function createPlaybackRuntime({
  adapter,
  ensureReady = async () => {}
}: {
  adapter: PlaybackSessionAdapter;
  ensureReady?: () => Promise<unknown>;
}): PlaybackRuntime {
  let playbackController: PlaybackSessionController | null = null;

  function ensurePlaybackController(): PlaybackSessionController {
    if (playbackController) return playbackController;
    playbackController = createPlaybackSessionController({ adapter });
    return playbackController;
  }

  return {
    ensureReady,
    ensurePlaybackController,
    getRuntimeState() {
      return ensurePlaybackController().getState().runtime || null;
    }
  };
}
