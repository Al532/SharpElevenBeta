// @ts-check

import { createDrillRuntimePrimitivesAppAssembly } from './drill-runtime-primitives-app-assembly.js';
import { createDrillRuntimePrimitivesAppBindings } from './drill-runtime-primitives-app-bindings.js';
import { createDrillRuntimePrimitivesRuntimeAppBindings } from './drill-runtime-primitives-runtime-app-bindings.js';
import { createDrillRuntimePrimitivesAppContextOptions } from './drill-runtime-primitives-app-context.js';

/**
 * Creates the full root-level runtime-primitives assembly from live app
 * bindings. This keeps the pattern-analysis and playback-settings contracts
 * out of `app.js` while preserving the existing app-context/bindings layers.
 *
 * @param {object} [options]
 * @param {Record<string, any>} [options.patternAnalysisConstants]
 * @param {Record<string, any>} [options.playbackSettingsDom]
 * @param {Record<string, any>} [options.playbackSettingsMixer]
 * @param {Record<string, any>} [options.playbackSettingsHelpers]
 * @param {Record<string, any>} [options.playbackSettingsConstants]
 */
export function createDrillRuntimePrimitivesRootAppAssembly({
  patternAnalysisConstants = {},
  playbackSettingsDom = {},
  playbackSettingsMixer = {},
  playbackSettingsHelpers = {},
  playbackSettingsConstants = {}
} = {}) {
  return createDrillRuntimePrimitivesAppAssembly(
    createDrillRuntimePrimitivesAppBindings(
      createDrillRuntimePrimitivesRuntimeAppBindings(
        createDrillRuntimePrimitivesAppContextOptions({
          patternAnalysisConstants,
          playbackSettingsDom,
          playbackSettingsMixer,
          playbackSettingsHelpers,
          playbackSettingsConstants
        })
      )
    )
  );
}
