type DrillRuntimeStateAppContextOptions = {
  keyPoolState?: Record<string, any>;
  sessionAnalyticsDom?: Record<string, any>;
  sessionAnalyticsState?: Record<string, any>;
  sessionAnalyticsHelpers?: Record<string, any>;
  sessionAnalyticsConstants?: Record<string, any>;
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
