type DrillSettingsUnknownMap = Record<string, unknown>;

type DrillSettingsAppContextOptions = {
  defaults?: DrillSettingsUnknownMap;
  dom?: DrillSettingsUnknownMap;
  snapshotConstants?: DrillSettingsUnknownMap;
  snapshotState?: DrillSettingsUnknownMap;
  snapshotHelpers?: DrillSettingsUnknownMap;
  loadApplierConstants?: DrillSettingsUnknownMap;
  loadApplierState?: DrillSettingsUnknownMap;
  loadApplierHelpers?: DrillSettingsUnknownMap;
  loadFinalizerConstants?: DrillSettingsUnknownMap;
  loadFinalizerState?: DrillSettingsUnknownMap;
  loadFinalizerHelpers?: DrillSettingsUnknownMap;
  resetterState?: DrillSettingsUnknownMap;
  resetterHelpers?: DrillSettingsUnknownMap;
};

function cloneOptions<T extends DrillSettingsUnknownMap>(options: T = {} as T): T {
  return { ...options };
}

export function createDrillSettingsDefaultsAppContext(
  options: DrillSettingsUnknownMap = {}
) {
  return cloneOptions(options);
}

export function createDrillSettingsConstantsAppContext(
  options: DrillSettingsUnknownMap = {}
) {
  return cloneOptions(options);
}

export function createDrillSettingsSnapshotHelpersAppContext(options: DrillSettingsUnknownMap = {}) {
  return cloneOptions(options);
}

export function createDrillSettingsLoadApplierHelpersAppContext(options: DrillSettingsUnknownMap = {}) {
  return cloneOptions(options);
}

export function createDrillSettingsAppContextOptions({
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
}: DrillSettingsAppContextOptions = {}) {
  return {
    defaults,
    snapshot: {
      constants: snapshotConstants,
      dom,
      state: snapshotState,
      helpers: snapshotHelpers
    },
    loadApplier: {
      constants: loadApplierConstants,
      dom,
      state: loadApplierState,
      helpers: loadApplierHelpers
    },
    loadFinalizer: {
      constants: loadFinalizerConstants,
      dom,
      state: loadFinalizerState,
      helpers: loadFinalizerHelpers
    },
    resetter: {
      dom,
      state: resetterState,
      helpers: resetterHelpers
    }
  };
}
