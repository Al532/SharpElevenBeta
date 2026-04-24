// @ts-check

import { createDrillPlaybackResourcesAppAssembly } from './drill-playback-resources-app-assembly.js';
import { createDrillPlaybackResourcesAppBindings } from './drill-playback-resources-app-bindings.js';
import { createDrillPlaybackResourcesAppContext } from './drill-playback-resources-app-context.js';
import { createDrillPlaybackResourcesHarmonyAppContext } from './drill-playback-resources-harmony-app-context.js';
import { createDrillPlaybackResourcesProgressionStateAppContext } from './drill-playback-resources-progression-state-app-context.js';
import { createDrillPlaybackResourcesRuntimeAppBindings } from './drill-playback-resources-runtime-app-bindings.js';
import { createDrillPlaybackResourcesRuntimeAppContext } from './drill-playback-resources-runtime-app-context.js';
import { createDrillPlaybackResourcesRuntimeEngineAppContext } from './drill-playback-resources-runtime-engine-app-context.js';
import { createDrillPlaybackResourcesSettingsAppContext } from './drill-playback-resources-settings-app-context.js';
import { createDrillPlaybackResourcesStateAppContext } from './drill-playback-resources-state-app-context.js';

/**
 * Creates the drill playback resources assembly from live root-app bindings.
 * This keeps the playback-preparation/resources contract out of `app.js`
 * while preserving the existing app-context and bindings layers.
 *
 * @param {Parameters<typeof createDrillPlaybackResourcesAppBindings>[0]} [options]
 * @returns {ReturnType<typeof createDrillPlaybackResourcesAppAssembly>}
 */
export function createDrillPlaybackResourcesRootAppAssembly({
  harmony = {},
  progressionState = {},
  playbackSettings = {},
  runtime = {},
  audioFacade = {}
} = {}) {
  return createDrillPlaybackResourcesAppAssembly(
    createDrillPlaybackResourcesAppBindings(
      createDrillPlaybackResourcesRuntimeAppBindings(
        createDrillPlaybackResourcesRuntimeAppContext(
          createDrillPlaybackResourcesAppContext(
            createDrillPlaybackResourcesStateAppContext({
              harmony: createDrillPlaybackResourcesHarmonyAppContext(harmony),
              progressionState: createDrillPlaybackResourcesProgressionStateAppContext(progressionState),
              playbackSettings: createDrillPlaybackResourcesSettingsAppContext(playbackSettings),
              runtime: createDrillPlaybackResourcesRuntimeEngineAppContext(runtime),
              audioFacade
            })
          )
        )
      )
    )
  );
}
