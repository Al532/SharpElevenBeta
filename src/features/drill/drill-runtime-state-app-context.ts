type DrillRuntimeStateAppContextOptions = {
  keyPoolState?: Record<string, unknown>;
  sessionAnalyticsDom?: Record<string, unknown>;
  sessionAnalyticsState?: Record<string, unknown>;
  sessionAnalyticsHelpers?: Record<string, unknown>;
  sessionAnalyticsConstants?: Record<string, unknown>;
  sessionAnalyticsNow?: (() => number) | undefined;
};

export function createDrillRuntimeStateAppContextOptions({
  keyPoolState = {},
  sessionAnalyticsDom = {},
  sessionAnalyticsState = {},
  sessionAnalyticsHelpers = {},
  sessionAnalyticsConstants = {},
  sessionAnalyticsNow
}: DrillRuntimeStateAppContextOptions = {}) {
  return {
    keyPool: keyPoolState,
    sessionAnalytics: {
      dom: sessionAnalyticsDom,
      state: sessionAnalyticsState,
      helpers: sessionAnalyticsHelpers,
      constants: sessionAnalyticsConstants,
      now: sessionAnalyticsNow
    }
  };
}
