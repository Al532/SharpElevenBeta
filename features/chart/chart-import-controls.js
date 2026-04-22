export function setChartImportStatus(chartImportStatusElement, message, isError = false) {
  if (!chartImportStatusElement) return;
  chartImportStatusElement.textContent = message || '';
  chartImportStatusElement.style.color = isError ? '#9f1239' : '';
}

export async function importDefaultFixtureLibrary({
  sourceUrl,
  fetchImpl = fetch,
  importDocumentsFromIRealText,
  applyImportedLibrary,
  loadPersistedChartId
} = {}) {
  const response = await fetchImpl(sourceUrl);
  if (!response.ok) {
    throw new Error(`Failed to load iReal source (${response.status})`);
  }
  const rawText = await response.text();
  const importedDocuments = await importDocumentsFromIRealText(
    rawText,
    sourceUrl.split('/').pop() || 'jazz-1460.txt'
  );

  applyImportedLibrary({
    documents: importedDocuments,
    source: 'bundled default library',
    preferredId: loadPersistedChartId?.(),
    statusMessage: `Loaded ${importedDocuments.length} charts from the bundled default library.`
  });
}

export async function handleChartBackupFileSelection({
  event,
  importDocumentsFromIRealText,
  applyImportedLibrary,
  setImportStatus
} = {}) {
  const file = event?.target?.files?.[0];
  if (!file) return;

  try {
    const rawText = await file.text();
    const documents = await importDocumentsFromIRealText(rawText, file.name);
    applyImportedLibrary({
      documents,
      source: file.name,
      statusMessage: `Loaded ${documents.length} charts from ${file.name}.`
    });
  } catch (error) {
    setImportStatus?.(`Import failed: ${error.message}`, true);
  } finally {
    event.target.value = '';
  }
}

export async function handlePastedChartIRealLinkImport({
  rawText,
  importDocumentsFromIRealText,
  applyImportedLibrary,
  setImportStatus
} = {}) {
  const trimmedText = String(rawText || '').trim();
  if (!trimmedText) {
    setImportStatus?.('Paste an irealb:// link first.', true);
    return;
  }

  try {
    const documents = await importDocumentsFromIRealText(trimmedText, 'pasted-ireal-link');
    applyImportedLibrary({
      documents,
      source: 'pasted iReal link',
      statusMessage: `Loaded ${documents.length} charts from the pasted iReal link.`
    });
  } catch (error) {
    setImportStatus?.(`Import failed: ${error.message}`, true);
  }
}

export function bindChartImportControls({
  importIRealBackupButton,
  irealBackupInput,
  openIRealDefaultPlaylistsButton,
  openIRealForumButton,
  importIRealLinkButton,
  irealLinkInput,
  defaultPlaylistsUrl,
  forumTracksUrl,
  setImportStatus,
  onBackupFileSelection,
  onPastedLinkImport
} = {}) {
  importIRealBackupButton?.addEventListener('click', () => {
    irealBackupInput?.click();
  });
  irealBackupInput?.addEventListener('change', onBackupFileSelection);
  openIRealDefaultPlaylistsButton?.addEventListener('click', () => {
    window.open(defaultPlaylistsUrl, '_blank', 'noopener,noreferrer');
    setImportStatus?.('Default playlists opened in a new tab. Paste an irealb:// link here when ready.');
  });
  openIRealForumButton?.addEventListener('click', () => {
    window.open(forumTracksUrl, '_blank', 'noopener,noreferrer');
    setImportStatus?.('Forum tracks opened in a new tab. Paste an irealb:// link here when ready.');
  });
  importIRealLinkButton?.addEventListener('click', onPastedLinkImport);
  irealLinkInput?.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    onPastedLinkImport?.();
  });
}
