export function createEmbeddedDrillApi({
  playbackController,
  applyEmbeddedPattern,
  getPlaybackState
} = {}) {
  if (!playbackController) {
    throw new Error('A playback controller is required.');
  }

  return {
    version: 2,
    applyEmbeddedPattern,
    applyEmbeddedPlaybackSettings(options = {}) {
      return playbackController.updatePlaybackSettings(options);
    },
    getPlaybackState,
    startPlayback() {
      return playbackController.start();
    },
    stopPlayback() {
      return playbackController.stop();
    },
    togglePausePlayback() {
      return playbackController.pauseToggle();
    }
  };
}
