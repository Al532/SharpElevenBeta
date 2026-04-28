import type { ChartDocument, ChartScreenState } from '../../core/types/contracts.js';
import {
  hasPersistedChartDocumentIndex,
  persistChartLibrary
} from './chart-persistence.js';
import {
  type IRealImportContext,
  importDocumentsFromIRealText as importChartDocumentsFromIRealText
} from './chart-library.js';
import { createChartLibraryImportBindings } from './chart-app-bindings.js';

type ChartLibraryImportFlowDom = {
  chartSearchInput?: HTMLInputElement | null;
};

type ChartLibraryImportFlowOptions = {
  state: ChartScreenState & {
    currentLibrarySourceLabel?: string;
    currentSearch?: string;
  };
  dom: ChartLibraryImportFlowDom;
  importDocuments: (...args: any[]) => any;
  renderChartSelector: (preferredId?: string | null) => void;
  renderFixture: () => void;
  setImportStatus: (message: string, isError?: boolean) => void;
  getRequestedPlaylist: () => string;
  applySearchFilter: () => void;
  getChartRenderPerfNow: () => number;
  logChartRenderPerf: (label: string, startedAt: number, details?: Record<string, unknown>) => void;
};

export function createChartLibraryImportFlow({
  state,
  dom,
  importDocuments,
  renderChartSelector,
  renderFixture,
  setImportStatus,
  getRequestedPlaylist,
  applySearchFilter,
  getChartRenderPerfNow,
  logChartRenderPerf
}: ChartLibraryImportFlowOptions) {
  async function importDocumentsFromIRealText(rawText: string, sourceFile = '', importContext?: IRealImportContext) {
    const startedAt = getChartRenderPerfNow();
    return importChartDocumentsFromIRealText(createChartLibraryImportBindings({
      rawText,
      sourceFile,
      importContext,
      importDocuments
    })).finally(() => {
      logChartRenderPerf('importDocumentsFromIRealText', startedAt, {
        sourceFile
      });
    });
  }

  function renderImportedLibrary({
    documents,
    source,
    preferredId,
    statusMessage,
    renderSelectedChart = true
  }: {
    documents: ChartDocument[],
    source: string,
    preferredId?: string | null,
    statusMessage?: string,
    renderSelectedChart?: boolean
  }) {
    state.fixtureLibrary = {
      source,
      documents
    };
    state.filteredDocuments = [...documents];
    state.currentLibrarySourceLabel = String(source || '');
    if (dom.chartSearchInput) {
      dom.chartSearchInput.value = '';
    }
    state.currentSearch = '';
    renderChartSelector(preferredId);
    if (renderSelectedChart) {
      renderFixture();
    }
    setImportStatus(statusMessage || `Loaded ${documents.length} charts from ${source}.`);

    const requestedPlaylist = getRequestedPlaylist();
    if (requestedPlaylist && dom.chartSearchInput) {
      dom.chartSearchInput.value = requestedPlaylist;
      applySearchFilter();
    }
  }

  async function persistImportedLibraryInBackground({
    documents,
    source,
    mergeWithExisting
  }: {
    documents: ChartDocument[],
    source: string,
    mergeWithExisting: boolean
  }) {
    const startedAt = getChartRenderPerfNow();
    try {
      await persistChartLibrary({
        documents,
        source,
        mergeWithExisting
      });
    } catch (error) {
      console.warn('Failed to persist chart library after initial render.', error);
    } finally {
      logChartRenderPerf('persistChartLibrary', startedAt, {
        source,
        mergeWithExisting,
        background: true
      });
    }
  }

  async function backfillChartDocumentIndexInBackground({
    documents,
    source
  }: {
    documents: ChartDocument[],
    source: string
  }) {
    const hasDocumentIndex = await hasPersistedChartDocumentIndex();
    if (hasDocumentIndex) return;
    await persistImportedLibraryInBackground({
      documents,
      source,
      mergeWithExisting: false
    });
  }

  async function applyImportedLibrary({ documents, source, preferredId = null, statusMessage = '' }: {
    documents: ChartDocument[],
    source: string,
    preferredId?: string | null,
    statusMessage?: string
  }): Promise<void> {
    let nextDocuments = documents;
    const isBundledDefaultLibrary = source === 'bundled default library';

    if (documents.length > 0) {
      const shouldMerge = !isBundledDefaultLibrary;

      if (isBundledDefaultLibrary) {
        renderImportedLibrary({
          documents: nextDocuments,
          source,
          preferredId,
          statusMessage
        });
        void persistImportedLibraryInBackground({
          documents,
          source,
          mergeWithExisting: shouldMerge
        });
        return;
      }

      const startedAt = getChartRenderPerfNow();
      const persistedLibrary = await persistChartLibrary({
        documents,
        source,
        mergeWithExisting: shouldMerge
      }).finally(() => {
        logChartRenderPerf('persistChartLibrary', startedAt, {
          source,
          mergeWithExisting: shouldMerge,
          background: false
        });
      });

      if (!persistedLibrary) {
        throw new Error('The imported chart library could not be confirmed in persistent storage.');
      }

      if (persistedLibrary.documents.length === 0) {
        throw new Error('The imported chart library could not be confirmed in persistent storage.');
      }

      nextDocuments = persistedLibrary.documents;
      source = persistedLibrary.source;
    }
    renderImportedLibrary({
      documents: nextDocuments,
      source,
      preferredId,
      statusMessage
    });
  }

  return {
    importDocumentsFromIRealText,
    renderImportedLibrary,
    persistImportedLibraryInBackground,
    backfillChartDocumentIndexInBackground,
    applyImportedLibrary
  };
}
