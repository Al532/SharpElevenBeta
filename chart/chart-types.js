function deepClone(value) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

function normalizeString(value, fallback = '') {
  return typeof value === 'string' ? value : (value == null ? fallback : String(value));
}

function normalizeNumber(value, fallback = 0) {
  const normalized = Number(value);
  return Number.isFinite(normalized) ? normalized : fallback;
}

function normalizeObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function normalizeArray(value) {
  return Array.isArray(value) ? value : [];
}

export const CHART_DOCUMENT_SCHEMA_VERSION = '1.0.0';
export const CHART_PLAYBACK_PLAN_SCHEMA_VERSION = '1.0.0';

export const CHART_DOCUMENT_CONTRACT = Object.freeze({
  schemaVersion: CHART_DOCUMENT_SCHEMA_VERSION,
  requiredTopLevelFields: ['schemaVersion', 'metadata', 'source', 'sections', 'bars', 'layout'],
  requiredMetadataFields: ['id', 'title', 'composer', 'primaryTimeSignature', 'barCount'],
  notes: [
    'Chart documents are JSON-safe plain objects.',
    'Missing metadata is normalized to stable empty-string/zero defaults.',
    'Sections and bars are always arrays.'
  ]
});

export const CHART_PLAYBACK_PLAN_CONTRACT = Object.freeze({
  schemaVersion: CHART_PLAYBACK_PLAN_SCHEMA_VERSION,
  requiredTopLevelFields: ['schemaVersion', 'chartTitle', 'chartId', 'timeSignature', 'navigation', 'diagnostics', 'entries'],
  notes: [
    'Playback plans are derived, JSON-safe plain objects.',
    'Diagnostics and entries are always arrays.',
    'Navigation is always an object.'
  ]
});

function normalizeChartMetadata(metadata = {}) {
  const safeMetadata = normalizeObject(metadata);
  return {
    ...deepClone(safeMetadata),
    id: normalizeString(safeMetadata.id),
    title: normalizeString(safeMetadata.title),
    composer: normalizeString(safeMetadata.composer),
    primaryTimeSignature: normalizeString(safeMetadata.primaryTimeSignature),
    barCount: normalizeNumber(safeMetadata.barCount, 0)
  };
}

function normalizeChartSource(source = {}) {
  return {
    ...deepClone(normalizeObject(source))
  };
}

function normalizeChartSection(section = {}) {
  const safeSection = normalizeObject(section);
  return {
    ...deepClone(safeSection),
    id: normalizeString(safeSection.id),
    label: normalizeString(safeSection.label),
    occurrence: normalizeNumber(safeSection.occurrence, 0),
    barIds: normalizeArray(safeSection.barIds).map((barId) => normalizeString(barId)).filter(Boolean)
  };
}

function normalizeChartBar(bar = {}) {
  const safeBar = normalizeObject(bar);
  return {
    ...deepClone(safeBar),
    id: normalizeString(safeBar.id),
    index: normalizeNumber(safeBar.index, 0),
    sectionId: normalizeString(safeBar.sectionId),
    sectionLabel: normalizeString(safeBar.sectionLabel),
    timeSignature: safeBar.timeSignature == null ? null : normalizeString(safeBar.timeSignature)
  };
}

export function createChartDocument({
  metadata,
  source,
  sections,
  bars,
  layout = null
} = {}) {
  return {
    schemaVersion: CHART_DOCUMENT_SCHEMA_VERSION,
    metadata: normalizeChartMetadata(metadata),
    source: normalizeChartSource(source),
    sections: normalizeArray(sections).map(normalizeChartSection),
    bars: normalizeArray(bars).map(normalizeChartBar),
    layout: layout == null ? null : deepClone(layout)
  };
}

export function createChartPlaybackPlan({
  document,
  entries,
  diagnostics = [],
  navigation = {}
} = {}) {
  const safeDocument = document && typeof document === 'object' ? document : {};
  return {
    schemaVersion: CHART_PLAYBACK_PLAN_SCHEMA_VERSION,
    chartTitle: normalizeString(safeDocument?.metadata?.title),
    chartId: normalizeString(safeDocument?.metadata?.id),
    timeSignature: normalizeString(safeDocument?.metadata?.primaryTimeSignature),
    navigation: deepClone(normalizeObject(navigation)),
    diagnostics: deepClone(normalizeArray(diagnostics)),
    entries: deepClone(normalizeArray(entries))
  };
}

export function cloneChartDocument(chartDocument) {
  return createChartDocument(chartDocument);
}

export function clonePlaybackPlan(playbackPlan) {
  return createChartPlaybackPlan({
    document: {
      metadata: {
        id: playbackPlan?.chartId,
        title: playbackPlan?.chartTitle,
        primaryTimeSignature: playbackPlan?.timeSignature
      }
    },
    entries: playbackPlan?.entries,
    diagnostics: playbackPlan?.diagnostics,
    navigation: playbackPlan?.navigation
  });
}
