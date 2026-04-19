import {
  createChartPlaybackPlanFromDocument,
  createChartViewModel,
  createDrillExportFromPlaybackPlan
} from '../chart/index.js';

const DEFAULT_TEMPO = 120;
const DEFAULT_BAR_GROUP_SIZE = 4;
const DRILL_STATE_POLL_INTERVAL_MS = 120;

const dom = {
  chartSearchInput: document.getElementById('chart-search-input'),
  chartLibraryCount: document.getElementById('chart-library-count'),
  fixtureSelect: document.getElementById('fixture-select'),
  transposeSelect: document.getElementById('transpose-select'),
  tempoInput: document.getElementById('tempo-input'),
  sheetStyle: document.getElementById('sheet-style'),
  sheetTitle: document.getElementById('sheet-title'),
  sheetSubtitle: document.getElementById('sheet-subtitle'),
  sheetTimeSignature: document.getElementById('sheet-time-signature'),
  sheetKey: document.getElementById('sheet-key'),
  sheetGrid: document.getElementById('sheet-grid'),
  chartMeta: document.getElementById('chart-meta'),
  playbackGrid: document.getElementById('playback-grid'),
  drillExport: document.getElementById('drill-export'),
  diagnosticsList: document.getElementById('diagnostics-list'),
  transportStatus: document.getElementById('transport-status'),
  transportPosition: document.getElementById('transport-position'),
  playButton: document.getElementById('play-button'),
  stopButton: document.getElementById('stop-button'),
  compingStyleSelect: document.getElementById('comping-style-select'),
  drumsSelect: document.getElementById('drums-select'),
  walkingBassToggle: document.getElementById('walking-bass-toggle'),
  masterVolume: document.getElementById('master-volume'),
  masterVolumeValue: document.getElementById('master-volume-value'),
  bassVolume: document.getElementById('bass-volume'),
  bassVolumeValue: document.getElementById('bass-volume-value'),
  stringsVolume: document.getElementById('strings-volume'),
  stringsVolumeValue: document.getElementById('strings-volume-value'),
  drumsVolume: document.getElementById('drums-volume'),
  drumsVolumeValue: document.getElementById('drums-volume-value'),
  drillBridgeFrame: document.getElementById('drill-bridge-frame')
};

const state = {
  fixtureLibrary: null,
  filteredDocuments: [],
  currentChartDocument: null,
  currentViewModel: null,
  currentPlaybackPlan: null,
  currentDrillExport: null,
  activeBarId: null,
  activePlaybackEntryIndex: -1,
  drillApi: null,
  drillFrameReadyPromise: null,
  drillPollTimer: null,
  isPlaying: false,
  currentSearch: ''
};

function getAvailableDocuments() {
  return state.filteredDocuments.length > 0
    ? state.filteredDocuments
    : (state.fixtureLibrary?.documents || []);
}

function getPlaybackSettings() {
  return {
    compingStyle: dom.compingStyleSelect.value,
    drumsMode: dom.drumsSelect.value,
    customMediumSwingBass: dom.walkingBassToggle.checked,
    masterVolume: Number(dom.masterVolume.value || 100),
    bassVolume: Number(dom.bassVolume.value || 100),
    stringsVolume: Number(dom.stringsVolume.value || 100),
    drumsVolume: Number(dom.drumsVolume.value || 100)
  };
}

function updateMixerOutputs() {
  dom.masterVolumeValue.textContent = `${dom.masterVolume.value}%`;
  dom.bassVolumeValue.textContent = `${dom.bassVolume.value}%`;
  dom.stringsVolumeValue.textContent = `${dom.stringsVolume.value}%`;
  dom.drumsVolumeValue.textContent = `${dom.drumsVolume.value}%`;
}

function getTempo() {
  const parsed = Number(dom.tempoInput.value || DEFAULT_TEMPO);
  return Number.isFinite(parsed) ? Math.max(40, Math.min(320, parsed)) : DEFAULT_TEMPO;
}

function getDisplayedBarGroupSize() {
  return DEFAULT_BAR_GROUP_SIZE;
}

function setActivePlaybackPosition(barId, entryIndex) {
  state.activeBarId = barId;
  state.activePlaybackEntryIndex = entryIndex;
  renderTransport();
  updateActiveHighlights();
}

function resetActivePlaybackPosition() {
  setActivePlaybackPosition(null, -1);
}

function updateActiveHighlights() {
  document.querySelectorAll('.chart-bar-cell').forEach((element) => {
    element.classList.toggle('is-active', element.dataset.barId === state.activeBarId);
  });

  document.querySelectorAll('.chart-playback-entry').forEach((element) => {
    element.classList.toggle('is-active', Number(element.dataset.entryIndex) === state.activePlaybackEntryIndex);
  });
}

function stopDrillPolling() {
  if (!state.drillPollTimer) return;
  clearInterval(state.drillPollTimer);
  state.drillPollTimer = null;
}

function startDrillPolling() {
  stopDrillPolling();
  state.drillPollTimer = window.setInterval(syncPlaybackStateFromDrill, DRILL_STATE_POLL_INTERVAL_MS);
}

function getDrillBridgeWindow() {
  return dom.drillBridgeFrame?.contentWindow || null;
}

function getDrillApi() {
  if (state.drillApi) return state.drillApi;
  const drillWindow = getDrillBridgeWindow();
  const drillApi = drillWindow?.__JPT_DRILL_API__ || null;
  if (drillApi) {
    state.drillApi = drillApi;
  }
  return state.drillApi;
}

function ensureDrillApi() {
  const existingApi = getDrillApi();
  if (existingApi) return Promise.resolve(existingApi);
  if (state.drillFrameReadyPromise) return state.drillFrameReadyPromise;

  state.drillFrameReadyPromise = new Promise((resolve, reject) => {
    const frame = dom.drillBridgeFrame;
    if (!frame) {
      reject(new Error('Missing Drill bridge iframe.'));
      return;
    }

    const finish = () => {
      const drillApi = getDrillApi();
      if (drillApi) {
        resolve(drillApi);
        return true;
      }
      return false;
    };

    if (finish()) return;

    const onReady = () => {
      cleanup();
      if (finish()) return;
      reject(new Error('Drill bridge loaded without exposing an API.'));
    };

    const onLoad = () => {
      window.setTimeout(() => {
        if (finish()) {
          cleanup();
          resolve(getDrillApi());
        }
      }, 0);
    };

    const cleanup = () => {
      frame.removeEventListener('load', onLoad);
      getDrillBridgeWindow()?.removeEventListener?.('jpt-drill-api-ready', onReady);
    };

    frame.addEventListener('load', onLoad, { once: true });
    getDrillBridgeWindow()?.addEventListener?.('jpt-drill-api-ready', onReady, { once: true });

    window.setTimeout(() => {
      if (finish()) {
        cleanup();
        resolve(getDrillApi());
        return;
      }
      cleanup();
      reject(new Error('Timed out while waiting for the Drill bridge.'));
    }, 10000);
  }).catch((error) => {
    state.drillFrameReadyPromise = null;
    throw error;
  });

  return state.drillFrameReadyPromise;
}

function getPlaybackEntryIndexFromDrillState(drillState) {
  if (!state.currentPlaybackPlan?.entries?.length) return -1;
  if (!drillState?.isPlaying || drillState.isIntro) return -1;

  const chordIndex = Number(drillState.currentChordIdx);
  if (!Number.isFinite(chordIndex) || chordIndex < 0) return -1;

  return Math.floor(chordIndex / 4) % state.currentPlaybackPlan.entries.length;
}

function syncPlaybackStateFromDrill() {
  const drillApi = getDrillApi();
  if (!drillApi) {
    state.isPlaying = false;
    resetActivePlaybackPosition();
    dom.transportStatus.textContent = 'Drill bridge unavailable';
    return;
  }

  const drillState = drillApi.getPlaybackState();
  const isPlaying = Boolean(drillState?.isPlaying);
  state.isPlaying = isPlaying;

  const entryIndex = getPlaybackEntryIndexFromDrillState(drillState);
  const entry = entryIndex >= 0 ? state.currentPlaybackPlan?.entries?.[entryIndex] : null;
  setActivePlaybackPosition(entry?.barId || null, entryIndex);

  if (drillState?.isPaused) {
    dom.transportStatus.textContent = 'Paused in Drill';
  } else if (drillState?.isIntro) {
    dom.transportStatus.textContent = 'Intro count-in';
  } else if (isPlaying) {
    dom.transportStatus.textContent = 'Playing via Drill';
  } else {
    dom.transportStatus.textContent = 'Ready';
  }
}

async function stopPlayback({ resetPosition = true } = {}) {
  stopDrillPolling();

  const drillApi = getDrillApi();
  if (drillApi) {
    drillApi.stopPlayback();
  }

  state.isPlaying = false;
  if (resetPosition) {
    resetActivePlaybackPosition();
  } else {
    renderTransport();
    updateActiveHighlights();
  }
}

async function startPlayback() {
  if (!state.currentDrillExport?.enginePatternString) return;

  dom.transportStatus.textContent = 'Connecting to Drill...';

  const drillApi = await ensureDrillApi();
  const playbackSettings = getPlaybackSettings();
  const applyResult = drillApi.applyEmbeddedPattern({
    patternName: state.currentChartDocument?.metadata?.title || 'Chart Dev',
    patternString: state.currentDrillExport.enginePatternString,
    patternMode: 'both',
    tempo: getTempo(),
    compingStyle: playbackSettings.compingStyle,
    drumsMode: playbackSettings.drumsMode,
    customMediumSwingBass: playbackSettings.customMediumSwingBass,
    repetitionsPerKey: 1,
    displayMode: 'show-both',
    showBeatIndicator: true,
    hideCurrentHarmony: false,
    masterVolume: playbackSettings.masterVolume,
    bassVolume: playbackSettings.bassVolume,
    stringsVolume: playbackSettings.stringsVolume,
    drumsVolume: playbackSettings.drumsVolume
  });

  if (!applyResult?.ok) {
    throw new Error(applyResult?.errorMessage || 'Drill rejected the interpreted chart.');
  }

  const startResult = await drillApi.startPlayback();
  if (!startResult?.ok) {
    throw new Error(startResult?.errorMessage || 'Drill failed to start playback.');
  }

  state.isPlaying = true;
  startDrillPolling();
  syncPlaybackStateFromDrill();
}

async function syncDrillPlaybackSettings() {
  try {
    const drillApi = await ensureDrillApi();
    const playbackSettings = getPlaybackSettings();
    const result = await drillApi.applyEmbeddedPlaybackSettings({
      compingStyle: playbackSettings.compingStyle,
      drumsMode: playbackSettings.drumsMode,
      customMediumSwingBass: playbackSettings.customMediumSwingBass,
      masterVolume: playbackSettings.masterVolume,
      bassVolume: playbackSettings.bassVolume,
      stringsVolume: playbackSettings.stringsVolume,
      drumsVolume: playbackSettings.drumsVolume
    });
    if (!result?.ok) {
      throw new Error(result?.errorMessage || 'Failed to sync Drill settings.');
    }
    if (!state.isPlaying) {
      dom.transportStatus.textContent = 'Ready';
    }
  } catch (error) {
    dom.transportStatus.textContent = `Drill settings error: ${error.message}`;
  }
}

function renderMeta(viewModel) {
  const items = [
    ['Title', viewModel.metadata.title],
    ['Composer', viewModel.metadata.composer],
    ['Style', viewModel.metadata.style],
    ['Source key', viewModel.metadata.sourceKey],
    ['Display key', viewModel.metadata.displayKey],
    ['Time', viewModel.metadata.primaryTimeSignature || '-'],
    ['Bars', String(viewModel.metadata.barCount || viewModel.bars.length)]
  ];

  dom.chartMeta.innerHTML = items
    .map(([term, value]) => `<dt>${term}</dt><dd>${value}</dd>`)
    .join('');
}

function renderToken(token) {
  const symbol = token?.symbol || '';
  const tokenClass = token?.kind === 'repeat_previous_bar' ? 'repeat' : 'chord';
  return `<span class="chart-token ${tokenClass}">${symbol}</span>`;
}

function renderEndingMarkup(endings = []) {
  if (!Array.isArray(endings) || endings.length === 0) return '';
  return `
    <div class="chart-ending-stack">
      ${endings.map(ending => `<span class="chart-ending">${ending}.</span>`).join('')}
    </div>
  `;
}

function getBarFootPills(bar) {
  const pills = [];
  if (bar.flags.includes('fine')) pills.push('Fine');
  if (bar.flags.includes('dc')) pills.push('D.C.');
  if (bar.flags.includes('ds')) pills.push('D.S.');
  if (bar.flags.includes('coda')) pills.push('Coda');
  if (bar.flags.includes('segno')) pills.push('Segno');
  if (bar.comments?.length) pills.push(...bar.comments);
  return pills;
}

function renderBarCell(bar) {
  const classes = ['chart-bar-cell'];
  if (bar.id === state.activeBarId) classes.push('is-active');
  if (bar.flags.includes('repeat_end_barline')) classes.push('is-repeat-end');
  if (bar.flags.includes('final_bar') || bar.flags.includes('end')) classes.push('is-final');

  const footPills = getBarFootPills(bar);
  return `
    <article class="${classes.join(' ')}" data-bar-id="${bar.id}">
      ${renderEndingMarkup(bar.endings)}
      <div class="chart-bar-head">
        <span class="chart-bar-index">${bar.index}</span>
      </div>
      <div class="chart-bar-body">
        ${bar.displayTokens.map(renderToken).join('')}
      </div>
      <div class="chart-bar-foot">
        ${footPills.map(pill => `<span class="chart-foot-pill">${pill}</span>`).join('')}
      </div>
    </article>
  `;
}

function renderSheet(viewModel) {
  const bars = viewModel.bars || [];
  const groupSize = getDisplayedBarGroupSize();
  const rows = [];

  for (let index = 0; index < bars.length; index += groupSize) {
    const rowBars = bars.slice(index, index + groupSize);
    const firstBar = rowBars[0];
    const previousBar = index > 0 ? bars[index - 1] : null;
    const sectionChanged = !previousBar || previousBar.sectionId !== firstBar.sectionId;

    rows.push(`
      <div class="chart-row">
        <div class="chart-section-marker">
          ${sectionChanged ? `<span class="chart-section-badge">${firstBar.sectionLabel}</span>` : '<span class="chart-section-spacer"></span>'}
        </div>
        ${rowBars.map(renderBarCell).join('')}
      </div>
    `);
  }

  dom.sheetGrid.innerHTML = rows.join('');
}

function renderPlaybackPlan(playbackPlan) {
  dom.playbackGrid.innerHTML = playbackPlan.entries.map((entry, entryIndex) => `
    <article class="chart-playback-entry ${entryIndex === state.activePlaybackEntryIndex ? 'is-active' : ''}" data-entry-index="${entryIndex}">
      <div class="chart-playback-bar">${entry.sequenceIndex}. ${entry.sectionLabel} ${entry.barIndex}</div>
      <div class="chart-playback-symbols">${entry.playbackSlots.map(slot => slot.symbol).join('  ') || '-'}</div>
    </article>
  `).join('');

  const diagnostics = playbackPlan.diagnostics || [];
  dom.diagnosticsList.innerHTML = diagnostics.length
    ? diagnostics.map(diagnostic => `<li>${diagnostic.level}: ${diagnostic.message}</li>`).join('')
    : '<li>No diagnostics.</li>';
}

function renderTransport() {
  const totalBars = state.currentPlaybackPlan?.entries?.length || 0;
  const currentBar = state.activePlaybackEntryIndex >= 0 ? state.activePlaybackEntryIndex + 1 : 0;
  if (!state.isPlaying && dom.transportStatus.textContent === 'Playing via Drill') {
    dom.transportStatus.textContent = 'Ready';
  }
  dom.transportPosition.textContent = `Bar ${currentBar} / ${totalBars}`;
  dom.playButton.disabled = state.isPlaying;
  dom.stopButton.disabled = !state.isPlaying && state.activePlaybackEntryIndex < 0;
}

function renderChartSelector(preferredId = null) {
  const documents = getAvailableDocuments();
  const previousId = preferredId || state.currentChartDocument?.metadata?.id || dom.fixtureSelect.value;

  if (documents.length === 0) {
    dom.fixtureSelect.innerHTML = '';
    dom.fixtureSelect.disabled = true;
    dom.chartLibraryCount.textContent = state.currentSearch
      ? 'No matching Medium Swing charts'
      : 'No Medium Swing charts loaded';
    state.currentChartDocument = null;
    state.currentViewModel = null;
    state.currentPlaybackPlan = null;
    state.currentDrillExport = null;
    dom.sheetStyle.textContent = '';
    dom.sheetTitle.textContent = 'No chart';
    dom.sheetSubtitle.textContent = '';
    dom.sheetTimeSignature.textContent = '';
    dom.sheetKey.textContent = '';
    dom.sheetGrid.innerHTML = '';
    dom.chartMeta.innerHTML = '';
    dom.playbackGrid.innerHTML = '';
    dom.drillExport.textContent = 'No Drill export.';
    dom.diagnosticsList.innerHTML = '<li>No diagnostics.</li>';
    resetActivePlaybackPosition();
    renderTransport();
    return;
  }

  dom.fixtureSelect.disabled = false;
  dom.fixtureSelect.innerHTML = documents
    .map((document) => {
      const composer = document.metadata.composer ? ` - ${document.metadata.composer}` : '';
      return `<option value="${document.metadata.id}">${document.metadata.title}${composer}</option>`;
    })
    .join('');

  const selectedId = documents.some(document => document.metadata.id === previousId)
    ? previousId
    : documents[0].metadata.id;
  dom.fixtureSelect.value = selectedId;

  const resultLabel = `${documents.length} / ${state.fixtureLibrary?.documents?.length || documents.length}`;
  dom.chartLibraryCount.textContent = state.currentSearch
    ? `${resultLabel} Medium Swing charts match`
    : `${resultLabel} Medium Swing charts`;
}

function applySearchFilter() {
  const query = String(dom.chartSearchInput.value || '').trim().toLowerCase();
  state.currentSearch = query;
  const allDocuments = state.fixtureLibrary?.documents || [];
  state.filteredDocuments = query
    ? allDocuments.filter((document) => {
      const title = String(document.metadata.title || '').toLowerCase();
      const composer = String(document.metadata.composer || '').toLowerCase();
      return title.includes(query) || composer.includes(query);
    })
    : [...allDocuments];

  renderChartSelector();
  if (state.filteredDocuments.length > 0) {
    renderFixture();
  }
}

function renderFixture() {
  if (!state.fixtureLibrary) return;

  const availableDocuments = getAvailableDocuments();
  const selectedId = dom.fixtureSelect.value || availableDocuments[0]?.metadata?.id;
  const chartDocument = availableDocuments.find(document => document.metadata.id === selectedId);
  if (!chartDocument) return;

  stopPlayback({ resetPosition: true });

  const transposeSemitones = Number(dom.transposeSelect.value || 0);
  const viewModel = createChartViewModel(chartDocument, {
    displayTransposeSemitones: transposeSemitones
  });
  const playbackPlan = createChartPlaybackPlanFromDocument(chartDocument);
  const drillExport = createDrillExportFromPlaybackPlan(playbackPlan, chartDocument);

  state.currentChartDocument = chartDocument;
  state.currentViewModel = viewModel;
  state.currentPlaybackPlan = playbackPlan;
  state.currentDrillExport = drillExport;

  dom.sheetStyle.textContent = `(${viewModel.metadata.style || 'Unknown Style'})`;
  dom.sheetTitle.textContent = viewModel.metadata.title || '';
  dom.sheetSubtitle.textContent = viewModel.metadata.composer || '';
  dom.sheetTimeSignature.textContent = viewModel.metadata.primaryTimeSignature || '';
  dom.sheetKey.textContent = viewModel.metadata.displayKey || viewModel.metadata.sourceKey || '';
  dom.tempoInput.value = String(chartDocument.metadata.tempo || dom.tempoInput.value || DEFAULT_TEMPO);

  renderMeta(viewModel);
  renderSheet(viewModel);
  renderPlaybackPlan(playbackPlan);
  dom.drillExport.textContent = drillExport.enginePatternString || 'No Drill export.';
  dom.transportStatus.textContent = 'Ready';
  renderTransport();
}

async function loadFixtures() {
  const response = await fetch('./fixtures/chart-medium-swing.json');
  state.fixtureLibrary = await response.json();
  state.filteredDocuments = [...(state.fixtureLibrary.documents || [])];

  renderChartSelector();
  dom.chartSearchInput.addEventListener('input', applySearchFilter);
  dom.fixtureSelect.addEventListener('change', renderFixture);
  dom.transposeSelect.addEventListener('change', renderFixture);
  dom.tempoInput.addEventListener('change', renderTransport);
  dom.compingStyleSelect.addEventListener('change', syncDrillPlaybackSettings);
  dom.drumsSelect.addEventListener('change', syncDrillPlaybackSettings);
  dom.walkingBassToggle.addEventListener('change', syncDrillPlaybackSettings);
  [dom.masterVolume, dom.bassVolume, dom.stringsVolume, dom.drumsVolume].forEach((slider) => {
    slider.addEventListener('input', () => {
      updateMixerOutputs();
      syncDrillPlaybackSettings();
    });
  });
  dom.playButton.addEventListener('click', async () => {
    try {
      await startPlayback();
    } catch (error) {
      dom.transportStatus.textContent = `Drill error: ${error.message}`;
      state.isPlaying = false;
      renderTransport();
    }
  });
  dom.stopButton.addEventListener('click', () => {
    stopPlayback({ resetPosition: true });
  });

  window.addEventListener('beforeunload', () => {
    stopPlayback({ resetPosition: true });
  });

  updateMixerOutputs();
  renderFixture();
  try {
    await ensureDrillApi();
    await syncDrillPlaybackSettings();
    dom.transportStatus.textContent = 'Ready';
  } catch (error) {
    dom.transportStatus.textContent = `Drill bridge error: ${error.message}`;
  }
}

loadFixtures().catch((error) => {
  dom.drillExport.textContent = `Failed to load fixtures: ${error.message}`;
});
