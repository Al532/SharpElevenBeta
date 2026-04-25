import { createChartDocumentsFromIRealText } from './chart/index.js';
import { initializeSharpElevenTheme } from './src/features/app/app-theme.js';
import {
  consumePendingIRealLinkResult,
  isIRealDeepLink,
  storePendingIRealLink
} from './src/features/app/app-pending-mobile-import.js';
import { openIrealBrowser } from './src/features/app/ireal-browser.js';
import { clearPersistedChartLibrary, persistChartLibrary } from './src/features/chart/chart-persistence.js';
import { importDocumentsFromIRealText } from './src/features/chart/chart-library.js';
import {
  bindChartImportControls,
  setChartImportStatus
} from './src/features/chart/chart-import-controls.js';

const themeApi = initializeSharpElevenTheme();

const IREAL_FORUM_TRACKS_URL = 'https://forums.irealpro.com';

const dom = {
  importIRealBackupButton: document.getElementById('import-ireal-backup-button') as HTMLButtonElement | null,
  openIRealForumButton: document.getElementById('open-ireal-forum-button') as HTMLButtonElement | null,
  irealBackupInput: document.getElementById('ireal-backup-input') as HTMLInputElement | null,
  clearAllChartsButton: document.getElementById('clear-all-charts-button') as HTMLButtonElement | null,
  homeThemeSelect: document.getElementById('home-theme-select') as HTMLSelectElement | null,
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

function initializeThemeSelector(themeSelect: HTMLSelectElement | null) {
  if (!themeSelect) return;

  const availableThemes = themeApi.listPalettes();
  themeSelect.replaceChildren();

  for (const paletteName of availableThemes) {
    const option = document.createElement('option');
    option.value = paletteName;
    option.textContent = paletteName;
    themeSelect.append(option);
  }

  themeSelect.value = themeApi.getPalette();
  themeSelect.disabled = false;

  themeSelect.addEventListener('change', () => {
    try {
      const appliedTheme = themeApi.setPalette(themeSelect.value);
      themeSelect.value = appliedTheme;
    } catch (error) {
      console.error('Failed to change theme.', error);
      themeSelect.value = themeApi.getPalette();
    }
  });
}

initializeThemeSelector(dom.homeThemeSelect);

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

    const persistedLibrary = await persistChartLibrary({
      documents,
      source: sourceFile,
      mergeWithExisting: true
    });

    if (!persistedLibrary || persistedLibrary.documents.length === 0) {
      throw new Error('The imported chart library could not be confirmed in persistent storage.');
    }

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

async function importPendingMobileIRealLink() {
  const pendingResult = await consumePendingIRealLinkResult();
  const pendingIRealLink = pendingResult.url;

  if (!pendingIRealLink && pendingResult.hadPendingMarker) {
    setImportStatus(
      pendingResult.errorMessage
        ? `iReal link detected, but the captured text could not be loaded: ${pendingResult.errorMessage}`
        : 'iReal link detected, but the captured text could not be loaded. Open the forum tracks and tap the link again.',
      true
    );
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
    // Keep the live listener active even if launch URL retrieval fails.
  }

  appPlugin.addListener('appUrlOpen', ({ url }: { url?: string }) => {
    handleIncomingUrl(String(url || ''));
  });
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

void bindIncomingMobileIRealImports().then(() => importPendingMobileIRealLink());

dom.clearAllChartsButton?.addEventListener('click', async () => {
  try {
    await clearPersistedChartLibrary();
    setImportStatus('All charts removed.');
  } catch (error) {
    setImportStatus(`Failed to remove charts: ${getErrorMessage(error)}`, true);
  }
});
