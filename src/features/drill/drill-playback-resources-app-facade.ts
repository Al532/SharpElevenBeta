import type {
  DrillPlaybackResourcesAudioFacade,
  DrillPlaybackResourcesPreparationFacade
} from './drill-playback-resources-types.js';

type DrillPlaybackResourcesAppFacadeOptions = {
  audioFacade?: DrillPlaybackResourcesAudioFacade;
  playbackPreparation?: DrillPlaybackResourcesPreparationFacade;
};

/**
 * Creates an app-facing facade around playback preparation and audio-preload
 * helpers so `app.js` can consume stable resource methods without re-declaring
 * thin wrappers.
 *
 * @param {object} [options]
 * @param {object} [options.audioFacade]
 * @param {object} [options.playbackPreparation]
 */
export function createDrillPlaybackResourcesAppFacade({
  audioFacade = {},
  playbackPreparation = {}
}: DrillPlaybackResourcesAppFacadeOptions = {}) {
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


