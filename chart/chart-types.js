function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

export const CHART_DOCUMENT_SCHEMA_VERSION = '1.0.0';
export const CHART_PLAYBACK_PLAN_SCHEMA_VERSION = '1.0.0';

export function createChartDocument({
  metadata,
  source,
  sections,
  bars
}) {
  return {
    schemaVersion: CHART_DOCUMENT_SCHEMA_VERSION,
    metadata: deepClone(metadata),
    source: deepClone(source),
    sections: deepClone(sections),
    bars: deepClone(bars)
  };
}

export function createChartPlaybackPlan({
  document,
  entries,
  diagnostics = [],
  navigation = {}
}) {
  return {
    schemaVersion: CHART_PLAYBACK_PLAN_SCHEMA_VERSION,
    chartTitle: document?.metadata?.title || '',
    chartId: document?.metadata?.id || '',
    timeSignature: document?.metadata?.primaryTimeSignature || '',
    navigation: deepClone(navigation),
    diagnostics: deepClone(diagnostics),
    entries: deepClone(entries)
  };
}

export function cloneChartDocument(chartDocument) {
  return deepClone(chartDocument);
}

export function clonePlaybackPlan(playbackPlan) {
  return deepClone(playbackPlan);
}
