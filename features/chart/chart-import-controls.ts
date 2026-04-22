import type { ChartDocument } from '../../core/types/contracts';

export function setChartImportStatus(
  chartImportStatusElement: HTMLElement | null | undefined,
  message: string,
  isError = false
): void {
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
}: {
  sourceUrl?: string;
  fetchImpl?: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
  importDocumentsFromIRealText?: (rawText: string, sourceFile: string) => Promise<ChartDocument[]>;
  applyImportedLibrary?: (options: { documents: ChartDocument[]; source: string; preferredId?: string; statusMessage?: string }) => void;
  loadPersistedChartId?: () => string;
} = {}): Promise<void> {
  const response = await fetchImpl(String(sourceUrl));
  if (!response.ok) {
    throw new Error(`Failed to load iReal source (${response.status})`);
  }
  const rawText = await response.text();
  const importedDocuments = await importDocumentsFromIRealText?.(
    rawText,
    String(sourceUrl || '').split('/').pop() || 'jazz-1460.txt'
  ) || [];

  applyImportedLibrary?.({
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
}: {
  event?: Event & { target: HTMLInputElement | null };
  importDocumentsFromIRealText?: (rawText: string, sourceFile: string) => Promise<ChartDocument[]>;
  applyImportedLibrary?: (options: { documents: ChartDocument[]; source: string; statusMessage?: string }) => void;
  setImportStatus?: (message: string, isError?: boolean) => void;
} = {}): Promise<void> {
  const file = event?.target?.files?.[0];
  if (!file) return;

  try {
    const rawText = await file.text();
    const documents = await importDocumentsFromIRealText?.(rawText, file.name) || [];
    applyImportedLibrary?.({
      documents,
      source: file.name,
      statusMessage: `Loaded ${documents.length} charts from ${file.name}.`
    });
  } catch (error) {
    setImportStatus?.(`Import failed: ${error instanceof Error ? error.message : String(error)}`, true);
  } finally {
    if (event?.target) {
      event.target.value = '';
    }
  }
}

export async function handlePastedChartIRealLinkImport({
  rawText,
  importDocumentsFromIRealText,
  applyImportedLibrary,
  setImportStatus
}: {
  rawText?: string;
  importDocumentsFromIRealText?: (rawText: string, sourceFile: string) => Promise<ChartDocument[]>;
  applyImportedLibrary?: (options: { documents: ChartDocument[]; source: string; statusMessage?: string }) => void;
  setImportStatus?: (message: string, isError?: boolean) => void;
} = {}): Promise<void> {
  const trimmedText = String(rawText || '').trim();
  if (!trimmedText) {
    setImportStatus?.('Paste an irealb:// link first.', true);
    return;
  }

  try {
    const documents = await importDocumentsFromIRealText?.(trimmedText, 'pasted-ireal-link') || [];
    applyImportedLibrary?.({
      documents,
      source: 'pasted iReal link',
      statusMessage: `Loaded ${documents.length} charts from the pasted iReal link.`
    });
  } catch (error) {
    setImportStatus?.(`Import failed: ${error instanceof Error ? error.message : String(error)}`, true);
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
}: {
  importIRealBackupButton?: HTMLButtonElement | null;
  irealBackupInput?: HTMLInputElement | null;
  openIRealDefaultPlaylistsButton?: HTMLButtonElement | null;
  openIRealForumButton?: HTMLButtonElement | null;
  importIRealLinkButton?: HTMLButtonElement | null;
  irealLinkInput?: HTMLInputElement | null;
  defaultPlaylistsUrl?: string;
  forumTracksUrl?: string;
  setImportStatus?: (message: string, isError?: boolean) => void;
  onBackupFileSelection?: EventListener;
  onPastedLinkImport?: () => void;
} = {}): void {
  importIRealBackupButton?.addEventListener('click', () => {
    irealBackupInput?.click();
  });
  if (onBackupFileSelection) {
    irealBackupInput?.addEventListener('change', onBackupFileSelection);
  }
  openIRealDefaultPlaylistsButton?.addEventListener('click', () => {
    window.open(defaultPlaylistsUrl, '_blank', 'noopener,noreferrer');
    setImportStatus?.('Default playlists opened in a new tab. Paste an irealb:// link here when ready.');
  });
  openIRealForumButton?.addEventListener('click', () => {
    window.open(forumTracksUrl, '_blank', 'noopener,noreferrer');
    setImportStatus?.('Forum tracks opened in a new tab. Paste an irealb:// link here when ready.');
  });
  importIRealLinkButton?.addEventListener('click', () => {
    onPastedLinkImport?.();
  });
  irealLinkInput?.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    onPastedLinkImport?.();
  });
}
