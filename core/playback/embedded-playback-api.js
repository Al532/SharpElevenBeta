// @ts-check

/** @typedef {import('../types/contracts').EmbeddedPlaybackApi} EmbeddedPlaybackApi */
/** @typedef {import('../types/contracts').EmbeddedPatternPayload} EmbeddedPatternPayload */
/** @typedef {import('../types/contracts').EmbeddedPlaybackRuntimeState} EmbeddedPlaybackRuntimeState */
/** @typedef {import('../types/contracts').PlaybackRuntime} PlaybackRuntime */
/** @typedef {import('../types/contracts').PlaybackOperationResult} PlaybackOperationResult */
/** @typedef {import('../types/contracts').PlaybackSessionController} PlaybackSessionController */

/**
 * Creates the embedded playback API surface exposed to legacy consumers.
 * This is the bridge-facing API shape shared by the embedded Drill runtime.
 *
 * @param {{
 *   playbackRuntime?: PlaybackRuntime,
 *   playbackController?: PlaybackSessionController,
 *   applyEmbeddedPattern?: (payload: EmbeddedPatternPayload) => PlaybackOperationResult | Promise<PlaybackOperationResult>,
 *   getPlaybackState?: () => EmbeddedPlaybackRuntimeState
 * }} [options]
 * @returns {EmbeddedPlaybackApi}
 */
export function createEmbeddedPlaybackApi({
  playbackRuntime,
  playbackController,
  applyEmbeddedPattern,
  getPlaybackState
} = {}) {
  const resolvedPlaybackController = playbackController || playbackRuntime?.ensurePlaybackController?.() || null;
  if (!resolvedPlaybackController) {
    throw new Error('A playback controller is required.');
  }

  return {
    version: 2,
    applyEmbeddedPattern,
    applyEmbeddedPlaybackSettings(options = {}) {
      return resolvedPlaybackController.updatePlaybackSettings(options);
    },
    getPlaybackState,
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
