// @ts-check

/**
 * Creates an app-facing facade around playback preparation and audio-preload
 * helpers so `app.js` can consume stable resource methods without re-declaring
 * thin wrappers.
 *
 * @param {object} [options]
 * @param {Record<string, any>} [options.audioFacade]
 * @param {Record<string, any>} [options.playbackPreparation]
 */
export function createDrillPlaybackResourcesAppFacade({
  audioFacade = {},
  playbackPreparation = {}
} = {}) {
  return {
    rebuildPreparedCompingPlans: playbackPreparation.rebuildPreparedCompingPlans,
    ensureWalkingBassGenerator: playbackPreparation.ensureWalkingBassGenerator,
    buildPreparedBassPlan: playbackPreparation.buildPreparedBassPlan,
    preloadStartupSamples: audioFacade.preloadStartupSamples,
    preloadNearTermSamples: audioFacade.preloadNearTermSamples,
    ensureNearTermSamplePreload: audioFacade.ensureNearTermSamplePreload,
    ensurePageSampleWarmup: audioFacade.ensurePageSampleWarmup,
    ensureBackgroundSamplePreload: audioFacade.ensureBackgroundSamplePreload
  };
}
