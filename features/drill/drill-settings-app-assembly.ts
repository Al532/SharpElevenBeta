
import {
  createDefaultDrillAppSettingsFactory,
  createDrillLoadedSettingsApplier,
  createDrillLoadedSettingsFinalizer,
  createDrillPlaybackSettingsResetter,
  createDrillSettingsSnapshotBuilder
} from './drill-settings.js';

type DrillSettingsAssemblySection = {
  constants?: Record<string, unknown>;
  dom?: Record<string, unknown>;
  state?: Record<string, unknown>;
  helpers?: Record<string, unknown>;
};

type CreateDrillSettingsAppAssemblyOptions = {
  defaults?: Record<string, unknown>;
  snapshot?: DrillSettingsAssemblySection;
  loadApplier?: DrillSettingsAssemblySection;
  loadFinalizer?: DrillSettingsAssemblySection;
  resetter?: {
    dom?: Record<string, unknown>;
    state?: Record<string, unknown>;
    helpers?: Record<string, unknown>;
  };
};

/**
 * Creates the app-level settings helpers used by the drill screen from grouped
 * state, DOM, and behavior bindings.
 *
 * This keeps the settings assembly out of `app.js` while preserving the same
 * low-level builders and runtime behavior.
 *
 * @param {{
 *   defaults?: Record<string, any>,
 *   snapshot?: {
 *     constants?: Record<string, any>,
 *     dom?: Record<string, any>,
 *     state?: Record<string, any>,
 *     helpers?: Record<string, any>
 *   },
 *   loadApplier?: {
 *     constants?: Record<string, any>,
 *     dom?: Record<string, any>,
 *     state?: Record<string, any>,
 *     helpers?: Record<string, any>
 *   },
 *   loadFinalizer?: {
 *     constants?: Record<string, any>,
 *     dom?: Record<string, any>,
 *     state?: Record<string, any>,
 *     helpers?: Record<string, any>
 *   },
 *   resetter?: {
 *     dom?: Record<string, any>,
 *     state?: Record<string, any>,
 *     helpers?: Record<string, any>
 *   }
 * }} [options]
 * @returns {{
 *   createDefaultAppSettings: ReturnType<typeof createDefaultDrillAppSettingsFactory>,
 *   buildSettingsSnapshot: ReturnType<typeof createDrillSettingsSnapshotBuilder>,
 *   applyLoadedSettings: ReturnType<typeof createDrillLoadedSettingsApplier>,
 *   finalizeLoadedSettings: ReturnType<typeof createDrillLoadedSettingsFinalizer>,
 *   resetPlaybackSettings: ReturnType<typeof createDrillPlaybackSettingsResetter>
 * }}
 */
export function createDrillSettingsAppAssembly({
  defaults = {},
  snapshot = {},
  loadApplier = {},
  loadFinalizer = {},
  resetter = {}
}: CreateDrillSettingsAppAssemblyOptions = {}) {
  const createDefaultAppSettings = createDefaultDrillAppSettingsFactory(defaults);

  return {
    createDefaultAppSettings,
    buildSettingsSnapshot: createDrillSettingsSnapshotBuilder({
      constants: snapshot.constants,
      dom: snapshot.dom,
      state: snapshot.state,
      helpers: snapshot.helpers
    }),
    applyLoadedSettings: createDrillLoadedSettingsApplier({
      constants: loadApplier.constants,
      dom: loadApplier.dom,
      state: loadApplier.state,
      helpers: loadApplier.helpers
    }),
    finalizeLoadedSettings: createDrillLoadedSettingsFinalizer({
      constants: loadFinalizer.constants,
      dom: loadFinalizer.dom,
      state: loadFinalizer.state,
      helpers: loadFinalizer.helpers
    }),
    resetPlaybackSettings: createDrillPlaybackSettingsResetter({
      dom: resetter.dom,
      state: resetter.state,
      helpers: {
        createDefaultAppSettings,
        ...(resetter.helpers || {})
      }
    })
  };
}


