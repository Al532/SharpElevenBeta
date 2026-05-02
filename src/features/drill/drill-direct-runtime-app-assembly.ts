import type {
  DirectPlaybackControllerOptions,
  EmbeddedPatternPayload,
  PlaybackOperationResult,
  PlaybackRuntimeState,
  PlaybackSettings
} from '../../core/types/contracts';

import { createDirectDrillRuntimeAppContextOptions } from './drill-direct-runtime-app-context.js';

type DrillDirectPlaybackRuntime = {
  ensureWalkingBassGenerator?: DirectPlaybackControllerOptions['ensureWalkingBassGenerator'];
  getAudioContext?: DirectPlaybackControllerOptions['getAudioContext'];
  noteFadeout?: DirectPlaybackControllerOptions['noteFadeout'];
  stopActiveChordVoices?: DirectPlaybackControllerOptions['stopActiveChordVoices'];
  rebuildPreparedCompingPlans?: DirectPlaybackControllerOptions['rebuildPreparedCompingPlans'];
  buildPreparedBassPlan?: DirectPlaybackControllerOptions['buildPreparedBassPlan'];
  getCurrentKey?: DirectPlaybackControllerOptions['getCurrentKey'];
  preloadNearTermSamples?: DirectPlaybackControllerOptions['preloadNearTermSamples'];
  queuePerformanceCue?: DirectPlaybackControllerOptions['queuePerformanceCue'];
  validateCustomPattern?: DirectPlaybackControllerOptions['validateCustomPattern'];
};

type DrillDirectPlaybackState = {
  getIsPlaying?: DirectPlaybackControllerOptions['isPlaying'];
};

type DrillDirectTransportActions = {
  startPlayback?: () => Promise<void> | void;
  stopPlayback?: () => void;
  togglePausePlayback?: () => void;
};

export function createDrillDirectRuntimeAppAssembly({
  embedded = {},
  playbackRuntime = {},
  playbackState = {},
  transportActions = {}
}: {
  embedded?: {
    applyEmbeddedPattern?: (payload: Partial<EmbeddedPatternPayload>) => PlaybackOperationResult;
    applyEmbeddedPlaybackSettings?: (settings: PlaybackSettings) => unknown;
    getEmbeddedPlaybackState?: () => Partial<PlaybackRuntimeState> | null | undefined;
  };
  playbackRuntime?: DrillDirectPlaybackRuntime;
  playbackState?: DrillDirectPlaybackState;
  transportActions?: DrillDirectTransportActions;
} = {}): DirectPlaybackControllerOptions {
  return createDirectDrillRuntimeAppContextOptions({
    applyEmbeddedPattern: embedded.applyEmbeddedPattern,
    applyEmbeddedPlaybackSettings: embedded.applyEmbeddedPlaybackSettings,
    getEmbeddedPlaybackState: embedded.getEmbeddedPlaybackState,
    playbackRuntime,
    playbackState,
    transportActions
  });
}
