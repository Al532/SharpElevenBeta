type DrillSettingsStateAppContextOptions = {
  snapshotState?: Record<string, any>;
  snapshotHelpers?: Record<string, any>;
  loadApplierState?: Record<string, any>;
  loadApplierHelpers?: Record<string, any>;
  loadFinalizerState?: Record<string, any>;
  loadFinalizerHelpers?: Record<string, any>;
  resetterState?: Record<string, any>;
  resetterHelpers?: Record<string, any>;
};

export function createDrillSettingsStateAppContext({
  snapshotState = {},
  snapshotHelpers = {},
  loadApplierState = {},
  loadApplierHelpers = {},
  loadFinalizerState = {},
  loadFinalizerHelpers = {},
  resetterState = {},
  resetterHelpers = {}
}: DrillSettingsStateAppContextOptions = {}) {
  return {
    snapshotState,
    snapshotHelpers,
    loadApplierState,
    loadApplierHelpers,
    loadFinalizerState,
    loadFinalizerHelpers,
    resetterState,
    resetterHelpers
  };
}
