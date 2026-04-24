import type {
  PracticePlaybackResourcesAudioFacade,
  PracticePlaybackResourcesPreparationFacade
} from './practice-playback-resources-types.js';

type PracticePlaybackResourcesAppFacadeOptions = {
  audioFacade?: PracticePlaybackResourcesAudioFacade;
  playbackPreparation?: PracticePlaybackResourcesPreparationFacade;
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
export function createPracticePlaybackResourcesAppFacade({
  audioFacade = {},
  playbackPreparation = {}
}: PracticePlaybackResourcesAppFacadeOptions = {}) {
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


