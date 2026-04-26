import { createChartDocumentsFromIRealText } from './chart/index.js';
import { initializeSharpElevenTheme } from './src/features/app/app-theme.js';
import {
  consumePendingIRealLinkResult,
  isIRealDeepLink,
  storePendingIRealLink
} from './src/features/app/app-pending-mobile-import.js';
import { openIrealBrowser } from './src/features/app/ireal-browser.js';
import {
  clearPersistedChartLibrary,
  loadPersistedChartLibrary,
  loadPersistedSetlists,
  persistChartLibrary,
  persistSetlists
} from './src/features/chart/chart-persistence.js';
import {
  applyBatchMetadataOperation,
  applyPerChartMetadataUpdate,
  createEmptyChartSetlist,
  filterChartDocuments,
  getChartSetlistMembership,
  getChartSourceRefs,
  importDocumentsFromIRealText,
  listChartLibraryFacets,
  previewBatchMetadataOperation,
  previewProtectedChartDelete,
  reorderSetlistItems
} from './src/features/chart/chart-library.js';
import type { BatchMetadataOperation } from './src/features/chart/chart-library.js';
import type { ChartDocument, ChartSetlist } from './src/core/types/contracts';
import {
  bindChartImportControls,
  setChartImportStatus
} from './src/features/chart/chart-import-controls.js';

initializeSharpElevenTheme();

const IREAL_FORUM_TRACKS_URL = 'https://forums.irealpro.com';
const VISIBLE_RESULT_LIMIT = 80;

const dom = {
  importIRealBackupButton: document.getElementById('import-ireal-backup-button') as HTMLButtonElement | null,
  openIRealForumButton: document.getElementById('open-ireal-forum-button') as HTMLButtonElement | null,
  irealBackupInput: document.getElementById('ireal-backup-input') as HTMLInputElement | null,
  clearAllChartsButton: document.getElementById('clear-all-charts-button') as HTMLButtonElement | null,
  chartImportStatus: document.getElementById('chart-import-status'),
  manageGlobalSummary: document.getElementById('manage-global-summary'),
  manageChartSearchInput: document.getElementById('manage-chart-search-input') as HTMLInputElement | null,
  manageOriginFilter: document.getElementById('manage-origin-filter') as HTMLSelectElement | null,
  manageSourceFilter: document.getElementById('manage-source-filter') as HTMLSelectElement | null,
  manageTagFilter: document.getElementById('manage-tag-filter') as HTMLSelectElement | null,
  manageSetlistFilter: document.getElementById('manage-setlist-filter') as HTMLSelectElement | null,
  manageStyleFilter: document.getElementById('manage-style-filter') as HTMLSelectElement | null,
  manageUnorganizedFilter: document.getElementById('manage-unorganized-filter') as HTMLInputElement | null,
  manageLibrarySummary: document.getElementById('manage-library-summary'),
  manageToggleResultsButton: document.getElementById('manage-toggle-results-button') as HTMLButtonElement | null,
  manageChartList: document.getElementById('manage-chart-list'),
  manageSelectMatchingButton: document.getElementById('manage-select-matching-button') as HTMLButtonElement | null,
  manageSelectVisibleButton: document.getElementById('manage-select-visible-button') as HTMLButtonElement | null,
  manageClearSelectionButton: document.getElementById('manage-clear-selection-button') as HTMLButtonElement | null,
  manageSelectedCount: document.getElementById('manage-selected-count'),
  manageBatchActionSelect: document.getElementById('manage-batch-action-select') as HTMLSelectElement | null,
  manageBatchTagInput: document.getElementById('manage-batch-tag-input') as HTMLInputElement | null,
  manageBatchSetlistSelect: document.getElementById('manage-batch-setlist-select') as HTMLSelectElement | null,
  managePreviewBatchButton: document.getElementById('manage-preview-batch-button') as HTMLButtonElement | null,
  manageBatchPreview: document.getElementById('manage-batch-preview'),
  manageSetlistNameInput: document.getElementById('manage-setlist-name-input') as HTMLInputElement | null,
  manageCreateSetlistButton: document.getElementById('manage-create-setlist-button') as HTMLButtonElement | null,
  manageSetlistList: document.getElementById('manage-setlist-list'),
  manageSetlistDetail: document.getElementById('manage-setlist-detail'),
  manageMetadataPanel: document.getElementById('manage-metadata-panel')
};

let currentDocuments: ChartDocument[] = [];
let currentSource = 'imported library';
let currentSetlists: ChartSetlist[] = [];
let selectedChartIds = new Set<string>();
let resultsExpanded = false;
let activeSetlistId = '';

function setImportStatus(message: string, isError = false) {
  setChartImportStatus(dom.chartImportStatus, message, isError);
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error || 'Unknown error');
}

function pluralizeChartLabel(count: number) {
  return `chart${count === 1 ? '' : 's'}`;
}

function createTextElement(tagName: string, className: string, textContent: string): HTMLElement {
  const element = document.createElement(tagName);
  element.className = className;
  element.textContent = textContent;
  return element;
}

function createButton(label: string, className = 'home-primary-action'): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = className;
  button.textContent = label;
  return button;
}

function getChartSubtitle(document: ChartDocument): string {
  const parts = [
    document.metadata?.composer,
    document.metadata?.styleReference || document.metadata?.style || document.metadata?.canonicalGroove,
    document.metadata?.origin === 'user' ? 'User chart' : getChartSourceRefs(document).map((ref) => ref.name).join(', ')
  ].map((part) => String(part || '').trim()).filter(Boolean);
  return [...new Set(parts)].join(' - ');
}

function formatImportSummary(persistedLibrary: Awaited<ReturnType<typeof persistChartLibrary>>, fallbackCount: number, sourceFile: string) {
  const summary = persistedLibrary?.lastImportSummary;
  if (!summary) return `Loaded ${fallbackCount} ${pluralizeChartLabel(fallbackCount)} from ${sourceFile}.`;
  return [
    `Import from ${sourceFile}: ${summary.createdCount} new ${pluralizeChartLabel(summary.createdCount)}`,
    `${summary.duplicateCount} duplicate${summary.duplicateCount === 1 ? '' : 's'} skipped`,
    `${summary.sourceRefsAddedCount} source reference${summary.sourceRefsAddedCount === 1 ? '' : 's'} added`,
    `${summary.totalCount} total ${pluralizeChartLabel(summary.totalCount)} in library`
  ].join(' - ');
}

function getFilteredManageDocuments(): ChartDocument[] {
  const query = dom.manageChartSearchInput?.value || '';
  const origin = dom.manageOriginFilter?.value || '';
  const source = dom.manageSourceFilter?.value || '';
  const tag = dom.manageTagFilter?.value || '';
  const setlistId = dom.manageSetlistFilter?.value || '';
  const style = dom.manageStyleFilter?.value || '';
  const unorganized = Boolean(dom.manageUnorganizedFilter?.checked);
  const setlist = currentSetlists.find((candidate) => candidate.id === setlistId);
  const setlistChartIds = new Set((setlist?.items || []).map((item) => item.chartId));
  let documents = query ? filterChartDocuments(currentDocuments, query) : [...currentDocuments];
  if (origin) documents = documents.filter((document) => document.metadata?.origin === origin);
  if (source) documents = documents.filter((document) => getChartSourceRefs(document).some((ref) => ref.name === source));
  if (tag) documents = documents.filter((document) => (document.metadata?.userTags || []).some((candidate) => candidate === tag));
  if (setlistId) documents = documents.filter((document) => setlistChartIds.has(document.metadata.id));
  if (style) documents = documents.filter((document) => String(document.metadata?.styleReference || document.metadata?.style || document.metadata?.canonicalGroove || document.metadata?.grooveReference || '') === style);
  if (unorganized) {
    documents = documents.filter((document) => {
      const hasTags = (document.metadata?.userTags || []).length > 0;
      const hasSetlist = getChartSetlistMembership(document.metadata.id, currentSetlists).length > 0;
      return !hasTags && !hasSetlist;
    });
  }
  return documents;
}

function renderOptionList(select: HTMLSelectElement | null, label: string, values: string[], previousValue = '') {
  if (!select) return;
  const fallbackValue = previousValue || select.value;
  select.replaceChildren(new Option(label, ''));
  for (const value of values) select.append(new Option(value, value));
  if ([...select.options].some((option) => option.value === fallbackValue)) select.value = fallbackValue;
}

function renderFacets() {
  const facets = listChartLibraryFacets(currentDocuments, currentSetlists);
  renderOptionList(dom.manageSourceFilter, 'All sources', facets.sources);
  renderOptionList(dom.manageTagFilter, 'All tags', facets.tags);
  renderOptionList(dom.manageStyleFilter, 'All styles/grooves', facets.styles);
  if (dom.manageSetlistFilter) {
    const previousValue = dom.manageSetlistFilter.value;
    dom.manageSetlistFilter.replaceChildren(new Option('All setlists', ''));
    for (const setlist of currentSetlists) dom.manageSetlistFilter.append(new Option(setlist.name, setlist.id));
    if ([...dom.manageSetlistFilter.options].some((option) => option.value === previousValue)) dom.manageSetlistFilter.value = previousValue;
  }
  if (dom.manageBatchSetlistSelect) {
    const previousValue = dom.manageBatchSetlistSelect.value;
    dom.manageBatchSetlistSelect.replaceChildren();
    for (const setlist of currentSetlists) dom.manageBatchSetlistSelect.append(new Option(setlist.name, setlist.id));
    if ([...dom.manageBatchSetlistSelect.options].some((option) => option.value === previousValue)) dom.manageBatchSetlistSelect.value = previousValue;
  }
}

function renderGlobalSummary() {
  if (!dom.manageGlobalSummary) return;
  const facets = listChartLibraryFacets(currentDocuments, currentSetlists);
  const importedCount = currentDocuments.filter((document) => document.metadata?.origin !== 'user').length;
  const userCount = currentDocuments.filter((document) => document.metadata?.origin === 'user').length;
  const entries = [
    ['Total charts', currentDocuments.length],
    ['Imported', importedCount],
    ['User', userCount],
    ['Sources', facets.sources.length],
    ['Tags', facets.tags.length],
    ['Setlists', currentSetlists.length]
  ];
  dom.manageGlobalSummary.replaceChildren(...entries.map(([label, value]) => {
    const card = document.createElement('div');
    card.className = 'chart-manage-summary-card';
    card.append(createTextElement('strong', '', String(value)));
    card.append(createTextElement('span', '', String(label)));
    return card;
  }));
}

function renderSelectionState() {
  selectedChartIds = new Set([...selectedChartIds].filter((chartId) => currentDocuments.some((document) => document.metadata.id === chartId)));
  if (dom.manageSelectedCount) dom.manageSelectedCount.textContent = `${selectedChartIds.size} selected`;
}

function renderManageCharts() {
  const documents = getFilteredManageDocuments();
  const visibleDocuments = documents.slice(0, VISIBLE_RESULT_LIMIT);
  if (dom.manageLibrarySummary) {
    dom.manageLibrarySummary.textContent = `${documents.length} matching ${pluralizeChartLabel(documents.length)}. Results are ${resultsExpanded ? 'expanded' : 'collapsed'}.`;
  }
  if (dom.manageToggleResultsButton) {
    dom.manageToggleResultsButton.textContent = resultsExpanded ? 'Hide matching charts' : 'Show matching charts';
  }
  if (!dom.manageChartList) return;
  dom.manageChartList.toggleAttribute('hidden', !resultsExpanded);
  dom.manageChartList.replaceChildren();
  if (!resultsExpanded) return;
  for (const chartDocument of visibleDocuments) {
    const item = document.createElement('li');
    const row = document.createElement('div');
    row.className = 'home-list-link chart-manage-chart-row';
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = selectedChartIds.has(chartDocument.metadata.id);
    checkbox.setAttribute('aria-label', `Select ${chartDocument.metadata.title || 'chart'}`);
    checkbox.addEventListener('change', () => {
      if (checkbox.checked) selectedChartIds.add(chartDocument.metadata.id);
      else selectedChartIds.delete(chartDocument.metadata.id);
      renderSelectionState();
    });
    const link = document.createElement('a');
    const targetUrl = new URL('./chart/index.html', window.location.href);
    targetUrl.searchParams.set('chart', chartDocument.metadata.id);
    link.href = targetUrl.toString();
    link.className = 'chart-manage-chart-link';
    link.append(createTextElement('span', 'home-list-title', chartDocument.metadata.title || 'Untitled chart'));
    const usage = getChartSetlistMembership(chartDocument.metadata.id, currentSetlists).map((setlist) => setlist.name);
    const subtitle = [getChartSubtitle(chartDocument), usage.length ? `Setlists: ${usage.join(', ')}` : ''].filter(Boolean).join(' - ');
    if (subtitle) link.append(createTextElement('span', 'home-list-meta', subtitle));
    const menuButton = createButton('⋮', 'chart-manage-kebab');
    menuButton.setAttribute('aria-label', `Edit metadata for ${chartDocument.metadata.title || 'chart'}`);
    menuButton.addEventListener('click', () => openMetadataPanel(chartDocument.metadata.id));
    row.append(checkbox, link, menuButton);
    item.append(row);
    dom.manageChartList.append(item);
  }
}

async function persistManageState(statusMessage: string) {
  const persistedLibrary = await persistChartLibrary({ documents: currentDocuments, source: currentSource, mergeWithExisting: false });
  currentDocuments = persistedLibrary?.documents || currentDocuments;
  currentSetlists = await persistSetlists(currentSetlists);
  setImportStatus(statusMessage);
  renderManageUi();
}

function buildMetadataPanel(chartId: string): HTMLElement {
  const chartDocument = currentDocuments.find((document) => document.metadata.id === chartId);
  const panel = document.createElement('div');
  panel.className = 'chart-metadata-card';
  if (!chartDocument) {
    panel.textContent = 'Chart not found.';
    return panel;
  }
  const sources = getChartSourceRefs(chartDocument).map((ref) => ref.name);
  const tags = chartDocument.metadata.userTags || [];
  const memberships = getChartSetlistMembership(chartId, currentSetlists);
  const closeButton = createButton('Close', 'chart-manage-small-action');
  closeButton.addEventListener('click', closeMetadataPanel);
  const header = document.createElement('div');
  header.className = 'chart-metadata-header';
  const title = document.createElement('div');
  title.append(createTextElement('strong', '', chartDocument.metadata.title || 'Untitled chart'));
  title.append(createTextElement('span', 'home-list-meta', [chartDocument.metadata.composer, chartDocument.metadata.styleReference || chartDocument.metadata.style].filter(Boolean).join(' - ')));
  header.append(title, closeButton);
  panel.append(header);

  const identity = document.createElement('dl');
  identity.className = 'chart-metadata-facts';
  const facts = [
    ['Origin', chartDocument.metadata.origin || 'imported'],
    ['Content hash', chartDocument.metadata.contentHash ? `Stored (${chartDocument.metadata.contentHashVersion || 'unknown version'})` : 'Missing'],
    ['Sources', sources.join(', ') || 'None'],
    ['Tags', tags.join(', ') || 'None'],
    ['Setlists', memberships.map((setlist) => setlist.name).join(', ') || 'None']
  ];
  for (const [label, value] of facts) {
    identity.append(createTextElement('dt', '', label));
    identity.append(createTextElement('dd', '', value));
  }
  panel.append(identity);

  const tagInput = document.createElement('input');
  tagInput.className = 'chart-manage-text-input';
  tagInput.placeholder = 'New or existing tag';
  const addTagButton = createButton('Add tag', 'chart-manage-small-action');
  addTagButton.addEventListener('click', async () => {
    const tag = tagInput.value.trim();
    if (!tag) return;
    const result = applyPerChartMetadataUpdate({ documents: currentDocuments, setlists: currentSetlists, chartId, patch: { addTags: [tag], createTag: tag } });
    currentDocuments = result.documents;
    currentSetlists = result.setlists;
    await persistManageState(`Added tag "${tag}" to ${chartDocument.metadata.title || 'chart'}.`);
  });
  const tagList = document.createElement('div');
  tagList.className = 'chart-manage-chip-row';
  for (const tag of tags) {
    const button = createButton(`Remove ${tag}`, 'chart-manage-chip');
    button.addEventListener('click', async () => {
      const result = applyPerChartMetadataUpdate({ documents: currentDocuments, setlists: currentSetlists, chartId, patch: { removeTags: [tag] } });
      currentDocuments = result.documents;
      currentSetlists = result.setlists;
      await persistManageState(`Removed tag "${tag}".`);
    });
    tagList.append(button);
  }
  panel.append(createTextElement('h3', '', 'Tags'), tagList, tagInput, addTagButton);

  const setlistSelect = document.createElement('select');
  setlistSelect.className = 'chart-manage-select';
  for (const setlist of currentSetlists) setlistSelect.append(new Option(setlist.name, setlist.id));
  const addSetlistButton = createButton('Add to setlist', 'chart-manage-small-action');
  addSetlistButton.addEventListener('click', async () => {
    const result = applyPerChartMetadataUpdate({ documents: currentDocuments, setlists: currentSetlists, chartId, patch: { addSetlistIds: [setlistSelect.value] } });
    currentDocuments = result.documents;
    currentSetlists = result.setlists;
    await persistManageState('Updated setlist membership.');
  });
  const newSetlistInput = document.createElement('input');
  newSetlistInput.className = 'chart-manage-text-input';
  newSetlistInput.placeholder = 'New setlist name';
  const createSetlistButton = createButton('Create setlist and add chart', 'chart-manage-small-action');
  createSetlistButton.addEventListener('click', async () => {
    const name = newSetlistInput.value.trim();
    if (!name) return;
    const result = applyPerChartMetadataUpdate({ documents: currentDocuments, setlists: currentSetlists, chartId, patch: { createSetlistName: name } });
    currentDocuments = result.documents;
    currentSetlists = result.setlists;
    await persistManageState(`Created "${name}" and added chart.`);
  });
  const membershipList = document.createElement('div');
  membershipList.className = 'chart-manage-chip-row';
  for (const setlist of memberships) {
    const button = createButton(`Remove from ${setlist.name}`, 'chart-manage-chip');
    button.addEventListener('click', async () => {
      const result = applyPerChartMetadataUpdate({ documents: currentDocuments, setlists: currentSetlists, chartId, patch: { removeSetlistIds: [setlist.id] } });
      currentDocuments = result.documents;
      currentSetlists = result.setlists;
      await persistManageState(`Removed chart from "${setlist.name}".`);
    });
    membershipList.append(button);
  }
  panel.append(createTextElement('h3', '', 'Setlists'), membershipList, setlistSelect, addSetlistButton, newSetlistInput, createSetlistButton);

  const deletePreview = previewProtectedChartDelete({ documents: currentDocuments, setlists: currentSetlists, chartIds: [chartId] });
  const deleteButton = createButton('Delete chart', 'home-primary-action chart-manage-danger');
  deleteButton.addEventListener('click', async () => {
    const confirmed = window.confirm(`Delete "${chartDocument.metadata.title || 'chart'}"?\n\n${deletePreview.deletedChartCount} chart will be deleted.\n${deletePreview.setlistUsageCount} setlist entries will be removed.`);
    if (!confirmed) return;
    const result = applyBatchMetadataOperation({ documents: currentDocuments, setlists: currentSetlists, chartIds: [chartId], operation: { kind: 'delete' } });
    currentDocuments = result.documents;
    currentSetlists = result.setlists;
    selectedChartIds.delete(chartId);
    closeMetadataPanel();
    await persistManageState('Chart deleted.');
  });
  panel.append(createTextElement('h3', '', 'Delete'), createTextElement('p', 'home-empty', `${deletePreview.deletedChartCount} chart delete, ${deletePreview.setlistUsageCount} setlist entries affected.`), deleteButton);
  return panel;
}

function openMetadataPanel(chartId: string) {
  if (!dom.manageMetadataPanel) return;
  dom.manageMetadataPanel.replaceChildren(buildMetadataPanel(chartId));
  dom.manageMetadataPanel.hidden = false;
}

function closeMetadataPanel() {
  if (!dom.manageMetadataPanel) return;
  dom.manageMetadataPanel.hidden = true;
  dom.manageMetadataPanel.replaceChildren();
}

function getBatchOperation(): BatchMetadataOperation | null {
  const kind = dom.manageBatchActionSelect?.value as BatchMetadataOperation['kind'] || 'add-tag';
  if (kind === 'add-tag' || kind === 'remove-tag') return { kind, tag: dom.manageBatchTagInput?.value.trim() || '' };
  if (kind === 'add-setlist' || kind === 'remove-setlist') return { kind, setlistId: dom.manageBatchSetlistSelect?.value || '' };
  return { kind: 'delete', activeSourceName: dom.manageSourceFilter?.value || '' };
}

async function previewAndApplyBatch() {
  const operation = getBatchOperation();
  if (!operation) return;
  const chartIds = [...selectedChartIds];
  if (chartIds.length === 0) {
    setImportStatus('Select charts before applying a batch action.', true);
    return;
  }
  const preview = previewBatchMetadataOperation({ documents: currentDocuments, setlists: currentSetlists, chartIds, operation });
  if (!dom.manageBatchPreview) return;
  dom.manageBatchPreview.hidden = false;
  dom.manageBatchPreview.replaceChildren();
  dom.manageBatchPreview.append(createTextElement('p', 'home-empty', [
    `${preview.selectedCount} selected`,
    `${preview.affectedCount} affected`,
    `${preview.alreadyHadCount} already had it`,
    `${preview.skippedCount} skipped`,
    `${preview.setlistUsageCount} setlist usages`,
    `${preview.protectedMultiSourceImportedCount} multi-source imported protected`
  ].join(' - ')));
  const applyButton = createButton(operation.kind === 'delete' ? 'Apply delete' : 'Apply batch', 'home-primary-action');
  applyButton.addEventListener('click', async () => {
    if (operation.kind === 'delete') {
      const confirmed = window.confirm(`Apply delete?\n\n${preview.deletedChartCount} charts deleted.\n${preview.sourceRefRemovedCount} source refs removed.\n${preview.protectedMultiSourceImportedCount} multi-source imported charts protected.`);
      if (!confirmed) return;
    }
    const result = applyBatchMetadataOperation({ documents: currentDocuments, setlists: currentSetlists, chartIds, operation });
    currentDocuments = result.documents;
    currentSetlists = result.setlists;
    if (operation.kind === 'delete') selectedChartIds = new Set([...selectedChartIds].filter((chartId) => currentDocuments.some((document) => document.metadata.id === chartId)));
    dom.manageBatchPreview?.setAttribute('hidden', '');
    await persistManageState('Batch action applied.');
  });
  dom.manageBatchPreview.append(applyButton);
}

function renderSetlists() {
  if (!dom.manageSetlistList) return;
  dom.manageSetlistList.replaceChildren();
  for (const setlist of currentSetlists) {
    const item = document.createElement('li');
    const row = document.createElement('div');
    row.className = 'home-list-link chart-manage-setlist-row';
    const label = document.createElement('button');
    label.type = 'button';
    label.className = 'chart-manage-setlist-open';
    label.append(createTextElement('span', 'home-list-title', setlist.name));
    label.append(createTextElement('span', 'home-list-meta', `${setlist.items.length} ${pluralizeChartLabel(setlist.items.length)} - manual playback`));
    label.addEventListener('click', () => {
      activeSetlistId = setlist.id;
      renderSetlistDetail();
    });
    const playLink = document.createElement('a');
    playLink.className = 'chart-manage-small-action';
    const targetUrl = new URL('./chart/index.html', window.location.href);
    targetUrl.searchParams.set('setlist', setlist.id);
    playLink.href = targetUrl.toString();
    playLink.textContent = 'Play';
    row.append(label, playLink);
    item.append(row);
    dom.manageSetlistList.append(item);
  }
  renderSetlistDetail();
}

function renderSetlistDetail() {
  if (!dom.manageSetlistDetail) return;
  const setlist = currentSetlists.find((candidate) => candidate.id === activeSetlistId);
  dom.manageSetlistDetail.hidden = !setlist;
  dom.manageSetlistDetail.replaceChildren();
  if (!setlist) return;
  const documentsById = new Map(currentDocuments.map((document) => [document.metadata.id, document]));
  dom.manageSetlistDetail.append(createTextElement('h3', '', `Manage ${setlist.name}`));
  const list = document.createElement('ol');
  list.className = 'chart-manage-ordered-list';
  setlist.items.forEach((item, index) => {
    const chartDocument = documentsById.get(item.chartId);
    const row = document.createElement('li');
    row.draggable = true;
    row.dataset.index = String(index);
    row.append(createTextElement('span', 'home-list-title', chartDocument?.metadata.title || item.chartId));
    const upButton = createButton('Up', 'chart-manage-small-action');
    const downButton = createButton('Down', 'chart-manage-small-action');
    const removeButton = createButton('Remove', 'chart-manage-small-action chart-manage-danger');
    upButton.disabled = index === 0;
    downButton.disabled = index === setlist.items.length - 1;
    upButton.addEventListener('click', () => updateSetlistItems(setlist.id, reorderSetlistItems(setlist.items, index, index - 1), 'Setlist reordered.'));
    downButton.addEventListener('click', () => updateSetlistItems(setlist.id, reorderSetlistItems(setlist.items, index, index + 1), 'Setlist reordered.'));
    removeButton.addEventListener('click', () => updateSetlistItems(setlist.id, setlist.items.filter((_, itemIndex) => itemIndex !== index), 'Removed setlist entry.'));
    row.addEventListener('dragstart', (event) => event.dataTransfer?.setData('text/plain', String(index)));
    row.addEventListener('dragover', (event) => event.preventDefault());
    row.addEventListener('drop', (event) => {
      event.preventDefault();
      const fromIndex = Number(event.dataTransfer?.getData('text/plain'));
      updateSetlistItems(setlist.id, reorderSetlistItems(setlist.items, fromIndex, index), 'Setlist reordered.');
    });
    row.append(upButton, downButton, removeButton);
    list.append(row);
  });
  dom.manageSetlistDetail.append(list);
}

function updateSetlistItems(setlistId: string, items: ChartSetlist['items'], statusMessage: string) {
  currentSetlists = currentSetlists.map((setlist) => setlist.id === setlistId
    ? { ...setlist, items, updatedAt: new Date().toISOString() }
    : setlist);
  void persistSetlists(currentSetlists).then((setlists) => {
    currentSetlists = setlists;
    setImportStatus(statusMessage);
    renderManageUi();
  }).catch((error) => setImportStatus(`Failed to update setlist: ${getErrorMessage(error)}`, true));
}

async function createSetlist() {
  const name = String(dom.manageSetlistNameInput?.value || '').trim();
  if (!name) {
    setImportStatus('Name the setlist first.', true);
    return;
  }
  currentSetlists = await persistSetlists([...currentSetlists, createEmptyChartSetlist(name)]);
  if (dom.manageSetlistNameInput) dom.manageSetlistNameInput.value = '';
  setImportStatus(`Created empty setlist "${name}".`);
  renderManageUi();
}

function renderManageUi() {
  renderFacets();
  renderGlobalSummary();
  renderSelectionState();
  renderManageCharts();
  renderSetlists();
}

async function loadManageState() {
  const persistedLibrary = await loadPersistedChartLibrary();
  currentDocuments = persistedLibrary?.documents || [];
  currentSource = persistedLibrary?.source || 'imported library';
  currentSetlists = await loadPersistedSetlists();
  renderManageUi();
}

async function importFromRawText(rawText: string, sourceFile: string) {
  const trimmedText = String(rawText || '').trim();
  if (!trimmedText) {
    setImportStatus('Paste an irealb:// link first.', true);
    return;
  }
  try {
    const documents = await importDocumentsFromIRealText({
      rawText: trimmedText,
      sourceFile,
      importDocuments: ({ rawText, sourceFile: importedSourceFile = '' }) =>
        createChartDocumentsFromIRealText({ rawText, sourceFile: importedSourceFile })
    });
    if (!documents.length) {
      setImportStatus(`No charts imported from ${sourceFile}.`);
      return;
    }
    const persistedLibrary = await persistChartLibrary({ documents, source: sourceFile, mergeWithExisting: true });
    if (!persistedLibrary || persistedLibrary.documents.length === 0) throw new Error('The imported chart library could not be confirmed in persistent storage.');
    currentDocuments = persistedLibrary.documents;
    currentSource = persistedLibrary.source;
    setImportStatus(formatImportSummary(persistedLibrary, documents.length, sourceFile));
    renderManageUi();
  } catch (error) {
    setImportStatus(`Import failed: ${getErrorMessage(error)}`, true);
  }
}

async function handleBackupFileSelection(event: Event & { target: HTMLInputElement | null }) {
  const file = event.target?.files?.[0];
  if (!file) return;
  try {
    await importFromRawText(await file.text(), file.name);
  } catch (error) {
    setImportStatus(`Import failed: ${getErrorMessage(error)}`, true);
  } finally {
    if (event.target) event.target.value = '';
  }
}

async function importPendingMobileIRealLink() {
  const pendingResult = await consumePendingIRealLinkResult();
  const pendingIRealLink = pendingResult.url;
  if (!pendingIRealLink && pendingResult.hadPendingMarker) {
    setImportStatus(pendingResult.errorMessage ? `iReal link detected, but the captured text could not be loaded: ${pendingResult.errorMessage}` : 'iReal link detected, but the captured text could not be loaded. Open the forum tracks and tap the link again.', true);
    return;
  }
  if (!pendingIRealLink) return;
  setImportStatus('iReal link captured. Importing charts...');
  await importFromRawText(pendingIRealLink, 'pasted-ireal-link');
}

async function bindIncomingMobileIRealImports() {
  if (!window.Capacitor?.isNativePlatform?.()) return;
  let appPlugin = null;
  try {
    const capacitorAppModule = await import('@capacitor/app');
    appPlugin = capacitorAppModule?.App || null;
  } catch (_error) {
    appPlugin = window.Capacitor?.Plugins?.App || null;
  }
  if (!appPlugin?.addListener) return;
  const handleIncomingUrl = (url: string) => {
    if (!isIRealDeepLink(url)) return;
    storePendingIRealLink(url);
    setImportStatus('iReal link detected. Loading captured text...');
    void importPendingMobileIRealLink();
  };
  try {
    const launchUrl = await appPlugin.getLaunchUrl?.();
    handleIncomingUrl(String(launchUrl?.url || ''));
  } catch (_error) {
    // Keep listener active.
  }
  appPlugin.addListener('appUrlOpen', ({ url }: { url?: string }) => handleIncomingUrl(String(url || '')));
}

bindChartImportControls({
  importIRealBackupButton: dom.importIRealBackupButton,
  irealBackupInput: dom.irealBackupInput,
  openIRealForumButton: dom.openIRealForumButton,
  forumTracksUrl: IREAL_FORUM_TRACKS_URL,
  setImportStatus,
  onBackupFileSelection: handleBackupFileSelection,
  onOpenForumTracks: () => openIrealBrowser({ url: IREAL_FORUM_TRACKS_URL, title: 'Click on a link to import' })
});

void bindIncomingMobileIRealImports().then(() => importPendingMobileIRealLink());

dom.clearAllChartsButton?.addEventListener('click', async () => {
  try {
    await clearPersistedChartLibrary();
    currentDocuments = [];
    currentSetlists = [];
    selectedChartIds.clear();
    setImportStatus('All charts removed.');
    renderManageUi();
  } catch (error) {
    setImportStatus(`Failed to remove charts: ${getErrorMessage(error)}`, true);
  }
});

[dom.manageChartSearchInput, dom.manageOriginFilter, dom.manageSourceFilter, dom.manageTagFilter, dom.manageSetlistFilter, dom.manageStyleFilter, dom.manageUnorganizedFilter].forEach((element) => {
  element?.addEventListener('input', renderManageCharts);
  element?.addEventListener('change', renderManageCharts);
});
dom.manageToggleResultsButton?.addEventListener('click', () => {
  resultsExpanded = !resultsExpanded;
  renderManageCharts();
});
dom.manageSelectMatchingButton?.addEventListener('click', () => {
  selectedChartIds = new Set(getFilteredManageDocuments().map((document) => document.metadata.id));
  renderManageCharts();
  renderSelectionState();
});
dom.manageSelectVisibleButton?.addEventListener('click', () => {
  for (const document of getFilteredManageDocuments().slice(0, VISIBLE_RESULT_LIMIT)) selectedChartIds.add(document.metadata.id);
  renderManageCharts();
  renderSelectionState();
});
dom.manageClearSelectionButton?.addEventListener('click', () => {
  selectedChartIds.clear();
  renderManageCharts();
  renderSelectionState();
});
dom.managePreviewBatchButton?.addEventListener('click', () => {
  void previewAndApplyBatch().catch((error) => setImportStatus(`Batch action failed: ${getErrorMessage(error)}`, true));
});
dom.manageCreateSetlistButton?.addEventListener('click', () => {
  void createSetlist().catch((error) => setImportStatus(`Failed to create setlist: ${getErrorMessage(error)}`, true));
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeMetadataPanel();
});

void loadManageState().catch((error) => {
  setImportStatus(`Failed to load chart library: ${getErrorMessage(error)}`, true);
});
