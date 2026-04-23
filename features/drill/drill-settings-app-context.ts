type DrillSettingsAppContextOptions = {
  defaults?: Record<string, any>;
  dom?: Record<string, any>;
  snapshotConstants?: Record<string, any>;
  snapshotState?: Record<string, any>;
  snapshotHelpers?: Record<string, any>;
  loadApplierConstants?: Record<string, any>;
  loadApplierState?: Record<string, any>;
  loadApplierHelpers?: Record<string, any>;
  loadFinalizerConstants?: Record<string, any>;
  loadFinalizerState?: Record<string, any>;
  loadFinalizerHelpers?: Record<string, any>;
  resetterState?: Record<string, any>;
  resetterHelpers?: Record<string, any>;
};

function cloneOptions(options: Record<string, any> = {}) {
  return { ...options };
}

export function createDrillSettingsDefaultsAppContext(
  options: Record<string, any> = {}
) {
  return cloneOptions(options);
}

export function createDrillSettingsConstantsAppContext(
  options: Record<string, any> = {}
) {
  return cloneOptions(options);
}

export function createDrillSettingsSnapshotHelpersAppContext(options: Record<string, any> = {}) {
  return cloneOptions(options);
}

export function createDrillSettingsLoadApplierHelpersAppContext(options: Record<string, any> = {}) {
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
