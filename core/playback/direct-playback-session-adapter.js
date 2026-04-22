// @ts-check

/** @typedef {import('../types/contracts').DirectPlaybackControllerOptions} DirectPlaybackControllerOptions */
/** @typedef {import('../types/contracts').PlaybackOperationResult} PlaybackOperationResult */
/** @typedef {import('../types/contracts').PlaybackRuntimeState} PlaybackRuntimeState */
/** @typedef {import('../types/contracts').PlaybackSessionAdapter} PlaybackSessionAdapter */
/** @typedef {import('../types/contracts').PlaybackSettings} PlaybackSettings */
/** @typedef {import('../types/contracts').PracticeSessionSpec} PracticeSessionSpec */

import { createDrillPlaybackSessionAdapter } from './drill-playback-session-adapter.js';

/**
 * Creates the direct in-page playback-session adapter.
 *
 * Unlike the legacy Drill-backed adapter, this one can load a session directly
 * without routing through the embedded pattern API first. When no direct
 * session hooks are provided yet, it gracefully falls back to the current
 * Drill/embedded behavior so existing consumers keep working.
 *
 * @param {DirectPlaybackControllerOptions & {
 *   loadDirectSession?: (sessionSpec: PracticeSessionSpec | null, playbackSettings: PlaybackSettings) => Promise<PlaybackOperationResult | undefined> | PlaybackOperationResult | undefined,
 *   updateDirectPlaybackSettings?: (playbackSettings: PlaybackSettings, sessionSpec: PracticeSessionSpec | null) => Promise<PlaybackOperationResult | undefined> | PlaybackOperationResult | undefined,
 *   getDirectPlaybackState?: () => Partial<PlaybackRuntimeState> | null | undefined,
 *   applyEmbeddedPattern?: (payload: import('../types/contracts').EmbeddedPatternPayload) => PlaybackOperationResult,
 *   applyEmbeddedPlaybackSettings?: (settings: PlaybackSettings) => unknown,
 *   getEmbeddedPlaybackState?: () => Partial<PlaybackRuntimeState>
 * }} [options]
 * @returns {PlaybackSessionAdapter}
 */
export function createDirectPlaybackSessionAdapter({
  loadDirectSession,
  updateDirectPlaybackSettings,
  getDirectPlaybackState,
  isPlaying,
  startPlayback,
  stopPlayback,
  togglePausePlayback,
  ...fallbackOptions
} = {}) {
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
