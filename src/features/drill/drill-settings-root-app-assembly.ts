// @ts-check

import { createDrillSettingsAppAssembly } from './drill-settings-app-assembly.js';
import { createDrillSettingsAppBindings } from './drill-settings-app-bindings.js';
import {
  createDrillSettingsAppContextOptions,
  createDrillSettingsConstantsAppContext,
  createDrillSettingsDefaultsAppContext,
  createDrillSettingsLoadApplierHelpersAppContext,
  createDrillSettingsSnapshotHelpersAppContext
} from './drill-settings-app-context.js';
import { createDrillSettingsRuntimeAppBindings } from './drill-settings-runtime-app-bindings.js';
import { createDrillSettingsStateAppContext } from './drill-settings-state-app-context.js';

/**
 * Creates the drill settings assembly from live root-app bindings.
 * This keeps the large settings persistence/runtime contract out of `app.js`
 * while preserving the existing settings app-context/bindings layers.
 *
 * @param {object} [options]
 * @param {Record<string, unknown>} [options.defaults]
 * @param {Record<string, unknown>} [options.dom]
 * @param {Record<string, unknown>} [options.snapshotConstants]
 * @param {Record<string, unknown>} [options.snapshotState]
 * @param {Record<string, unknown>} [options.snapshotHelpers]
 * @param {Record<string, unknown>} [options.loadApplierConstants]
 * @param {Record<string, unknown>} [options.loadApplierState]
 * @param {Record<string, unknown>} [options.loadApplierHelpers]
 * @param {Record<string, unknown>} [options.loadFinalizerConstants]
 * @param {Record<string, unknown>} [options.loadFinalizerState]
 * @param {Record<string, unknown>} [options.loadFinalizerHelpers]
 * @param {Record<string, unknown>} [options.resetterState]
 * @param {Record<string, unknown>} [options.resetterHelpers]
 */
export function createDrillSettingsRootAppAssembly({
  defaults = {},
  dom = {},
  snapshotConstants = {},
  snapshotState = {},
  snapshotHelpers = {},
  loadApplierConstants = {},
  loadApplierState = {},
  loadApplierHelpers = {},
  loadFinalizerConstants = {},
  loadFinalizerState = {},
  loadFinalizerHelpers = {},
  resetterState = {},
  resetterHelpers = {}
} = {}) {
  return createDrillSettingsAppAssembly(
    createDrillSettingsAppBindings(
      createDrillSettingsRuntimeAppBindings(
        createDrillSettingsAppContextOptions({
          defaults: createDrillSettingsDefaultsAppContext(defaults),
          dom,
          snapshotConstants: createDrillSettingsConstantsAppContext(snapshotConstants),
          ...createDrillSettingsStateAppContext({
            snapshotState,
            snapshotHelpers: createDrillSettingsSnapshotHelpersAppContext(snapshotHelpers),
            loadApplierState,
            loadApplierHelpers: createDrillSettingsLoadApplierHelpersAppContext(loadApplierHelpers),
            loadFinalizerState,
            loadFinalizerHelpers,
            resetterState,
            resetterHelpers
          }),
          loadApplierConstants: createDrillSettingsConstantsAppContext(loadApplierConstants),
          loadFinalizerConstants: createDrillSettingsConstantsAppContext(loadFinalizerConstants)
        })
      )
    )
  );
}
