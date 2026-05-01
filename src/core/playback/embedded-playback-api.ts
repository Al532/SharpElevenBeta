import type {
  EmbeddedPatternPayload,
  EmbeddedPlaybackApi,
  EmbeddedPlaybackRuntimeState,
  PlaybackOperationResult,
  PlaybackRuntime,
  ChartPerformanceCue,
  PlaybackSessionController
} from '../types/contracts';

export function createEmbeddedPlaybackApi({
  playbackRuntime,
  playbackController,
  applyEmbeddedPattern,
  queuePerformanceCue,
  getPlaybackState
}: {
  playbackRuntime?: PlaybackRuntime;
  playbackController?: PlaybackSessionController;
  applyEmbeddedPattern?: (
    payload: EmbeddedPatternPayload
  ) => PlaybackOperationResult | Promise<PlaybackOperationResult>;
  queuePerformanceCue?: (cue: ChartPerformanceCue) => PlaybackOperationResult | Promise<PlaybackOperationResult>;
  getPlaybackState?: () => EmbeddedPlaybackRuntimeState;
} = {}): EmbeddedPlaybackApi {
  const resolvedPlaybackController = playbackController || playbackRuntime?.ensurePlaybackController?.() || null;
  if (!resolvedPlaybackController) {
    throw new Error('A playback controller is required.');
  }
  const readPlaybackState =
    typeof getPlaybackState === 'function'
      ? getPlaybackState
      : () => playbackRuntime?.getRuntimeState?.() || resolvedPlaybackController.getState().runtime || null;

  return {
    version: 2,
    applyEmbeddedPattern,
    applyEmbeddedPlaybackSettings(options = {}) {
      return resolvedPlaybackController.updatePlaybackSettings(options);
    },
    queuePerformanceCue(cue) {
      return queuePerformanceCue?.(cue) || resolvedPlaybackController.queuePerformanceCue(cue);
    },
    getPlaybackState: readPlaybackState,
    startPlayback() {
      return resolvedPlaybackController.start();
    },
    stopPlayback() {
      return resolvedPlaybackController.stop();
    },
    togglePausePlayback() {
      return resolvedPlaybackController.pauseToggle();
    }
  };
}
