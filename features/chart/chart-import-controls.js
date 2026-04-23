// @ts-check

/** @typedef {import('../../core/types/contracts').ChartDocument} ChartDocument */

/**
 * @param {HTMLElement | null | undefined} chartImportStatusElement
 * @param {string} message
 * @param {boolean} [isError]
 * @returns {void}
 */
export function setChartImportStatus(chartImportStatusElement, message, isError = false) {
  if (!chartImportStatusElement) return;
  chartImportStatusElement.textContent = message || '';
  chartImportStatusElement.style.color = isError ? '#9f1239' : '';
}

/**
 * @param {{
 *   sourceUrl?: string,
 *   fetchImpl?: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>,
 *   importDocumentsFromIRealText?: (rawText: string, sourceFile: string) => Promise<ChartDocument[]>,
 *   applyImportedLibrary?: (options: { documents: ChartDocument[], source: string, preferredId?: string, statusMessage?: string }) => void,
 *   loadPersistedChartId?: () => string
 * }} [options]
 * @returns {Promise<void>}
 */
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

/**
 * @param {{
 *   event?: Event & { target: HTMLInputElement | null },
 *   importDocumentsFromIRealText?: (rawText: string, sourceFile: string) => Promise<ChartDocument[]>,
 *   applyImportedLibrary?: (options: { documents: ChartDocument[], source: string, statusMessage?: string }) => void,
 *   setImportStatus?: (message: string, isError?: boolean) => void
 * }} [options]
 * @returns {Promise<void>}
 */
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

/**
 * @param {{
 *   rawText?: string,
 *   importDocumentsFromIRealText?: (rawText: string, sourceFile: string) => Promise<ChartDocument[]>,
 *   applyImportedLibrary?: (options: { documents: ChartDocument[], source: string, statusMessage?: string }) => void,
 *   setImportStatus?: (message: string, isError?: boolean) => void
 * }} [options]
 * @returns {Promise<void>}
 */
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

/**
 * @param {{
 *   importIRealBackupButton?: HTMLButtonElement | null,
 *   irealBackupInput?: HTMLInputElement | null,
 *   openIRealDefaultPlaylistsButton?: HTMLButtonElement | null,
 *   openIRealForumButton?: HTMLButtonElement | null,
 *   importIRealLinkButton?: HTMLButtonElement | null,
 *   irealLinkInput?: HTMLInputElement | null,
 *   defaultPlaylistsUrl?: string,
 *   forumTracksUrl?: string,
 *   setImportStatus?: (message: string, isError?: boolean) => void,
 *   onBackupFileSelection?: EventListener,
 *   onPastedLinkImport?: () => void,
 *   onOpenForumTracks?: () => Promise<boolean> | boolean
 * }} [options]
 * @returns {void}
 */
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
  onPastedLinkImport,
  onOpenForumTracks
} = {}) {
  importIRealBackupButton?.addEventListener('click', () => {
    irealBackupInput?.click();
  });
  irealBackupInput?.addEventListener('change', onBackupFileSelection);
  openIRealDefaultPlaylistsButton?.addEventListener('click', () => {
    window.open(defaultPlaylistsUrl, '_blank', 'noopener,noreferrer');
    setImportStatus?.('Default playlists opened in a new tab. Paste an irealb:// link here when ready.');
  });
  openIRealForumButton?.addEventListener('click', async () => {
    const openedInternally = await onOpenForumTracks?.();
    if (openedInternally) {
      setImportStatus?.('Forum tracks opened in the in-app browser. Tap an irealb:// link there to import it here.');
      return;
    }
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
