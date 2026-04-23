// @ts-check

import { initializeDrillPianoControls } from './drill-piano-tools.js';
import { initializeDrillRuntimeControls } from './drill-runtime-controls.js';
import { initializeDrillScreen } from './drill-ui-shell.js';
import { initializeHarmonyDisplayObservers } from './drill-ui-runtime.js';

/**
 * Creates the drill UI bootstrap assembly from live root-app bindings.
 * This keeps the late screen/control/observer initialization contracts out of
 * `app.js` while preserving the same one-shot drill UI bootstrap behavior.
 *
 * @param {object} [options]
 * @param {Record<string, any>} [options.screen]
 * @param {Record<string, any>} [options.harmonyDisplayObservers]
 * @param {Record<string, any>} [options.pianoControls]
 * @param {Record<string, any>} [options.runtimeControls]
 */
export function createDrillUiBootstrapRootAppAssembly({
  screen = {},
  harmonyDisplayObservers = {},
  pianoControls = {},
  runtimeControls = {}
} = {}) {
  return {
    initializeScreen: () => initializeDrillScreen(screen),
    initializeHarmonyDisplayObservers: () => initializeHarmonyDisplayObservers(harmonyDisplayObservers),
    initializePianoControls: () => initializeDrillPianoControls(pianoControls),
    initializeRuntimeControls: () => initializeDrillRuntimeControls(runtimeControls)
  };
}
