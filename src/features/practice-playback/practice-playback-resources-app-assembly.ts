// @ts-check

import { createPracticePlaybackPreparationAppContext } from './practice-playback-preparation-app-context.js';
import { createPracticePlaybackResourcesAppFacade } from './practice-playback-resources-app-facade.js';
import './practice-playback-resources-types.js';

/**
 * Creates the app-level playback resource assembly from grouped preparation
 * and audio concerns. This keeps the shared playback-preparation/resource
 * wiring out of `app.js` while preserving the same runtime contracts.
 *
 * @param {import('./practice-playback-resources-types.js').PracticePlaybackResourcesAppContextShape} [options]
 * @returns {{
 *   playbackPreparation: ReturnType<typeof createPracticePlaybackPreparationAppContext>,
 *   playbackResourcesFacade: ReturnType<typeof createPracticePlaybackResourcesAppFacade>
 * }}
 */
export function createPracticePlaybackResourcesAppAssembly({
  harmony = {},
  progressionState = {},
  playbackSettings = {},
  runtime = {},
  audioFacade = {}
} = {}) {
  const playbackPreparation = createPracticePlaybackPreparationAppContext({
    harmony,
    progressionState,
    playbackSettings,
    runtime
  });

  const playbackResourcesFacade = createPracticePlaybackResourcesAppFacade({
    audioFacade,
    playbackPreparation: {
      rebuildPreparedCompingPlans: playbackPreparation.rebuildPreparedCompingPlans,
      ensureWalkingBassGenerator: playbackPreparation.ensureWalkingBassGenerator,
      buildPreparedBassPlan: playbackPreparation.buildPreparedBassPlan
    }
  });

  return {
    playbackPreparation,
    playbackResourcesFacade
  };
}
