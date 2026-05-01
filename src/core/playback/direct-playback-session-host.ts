import type {
  EmbeddedPatternPayload,
  PlaybackOperationResult,
  PlaybackRuntimeState,
  PlaybackSettings,
  PracticeSessionSpec
} from '../types/contracts';

import { applyPracticeSessionToEmbeddedPattern } from './practice-session-pattern-adapter.js';

export function createDirectPlaybackSessionHandlers({
  applyPracticeSession,
  applyPlaybackSettings,
  getPlaybackState
}: {
  applyPracticeSession?: (session: PracticeSessionSpec | null) => PlaybackOperationResult;
  applyPlaybackSettings?: (
    settings: PlaybackSettings,
    session?: PracticeSessionSpec | null
  ) => PlaybackOperationResult | PlaybackSettings | unknown;
  getPlaybackState?: () => Partial<PlaybackRuntimeState> | null | undefined;
} = {}) {
  return {
    loadDirectSession(sessionSpec: PracticeSessionSpec | null, playbackSettings: PlaybackSettings = {}) {
      const applyResult = applyPracticeSession?.(sessionSpec || null) || {
        ok: false,
        errorMessage: 'Missing direct session host.'
      };
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
    updateDirectPlaybackSettings(playbackSettings: PlaybackSettings = {}, sessionSpec: PracticeSessionSpec | null = null) {
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

export function createDirectPlaybackSessionHost({
  applyEmbeddedPattern,
  applyEmbeddedPlaybackSettings,
  getEmbeddedPlaybackState
}: {
  applyEmbeddedPattern?: (payload: Partial<EmbeddedPatternPayload>) => PlaybackOperationResult;
  applyEmbeddedPlaybackSettings?: (settings: PlaybackSettings) => unknown;
  getEmbeddedPlaybackState?: () => Partial<PlaybackRuntimeState> | null | undefined;
} = {}) {
  return createDirectPlaybackSessionHandlers({
    applyPracticeSession(sessionSpec) {
      return applyPracticeSessionToEmbeddedPattern({
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
