export function createChartManagementDomRefs(rootDocument: Document = document) {
  return {
    manageChartSearchInput: rootDocument.getElementById('manage-chart-search-input') as HTMLInputElement | null,
    manageOriginFilterRow: rootDocument.getElementById('manage-origin-filter-row'),
    manageOriginFilter: rootDocument.getElementById('manage-origin-filter') as HTMLSelectElement | null,
    manageOriginFilterChips: rootDocument.getElementById('manage-origin-filter-chips'),
    manageSourceFilterRow: rootDocument.getElementById('manage-source-filter-row'),
    manageSourceFilter: rootDocument.getElementById('manage-source-filter') as HTMLSelectElement | null,
    manageSourceFilterChips: rootDocument.getElementById('manage-source-filter-chips'),
    manageTagFilterRow: rootDocument.getElementById('manage-tag-filter-row'),
    manageTagFilter: rootDocument.getElementById('manage-tag-filter') as HTMLSelectElement | null,
    manageTagFilterChips: rootDocument.getElementById('manage-tag-filter-chips'),
    manageSetlistFilterRow: rootDocument.getElementById('manage-setlist-filter-row'),
    manageSetlistFilter: rootDocument.getElementById('manage-setlist-filter') as HTMLSelectElement | null,
    manageSetlistFilterChips: rootDocument.getElementById('manage-setlist-filter-chips'),
    manageLibrarySummary: rootDocument.getElementById('manage-library-summary'),
    manageChartList: rootDocument.getElementById('manage-chart-list'),
    manageSetlistsSection: rootDocument.getElementById('manage-setlists-section'),
    manageCreateSetlistButton: rootDocument.getElementById('manage-create-setlist-button') as HTMLButtonElement | null,
    manageSetlistList: rootDocument.getElementById('manage-setlist-list'),
    manageMetadataPanel: rootDocument.getElementById('manage-metadata-panel')
  };
}
