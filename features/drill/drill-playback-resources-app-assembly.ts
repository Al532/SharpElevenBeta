// @ts-check

import { createDrillPlaybackPreparationAppContext } from './drill-playback-preparation-app-context.js';
import { createDrillPlaybackResourcesAppFacade } from './drill-playback-resources-app-facade.js';
import './drill-playback-resources-types.js';

/**
 * Creates the app-level playback resource assembly from grouped preparation
 * and audio concerns. This keeps the shared playback-preparation/resource
 * wiring out of `app.js` while preserving the same runtime contracts.
 *
 * @param {import('./drill-playback-resources-types.js').DrillPlaybackResourcesAppContextShape} [options]
 * @returns {{
 *   playbackPreparation: ReturnType<typeof createDrillPlaybackPreparationAppContext>,
 *   playbackResourcesFacade: ReturnType<typeof createDrillPlaybackResourcesAppFacade>
 * }}
 */
export function createDrillPlaybackResourcesAppAssembly({
  harmony = {},
  progressionState = {},
  playbackSettings = {},
  runtime = {},
  audioFacade = {}
} = {}) {
  const playbackPreparation = createDrillPlaybackPreparationAppContext({
    harmony,
    progressionState,
    playbackSettings,
    runtime
  });

  const playbackResourcesFacade = createDrillPlaybackResourcesAppFacade({
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
