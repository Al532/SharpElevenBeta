export function createChartManagementDomRefs(rootDocument: Document = document) {
  return {
    manageChartSearchInput: rootDocument.getElementById('manage-chart-search-input') as HTMLInputElement | null,
    manageSourceFilterRow: rootDocument.getElementById('manage-source-filter-row'),
    manageSourceFilter: rootDocument.getElementById('manage-source-filter') as HTMLSelectElement | null,
    manageSourceFilterChips: rootDocument.getElementById('manage-source-filter-chips'),
    manageStyleFilterRow: rootDocument.getElementById('manage-style-filter-row'),
    manageStyleFilter: rootDocument.getElementById('manage-style-filter') as HTMLSelectElement | null,
    manageStyleFilterChips: rootDocument.getElementById('manage-style-filter-chips'),
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
