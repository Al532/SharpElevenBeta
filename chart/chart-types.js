// @ts-check

/** @typedef {import('../core/types/contracts').ChartDocument} ChartDocument */
/** @typedef {import('../core/types/contracts').ChartMetadata} ChartMetadata */
/** @typedef {import('../core/types/contracts').ChartPlaybackDiagnostic} ChartPlaybackDiagnostic */
/** @typedef {import('../core/types/contracts').ChartPlaybackEntry} ChartPlaybackEntry */
/** @typedef {import('../core/types/contracts').ChartPlaybackNavigation} ChartPlaybackNavigation */
/** @typedef {import('../core/types/contracts').ChartPlaybackPlan} ChartPlaybackPlan */
/** @typedef {import('../core/types/contracts').ChartSection} ChartSection */
/** @typedef {import('../core/types/contracts').ChartBar} ChartBar */

/**
 * @param {any} value
 * @returns {any}
 */
function deepClone(value) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

/**
 * @param {any} value
 * @param {string} [fallback]
 * @returns {string}
 */
function normalizeString(value, fallback = '') {
  return typeof value === 'string' ? value : (value == null ? fallback : String(value));
}

/**
 * @param {any} value
 * @param {number} [fallback]
 * @returns {number}
 */
function normalizeNumber(value, fallback = 0) {
  const normalized = Number(value);
  return Number.isFinite(normalized) ? normalized : fallback;
}

/**
 * @param {any} value
 * @returns {Record<string, any>}
 */
function normalizeObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

/**
 * @param {any} value
 * @returns {any[]}
 */
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

/**
 * @param {Partial<ChartMetadata>} [metadata]
 * @returns {ChartMetadata}
 */
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

/**
 * @param {Record<string, unknown>} [source]
 * @returns {Record<string, unknown>}
 */
function normalizeChartSource(source = {}) {
  return {
    ...deepClone(normalizeObject(source))
  };
}

/**
 * @param {Partial<ChartSection>} [section]
 * @returns {ChartSection}
 */
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

/**
 * @param {Partial<ChartBar>} [bar]
 * @returns {ChartBar}
 */
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

/**
 * @param {Partial<ChartPlaybackNavigation>} [navigation]
 * @returns {ChartPlaybackNavigation}
 */
function normalizeChartPlaybackNavigation(navigation = {}) {
  const safeNavigation = normalizeObject(navigation);
  return {
    ...deepClone(safeNavigation),
    segnoIndex: Number.isInteger(safeNavigation.segnoIndex) ? Number(safeNavigation.segnoIndex) : null,
    codaIndex: Number.isInteger(safeNavigation.codaIndex) ? Number(safeNavigation.codaIndex) : null
  };
}

/**
 * @param {{
 *   metadata?: Partial<ChartMetadata>,
 *   source?: Record<string, unknown>,
 *   sections?: Partial<ChartSection>[],
 *   bars?: Partial<ChartBar>[],
 *   layout?: Record<string, unknown> | null
 * }} [options]
 * @returns {ChartDocument}
 */
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

/**
 * @param {{
 *   document?: { metadata?: Partial<ChartMetadata> },
 *   entries?: ChartPlaybackEntry[],
 *   diagnostics?: ChartPlaybackDiagnostic[],
 *   navigation?: ChartPlaybackNavigation
 * }} [options]
 * @returns {ChartPlaybackPlan}
 */
export function createChartPlaybackPlan({
  document,
  entries,
  diagnostics = [],
  navigation = { segnoIndex: null, codaIndex: null }
} = {}) {
  const safeDocument = document && typeof document === 'object' ? document : {};
  return {
    schemaVersion: CHART_PLAYBACK_PLAN_SCHEMA_VERSION,
    chartTitle: normalizeString(safeDocument?.metadata?.title),
    chartId: normalizeString(safeDocument?.metadata?.id),
    timeSignature: normalizeString(safeDocument?.metadata?.primaryTimeSignature),
    navigation: normalizeChartPlaybackNavigation(navigation),
    diagnostics: deepClone(normalizeArray(diagnostics)),
    entries: deepClone(normalizeArray(entries))
  };
}

/**
 * @param {ChartDocument} chartDocument
 * @returns {ChartDocument}
 */
export function cloneChartDocument(chartDocument) {
  return createChartDocument(chartDocument);
}

/**
 * @param {ChartPlaybackPlan} playbackPlan
 * @returns {ChartPlaybackPlan}
 */
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
