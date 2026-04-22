import type {
  DrillPlaybackControllerOptions,
  EmbeddedPatternPayload,
  PlaybackOperationResult,
  PlaybackRuntime,
  PlaybackRuntimeState,
  PlaybackSessionController,
  PlaybackSettings
} from '../../core/types/contracts';

import { createDrillPlaybackAssemblyProvider } from '../../core/playback/drill-playback-assembly-provider.js';
import { createDrillPlaybackRuntimeProvider } from '../../core/playback/drill-playback-runtime-provider.js';

type DrillPlaybackOptions = DrillPlaybackControllerOptions & {
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
}: DrillPlaybackOptions = {}): PlaybackRuntime {
  return createDrillPlaybackRuntimeProvider({
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
  }).getRuntime();
}

export function createDrillPlaybackController({
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
}: DrillPlaybackOptions = {}): PlaybackSessionController {
  return createDrillPlaybackAssemblyProvider({
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
  }).getAssembly().playbackController;
}

export const createDirectPlaybackRuntime = createDrillPlaybackRuntime;
export const createDirectPlaybackController = createDrillPlaybackController;
