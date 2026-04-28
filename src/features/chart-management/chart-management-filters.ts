import type { ChartDocument, ChartSetlist } from '../../core/types/contracts.js';
import { filterChartDocuments, listChartLibraryFacets } from '../chart/chart-library.js';
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
import { getDocumentSourceNames } from './chart-management-view-helpers.js';

type ChartManagementDomRefs = ReturnType<typeof createChartManagementDomRefs>;

export type ChartManagementFilterState = {
  activeFilters: Record<ChartManageFilterKey, Set<string>>;
  activeModes: Record<ChartManageFilterKey, ChartManageFilterMode>;
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
  setlists,
  dom,
  filterState,
  getPageClassName,
  onSelectFilterValue
}: {
  documents: ChartDocument[];
  setlists: ChartSetlist[];
  dom: ChartManagementDomRefs;
  filterState: ChartManagementFilterState;
  getPageClassName: (name: string) => string;
  onSelectFilterValue: (key: ChartManageFilterKey, value: string, values: ChartManageFilterOption[]) => void;
}) {
  const facets = listChartLibraryFacets(documents, setlists);
  const setlistedChartIds = new Set(
    setlists.flatMap((setlist) => setlist.items.map((item) => item.chartId))
  );
  const sourceOptions = [
    ...facets.sources.map((source) => ({ label: source, value: source })),
    documents.some((document) => getDocumentSourceNames(document).length === 0)
      ? { label: 'User charts', value: FILTER_SOURCE_USER_CHARTS }
      : null
  ].filter(Boolean) as ChartManageFilterOption[];
  const styleOptions = [
    ...facets.styles.map((style) => ({ label: style, value: style })),
    documents.some((document) => !getDocumentStyleName(document))
      ? { label: 'No style', value: FILTER_STYLE_NO_STYLE }
      : null
  ].filter(Boolean) as ChartManageFilterOption[];
  const setlistOptions = [
    ...setlists.map((setlist) => ({ label: setlist.name, value: setlist.id })),
    documents.some((document) => !setlistedChartIds.has(String(document.metadata?.id || '')))
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
  setlists,
  query,
  filterState
}: {
  documents: ChartDocument[];
  setlists: ChartSetlist[];
  query: string;
  filterState: ChartManagementFilterState;
}): ChartDocument[] {
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
  let filteredDocuments = query ? filterChartDocuments(documents, query) : [...documents];
  if ([hasSourceFilter && sources.size === 0, hasStyleFilter && styles.size === 0, hasSetlistFilter && setlistIds.size === 0].some(Boolean)) {
    return [];
  }
  if (hasSourceFilter) {
    filteredDocuments = filteredDocuments.filter((document) => {
      const sourceNames = getDocumentSourceNames(document);
      return (sourceNames.length === 0 && sources.has(FILTER_SOURCE_USER_CHARTS))
        || sourceNames.some((sourceName) => sources.has(sourceName));
    });
  }
  if (hasStyleFilter) {
    filteredDocuments = filteredDocuments.filter((document) => {
      const styleName = getDocumentStyleName(document);
      return (styleName && styles.has(styleName))
        || (!styleName && styles.has(FILTER_STYLE_NO_STYLE));
    });
  }
  if (hasSetlistFilter) {
    filteredDocuments = filteredDocuments.filter((document) => {
      const chartId = String(document.metadata?.id || '');
      return setlistChartIds.has(chartId)
        || (!allSetlistChartIds.has(chartId) && setlistIds.has(FILTER_SETLIST_NO_SETLIST));
    });
  }
  return filteredDocuments;
}
