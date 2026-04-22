// @ts-check

import { createDrillPlaybackPreparationAppContext } from './drill-playback-preparation-app-context.js';
import { createDrillPlaybackResourcesAppFacade } from './drill-playback-resources-app-facade.js';

/**
 * Creates the app-level playback resource assembly from grouped preparation
 * and audio concerns. This keeps the shared playback-preparation/resource
 * wiring out of `app.js` while preserving the same runtime contracts.
 *
 * @param {{
 *   harmony?: Record<string, any>,
 *   progressionState?: Record<string, any>,
 *   playbackSettings?: Record<string, any>,
 *   runtime?: Record<string, any>,
 *   audioFacade?: Record<string, any>
 * }} [options]
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
