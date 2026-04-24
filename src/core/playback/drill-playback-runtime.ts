import type {
  DrillPlaybackControllerOptions,
  EmbeddedPatternPayload,
  PlaybackOperationResult,
  PlaybackRuntime,
  PlaybackRuntimeState,
  PlaybackSettings
} from '../types/contracts';

import { createDrillPlaybackSessionAdapter } from './drill-playback-session-adapter.js';
import { createPlaybackRuntime } from './playback-runtime.js';

type DrillPlaybackRuntimeOptions = DrillPlaybackControllerOptions & {
  applyEmbeddedPattern?: (payload: EmbeddedPatternPayload) => PlaybackOperationResult;
  applyEmbeddedPlaybackSettings?: (settings: PlaybackSettings) => unknown;
  getEmbeddedPlaybackState?: () => Partial<PlaybackRuntimeState>;
};

export function createDrillPlaybackRuntime({
  applyEmbeddedPattern,
  applyEmbeddedPlaybackSettings,
  getEmbeddedPlaybackState,
  ensureWalkingBassGenerator,
  isPlaying,
  getAudioContext,
  noteFadeout,
  stopActiveChordVoices,
  rebuildPreparedCompingPlans,
  buildPreparedBassPlan,
  getCurrentKey,
  preloadNearTermSamples,
  validateCustomPattern,
  startPlayback,
  stopPlayback,
  togglePausePlayback
}: DrillPlaybackRuntimeOptions = {}): PlaybackRuntime {
  return createPlaybackRuntime({
    adapter: createDrillPlaybackSessionAdapter({
      applyEmbeddedPattern,
      applyEmbeddedPlaybackSettings,
      getEmbeddedPlaybackState,
      ensureWalkingBassGenerator,
      isPlaying,
      getAudioContext,
      noteFadeout,
      stopActiveChordVoices,
      rebuildPreparedCompingPlans,
      buildPreparedBassPlan,
      getCurrentKey,
      preloadNearTermSamples,
      validateCustomPattern,
      startPlayback,
      stopPlayback,
      togglePausePlayback
    })
  });
}
