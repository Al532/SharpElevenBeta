type DrillSettingsStateAppContextOptions = {
  snapshotState?: Record<string, unknown>;
  snapshotHelpers?: Record<string, unknown>;
  loadApplierState?: Record<string, unknown>;
  loadApplierHelpers?: Record<string, unknown>;
  loadFinalizerState?: Record<string, unknown>;
  loadFinalizerHelpers?: Record<string, unknown>;
  resetterState?: Record<string, unknown>;
  resetterHelpers?: Record<string, unknown>;
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
