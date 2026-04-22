import { createEmbeddedDrillApi } from './drill-embedded-api.js';

export function bootstrapEmbeddedDrillApi({
  playbackController,
  applyEmbeddedPattern,
  getPlaybackState
} = {}) {
  const embeddedApi = createEmbeddedDrillApi({
    playbackController,
    applyEmbeddedPattern,
    getPlaybackState
  });

  window.__JPT_DRILL_API__ = embeddedApi;
  window.__JPT_PLAYBACK_SESSION_CONTROLLER__ = playbackController;
  window.dispatchEvent(new CustomEvent('jpt-drill-api-ready'));

  return embeddedApi;
}
