import { createChartDocumentsFromIRealText } from './chart/index.js';
import { initializeSharpElevenTheme } from './src/features/app/app-theme.js';
import { openIrealBrowser } from './src/features/app/ireal-browser.js';
import { clearPersistedChartLibrary, persistChartLibrary } from './src/features/chart/chart-persistence.js';
import { importDocumentsFromIRealText } from './src/features/chart/chart-library.js';
import {
  bindChartImportControls,
  setChartImportStatus
} from './src/features/chart/chart-import-controls.js';

initializeSharpElevenTheme();

const IREAL_FORUM_TRACKS_URL = 'https://forums.irealpro.com/#songs.3';

const dom = {
  importIRealBackupButton: document.getElementById('import-ireal-backup-button') as HTMLButtonElement | null,
  openIRealForumButton: document.getElementById('open-ireal-forum-button') as HTMLButtonElement | null,
  irealBackupInput: document.getElementById('ireal-backup-input') as HTMLInputElement | null,
  clearAllChartsButton: document.getElementById('clear-all-charts-button') as HTMLButtonElement | null,
  chartImportStatus: document.getElementById('chart-import-status')
};

function setImportStatus(message: string, isError = false) {
  setChartImportStatus(dom.chartImportStatus, message, isError);
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error || 'Unknown error');
}

function pluralizeChartLabel(count: number) {
  return `chart${count === 1 ? '' : 's'}`;
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

    await persistChartLibrary({
      documents,
      source: sourceFile
    });

    setImportStatus(`Loaded ${documents.length} ${pluralizeChartLabel(documents.length)} from ${sourceFile}.`);
  } catch (error) {
    setImportStatus(`Import failed: ${getErrorMessage(error)}`, true);
  }
}

async function handleBackupFileSelection(event: Event & { target: HTMLInputElement | null }) {
  const file = event.target?.files?.[0];
  if (!file) return;

  try {
    const rawText = await file.text();
    await importFromRawText(rawText, file.name);
  } catch (error) {
    setImportStatus(`Import failed: ${getErrorMessage(error)}`, true);
  } finally {
    if (event.target) event.target.value = '';
  }
}

bindChartImportControls({
  importIRealBackupButton: dom.importIRealBackupButton,
  irealBackupInput: dom.irealBackupInput,
  openIRealForumButton: dom.openIRealForumButton,
  forumTracksUrl: IREAL_FORUM_TRACKS_URL,
  setImportStatus,
  onBackupFileSelection: handleBackupFileSelection,
  onOpenForumTracks: () => openIrealBrowser({
    url: IREAL_FORUM_TRACKS_URL,
    title: 'Click on a link to import'
  })
});

dom.clearAllChartsButton?.addEventListener('click', async () => {
  try {
    await clearPersistedChartLibrary();
    setImportStatus('All charts removed.');
  } catch (error) {
    setImportStatus(`Failed to remove charts: ${getErrorMessage(error)}`, true);
  }
});
