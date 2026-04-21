import {
  createChartDocumentsFromIRealText,
  createChartPlaybackPlanFromDocument,
  createChartViewModel,
  createDrillExportFromPlaybackPlan
} from '../chart/index.js';
import { renderChordSymbolHtml } from '../chord-symbol-display.js';
import voicingConfig from '../voicing-config.js';

const DEFAULT_TEMPO = 120;
const DEFAULT_BAR_GROUP_SIZE = 4;
const DRILL_STATE_POLL_INTERVAL_MS = 120;
const IREAL_SOURCE_URL = '../parsing-projects/ireal/sources/jazz-1460.txt';
const IREAL_DEFAULT_PLAYLISTS_URL = 'https://www.irealpro.com/main-playlists/';
const IREAL_FORUM_TRACKS_URL = 'https://forums.irealpro.com/#songs.3';
const LAST_CHART_STORAGE_KEY = 'jpt-chart-dev-last-chart-id';
const PLAYBACK_SETTINGS_STORAGE_KEY = 'jpt-chart-dev-playback-settings';
const HARMONY_DISPLAY_MODE_DEFAULT = 'default';
const HARMONY_DISPLAY_MODE_RICH = 'rich';

const {
  DEFAULT_DISPLAY_QUALITY_ALIASES = {},
  RICH_DISPLAY_QUALITY_ALIASES = {}
} = voicingConfig;

const dom = {
  chartSearchInput: document.getElementById('chart-search-input'),
  chartLibraryCount: document.getElementById('chart-library-count'),
  importIRealBackupButton: document.getElementById('import-ireal-backup-button'),
  openIRealDefaultPlaylistsButton: document.getElementById('open-ireal-default-playlists-button'),
  openIRealForumButton: document.getElementById('open-ireal-forum-button'),
  irealLinkInput: document.getElementById('ireal-link-input'),
  importIRealLinkButton: document.getElementById('import-ireal-link-button'),
  chartImportStatus: document.getElementById('chart-import-status'),
  irealBackupInput: document.getElementById('ireal-backup-input'),
  fixtureSelect: document.getElementById('fixture-select'),
  transposeSelect: document.getElementById('transpose-select'),
  harmonyDisplayMode: document.getElementById('harmony-display-mode'),
  tempoInput: document.getElementById('tempo-input'),
  sheetStyle: document.getElementById('sheet-style'),
  sheetTitle: document.getElementById('sheet-title'),
  sheetSubtitle: document.getElementById('sheet-subtitle'),
  sheetTimeSignature: document.getElementById('sheet-time-signature'),
  sheetKey: document.getElementById('sheet-key'),
  sheetGrid: document.getElementById('sheet-grid'),
  chartMeta: document.getElementById('chart-meta'),
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
  drillBridgeFrame: document.getElementById('drill-bridge-frame'),
  mobileMenuToggle: document.getElementById('mobile-menu-toggle'),
  mobileMenuClose: document.getElementById('mobile-menu-close'),
  mobileBackdrop: document.getElementById('chart-mobile-backdrop'),
  chartApp: document.querySelector('.chart-app')
};

const state = {
  fixtureLibrary: null,
  filteredDocuments: [],
  currentChartDocument: null,
  currentViewModel: null,
  currentPlaybackPlan: null,
  currentDrillExport: null,
  currentLibrarySourceLabel: '',
  activeBarId: null,
  activePlaybackEntryIndex: -1,
  drillApi: null,
  drillFrameReadyPromise: null,
  drillPollTimer: null,
  isPlaying: false,
  currentSearch: ''
};

function loadPersistedChartId() {
  try {
    return window.localStorage.getItem(LAST_CHART_STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

function persistChartId(chartId) {
  try {
    if (!chartId) return;
    window.localStorage.setItem(LAST_CHART_STORAGE_KEY, chartId);
  } catch {
    // Ignore storage failures so chart-dev still works in restricted contexts.
  }
}

function loadPersistedPlaybackSettings() {
  try {
    const raw = window.localStorage.getItem(PLAYBACK_SETTINGS_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
  } catch {
    return null;
  }
}

function persistPlaybackSettings() {
  try {
    window.localStorage.setItem(PLAYBACK_SETTINGS_STORAGE_KEY, JSON.stringify({
      compingStyle: dom.compingStyleSelect.value || 'strings',
      drumsMode: dom.drumsSelect.value || 'full_swing',
      customMediumSwingBass: dom.walkingBassToggle.checked !== false,
      harmonyDisplayMode: normalizeHarmonyDisplayMode(dom.harmonyDisplayMode?.value)
    }));
  } catch {
    // Ignore storage failures so chart-dev still works in restricted contexts.
  }
}

function applyPersistedPlaybackSettings() {
  const persisted = loadPersistedPlaybackSettings();
  if (!persisted) return;

  if (persisted.compingStyle && Array.from(dom.compingStyleSelect.options).some((option) => option.value === persisted.compingStyle)) {
    dom.compingStyleSelect.value = persisted.compingStyle;
  }

  if (persisted.drumsMode && Array.from(dom.drumsSelect.options).some((option) => option.value === persisted.drumsMode)) {
    dom.drumsSelect.value = persisted.drumsMode;
  }

  if (persisted.customMediumSwingBass !== undefined) {
    dom.walkingBassToggle.checked = Boolean(persisted.customMediumSwingBass);
  }

  if (dom.harmonyDisplayMode && persisted.harmonyDisplayMode) {
    dom.harmonyDisplayMode.value = normalizeHarmonyDisplayMode(persisted.harmonyDisplayMode);
  }
}

function normalizeHarmonyDisplayMode(mode) {
  return [
    HARMONY_DISPLAY_MODE_DEFAULT,
    HARMONY_DISPLAY_MODE_RICH
  ].includes(mode)
    ? mode
    : HARMONY_DISPLAY_MODE_DEFAULT;
}

function getDisplayAliasQuality(quality, displayMode) {
  if (!quality) return quality;
  if (displayMode === HARMONY_DISPLAY_MODE_RICH) {
    return RICH_DISPLAY_QUALITY_ALIASES[quality] || quality;
  }
  return DEFAULT_DISPLAY_QUALITY_ALIASES[quality] || quality;
}

function getAvailableDocuments() {
  return state.filteredDocuments.length > 0
    ? state.filteredDocuments
    : (state.fixtureLibrary?.documents || []);
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^\w]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function setImportStatus(message, isError = false) {
  if (!dom.chartImportStatus) return;
  dom.chartImportStatus.textContent = message || '';
  dom.chartImportStatus.style.color = isError ? '#9f1239' : '';
}

function extractIRealLinks(rawText) {
  const matches = [...String(rawText || '').matchAll(/irealb(?:ook)?:\/\/[^"'\s<]+/gi)].map((match) => match[0]);
  return [...new Set(matches)];
}

function dedupeAndTagImportedDocuments(documents) {
  const seenIds = new Map();

  return documents.map((document) => {
    const playlistName = String(document?.source?.playlistName || '').trim();
    const baseId = String(document?.metadata?.id || 'chart');
    const playlistSlug = slugify(playlistName) || 'playlist';
    const sourceIndex = Number(document?.source?.songIndex || 0);
    const occurrence = (seenIds.get(baseId) || 0) + 1;
    seenIds.set(baseId, occurrence);
    const uniqueId = `${baseId}-${playlistSlug}-${sourceIndex || occurrence}-${occurrence}`;

    return {
      ...document,
      metadata: {
        ...document.metadata,
        id: uniqueId
      },
      source: {
        ...document.source,
        playlistName
      }
    };
  });
}

async function importDocumentsFromIRealText(rawText, sourceFile = '') {
  const links = extractIRealLinks(rawText);
  const sources = links.length > 0 ? links : [rawText];
  const importedDocuments = [];

  for (let index = 0; index < sources.length; index += 1) {
    const sourceText = sources[index];
    const sourceLabel = links.length > 0 ? `${sourceFile || 'ireal-backup'}#${index + 1}` : sourceFile;
    const documents = await createChartDocumentsFromIRealText({
      rawText: sourceText,
      sourceFile: sourceLabel
    });
    importedDocuments.push(...documents);
  }

  return dedupeAndTagImportedDocuments(importedDocuments)
    .sort((left, right) => {
      const titleComparison = String(left.metadata?.title || '').localeCompare(String(right.metadata?.title || ''), 'en', { sensitivity: 'base' });
      if (titleComparison !== 0) return titleComparison;
      const playlistComparison = String(left.source?.playlistName || '').localeCompare(String(right.source?.playlistName || ''), 'en', { sensitivity: 'base' });
      if (playlistComparison !== 0) return playlistComparison;
      return Number(left.source?.songIndex || 0) - Number(right.source?.songIndex || 0);
    });
}

function applyImportedLibrary({ documents, source, preferredId = null, statusMessage = '' }) {
  state.fixtureLibrary = {
    source,
    documents
  };
  state.filteredDocuments = [...documents];
  state.currentLibrarySourceLabel = source;
  dom.chartSearchInput.value = '';
  state.currentSearch = '';
  renderChartSelector(preferredId);
  renderFixture();
  setImportStatus(statusMessage || `Loaded ${documents.length} charts from ${source}.`);
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
    persistPlaybackSettings();
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
    ['Style', viewModel.metadata.styleReference || viewModel.metadata.style || '-'],
    ['Source key', viewModel.metadata.sourceKey],
    ['Display key', viewModel.metadata.displayKey],
    ['Time', viewModel.metadata.primaryTimeSignature || '-'],
    ['Bars', String(viewModel.metadata.barCount || viewModel.bars.length)]
  ];

  dom.chartMeta.innerHTML = items
    .map(([term, value]) => `<dt>${term}</dt><dd>${value}</dd>`)
    .join('');
}

function renderChordMarkup(token, harmonyDisplayMode) {
  return renderChordSymbolHtml(
    token.root || '',
    getDisplayAliasQuality(token.quality || '', harmonyDisplayMode),
    token.bass || null
  );
}

function getTokenVisualMetrics(token) {
  if (!token || typeof token !== 'object') {
    return {
      visualWeight: 0,
      estimatedWidth: 0,
      symbolLength: 0
    };
  }

  const symbol = String(token.symbol || '').replace(/\s+/g, '');
  const alternate = String(token.alternate?.symbol || '').replace(/\s+/g, '');
  const prefixWeight = token.displayPrefix ? 0.35 : 0;
  const accidentalCount = (symbol.match(/[b#]/g) || []).length;
  const slashCount = (symbol.match(/\//g) || []).length;
  const parentheticalCount = (symbol.match(/[()]/g) || []).length;
  const extensionCount = (symbol.match(/\d+/g) || []).length;
  const longQualityCount = (symbol.match(/maj|sus|dim|alt|aug|add/gi) || []).length;

  const visualWeight = symbol.length
    + (alternate ? alternate.length * 0.2 : 0)
    + prefixWeight
    + (accidentalCount * 0.18)
    + (slashCount * 1.1)
    + (parentheticalCount * 0.45)
    + (extensionCount * 0.25)
    + (longQualityCount * 0.55);

  return {
    visualWeight,
    estimatedWidth: 0.46 + (visualWeight * 0.18),
    symbolLength: symbol.length
  };
}

function getTokenScaleForSubdividedLayout(tokenMetrics) {
  if (!tokenMetrics || tokenMetrics.symbolLength <= 3) return 1;
  if (tokenMetrics.visualWeight >= 11) return 0.82;
  if (tokenMetrics.visualWeight >= 9.5) return 0.88;
  if (tokenMetrics.visualWeight >= 7.5) return 0.94;
  return 0.97;
}

function renderToken(token, placement, harmonyDisplayMode) {
  const symbol = token?.symbol || '';
  const tokenClass = token?.kind === 'repeat_previous_bar' ? 'repeat' : 'chord';
  const slotStart = Math.max(1, Number(placement?.start || 1));
  const slotEnd = Math.max(slotStart + 1, Number(placement?.end || (slotStart + 1)));
  const slotStyle = `grid-column: ${slotStart} / ${slotEnd};`;
  const tokenMarkup = tokenClass === 'chord'
    ? renderChordMarkup(token, harmonyDisplayMode)
    : symbol;
  const alternateMarkup = token?.alternate?.symbol
    ? `<span class="chart-token-alternate">${token.alternate.symbol}</span>`
    : '';

  return `
    <span class="chart-token-slot" style="${slotStyle}">
      <span class="chart-token ${tokenClass}">${tokenMarkup}${alternateMarkup}</span>
    </span>
  `;
}

function renderEndingMarkup(endings = []) {
  if (!Array.isArray(endings) || endings.length === 0) return '';
  return `
    <div class="chart-ending-stack">
      ${endings.map(ending => `<span class="chart-ending">${ending}.</span>`).join('')}
    </div>
  `;
}

function renderBarCornerMarkers(bar) {
  const markers = [];
  if (bar.flags.includes('coda')) {
    markers.push('<span class="chart-bar-corner-marker chart-bar-coda-marker" aria-label="Coda">&#119052;</span>');
  }
  if (bar.flags.includes('segno')) {
    markers.push('<span class="chart-bar-corner-marker chart-bar-segno-marker" aria-label="Segno">&#119074;</span>');
  }
  if (bar.flags.includes('fermata')) {
    markers.push('<span class="chart-bar-corner-marker chart-bar-fermata-marker" aria-label="Fermata">&#119133;</span>');
  }
  if (markers.length === 0) return '';
  return `<div class="chart-bar-corner-markers">${markers.join('')}</div>`;
}

function formatOrdinal(value) {
  const number = Number(value || 0);
  if (number === 1) return '1st';
  if (number === 2) return '2nd';
  if (number === 3) return '3rd';
  return `${number}th`;
}

function formatDirectiveLabel(directive) {
  if (!directive?.type) return '';

  switch (directive.type) {
    case 'dc_al_fine':
      return 'D.C. al Fine';
    case 'dc_al_coda':
      return 'D.C. al Coda';
    case 'dc_al_ending':
      return `D.C. al ${formatOrdinal(directive.ending || 2)} ending`;
    case 'ds_al_fine':
      return 'D.S. al Fine';
    case 'ds_al_coda':
      return 'D.S. al Coda';
    case 'ds_al_ending':
      return `D.S. al ${formatOrdinal(directive.ending || 2)} ending`;
    case 'dc_on_cue':
      return 'D.C. on cue';
    case 'open_vamp':
      return 'Open vamp';
    case 'open_instruction':
      return directive.text || 'Open';
    case 'vamp_instruction':
      return directive.text || 'Vamp';
    case 'fade_out':
      return directive.text || 'Fade out';
    case 'repeat_hint':
      return `Repeat x${directive.times || 2}`;
    case 'fine':
      return directive.qualifier ? `Fine (${directive.qualifier})` : 'Fine';
    default:
      return directive.type;
  }
}

function formatSpecialEventLabel(event) {
  switch (event?.type) {
    case 'no_chord_marker':
      return 'special: no chord marker';
    case 'slash_display_marker':
      return 'special: slash display marker';
    case 'invisible_root_marker':
      return `special: invisible root${event.bass ? ` / ${event.bass}` : ''}`;
    default:
      return event?.type ? `special: ${event.type}` : '';
  }
}

function getBarFootPills(bar) {
  const pills = [];
  if (bar.flags.includes('fine')) pills.push('Fine');
  if (bar.flags.includes('dc')) pills.push('D.C.');
  if (bar.flags.includes('ds')) pills.push('D.S.');
  if (bar.flags.includes('coda')) pills.push('Coda');
  if (bar.flags.includes('segno')) pills.push('Segno');
  if (bar.flags.includes('fermata')) pills.push('Fermata');
  if (bar.flags.includes('end')) pills.push('End');
  if (bar.flags.includes('final_bar')) pills.push('Final bar');
  if (bar.directives?.length) pills.push(...bar.directives.map(formatDirectiveLabel).filter(Boolean));
  if (bar.comments?.length) pills.push(...bar.comments);
  return pills;
}

function renderBarDebugInfo(bar) {
  return '';
}

function getBarBeatCount(bar, fallbackTimeSignature = '') {
  const rawTimeSignature = String(bar?.timeSignature || fallbackTimeSignature || '').trim();
  const match = /^(\d+)\s*\/\s*(\d+)$/.exec(rawTimeSignature);
  if (!match) return 4;
  const beats = Number.parseInt(match[1], 10);
  if (!Number.isFinite(beats) || beats <= 0) return 4;
  return Math.max(1, Math.min(beats, 12));
}

function getCellSlotPlacements(bar, tokenCount) {
  const cellSlots = Array.isArray(bar?.playback?.cellSlots) ? bar.playback.cellSlots : [];
  if (cellSlots.length === 0) return null;

  const chordSlotIndexes = cellSlots
    .map((cellSlot, index) => (cellSlot?.chord ? index : -1))
    .filter((index) => index >= 0);

  if (chordSlotIndexes.length === 0) return null;
  if (chordSlotIndexes.length !== tokenCount) return null;

  const candidateLogicalSlots = [2, 4, cellSlots.length]
    .filter((candidate, index, list) => Number.isInteger(candidate)
      && candidate > 0
      && cellSlots.length % candidate === 0
      && list.indexOf(candidate) === index)
    .sort((left, right) => left - right);

  const logicalSlots = candidateLogicalSlots.find((candidate) =>
    chordSlotIndexes.every((slotIndex) => Number.isInteger((slotIndex * candidate) / cellSlots.length))
  ) || cellSlots.length;

  return {
    logicalSlots,
    placements: chordSlotIndexes.map((slotIndex, index) => {
      const startIndex = ((slotIndex * logicalSlots) / cellSlots.length) + 1;
      return {
        start: startIndex,
        end: Math.min(logicalSlots + 1, startIndex + 1)
      };
    })
  };
}

function getBarBodyLayout(bar, fallbackTimeSignature = '') {
  const tokens = Array.isArray(bar?.displayTokens) ? bar.displayTokens : [];
  const tokenCount = tokens.length;
  const cellSlotLayout = getCellSlotPlacements(bar, tokenCount);
  const useHalfLayout = tokenCount <= 2 && (!cellSlotLayout || cellSlotLayout.logicalSlots <= 2);
  let logicalSlots = cellSlotLayout?.logicalSlots || 2;
  if (!cellSlotLayout) {
    if (tokenCount > 2) logicalSlots = 4;
    if (tokenCount > 4) logicalSlots = 8;
  }
  const parts = useHalfLayout ? 2 : logicalSlots;

  const tokenMetrics = tokens.map(getTokenVisualMetrics);
  const weight = tokenMetrics.reduce((total, tokenMetric) => total + tokenMetric.visualWeight, 0);
  const maxTokenWeight = tokenMetrics.reduce((max, tokenMetric) => Math.max(max, tokenMetric.visualWeight), 0);
  const hasVeryLongSymbol = maxTokenWeight >= 12;
  const hasExtremelyLongSymbol = maxTokenWeight >= 15;

  const classes = ['chart-bar-body'];
  if (useHalfLayout) {
    classes.push('chart-bar-body-halves');
  } else {
    classes.push('chart-bar-body-subdivided');
  }

  const shouldReduceForDensity =
    tokenCount > 2
    || (!useHalfLayout && hasVeryLongSymbol);
  const shouldReduceAggressively =
    tokenCount > logicalSlots
    || (tokenCount >= logicalSlots && weight >= 28)
    || (!useHalfLayout && hasExtremelyLongSymbol && weight >= 32);

  if (shouldReduceForDensity) {
    classes.push('is-dense');
  }
  if (shouldReduceAggressively) {
    classes.push('is-very-dense');
  }
  const style = `--chart-bar-parts: ${parts}; --chart-bar-guide-count: ${useHalfLayout ? 1 : Math.max(0, parts - 1)};`;
  const placements = useHalfLayout
    ? tokens.map((_, index) => ({
        start: index + 1,
        end: index + 2
      }))
    : (cellSlotLayout?.placements || tokens.map((_, index) => {
        const start = Math.round((index * logicalSlots) / Math.max(tokenCount, 1)) + 1;
        return {
          start,
          end: Math.min(parts + 1, start + 1)
        };
      }));

  const tokenLayouts = tokens.map((token, index) => {
    const placement = placements[index];
    const metrics = tokenMetrics[index];
    const span = Math.max(1, (placement?.end || 2) - (placement?.start || 1));
    return {
      scale: useHalfLayout ? 1 : getTokenScaleForSubdividedLayout(metrics),
      offsetEm: 0,
      span,
      estimatedWidth: metrics.estimatedWidth,
      scaledWidth: metrics.estimatedWidth * (useHalfLayout ? 1 : getTokenScaleForSubdividedLayout(metrics))
    };
  });

  return {
    className: classes.join(' '),
    style,
    parts,
    placements,
    tokenLayouts
  };
}

function renderBarCell(bar) {
  const classes = ['chart-bar-cell'];
  if (bar.id === state.activeBarId) classes.push('is-active');
  if (bar.flags.includes('repeat_end_barline')) classes.push('is-repeat-end');
  if (bar.flags.includes('final_bar') || bar.flags.includes('end')) classes.push('is-final');

  const footPills = getBarFootPills(bar);
  const bodyLayout = getBarBodyLayout(bar, state.currentViewModel?.metadata?.primaryTimeSignature || '');
  const harmonyDisplayMode = normalizeHarmonyDisplayMode(dom.harmonyDisplayMode?.value);
  return `
    <article class="${classes.join(' ')}" data-bar-id="${bar.id}">
      ${renderEndingMarkup(bar.endings)}
      ${renderBarCornerMarkers(bar)}
      <div class="chart-bar-head">
        <span class="chart-bar-index">${bar.index}</span>
      </div>
      <div class="${bodyLayout.className}" style="${bodyLayout.style}">
        ${bar.displayTokens.map((token, index) => renderToken(token, bodyLayout.placements[index], harmonyDisplayMode)).join('')}
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
      <div class="chart-row${sectionChanged ? ' has-section-marker' : ''}">
        <div class="chart-section-marker">
          ${sectionChanged ? `<span class="chart-section-badge">${firstBar.sectionLabel}</span>` : '<span class="chart-section-spacer"></span>'}
        </div>
        ${rowBars.map(renderBarCell).join('')}
      </div>
    `);
  }

  dom.sheetGrid.innerHTML = rows.join('');
}

function getVisualSymbolRect(slotEl) {
  // .chord-symbol-sup is position:absolute and overflows its parent, so
  // getBoundingClientRect() on .chord-symbol does NOT include it. We manually
  // compute the union rect of every visible sub-element instead.
  const selectors = [
    '.chord-symbol-main',
    '.chord-symbol-sup',
    '.chord-symbol-slash-stack',
    '.chart-token-alternate'
  ];
  let left = Infinity;
  let right = -Infinity;
  for (const sel of selectors) {
    const el = slotEl.querySelector(sel);
    if (!el) continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0) continue;
    left  = Math.min(left, r.left);
    right = Math.max(right, r.right);
  }
  return isFinite(left) ? { left, right } : null;
}

function measureTokenGeometry(slotEl) {
  const tokenEl = slotEl.querySelector('.chart-token');
  const mainEl  = slotEl.querySelector('.chord-symbol-main');

  const slotRect   = slotEl.getBoundingClientRect();
  const symbolRect = getVisualSymbolRect(slotEl);
  const mainRect   = mainEl ? mainEl.getBoundingClientRect() : null;

  // Optical anchor = horizontal centre of .chord-symbol-main (root + base only,
  // excluding sup and slash-stack which extend to the right of the onset).
  const anchorX = mainRect
    ? mainRect.left + mainRect.width / 2
    : slotRect.left + slotRect.width / 2;

  // Target = centre of the rendered slot.
  const beatTargetX = slotRect.left + slotRect.width / 2;

  return { slotEl, tokenEl, slotRect, symbolRect, mainRect, anchorX, beatTargetX };
}

function resolveCollisions(rawLefts, rawRights, offsets, scales, symLefts, symRights, barRect) {
  const isMobile = window.matchMedia('(max-width: 720px)').matches;
  const MIN_GAP   = 1;
  const MIN_SCALE = isMobile ? 0.64 : 0.72;
  const n = rawLefts.length;

  // Shrink symbol i so its right edge retreats by overlapPx.
  // Scale is symmetric (transform-origin: center bottom), so both edges move.
  function shrinkRight(i, overlapPx) {
    const rawW = rawRights[i] - rawLefts[i];
    if (rawW <= 0) return;
    const center   = (symLefts[i] + symRights[i]) / 2;
    const newHalfW = Math.max(symRights[i] - center - overlapPx, rawW / 2 * MIN_SCALE);
    scales[i]    = (2 * newHalfW) / rawW;
    symLefts[i]  = center - newHalfW;
    symRights[i] = center + newHalfW;
  }

  // Shrink symbol i so its left edge advances by overlapPx.
  function shrinkLeft(i, overlapPx) {
    const rawW = rawRights[i] - rawLefts[i];
    if (rawW <= 0) return;
    const center   = (symLefts[i] + symRights[i]) / 2;
    const newHalfW = Math.max(center - symLefts[i] - overlapPx, rawW / 2 * MIN_SCALE);
    scales[i]    = (2 * newHalfW) / rawW;
    symLefts[i]  = center - newHalfW;
    symRights[i] = center + newHalfW;
  }

  // Pass 1 (right→left): push right, then shrink left symbol's right edge.
  for (let i = n - 2; i >= 0; i--) {
    let overlap = symRights[i] - symLefts[i + 1] + MIN_GAP;
    if (overlap <= 0) continue;

    const rightBound = i + 2 < n ? symLefts[i + 2] - MIN_GAP : barRect.right;
    const push = Math.min(overlap, Math.max(0, rightBound - symRights[i + 1]));
    offsets[i + 1]   += push;
    symLefts[i + 1]  += push;
    symRights[i + 1] += push;
    overlap -= push;

    if (overlap > 0) shrinkRight(i, overlap);
  }

  // Pass 2 (left→right): pull left, then shrink the wider of the two.
  for (let i = 0; i < n - 1; i++) {
    let overlap = symRights[i] - symLefts[i + 1] + MIN_GAP;
    if (overlap <= 0) continue;

    const leftBound = i > 0 ? symRights[i - 1] + MIN_GAP : barRect.left;
    const pull = Math.min(overlap, Math.max(0, symLefts[i] - leftBound));
    offsets[i]   -= pull;
    symLefts[i]  -= pull;
    symRights[i] -= pull;
    overlap -= pull;

    if (overlap > 0) {
      const rawWi  = rawRights[i]     - rawLefts[i];
      const rawWi1 = rawRights[i + 1] - rawLefts[i + 1];
      if (rawWi >= rawWi1) {
        shrinkRight(i, overlap);
      } else {
        shrinkLeft(i + 1, overlap);
      }
    }
  }

  if (n === 2) {
    const rawW0 = rawRights[0] - rawLefts[0];
    const rawW1 = rawRights[1] - rawLefts[1];
    const availableWidth = Math.max(0, barRect.right - barRect.left);
    const pairGap = 1;
    const sharedScale = Math.max(
      MIN_SCALE,
      Math.min(1, (availableWidth - pairGap) / Math.max(1, rawW0 + rawW1))
    );
    scales[0] = sharedScale;
    scales[1] = sharedScale;

    const width0 = rawW0 * sharedScale;
    const width1 = rawW1 * sharedScale;
    const slotWidth = availableWidth / 2;
    const slot0Center = barRect.left + slotWidth / 2;
    const slot1Center = barRect.left + slotWidth * 1.5;
    const leftLimit0 = barRect.left;
    const rightLimit0 = barRect.left + slotWidth - pairGap / 2;
    const leftLimit1 = barRect.left + slotWidth + pairGap / 2;
    const rightLimit1 = barRect.right;

    const center0 = Math.max(
      leftLimit0 + width0 / 2,
      Math.min(slot0Center, rightLimit0 - width0 / 2)
    );
    const center1 = Math.max(
      leftLimit1 + width1 / 2,
      Math.min(slot1Center, rightLimit1 - width1 / 2)
    );

    offsets[0] = center0 - (rawLefts[0] + rawRights[0]) / 2;
    offsets[1] = center1 - (rawLefts[1] + rawRights[1]) / 2;

    symLefts[0] = center0 - width0 / 2;
    symRights[0] = center0 + width0 / 2;
    symLefts[1] = center1 - width1 / 2;
    symRights[1] = center1 + width1 / 2;
    return;
  }

  const reducedScales = scales.filter(scale => scale < 0.999);
  if (reducedScales.length >= 2) {
    const targetScale = Math.max(MIN_SCALE, Math.min(...reducedScales));
    const blend = 0.7;

    for (let i = 0; i < n; i++) {
      if (scales[i] >= 0.999) continue;
      scales[i] = Math.max(MIN_SCALE, scales[i] * (1 - blend) + targetScale * blend);
    }
  }
}

function applySingleChordAnchor(barBodyEl) {
  const slots = Array.from(barBodyEl.querySelectorAll('.chart-token-slot'));
  if (slots.length !== 1) return;
  const tokenEl = slots[0].querySelector('.chart-token');
  if (!tokenEl) return;
  tokenEl.style.removeProperty('--chart-token-offset-x');
  tokenEl.style.removeProperty('--chart-token-scale');
  const barRect = barBodyEl.getBoundingClientRect();
  const geo = measureTokenGeometry(slots[0]);
  const rawLeft = geo.symbolRect ? geo.symbolRect.left : geo.slotRect.left;
  const rawRight = geo.symbolRect ? geo.symbolRect.right : geo.slotRect.right;
  const rawWidth = Math.max(0, rawRight - rawLeft);
  const fontSizePx = parseFloat(getComputedStyle(tokenEl).fontSize);
  if (!fontSizePx || rawWidth <= 0) return;

  const leftBound = barRect.left + 1;
  const rightBound = barRect.right - 1;
  const availableWidth = Math.max(0, rightBound - leftBound);
  const anchoredLeft = barRect.left + barRect.width * 0.2;
  const centeredLeft = leftBound + Math.max(0, (availableWidth - rawWidth) / 2);

  let offsetPx = anchoredLeft - rawLeft;
  let scaledLeft = rawLeft + offsetPx;
  let scaledRight = rawRight + offsetPx;
  let scale = 1;

  const leftSpace = Math.max(0, scaledLeft - leftBound);
  const rightSpace = Math.max(0, rightBound - scaledRight);
  if (rightSpace < leftSpace) {
    const shiftTowardCenter = Math.min(leftSpace - rightSpace, scaledLeft - centeredLeft);
    if (shiftTowardCenter > 0) {
      offsetPx -= shiftTowardCenter;
      scaledLeft -= shiftTowardCenter;
      scaledRight -= shiftTowardCenter;
    }
  }

  if (scaledLeft < leftBound) {
    offsetPx += leftBound - scaledLeft;
    scaledLeft = leftBound;
    scaledRight = rawRight + offsetPx;
  }

  if (scaledRight > rightBound) {
    const overflow = scaledRight - rightBound;
    const candidateScale = Math.max(0.6, (rawWidth - overflow) / rawWidth);
    scale = Math.min(scale, candidateScale);
    const scaledWidth = rawWidth * scale;
    scaledRight = scaledLeft + scaledWidth;
    if (scaledRight > rightBound) {
      offsetPx -= scaledRight - rightBound;
      scaledLeft -= scaledRight - rightBound;
      scaledRight = rightBound;
    }
  }

  if (rawWidth * scale > availableWidth) {
    scale = Math.min(scale, Math.max(0.6, availableWidth / rawWidth));
  }

  tokenEl.style.setProperty('--chart-token-offset-x', `${(offsetPx / fontSizePx).toFixed(3)}em`);
  if (scale < 0.999) {
    tokenEl.style.setProperty('--chart-token-scale', scale.toFixed(3));
  }
}

function applyOpticalPlacements() {
  document.querySelectorAll('.chart-bar-body').forEach(applySingleChordAnchor);

  document.querySelectorAll('.chart-bar-body.chart-bar-body-subdivided, .chart-bar-body.chart-bar-body-halves').forEach(barBodyEl => {
    const slots = Array.from(barBodyEl.querySelectorAll('.chart-token-slot'));

    if (slots.length === 1) { applySingleChordAnchor(barBodyEl); return; }

    if (slots.length < 2) return;

    // Reset previous corrections so we always measure the natural uncorrected layout.
    // This eliminates the feedback loop on resize / zoom.
    slots.forEach(slotEl => {
      const tokenEl = slotEl.querySelector('.chart-token');
      if (!tokenEl) return;
      tokenEl.style.removeProperty('--chart-token-offset-x');
      tokenEl.style.removeProperty('--chart-token-scale');
    });

    const barRect    = barBodyEl.getBoundingClientRect();
    const geometries = slots.map(s => measureTokenGeometry(s));

    const rawLefts  = geometries.map(g => g.symbolRect ? g.symbolRect.left  : g.slotRect.left);
    const rawRights = geometries.map(g => g.symbolRect ? g.symbolRect.right : g.slotRect.right);

    // Step 1: Optical centering — align mainRect centre to slot centre.
    // Cap: never push in the direction where the symbol already overflows its slot.
    const offsets = geometries.map(geo => geo.beatTargetX - geo.anchorX);
    const scales  = geometries.map(() => 1);

    for (let i = 0; i < geometries.length; i++) {
      const { slotRect } = geometries[i];
      if (offsets[i] > 0) {
        offsets[i] = Math.min(offsets[i], Math.max(0, slotRect.right - rawRights[i]));
      } else if (offsets[i] < 0) {
        offsets[i] = Math.max(offsets[i], -Math.max(0, rawLefts[i] - slotRect.left));
      }
    }

    const symLefts  = rawLefts.map((l, i)  => l + offsets[i]);
    const symRights = rawRights.map((r, i) => r + offsets[i]);

    // Step 2: Collision resolution — nudge then scale down if needed.
    resolveCollisions(rawLefts, rawRights, offsets, scales, symLefts, symRights, barRect);

    // Step 3: Apply offsets (as em) and scales to each token.
    geometries.forEach((geo, i) => {
      if (!geo.tokenEl) return;
      const fontSizePx = parseFloat(getComputedStyle(geo.tokenEl).fontSize);
      if (!fontSizePx) return;
      geo.tokenEl.style.setProperty('--chart-token-offset-x', `${(offsets[i] / fontSizePx).toFixed(3)}em`);
      geo.tokenEl.style.setProperty('--chart-token-scale', scales[i].toFixed(3));
    });
  });
}

function renderDiagnostics(playbackPlan) {
  const diagnostics = [...(playbackPlan?.diagnostics || [])];
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
  dom.stopButton.disabled = !state.isPlaying && state.activePlaybackEntryIndex < 0;
}

function renderChartSelector(preferredId = null) {
  const documents = getAvailableDocuments();
  const previousId = preferredId || state.currentChartDocument?.metadata?.id || dom.fixtureSelect.value;

  if (documents.length === 0) {
    dom.fixtureSelect.innerHTML = '';
    dom.fixtureSelect.disabled = true;
    dom.chartLibraryCount.textContent = state.currentSearch
      ? 'No matching charts'
      : 'No charts loaded';
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
    dom.diagnosticsList.innerHTML = '<li>No diagnostics.</li>';
    resetActivePlaybackPosition();
    renderTransport();
    return;
  }

  dom.fixtureSelect.disabled = false;
  dom.fixtureSelect.innerHTML = documents
    .map((document) => {
      const composer = document.metadata.composer ? ` - ${document.metadata.composer}` : '';
      const playlist = document.source?.playlistName ? ` [${document.source.playlistName}]` : '';
      return `<option value="${document.metadata.id}">${document.metadata.title}${composer}${playlist}</option>`;
    })
    .join('');

  const selectedId = documents.some(document => document.metadata.id === previousId)
    ? previousId
    : documents[0].metadata.id;
  dom.fixtureSelect.value = selectedId;

  const resultLabel = `${documents.length} / ${state.fixtureLibrary?.documents?.length || documents.length}`;
  const suffix = state.currentLibrarySourceLabel ? ` from ${state.currentLibrarySourceLabel}` : '';
  dom.chartLibraryCount.textContent = state.currentSearch
    ? `${resultLabel} charts match${suffix}`
    : `${resultLabel} charts${suffix}`;
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
  persistChartId(chartDocument.metadata.id);

  dom.sheetStyle.textContent = `(${viewModel.metadata.styleReference || viewModel.metadata.style || 'Unknown Style'})`;
  dom.sheetTitle.textContent = viewModel.metadata.title || '';
  dom.sheetSubtitle.textContent = [
    viewModel.metadata.composer || '',
    chartDocument.source?.playlistName || ''
  ].filter(Boolean).join(' • ');
  dom.sheetTimeSignature.textContent = viewModel.metadata.primaryTimeSignature || '';
  dom.sheetKey.textContent = viewModel.metadata.displayKey || viewModel.metadata.sourceKey || '';
  dom.tempoInput.value = String(chartDocument.metadata.tempo || dom.tempoInput.value || DEFAULT_TEMPO);

  renderMeta(viewModel);
  renderSheet(viewModel);
  renderDiagnostics(playbackPlan);
  dom.transportStatus.textContent = 'Ready';
  renderTransport();
}

function openMobilePanel() {
  dom.chartApp?.classList.add('mobile-open');
  document.getElementById('chart-controls-drawer')?.setAttribute('aria-hidden', 'false');
}

function closeMobilePanel() {
  dom.chartApp?.classList.remove('mobile-open');
  document.getElementById('chart-controls-drawer')?.setAttribute('aria-hidden', 'true');
  document.querySelectorAll('.chart-menu-group[open]').forEach((element) => {
    element.removeAttribute('open');
  });
}

async function importDefaultFixtureLibrary() {
  const response = await fetch(IREAL_SOURCE_URL);
  if (!response.ok) {
    throw new Error(`Failed to load iReal source (${response.status})`);
  }
  const rawText = await response.text();
  const importedDocuments = await importDocumentsFromIRealText(
    rawText,
    IREAL_SOURCE_URL.split('/').pop() || 'jazz-1460.txt'
  );

  applyImportedLibrary({
    documents: importedDocuments,
    source: 'bundled default library',
    preferredId: loadPersistedChartId(),
    statusMessage: `Loaded ${importedDocuments.length} charts from the bundled default library.`
  });
}

async function handleBackupFileSelection(event) {
  const file = event.target.files?.[0];
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
    setImportStatus(`Import failed: ${error.message}`, true);
  } finally {
    event.target.value = '';
  }
}

async function handlePastedIRealLinkImport() {
  const rawText = String(dom.irealLinkInput.value || '').trim();
  if (!rawText) {
    setImportStatus('Paste an irealb:// link first.', true);
    return;
  }

  try {
    const documents = await importDocumentsFromIRealText(rawText, 'pasted-ireal-link');
    applyImportedLibrary({
      documents,
      source: 'pasted iReal link',
      statusMessage: `Loaded ${documents.length} charts from the pasted iReal link.`
    });
  } catch (error) {
    setImportStatus(`Import failed: ${error.message}`, true);
  }
}

function bindImportControls() {
  dom.importIRealBackupButton?.addEventListener('click', () => {
    dom.irealBackupInput?.click();
  });
  dom.irealBackupInput?.addEventListener('change', handleBackupFileSelection);
  dom.openIRealDefaultPlaylistsButton?.addEventListener('click', () => {
    window.open(IREAL_DEFAULT_PLAYLISTS_URL, '_blank', 'noopener,noreferrer');
    setImportStatus('Default playlists opened in a new tab. Paste an irealb:// link here when ready.');
  });
  dom.openIRealForumButton?.addEventListener('click', () => {
    window.open(IREAL_FORUM_TRACKS_URL, '_blank', 'noopener,noreferrer');
    setImportStatus('Forum tracks opened in a new tab. Paste an irealb:// link here when ready.');
  });
  dom.importIRealLinkButton?.addEventListener('click', handlePastedIRealLinkImport);
  dom.irealLinkInput?.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    handlePastedIRealLinkImport();
  });
}

async function loadFixtures() {
  applyPersistedPlaybackSettings();
  bindImportControls();
  await importDefaultFixtureLibrary();
  dom.chartSearchInput.addEventListener('input', applySearchFilter);
  dom.fixtureSelect.addEventListener('change', renderFixture);
  dom.transposeSelect.addEventListener('change', renderFixture);
  dom.harmonyDisplayMode?.addEventListener('change', () => {
    persistPlaybackSettings();
    renderFixture();
  });
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

  dom.mobileMenuToggle?.addEventListener('click', openMobilePanel);
  dom.mobileMenuClose?.addEventListener('click', closeMobilePanel);
  dom.mobileBackdrop?.addEventListener('click', closeMobilePanel);

  window.addEventListener('resize', applyOpticalPlacements);
  if (typeof ResizeObserver !== 'undefined' && dom.sheetGrid) {
    new ResizeObserver(applyOpticalPlacements).observe(dom.sheetGrid);
  }
  if (document.fonts?.ready) {
    document.fonts.ready.then(() => {
      applyOpticalPlacements();
    }).catch(() => {});
  }

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
  dom.transportStatus.textContent = `Failed to load charts: ${error.message}`;
});
