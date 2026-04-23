// @ts-check

import { createDrillSettingsAppAssembly } from './drill-settings-app-assembly.js';
import { createDrillSettingsAppBindings } from './drill-settings-app-bindings.js';
import { createDrillSettingsAppContextOptions } from './drill-settings-app-context.js';
import { createDrillSettingsConstantsAppContext } from './drill-settings-constants-app-context.js';
import { createDrillSettingsDefaultsAppContext } from './drill-settings-defaults-app-context.js';
import { createDrillSettingsLoadApplierHelpersAppContext } from './drill-settings-load-applier-helpers-app-context.js';
import { createDrillSettingsRuntimeAppBindings } from './drill-settings-runtime-app-bindings.js';
import { createDrillSettingsSnapshotHelpersAppContext } from './drill-settings-snapshot-helpers-app-context.js';
import { createDrillSettingsStateAppContext } from './drill-settings-state-app-context.js';

/**
 * Creates the drill settings assembly from live root-app bindings.
 * This keeps the large settings persistence/runtime contract out of `app.js`
 * while preserving the existing settings app-context/bindings layers.
 *
 * @param {object} [options]
 * @param {Record<string, any>} [options.defaults]
 * @param {Record<string, any>} [options.dom]
 * @param {Record<string, any>} [options.snapshotConstants]
 * @param {Record<string, any>} [options.snapshotState]
 * @param {Record<string, any>} [options.snapshotHelpers]
 * @param {Record<string, any>} [options.loadApplierConstants]
 * @param {Record<string, any>} [options.loadApplierState]
 * @param {Record<string, any>} [options.loadApplierHelpers]
 * @param {Record<string, any>} [options.loadFinalizerConstants]
 * @param {Record<string, any>} [options.loadFinalizerState]
 * @param {Record<string, any>} [options.loadFinalizerHelpers]
 * @param {Record<string, any>} [options.resetterState]
 * @param {Record<string, any>} [options.resetterHelpers]
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
