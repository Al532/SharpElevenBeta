import type { ChartDocument, ChartSetlist } from '../../core/types/contracts.js';
import { filterChartDocuments, listChartLibraryFacets } from '../chart/chart-library.js';
import type { createChartManagementDomRefs } from './chart-management-dom.js';
import {
  CHIP_FILTER_OPTION_LIMIT,
  FILTER_ACTION_ALL,
  FILTER_ACTION_NONE,
  FILTER_SETLIST_NO_SETLIST,
  FILTER_SOURCE_NO_SOURCE,
  FILTER_TAG_NO_TAG,
  type ChartManageFilterKey,
  type ChartManageFilterMode,
  type ChartManageFilterOption
} from './chart-management-types.js';
import { createButton, getDocumentSourceNames } from './chart-management-view-helpers.js';

type ChartManagementDomRefs = ReturnType<typeof createChartManagementDomRefs>;

export type ChartManagementFilterState = {
  activeFilters: Record<ChartManageFilterKey, Set<string>>;
  activeModes: Record<ChartManageFilterKey, ChartManageFilterMode>;
};

export function createChartManagementFilterState(): ChartManagementFilterState {
  return {
    activeFilters: {
      origin: new Set(),
      source: new Set(),
      tag: new Set(),
      setlist: new Set()
    },
    activeModes: {
      origin: 'all',
      source: 'all',
      tag: 'all',
      setlist: 'all'
    }
  };
}

export function getSelectFilterOptions(select: HTMLSelectElement): ChartManageFilterOption[] {
  return Array.from(select.options)
    .filter((option) => option.value && option.value !== FILTER_ACTION_ALL && option.value !== FILTER_ACTION_NONE)
    .map((option) => ({ label: option.textContent?.replace(/^Selected - /, '') || option.value, value: option.value }));
}

function getFilterOptionValues(values: ChartManageFilterOption[]) {
  return values.map((option) => option.value);
}

function isFilterAllSelected(filterState: ChartManagementFilterState, key: ChartManageFilterKey, values: ChartManageFilterOption[]) {
  const active = filterState.activeFilters[key];
  return filterState.activeModes[key] === 'custom'
    && values.length > 0
    && active.size === values.length
    && values.every((option) => active.has(option.value));
}

function getSelectedFilterCount(filterState: ChartManagementFilterState, key: ChartManageFilterKey, values: ChartManageFilterOption[]) {
  return filterState.activeModes[key] === 'all'
    ? 0
    : isFilterAllSelected(filterState, key, values)
      ? values.length
      : filterState.activeFilters[key].size;
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
  if (value === FILTER_ACTION_ALL) {
    filterState.activeModes[key] = 'custom';
    active.clear();
    getFilterOptionValues(values).forEach((optionValue) => active.add(optionValue));
  } else if (value === FILTER_ACTION_NONE) {
    filterState.activeModes[key] = 'custom';
    active.clear();
  } else if (filterState.activeModes[key] === 'all') {
    filterState.activeModes[key] = 'custom';
    active.clear();
    getFilterOptionValues(values).forEach((optionValue) => active.add(optionValue));
    active.delete(value);
  } else if (active.has(value)) {
    active.delete(value);
  } else {
    active.add(value);
  }
}

function keepValidFilterValues(filterState: ChartManagementFilterState, key: ChartManageFilterKey, values: ChartManageFilterOption[]) {
  const validValues = new Set(values.map((option) => option.value));
  filterState.activeFilters[key].forEach((value) => {
    if (!validValues.has(value)) filterState.activeFilters[key].delete(value);
  });
  if (values.length <= 1) {
    filterState.activeModes[key] = 'all';
    filterState.activeFilters[key].clear();
  }
}

function setElementHidden(element: HTMLElement | null, shouldHide: boolean) {
  if (element) element.hidden = shouldHide;
}

function renderOptionList(filterState: ChartManagementFilterState, select: HTMLSelectElement | null, label: string, values: ChartManageFilterOption[]) {
  if (!select) return;
  const key = select.dataset.filterKey as ChartManageFilterKey;
  const active = filterState.activeFilters[key];
  const allSelected = isFilterAllSelected(filterState, key, values);
  const selectedCount = getSelectedFilterCount(filterState, key, values);
  select.replaceChildren(new Option(`${selectedCount}/${values.length} selected`, ''));
  select.append(new Option(label, FILTER_ACTION_ALL));
  select.append(new Option('None', FILTER_ACTION_NONE));
  for (const { label: optionLabel, value } of values) {
    select.append(new Option(allSelected || active?.has(value) ? `Selected - ${optionLabel}` : optionLabel, value));
  }
  select.value = '';
}

function renderFilterChips({
  filterState,
  host,
  key,
  values,
  getPageClassName,
  onSelectFilterValue
}: {
  filterState: ChartManagementFilterState;
  host: HTMLElement | null;
  key: ChartManageFilterKey;
  values: ChartManageFilterOption[];
  getPageClassName: (name: string) => string;
  onSelectFilterValue: (key: ChartManageFilterKey, value: string, values: ChartManageFilterOption[]) => void;
}) {
  if (!host) return;
  const active = filterState.activeFilters[key];
  const isAllSelected = isFilterAllSelected(filterState, key, values);
  host.replaceChildren();
  const buttons = [
    { label: 'All', value: FILTER_ACTION_ALL },
    { label: 'None', value: FILTER_ACTION_NONE },
    ...values
  ].map(({ label, value }) => {
    const button = createButton(label, getPageClassName('filter-chip'));
    const isFilterAction = value === FILTER_ACTION_ALL || value === FILTER_ACTION_NONE;
    const isActive = !isFilterAction && (isAllSelected || active.has(value));
    button.setAttribute('aria-pressed', String(isActive));
    if (isActive) button.classList.add('is-active');
    button.addEventListener('click', () => onSelectFilterValue(key, value, values));
    return button;
  });
  host.append(...buttons);
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
  const shouldHide = values.length <= 1;
  const shouldUseChips = !shouldHide && values.length <= CHIP_FILTER_OPTION_LIMIT;
  if (select) select.dataset.filterKey = key;
  renderOptionList(filterState, select, allLabel, values);
  renderFilterChips({ filterState, host: chipHost, key, values, getPageClassName, onSelectFilterValue });
  setElementHidden(row, shouldHide);
  setElementHidden(select, shouldHide || shouldUseChips);
  setElementHidden(chipHost, shouldHide || !shouldUseChips);
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
      ? { label: 'No source', value: FILTER_SOURCE_NO_SOURCE }
      : null
  ].filter(Boolean) as ChartManageFilterOption[];
  const tagOptions = [
    ...facets.tags.map((tag) => ({ label: tag, value: tag })),
    documents.some((document) => (document.metadata?.userTags || []).map((tag) => String(tag || '').trim()).filter(Boolean).length === 0)
      ? { label: 'No tag', value: FILTER_TAG_NO_TAG }
      : null
  ].filter(Boolean) as ChartManageFilterOption[];
  const setlistOptions = [
    ...setlists.map((setlist) => ({ label: setlist.name, value: setlist.id })),
    documents.some((document) => !setlistedChartIds.has(String(document.metadata?.id || '')))
      ? { label: 'No setlist', value: FILTER_SETLIST_NO_SETLIST }
      : null
  ].filter(Boolean) as ChartManageFilterOption[];
  const originOptions = [
    documents.some((document) => document.metadata?.origin !== 'user') ? { label: 'Imported', value: 'imported' } : null,
    documents.some((document) => document.metadata?.origin === 'user') ? { label: 'User', value: 'user' } : null
  ].filter(Boolean) as ChartManageFilterOption[];

  renderFilterControl({
    filterState,
    key: 'origin',
    row: dom.manageOriginFilterRow,
    select: dom.manageOriginFilter,
    chipHost: dom.manageOriginFilterChips,
    allLabel: 'All origins',
    values: originOptions,
    getPageClassName,
    onSelectFilterValue
  });
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
    key: 'tag',
    row: dom.manageTagFilterRow,
    select: dom.manageTagFilter,
    chipHost: dom.manageTagFilterChips,
    allLabel: 'All tags',
    values: tagOptions,
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
  const origins = filterState.activeFilters.origin;
  const sources = filterState.activeFilters.source;
  const tags = filterState.activeFilters.tag;
  const setlistIds = filterState.activeFilters.setlist;
  const hasOriginFilter = filterState.activeModes.origin === 'custom';
  const hasSourceFilter = filterState.activeModes.source === 'custom';
  const hasTagFilter = filterState.activeModes.tag === 'custom';
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
  if ([hasOriginFilter && origins.size === 0, hasSourceFilter && sources.size === 0, hasTagFilter && tags.size === 0, hasSetlistFilter && setlistIds.size === 0].some(Boolean)) {
    return [];
  }
  if (hasOriginFilter) filteredDocuments = filteredDocuments.filter((document) => origins.has(document.metadata?.origin === 'user' ? 'user' : 'imported'));
  if (hasSourceFilter) {
    filteredDocuments = filteredDocuments.filter((document) => {
      const sourceNames = getDocumentSourceNames(document);
      return (sourceNames.length === 0 && sources.has(FILTER_SOURCE_NO_SOURCE))
        || sourceNames.some((sourceName) => sources.has(sourceName));
    });
  }
  if (hasTagFilter) {
    filteredDocuments = filteredDocuments.filter((document) => {
      const documentTags = (document.metadata?.userTags || []).map((tag) => String(tag || '').trim()).filter(Boolean);
      return (documentTags.length === 0 && tags.has(FILTER_TAG_NO_TAG))
        || documentTags.some((candidate) => tags.has(candidate));
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
