type AnalyticsProps = Record<string, unknown>;

type TrackEventOptions = {
  includePropsInPath?: boolean
};

let analyticsDebugEnabled = false;

export function getAnalyticsDebugEnabled() {
  return analyticsDebugEnabled;
}

export function setAnalyticsDebugEnabled(enabled: boolean) {
  analyticsDebugEnabled = Boolean(enabled);
}

export function initAnalytics() {}

export function trackEvent(_name: string, _props: AnalyticsProps = {}, _options: TrackEventOptions = {}) {}
