import type {
  PracticePlaybackControllerOptions,
  EmbeddedPatternPayload,
  PlaybackOperationResult,
  PlaybackRuntime,
  PlaybackRuntimeState,
  PlaybackSessionController,
  PlaybackSettings
} from '../../core/types/contracts';

import { createPracticePlaybackAssemblyProvider } from '../../core/playback/practice-playback-assembly-provider.js';
import { createPracticePlaybackRuntimeProvider } from '../../core/playback/practice-playback-runtime-provider.js';

type PracticePlaybackOptions = PracticePlaybackControllerOptions & {
  applyEmbeddedPattern?: (payload: EmbeddedPatternPayload) => PlaybackOperationResult;
  applyEmbeddedPlaybackSettings?: (settings: PlaybackSettings) => unknown;
  getEmbeddedPlaybackState?: () => Partial<PlaybackRuntimeState>;
};

export function createPracticePlaybackRuntime({
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
}: PracticePlaybackOptions = {}): PlaybackRuntime {
  return createPracticePlaybackRuntimeProvider({
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

export function createPracticePlaybackController({
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
}: PracticePlaybackOptions = {}): PlaybackSessionController {
  return createPracticePlaybackAssemblyProvider({
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

export const createDirectPlaybackRuntime = createPracticePlaybackRuntime;
export const createDirectPlaybackController = createPracticePlaybackController;
