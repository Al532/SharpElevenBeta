// @ts-check

/** @typedef {import('../../core/types/contracts').DirectPlaybackControllerOptions} DirectPlaybackControllerOptions */
/** @typedef {import('../../core/types/contracts').PlaybackOperationResult} PlaybackOperationResult */
/** @typedef {import('../../core/types/contracts').PlaybackRuntimeState} PlaybackRuntimeState */
/** @typedef {import('../../core/types/contracts').PlaybackSettings} PlaybackSettings */
/** @typedef {import('../../core/types/contracts').PracticeSessionSpec} PracticeSessionSpec */

import { applyPracticeSessionToDrillUi } from './drill-session-builder.js';

/**
 * Creates direct session handlers from app-level drill UI/runtime bindings.
 * This is the bridge between a `PracticeSessionSpec` and the current in-page
 * playback host without exposing the legacy embedded API semantics upstream.
 *
 * @param {{
 *   applyPracticeSession?: (session: PracticeSessionSpec | null) => PlaybackOperationResult,
 *   applyPlaybackSettings?: (settings: PlaybackSettings, session?: PracticeSessionSpec | null) => PlaybackOperationResult | PlaybackSettings | unknown,
 *   getPlaybackState?: () => Partial<PlaybackRuntimeState> | null | undefined
 * }} [options]
 * @returns {{
 *   loadDirectSession: (sessionSpec: PracticeSessionSpec | null, playbackSettings: PlaybackSettings) => PlaybackOperationResult,
 *   updateDirectPlaybackSettings: (playbackSettings: PlaybackSettings, sessionSpec: PracticeSessionSpec | null) => PlaybackOperationResult,
 *   getDirectPlaybackState: () => Partial<PlaybackRuntimeState> | null
 * }}
 */
export function createDirectPlaybackSessionHandlers({
  applyPracticeSession,
  applyPlaybackSettings,
  getPlaybackState
} = {}) {
  return {
    loadDirectSession(sessionSpec, playbackSettings = {}) {
      const applyResult = applyPracticeSession?.(sessionSpec || null) || { ok: false, errorMessage: 'Missing direct session host.' };
      if (applyResult?.ok !== false && typeof applyPlaybackSettings === 'function') {
        applyPlaybackSettings(playbackSettings, sessionSpec || null);
      }
      return {
        ok: applyResult?.ok !== false,
        errorMessage: applyResult?.errorMessage || null,
        state: getPlaybackState?.() || null,
        session: sessionSpec || null
      };
    },
    updateDirectPlaybackSettings(playbackSettings = {}, sessionSpec = null) {
      const result = applyPlaybackSettings?.(playbackSettings, sessionSpec || null);
      return {
        ok: true,
        state: getPlaybackState?.() || null,
        settings: result || playbackSettings
      };
    },
    getDirectPlaybackState() {
      return getPlaybackState?.() || null;
    }
  };
}

/**
 * Creates a direct session host that still uses the current drill UI/runtime
 * implementation under the hood. This keeps the `PracticeSessionSpec` boundary
 * explicit while the deeper audio runtime continues to be extracted.
 *
 * @param {{
 *   applyEmbeddedPattern?: DirectPlaybackControllerOptions['loadDirectSession'],
 *   applyEmbeddedPlaybackSettings?: (settings: PlaybackSettings) => unknown,
 *   getEmbeddedPlaybackState?: () => Partial<PlaybackRuntimeState> | null | undefined
 * }} [options]
 * @returns {{
 *   loadDirectSession: (sessionSpec: PracticeSessionSpec | null, playbackSettings: PlaybackSettings) => PlaybackOperationResult,
 *   updateDirectPlaybackSettings: (playbackSettings: PlaybackSettings, sessionSpec: PracticeSessionSpec | null) => PlaybackOperationResult,
 *   getDirectPlaybackState: () => Partial<PlaybackRuntimeState> | null
 * }}
 */
export function createDirectPlaybackSessionHost({
  applyEmbeddedPattern,
  applyEmbeddedPlaybackSettings,
  getEmbeddedPlaybackState
} = {}) {
  return createDirectPlaybackSessionHandlers({
    applyPracticeSession(sessionSpec) {
      return applyPracticeSessionToDrillUi({
        session: sessionSpec,
        applyEmbeddedPattern,
        applyEmbeddedPlaybackSettings
      });
    },
    applyPlaybackSettings(playbackSettings) {
      return applyEmbeddedPlaybackSettings?.(playbackSettings);
    },
    getPlaybackState: getEmbeddedPlaybackState
  });
}
