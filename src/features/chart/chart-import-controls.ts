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
  rawText: bundledRawText,
  fetchImpl = fetch,
  importDocumentsFromIRealText,
  applyImportedLibrary,
  loadPersistedChartId
}: {
  sourceUrl?: string;
  rawText?: string;
  fetchImpl?: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
  importDocumentsFromIRealText?: (rawText: string, sourceFile: string) => Promise<ChartDocument[]>;
  applyImportedLibrary?: (options: { documents: ChartDocument[]; source: string; preferredId?: string; statusMessage?: string }) => void;
  loadPersistedChartId?: () => string;
} = {}): Promise<void> {
  let rawText = bundledRawText;
  const sourceFile = String(sourceUrl || '').split('/').pop() || 'jazz-1460.txt';

  if (rawText === undefined) {
    let response: Response;
    try {
      response = await fetchImpl(String(sourceUrl));
      if (!response.ok) {
        throw new Error(`Failed to load iReal source (${response.status})`);
      }
    } catch {
      applyImportedLibrary?.({
        documents: [],
        source: 'bundled default library',
        preferredId: loadPersistedChartId?.(),
        statusMessage: 'No bundled chart library found. Import an iReal backup or paste an iReal link.'
      });
      return;
    }

    rawText = await response.text();
  }

  try {
    if (/^\s*(?:<!doctype\s+html|<html[\s>])/i.test(rawText)) {
      throw new Error('Bundled iReal source resolved to HTML instead of iReal text.');
    }

    const importedDocuments = await importDocumentsFromIRealText?.(
      rawText,
      sourceFile
    ) || [];

    applyImportedLibrary?.({
      documents: importedDocuments,
      source: 'bundled default library',
      preferredId: loadPersistedChartId?.(),
      statusMessage: `Loaded ${importedDocuments.length} charts from the bundled default library.`
    });
  } catch (error) {
    applyImportedLibrary?.({
      documents: [],
      source: 'bundled default library',
      preferredId: loadPersistedChartId?.(),
      statusMessage: `Failed to import bundled chart library: ${error instanceof Error ? error.message : String(error)}`
    });
  }
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
  openIRealForumButton,
  forumTracksUrl,
  setImportStatus,
  onBackupFileSelection,
  onOpenForumTracks
}: {
  importIRealBackupButton?: HTMLButtonElement | null;
  irealBackupInput?: HTMLInputElement | null;
  openIRealForumButton?: HTMLButtonElement | null;
  forumTracksUrl?: string;
  setImportStatus?: (message: string, isError?: boolean) => void;
  onBackupFileSelection?: EventListener;
  onOpenForumTracks?: () => Promise<boolean> | boolean;
} = {}): void {
  importIRealBackupButton?.addEventListener('click', () => {
    irealBackupInput?.click();
  });
  if (onBackupFileSelection) {
    irealBackupInput?.addEventListener('change', onBackupFileSelection);
  }
  openIRealForumButton?.addEventListener('click', async () => {
    const openedInternally = await onOpenForumTracks?.();
    if (openedInternally) {
      setImportStatus?.('Forum tracks opened in the in-app browser. Click on a link to import.');
      return;
    }
    window.open(forumTracksUrl, '_blank', 'noopener,noreferrer');
    setImportStatus?.('Forum tracks opened in a new tab. Click on a link to import.');
  });
}
