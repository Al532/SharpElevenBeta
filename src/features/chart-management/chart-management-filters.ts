import type { ChartDocument, ChartMetadata, ChartSetlist } from '../../core/types/contracts.js';
import {
  getChartSearchText,
  getChartSourceRefs,
  normalizeChartTextKey
} from '../chart/chart-library.js';
import type { createChartManagementDomRefs } from './chart-management-dom.js';
import {
  FILTER_ACTION_ALL,
  FILTER_SETLIST_NO_SETLIST,
  FILTER_SOURCE_USER_CHARTS,
  FILTER_STYLE_NO_STYLE,
  type ChartManageFilterKey,
  type ChartManageFilterMode,
  type ChartManageFilterOption
} from './chart-management-types.js';

type ChartManagementDomRefs = ReturnType<typeof createChartManagementDomRefs>;

export type ChartManagementFilterState = {
  activeFilters: Record<ChartManageFilterKey, Set<string>>;
  activeModes: Record<ChartManageFilterKey, ChartManageFilterMode>;
};

type ChartManagementDocumentRecord = {
  document: ChartDocument;
  chartId: string;
  sourceNames: string[];
  styleName: string;
  searchText: string;
  titleKey: string;
  composerKey: string;
  styleKey: string;
  tagsKey: string;
  sourceKey: string;
};

export type ChartManagementDocumentIndex = {
  records: ChartManagementDocumentRecord[];
  sources: string[];
  styles: string[];
  hasUserCharts: boolean;
  hasChartsWithoutStyle: boolean;
};

export function createChartManagementFilterState(): ChartManagementFilterState {
  return {
    activeFilters: {
      source: new Set(),
      style: new Set(),
      setlist: new Set()
    },
    activeModes: {
      source: 'all',
      style: 'all',
      setlist: 'all'
    }
  };
}

export function getSelectFilterOptions(select: HTMLSelectElement): ChartManageFilterOption[] {
  return Array.from(select.options)
    .filter((option) => option.value && option.value !== FILTER_ACTION_ALL)
    .map((option) => ({ label: option.textContent || option.value, value: option.value }));
}

export function selectChartManagementFilterValue({
  filterState,
  key,
  value,
  values
}: {
  filterState: ChartManagementFilterState;
  key: ChartManageFilterKey;
  value: string;
  values: ChartManageFilterOption[];
}) {
  const active = filterState.activeFilters[key];
  const validValues = new Set(values.map((option) => option.value));
  if (!value || value === FILTER_ACTION_ALL || !validValues.has(value)) {
    filterState.activeModes[key] = 'all';
    active.clear();
    return;
  }
  filterState.activeModes[key] = 'custom';
  active.clear();
  active.add(value);
}

function keepValidFilterValues(filterState: ChartManagementFilterState, key: ChartManageFilterKey, values: ChartManageFilterOption[]) {
  const validValues = new Set(values.map((option) => option.value));
  filterState.activeFilters[key].forEach((value) => {
    if (!validValues.has(value)) filterState.activeFilters[key].delete(value);
  });
  if (filterState.activeModes[key] === 'custom' && filterState.activeFilters[key].size === 0) {
    filterState.activeModes[key] = 'all';
  }
}

function setElementHidden(element: HTMLElement | null, shouldHide: boolean) {
  if (element) element.hidden = shouldHide;
}

function getDocumentStyleName(document: ChartDocument): string {
  return String(document.metadata?.styleReference || document.metadata?.style || document.metadata?.canonicalGroove || document.metadata?.grooveReference || '').trim();
}

function getRecordSearchScore(record: ChartManagementDocumentRecord, normalizedQuery: string): number {
  if (record.titleKey === normalizedQuery) return 1000;
  if (record.titleKey.startsWith(normalizedQuery)) return 800;
  if (record.titleKey.includes(normalizedQuery)) return 600;
  if (record.composerKey.includes(normalizedQuery)) return 400;
  if (record.styleKey.includes(normalizedQuery)) return 300;
  if (record.tagsKey.includes(normalizedQuery)) return 250;
  if (record.sourceKey.includes(normalizedQuery)) return 150;
  return 0;
}

function sortLocaleValues(values: Iterable<string>): string[] {
  return [...values].sort((left, right) => left.localeCompare(right, 'en', { sensitivity: 'base' }));
}

export function createChartManagementDocumentIndex(documents: ChartDocument[] = []): ChartManagementDocumentIndex {
  const sources = new Set<string>();
  const styles = new Set<string>();
  let hasUserCharts = false;
  let hasChartsWithoutStyle = false;
  const records = documents.map((document) => {
    const metadata = (document.metadata || {}) as Partial<ChartMetadata>;
    const sourceNames = getChartSourceRefs(document)
      .map((ref) => String(ref.name || '').trim())
      .filter(Boolean);
    const styleName = getDocumentStyleName(document);
    sourceNames.forEach((sourceName) => sources.add(sourceName));
    if (sourceNames.length === 0) hasUserCharts = true;
    if (styleName) {
      styles.add(styleName);
    } else {
      hasChartsWithoutStyle = true;
    }

    return {
      document,
      chartId: String(metadata.id || ''),
      sourceNames,
      styleName,
      searchText: getChartSearchText(document),
      titleKey: normalizeChartTextKey(metadata.titleKey || metadata.title),
      composerKey: normalizeChartTextKey(metadata.composerKey || metadata.composer),
      styleKey: normalizeChartTextKey(metadata.styleReference || metadata.style || metadata.canonicalGroove),
      tagsKey: (Array.isArray(metadata.userTags) ? metadata.userTags : []).map(normalizeChartTextKey).join(' '),
      sourceKey: sourceNames.map(normalizeChartTextKey).join(' ')
    };
  });

  return {
    records,
    sources: sortLocaleValues(sources),
    styles: sortLocaleValues(styles),
    hasUserCharts,
    hasChartsWithoutStyle
  };
}

function renderOptionList(filterState: ChartManagementFilterState, select: HTMLSelectElement | null, label: string, values: ChartManageFilterOption[]) {
  if (!select) return;
  const key = select.dataset.filterKey as ChartManageFilterKey;
  const active = filterState.activeFilters[key];
  select.disabled = values.length === 0;
  select.replaceChildren(new Option(values.length > 0 ? label : `No ${label.replace(/^All /, '').toLowerCase()}`, FILTER_ACTION_ALL));
  if (values.length === 0) {
    select.value = FILTER_ACTION_ALL;
    return;
  }
  for (const { label: optionLabel, value } of values) {
    select.append(new Option(optionLabel, value));
  }
  const selectedValue = filterState.activeModes[key] === 'custom'
    ? Array.from(active).find((value) => values.some((option) => option.value === value)) || FILTER_ACTION_ALL
    : FILTER_ACTION_ALL;
  select.value = selectedValue;
}

function renderFilterControl({
  filterState,
  key,
  row,
  select,
  chipHost,
  allLabel,
  values,
  getPageClassName,
  onSelectFilterValue
}: {
  filterState: ChartManagementFilterState;
  key: ChartManageFilterKey;
  row: HTMLElement | null;
  select: HTMLSelectElement | null;
  chipHost: HTMLElement | null;
  allLabel: string;
  values: ChartManageFilterOption[];
  getPageClassName: (name: string) => string;
  onSelectFilterValue: (key: ChartManageFilterKey, value: string, values: ChartManageFilterOption[]) => void;
}) {
  keepValidFilterValues(filterState, key, values);
  if (select) select.dataset.filterKey = key;
  renderOptionList(filterState, select, allLabel, values);
  chipHost?.replaceChildren();
  setElementHidden(row, false);
  setElementHidden(select, false);
  setElementHidden(chipHost, true);
}

export function renderChartManagementFacets({
  documents,
  documentIndex,
  setlists,
  dom,
  filterState,
  getPageClassName,
  onSelectFilterValue
}: {
  documents: ChartDocument[];
  documentIndex?: ChartManagementDocumentIndex;
  setlists: ChartSetlist[];
  dom: ChartManagementDomRefs;
  filterState: ChartManagementFilterState;
  getPageClassName: (name: string) => string;
  onSelectFilterValue: (key: ChartManageFilterKey, value: string, values: ChartManageFilterOption[]) => void;
}) {
  const index = documentIndex || createChartManagementDocumentIndex(documents);
  const setlistedChartIds = new Set(
    setlists.flatMap((setlist) => setlist.items.map((item) => item.chartId))
  );
  const sourceOptions = [
    ...index.sources.map((source) => ({ label: source, value: source })),
    index.hasUserCharts
      ? { label: 'User charts', value: FILTER_SOURCE_USER_CHARTS }
      : null
  ].filter(Boolean) as ChartManageFilterOption[];
  const styleOptions = [
    ...index.styles.map((style) => ({ label: style, value: style })),
    index.hasChartsWithoutStyle
      ? { label: 'No style', value: FILTER_STYLE_NO_STYLE }
      : null
  ].filter(Boolean) as ChartManageFilterOption[];
  const setlistOptions = [
    ...setlists.map((setlist) => ({ label: setlist.name, value: setlist.id })),
    index.records.some((record) => !setlistedChartIds.has(record.chartId))
      ? { label: 'No setlist', value: FILTER_SETLIST_NO_SETLIST }
      : null
  ].filter(Boolean) as ChartManageFilterOption[];
  renderFilterControl({
    filterState,
    key: 'source',
    row: dom.manageSourceFilterRow,
    select: dom.manageSourceFilter,
    chipHost: dom.manageSourceFilterChips,
    allLabel: 'All sources',
    values: sourceOptions,
    getPageClassName,
    onSelectFilterValue
  });
  renderFilterControl({
    filterState,
    key: 'style',
    row: dom.manageStyleFilterRow,
    select: dom.manageStyleFilter,
    chipHost: dom.manageStyleFilterChips,
    allLabel: 'All styles',
    values: styleOptions,
    getPageClassName,
    onSelectFilterValue
  });
  renderFilterControl({
    filterState,
    key: 'setlist',
    row: dom.manageSetlistFilterRow,
    select: dom.manageSetlistFilter,
    chipHost: dom.manageSetlistFilterChips,
    allLabel: 'All setlists',
    values: setlistOptions,
    getPageClassName,
    onSelectFilterValue
  });
}

export function getFilteredChartManagementDocuments({
  documents,
  documentIndex,
  setlists,
  query,
  filterState
}: {
  documents: ChartDocument[];
  documentIndex?: ChartManagementDocumentIndex;
  setlists: ChartSetlist[];
  query: string;
  filterState: ChartManagementFilterState;
}): ChartDocument[] {
  const index = documentIndex || createChartManagementDocumentIndex(documents);
  const sources = filterState.activeFilters.source;
  const styles = filterState.activeFilters.style;
  const setlistIds = filterState.activeFilters.setlist;
  const hasSourceFilter = filterState.activeModes.source === 'custom';
  const hasStyleFilter = filterState.activeModes.style === 'custom';
  const hasSetlistFilter = filterState.activeModes.setlist === 'custom';
  const setlistChartIds = new Set(
    setlists
      .filter((candidate) => setlistIds.has(candidate.id))
      .flatMap((setlist) => setlist.items.map((item) => item.chartId))
  );
  const allSetlistChartIds = new Set(
    setlists.flatMap((setlist) => setlist.items.map((item) => item.chartId))
  );
  const normalizedQuery = normalizeChartTextKey(query);
  let filteredRecords = normalizedQuery
    ? index.records
        .filter((record) => record.searchText.includes(normalizedQuery))
        .sort((left, right) => getRecordSearchScore(right, normalizedQuery) - getRecordSearchScore(left, normalizedQuery)
          || String(left.document.metadata?.title || '').localeCompare(String(right.document.metadata?.title || ''), 'en', { sensitivity: 'base' }))
    : [...index.records];
  if ([hasSourceFilter && sources.size === 0, hasStyleFilter && styles.size === 0, hasSetlistFilter && setlistIds.size === 0].some(Boolean)) {
    return [];
  }
  if (hasSourceFilter) {
    filteredRecords = filteredRecords.filter((record) => {
      return (record.sourceNames.length === 0 && sources.has(FILTER_SOURCE_USER_CHARTS))
        || record.sourceNames.some((sourceName) => sources.has(sourceName));
    });
  }
  if (hasStyleFilter) {
    filteredRecords = filteredRecords.filter((record) => {
      return (record.styleName && styles.has(record.styleName))
        || (!record.styleName && styles.has(FILTER_STYLE_NO_STYLE));
    });
  }
  if (hasSetlistFilter) {
    filteredRecords = filteredRecords.filter((record) => {
      return setlistChartIds.has(record.chartId)
        || (!allSetlistChartIds.has(record.chartId) && setlistIds.has(FILTER_SETLIST_NO_SETLIST));
    });
  }
  return filteredRecords.map((record) => record.document);
}
