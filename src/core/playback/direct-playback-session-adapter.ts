import type {
  DirectPlaybackControllerOptions,
  EmbeddedPatternPayload,
  PlaybackOperationResult,
  PlaybackRuntimeState,
  PlaybackSessionAdapter,
  PlaybackSettings,
  PracticeSessionSpec
} from '../types/contracts';

import { createDrillPlaybackSessionAdapter } from './drill-playback-session-adapter.js';

type DirectPlaybackSessionAdapterOptions = DirectPlaybackControllerOptions & {
  loadDirectSession?: (
    sessionSpec: PracticeSessionSpec | null,
    playbackSettings: PlaybackSettings
  ) => Promise<PlaybackOperationResult | undefined> | PlaybackOperationResult | undefined;
  updateDirectPlaybackSettings?: (
    playbackSettings: PlaybackSettings,
    sessionSpec: PracticeSessionSpec | null
  ) => Promise<PlaybackOperationResult | undefined> | PlaybackOperationResult | undefined;
  getDirectPlaybackState?: () => Partial<PlaybackRuntimeState> | null | undefined;
  applyEmbeddedPattern?: (payload: EmbeddedPatternPayload) => PlaybackOperationResult;
  applyEmbeddedPlaybackSettings?: (settings: PlaybackSettings) => unknown;
  getEmbeddedPlaybackState?: () => Partial<PlaybackRuntimeState>;
};

export function createDirectPlaybackSessionAdapter({
  loadDirectSession,
  updateDirectPlaybackSettings,
  getDirectPlaybackState,
  isPlaying,
  startPlayback,
  stopPlayback,
  togglePausePlayback,
  ...fallbackOptions
}: DirectPlaybackSessionAdapterOptions = {}): PlaybackSessionAdapter {
  const fallbackAdapter = createDrillPlaybackSessionAdapter(fallbackOptions);

  return {
    async loadSession(sessionSpec, playbackSettings) {
      if (typeof loadDirectSession === 'function') {
        return loadDirectSession(sessionSpec, playbackSettings || {});
      }
      return fallbackAdapter.loadSession?.(sessionSpec, playbackSettings || {});
    },
    async updatePlaybackSettings(playbackSettings, sessionSpec) {
      if (typeof updateDirectPlaybackSettings === 'function') {
        return updateDirectPlaybackSettings(playbackSettings || {}, sessionSpec || null);
      }
      return fallbackAdapter.updatePlaybackSettings?.(playbackSettings || {}, sessionSpec || null);
    },
    async start(sessionSpec, playbackSettings) {
      if (typeof loadDirectSession === 'function' || typeof updateDirectPlaybackSettings === 'function') {
        if (!isPlaying?.()) {
          await startPlayback?.();
        }
        return {
          ok: true,
          state: (typeof getDirectPlaybackState === 'function' ? getDirectPlaybackState() : null) || null
        };
      }
      return fallbackAdapter.start?.(sessionSpec, playbackSettings || {});
    },
    async stop(sessionSpec, playbackSettings) {
      if (typeof loadDirectSession === 'function' || typeof updateDirectPlaybackSettings === 'function') {
        if (isPlaying?.()) {
          stopPlayback?.();
        }
        return {
          ok: true,
          state: (typeof getDirectPlaybackState === 'function' ? getDirectPlaybackState() : null) || null
        };
      }
      return fallbackAdapter.stop?.(sessionSpec, playbackSettings || {});
    },
    async pauseToggle(sessionSpec, playbackSettings) {
      if (typeof loadDirectSession === 'function' || typeof updateDirectPlaybackSettings === 'function') {
        togglePausePlayback?.();
        return {
          ok: true,
          state: (typeof getDirectPlaybackState === 'function' ? getDirectPlaybackState() : null) || null
        };
      }
      return fallbackAdapter.pauseToggle?.(sessionSpec, playbackSettings || {});
    },
    getRuntimeState() {
      if (typeof getDirectPlaybackState === 'function') {
        return getDirectPlaybackState() || null;
      }
      return fallbackAdapter.getRuntimeState?.() || null;
    },
    subscribe(listener) {
      return fallbackAdapter.subscribe?.(listener);
    }
  };
}
