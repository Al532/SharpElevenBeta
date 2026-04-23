import { getAnalyticsDebugEnabled, setAnalyticsDebugEnabled, trackEvent } from './analytics.js';
import {
  createProgressionEntry as createProgressionEntryBase,
  isProgressionModeToken,
  normalizeProgressionEntry as normalizeProgressionEntryBase,
  normalizeProgressionsMap as normalizeProgressionsMapBase,
  parseDefaultProgressionsText as parseDefaultProgressionsTextBase
} from './progression-library.js';
import {
  loadStoredKeySelectionPreset,
  loadStoredProgressionSettings,
  saveStoredKeySelectionPreset,
  saveStoredProgressionSettings
} from './progression-storage.js';
import { DEFAULT_DISPLAY_PLACEHOLDER_MESSAGE } from './display-placeholder-messages.js';
import { renderAccidentalTextHtml, renderChordSymbolHtml } from './chord-symbol-display.js';
import pianoRhythmConfig from './piano-rhythm-config.js';
import voicingConfig from './voicing-config.js';
import {
  applyContextualQualityRules,
  applyPriorityDominantResolutionRules
} from './harmony-context.js';
import {
  DEFAULT_SWING_RATIO,
} from './swing-utils.js';
import { saveSharedPlaybackSettings } from './core/storage/app-state-storage.js';
import { createDrillAudioRuntimeRootAppAssembly } from './features/drill/drill-audio-runtime-root-app-assembly.js';
import { createDrillCompingEngineRootAppAssembly } from './features/drill/drill-comping-engine-root-app-assembly.js';
import { createDrillDefaultProgressionsRootAppAssembly } from './features/drill/drill-default-progressions-root-app-assembly.js';
import { createDrillDisplayRenderRootAppFacade } from './features/drill/drill-display-render-root-app-facade.js';
import { createDrillKeySelectionRootAppFacade } from './features/drill/drill-key-selection-root-app-facade.js';
import { loadDrillPatternHelp } from './features/drill/drill-pattern-help.js';
import { validateDrillCustomPattern } from './features/drill/drill-pattern-validation.js';
import { createDrillPlaybackResourcesRootAppAssembly } from './features/drill/drill-playback-resources-root-app-assembly.js';
import { createDrillKeyPickerRootAppAssembly } from './features/drill/drill-key-picker-root-app-assembly.js';
import { createDrillVoicingRuntimeRootAppAssembly } from './features/drill/drill-voicing-runtime-root-app-assembly.js';
import { createDrillWalkingBassRootAppAssembly } from './features/drill/drill-walking-bass-root-app-assembly.js';
import { createDrillPianoMidiRuntimeRootAppAssembly } from './features/drill/drill-piano-midi-runtime-root-app-assembly.js';
import { createDrillNextPreviewRootAppFacade } from './features/drill/drill-next-preview-root-app-facade.js';
import { createDrillPatternNormalizationRootAppContext } from './features/drill/drill-pattern-normalization-root-app-context.js';
import { createDrillPianoToolsRootAppFacade } from './features/drill/drill-piano-tools-root-app-facade.js';
import { createDrillWelcomeRootAppFacade } from './features/drill/drill-welcome-root-app-facade.js';
import { createDrillDisplayControlsRootAppFacade } from './features/drill/drill-display-controls-root-app-facade.js';
import { createDrillDisplayShellRootAppFacade } from './features/drill/drill-display-shell-root-app-facade.js';
import { createDrillDisplayRuntimeRootAppAssembly } from './features/drill/drill-display-runtime-root-app-assembly.js';
import { createDrillProgressionRootAppAssembly } from './features/drill/drill-progression-root-app-assembly.js';
import { createDrillRuntimeControlsRootAppContext } from './features/drill/drill-runtime-controls-root-app-context.js';
import { createDrillStartupDataRootAppAssembly } from './features/drill/drill-startup-data-root-app-assembly.js';
import { createDrillSettingsNormalizationRootAppContext } from './features/drill/drill-settings-normalization-root-app-context.js';
import { createDrillSettingsPersistenceRootAppAssembly } from './features/drill/drill-settings-persistence-root-app-assembly.js';
import { createDrillUiEventBindingsRootAppAssembly } from './features/drill/drill-ui-event-bindings-root-app-assembly.js';
import { createDrillUiBootstrapScreenRootAppContext } from './features/drill/drill-ui-bootstrap-screen-root-app-context.js';
import { createDrillSettingsRootAppAssembly } from './features/drill/drill-settings-root-app-assembly.js';
import { createDrillSharedPlaybackDirectRuntimeRootAppContext } from './features/drill/drill-shared-playback-direct-runtime-root-app-context.js';
import { createDrillSharedPlaybackHostRootAppContext } from './features/drill/drill-shared-playback-host-root-app-context.js';
import { createDrillSharedPlaybackPatternUiRootAppContext } from './features/drill/drill-shared-playback-pattern-ui-root-app-context.js';
import { initializeAppShell } from './features/app/app-shell.js';
import { consumePendingDrillSessionIntoUi } from './features/drill/drill-session-import.js';
import { initializeSocialShareLinks } from './features/drill/drill-ui-runtime.js';
import { createDrillSharedPlaybackRootAppAssembly } from './features/drill/drill-shared-playback-root-app-assembly.js';
import { createDrillPlaybackRuntimeHostRootAppAssembly } from './features/drill/drill-playback-runtime-host-root-app-assembly.js';
import { createDrillRuntimePrimitivesRootAppAssembly } from './features/drill/drill-runtime-primitives-root-app-assembly.js';
import { createDrillRuntimeStateRootAppAssembly } from './features/drill/drill-runtime-state-root-app-assembly.js';
import { createDrillUiBootstrapRootAppAssembly } from './features/drill/drill-ui-bootstrap-root-app-assembly.js';
import { createDrillWelcomeStandardsRootAppAssembly } from './features/drill/drill-welcome-standards-root-app-assembly.js';

/* ============================================================
   Jazz Progression Trainer — app.js
   ============================================================ */

// ---- Constants ----

const KEY_NAMES_MAJOR = ['C','D♭','D','E♭','E','F','G♭','G','A♭','A','B♭','B'];
const KEY_NAMES_MINOR = ['C','C♯','D','E♭','E','F','F♯','G','A♭','A','B♭','B'];

const ROMAN_TO_SEMITONES = {
  'I': 0, 'II': 2, 'III': 4, 'IV': 5, 'V': 7, 'VI': 9, 'VII': 11
};

const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const NATURAL_SEMITONES = [0, 2, 4, 5, 7, 9, 11];
const DEGREE_INDICES = { 'I':0, 'II':1, 'III':2, 'IV':3, 'V':4, 'VI':5, 'VII':6 };
const NOTE_LETTER_TO_SEMITONE = { C:0, D:2, E:4, F:5, G:7, A:9, B:11 };
const SEMITONE_TO_ROMAN_TOKEN = {
  0: { roman: 'I', modifier: '' },
  1: { roman: 'II', modifier: 'b' },
  2: { roman: 'II', modifier: '' },
  3: { roman: 'III', modifier: 'b' },
  4: { roman: 'III', modifier: '' },
  5: { roman: 'IV', modifier: '' },
  6: { roman: 'IV', modifier: '#' },
  7: { roman: 'V', modifier: '' },
  8: { roman: 'VI', modifier: 'b' },
  9: { roman: 'VI', modifier: '' },
  10: { roman: 'VII', modifier: 'b' },
  11: { roman: 'VII', modifier: '' }
};
const INTERVAL_SEMITONES = {
  '1': 0,
  b9: 1, '9': 2, '#9': 3,
  b3: 3, '3': 4,
  '4': 5,
  '#11': 6, b5: 6, '5': 7,
  '#5': 8, b6: 8, b13: 8, '6': 9, '13': 9, bb7: 9,
  b7: 10, '7': 11
};

const PIANO_WHITE_KEY_COLUMNS = { 0: 1, 2: 2, 4: 3, 5: 4, 7: 5, 9: 6, 11: 7 };
const PIANO_BLACK_KEY_COLUMNS = { 1: 1, 3: 2, 6: 4, 8: 5, 10: 6 };

const APP_VERSION = typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : 'dev';
const APP_URL_PARAMS = new URLSearchParams(window.location.search);
const IS_EMBEDDED_DRILL_MODE = APP_URL_PARAMS.get('embedded') === '1';
const ONE_TIME_MIGRATIONS = Object.freeze({
  silentDefaultPresetReset: '2026-04-silent-default-preset-reset',
  masterVolumeDefault50: '2026-04-master-volume-default-50'
});
const PIANO_SAMPLE_LOW = 45;
const PIANO_SAMPLE_HIGH = 89;
const DEFAULT_PIANO_FADE_SETTINGS = Object.freeze({
  timeConstantLow: 0.095,
  timeConstantHigh: 0.055,
  ...(pianoRhythmConfig?.pianoFadeOut || {})
});
const DEFAULT_PIANO_MIDI_SETTINGS = Object.freeze({
  enabled: false,
  inputId: '',
  sustainPedalEnabled: true
});
const PIANO_SETTINGS_PRESET_VERSION = 1;

// Centralized voicing/chord defaults loaded from voicing-config.js
const {
  DEGREE_QUALITY_MAJOR,
  ALTERED_SEMITONE_QUALITY_MAJOR,
  DEGREE_QUALITY_MINOR,
  ALTERED_SEMITONE_QUALITY_MINOR,
  GUIDE_TONES,
  COLOR_TONES,
  DOMINANT_COLOR_TONES,
  DOMINANT_GUIDE_TONES = {},
  DOMINANT_DEFAULT_QUALITY_MAJOR = {},
  DOMINANT_DEFAULT_QUALITY_MINOR = {},
  DOMINANT_QUALITY_ALIASES = {},
  QUALITY_CATEGORY_ALIASES = {},
  DEFAULT_DISPLAY_QUALITY_ALIASES = {},
  RICH_DISPLAY_QUALITY_ALIASES = {}
} = voicingConfig;

const PATTERN_MODE_BOTH = 'both';
const PATTERN_MODE_MAJOR = 'major';
const PATTERN_MODE_MINOR = 'minor';
const NEXT_PREVIEW_UNIT_BARS = 'bars';
const NEXT_PREVIEW_UNIT_SECONDS = 'seconds';
const DISPLAY_MODE_SHOW_BOTH = 'show-both';
const DISPLAY_MODE_CHORDS_ONLY = 'chords-only';
const DISPLAY_MODE_KEY_ONLY = 'key-only';
const HARMONY_DISPLAY_MODE_DEFAULT = 'default';
const HARMONY_DISPLAY_MODE_RICH = 'rich';
const DEFAULT_PROGRESSIONS_URL = './default-progressions.txt';
const DEFAULT_REPETITIONS_PER_KEY = 2;
const COMPING_STYLE_OFF = 'off';
const DEFAULT_NEXT_PREVIEW_LEAD_BARS = 1;
const COMPING_STYLE_STRINGS = 'strings';
const COMPING_STYLE_PIANO = 'piano';
const DEFAULT_CHORDS_PER_BAR = 1;
const SUPPORTED_CHORDS_PER_BAR = Object.freeze([1, 2, 4]);
const WELCOME_GOAL_PROGRESSION = 'progression';
const WELCOME_GOAL_ONE_CHORD = 'one-chord';
const WELCOME_GOAL_STANDARD = 'standard';
const WELCOME_ONBOARDING_SETTINGS_KEY = 'welcomeCompleted';
const WELCOME_SHOW_NEXT_TIME_SETTINGS_KEY = 'welcomeShowNextTime';
const WELCOME_VERSION_SETTINGS_KEY = 'welcomeVersion';
const WELCOME_VERSION = '2';
const REVIEW_STANDARD_CONVERSIONS_URL = './parsing-projects/review-standard-conversions.txt';

const BASS_LOW = 28;  // MIDI note for E1 (lowest bass sample)
const BASS_HIGH = 48; // MIDI note for C3 (highest bass sample)
const CELLO_LOW = 37;  // MIDI C#2
const CELLO_HIGH = 80; // MIDI G#5
const VIOLIN_LOW = 56; // MIDI G#3
const VIOLIN_HIGH = 84; // MIDI C6
const GUIDE_TONE_LOW = 49;  // MIDI C#3 — bottom of guide tone range
const GUIDE_TONE_HIGH = 60; // MIDI C4  — top of guide tone range
const SCHEDULE_AHEAD = 0.1;  // seconds
const SCHEDULE_INTERVAL = 25; // ms

// ---- Voicing Data ----

// ---- DOM refs ----

const dom = {
  appVersion:      document.getElementById('app-version'),
  selectedKeysSummary: document.getElementById('selected-keys-summary'),
  displayPlaceholder: document.getElementById('display-placeholder'),
  displayPlaceholderMessage: document.getElementById('display-placeholder-message'),
  keyDisplay:      document.getElementById('key-display'),
  chordDisplay:    document.getElementById('chord-display'),
  nextHeader:      document.getElementById('next-header'),
  nextKeyDisplay:  document.getElementById('next-key-display'),
  nextChordDisplay:document.getElementById('next-chord-display'),
  compingStyle:    document.getElementById('comping-style'),
  drumsSelect:     document.getElementById('drums-select'),
  patternHelp:     document.getElementById('pattern-help'),
  patternPicker:   document.getElementById('pattern-picker'),
  patternSelect:   document.getElementById('pattern-select'),
  patternPickerCustom: document.getElementById('pattern-picker-custom'),
  patternPreview:  document.getElementById('pattern-preview'),
  patternPreviewRow: document.querySelector('.pattern-preview-row'),
  patternPreviewDefaultAnchor: document.getElementById('pattern-preview-default-anchor'),
  patternPreviewEditAnchor: document.getElementById('pattern-preview-edit-anchor'),
  customPatternPanel: document.getElementById('custom-pattern-panel'),
  customPattern:   document.getElementById('custom-pattern'),
  patternName:     document.getElementById('pattern-name'),
  patternMode:     document.getElementById('pattern-mode'),
  patternModeBoth: document.getElementById('pattern-mode-both'),
  patternError:    document.getElementById('pattern-error'),
  saveProgression:      document.getElementById('save-progression'),
  cancelProgressionEdit: document.getElementById('cancel-progression-edit'),
  newProgression:       document.getElementById('new-progression'),
  editProgression:      document.getElementById('edit-progression'),
  deleteProgression:    document.getElementById('delete-progression'),
  manageProgressions:   document.getElementById('manage-progressions'),
  progressionManagerPanel: document.getElementById('progression-manager-panel'),
  progressionManagerList: document.getElementById('progression-manager-list'),
  closeProgressionManager: document.getElementById('close-progression-manager'),
  restoreDefaultProgressions: document.getElementById('restore-default-progressions'),
  clearAllProgressions: document.getElementById('clear-all-progressions'),
  progressionFeedback:  document.getElementById('progression-feedback'),
  progressionUpdateModal: document.getElementById('progression-update-modal'),
  progressionUpdateMessage: document.getElementById('progression-update-message'),
  progressionUpdateReplace: document.getElementById('progression-update-replace'),
  progressionUpdateMerge: document.getElementById('progression-update-merge'),
  progressionUpdateKeep: document.getElementById('progression-update-keep'),
  tempoSlider:     document.getElementById('tempo-slider'),
  tempoValue:      document.getElementById('tempo-value'),
  repetitionsPerKey: document.getElementById('repetitions-per-key'),
  transpositionSelect: document.getElementById('transposition-select'),
  nextPreviewValue: document.getElementById('next-preview-value'),
  nextPreviewUnitToggle: document.getElementById('next-preview-unit-toggle'),
  nextPreviewHint: document.getElementById('next-preview-hint'),
  chordsPerBar:    document.getElementById('chords-per-bar'),
  doubleTimeRow:   document.getElementById('double-time-row'),
  doubleTimeToggle: document.getElementById('double-time'),
  majorMinor:      document.getElementById('major-minor'),
  displayMode:     document.getElementById('display-mode'),
  harmonyDisplayMode: document.getElementById('harmony-display-mode'),
  useMajorTriangleSymbol: document.getElementById('use-major-triangle-symbol'),
  useHalfDiminishedSymbol: document.getElementById('use-half-diminished-symbol'),
  useDiminishedSymbol: document.getElementById('use-diminished-symbol'),
  debugToggle:     document.getElementById('debug-toggle'),
  keyPicker:       document.getElementById('key-picker'),
  keyPickerBackdrop: document.getElementById('key-picker-backdrop'),
  closeKeyPicker:  document.getElementById('close-key-picker'),
  startStop:       document.getElementById('start-stop'),
  pause:           document.getElementById('pause'),
  beatIndicator:   document.getElementById('beat-indicator'),
  beatDots:        document.querySelectorAll('.beat-dot'),
  selectAllKeys:   document.getElementById('select-all-keys'),
  invertKeys:      document.getElementById('invert-keys'),
  clearAllKeys:    document.getElementById('clear-all-keys'),
  saveKeyPreset:   document.getElementById('save-key-preset'),
  loadKeyPreset:   document.getElementById('load-key-preset'),
  keyCheckboxes:   document.getElementById('key-checkboxes'),
  masterVolume:    document.getElementById('master-volume'),
  masterVolumeValue: document.getElementById('master-volume-value'),
  bassVolume:      document.getElementById('bass-volume'),
  bassVolumeValue: document.getElementById('bass-volume-value'),
  stringsVolume:   document.getElementById('strings-volume'),
  stringsVolumeValue: document.getElementById('strings-volume-value'),
  drumsVolume:     document.getElementById('drums-volume'),
  drumsVolumeValue: document.getElementById('drums-volume-value'),
  walkingBass:     document.getElementById('walking-bass-toggle'),
  showBeatIndicator: document.getElementById('show-beat-indicator'),
  hideCurrentHarmony: document.getElementById('hide-current-harmony'),
  welcomeOverlay: document.getElementById('welcome-overlay'),
  welcomeSkip: document.getElementById('welcome-skip'),
  welcomeApply: document.getElementById('welcome-apply'),
  welcomeSummary: document.getElementById('welcome-summary'),
  welcomeGoalPanels: document.querySelectorAll('[data-welcome-panel]'),
  reopenWelcome: document.getElementById('reopen-welcome'),
  welcomeStandardSelect: document.getElementById('welcome-standard-select'),
  welcomeShowNextTime: document.getElementById('welcome-show-next-time'),
  resetSettings: document.getElementById('reset-settings'),
  pianoToolsPanel: document.getElementById('piano-tools-panel'),
  pianoMidiEnabled: document.getElementById('piano-midi-enabled'),
  pianoMidiStatus: document.getElementById('piano-midi-status'),
  pianoMidiInput: document.getElementById('piano-midi-input'),
  pianoMidiRefresh: document.getElementById('piano-midi-refresh'),
  pianoMidiSustain: document.getElementById('piano-midi-sustain'),
  pianoTimeConstantLow: document.getElementById('piano-time-constant-low'),
  pianoTimeConstantHigh: document.getElementById('piano-time-constant-high'),
  pianoSettingsJson: document.getElementById('piano-settings-json'),
  pianoSettingsCopy: document.getElementById('piano-settings-copy'),
  pianoSettingsApply: document.getElementById('piano-settings-apply'),
  pianoSettingsReset: document.getElementById('piano-settings-reset')
};

if (dom.appVersion) {
  dom.appVersion.textContent = `Version ${APP_VERSION}`;
}

initializeAppShell({
  mode: 'drill',
  drillLink: document.getElementById('app-mode-drill-link'),
  chartLink: document.getElementById('app-mode-chart-link'),
  modeBadge: document.getElementById('app-mode-badge')
});

function setKeyPickerOpen(isOpen) {
  if (!dom.keyPicker) return;
  dom.keyPicker.open = Boolean(isOpen);
}

let restoreAllKeysIfNoneSelectedOnCloseImpl = () => {};

function restoreAllKeysIfNoneSelectedOnClose(...args) {
  return restoreAllKeysIfNoneSelectedOnCloseImpl(...args);
}

let createDefaultAppSettingsImpl = (..._args) => ({});

function createDefaultAppSettings(...args) {
  return createDefaultAppSettingsImpl(...args);
}

let clearProgressionEditingStateImpl = () => {};
let closeProgressionManagerImpl = () => {};
let setPatternSelectValueImpl = () => {};
let getSelectedProgressionNameImpl = () => '';
let getSelectedProgressionPatternImpl = () => '';
let setEditorPatternModeImpl = () => {};
let getSelectedProgressionModeImpl = () => '';
let syncPatternSelectionFromInputImpl = () => {};
let syncCustomPatternUIImpl = () => {};
let syncProgressionManagerStateImpl = () => {};
let applyPatternModeAvailabilityImpl = () => {};
let syncPatternPreviewImpl = () => {};
let startImpl = () => {};
let saveSettingsImpl = () => {};
let loadSettingsImpl = () => {};

function clearProgressionEditingState(...args) {
  return clearProgressionEditingStateImpl(...args);
}

function closeProgressionManager(...args) {
  return closeProgressionManagerImpl(...args);
}

function setPatternSelectValue(...args) {
  return setPatternSelectValueImpl(...args);
}

function getSelectedProgressionName(...args) {
  return getSelectedProgressionNameImpl(...args);
}

function getSelectedProgressionPattern(...args) {
  return getSelectedProgressionPatternImpl(...args);
}

function setEditorPatternMode(...args) {
  return setEditorPatternModeImpl(...args);
}

function getSelectedProgressionMode(...args) {
  return getSelectedProgressionModeImpl(...args);
}

function syncPatternSelectionFromInput(...args) {
  return syncPatternSelectionFromInputImpl(...args);
}

function syncCustomPatternUI(...args) {
  return syncCustomPatternUIImpl(...args);
}

function syncProgressionManagerState(...args) {
  return syncProgressionManagerStateImpl(...args);
}

function applyPatternModeAvailability(...args) {
  return applyPatternModeAvailabilityImpl(...args);
}

function syncPatternPreview(...args) {
  return syncPatternPreviewImpl(...args);
}

function start(...args) {
  return startImpl(...args);
}

function saveSettings(...args) {
  return saveSettingsImpl(...args);
}

function loadSettings(...args) {
  return loadSettingsImpl(...args);
}

function stopPlaybackIfRunning() {
  if (!isPlaying) return;
  stop();
}

let DEFAULT_PROGRESSIONS = {};
let progressions = {};
let editingProgressionName = '';
let editingProgressionSnapshot = null;
let progressionSelectionBeforeEditing = '';
let isCreatingProgression = false;
let suppressPatternSelectChange = false;
let lastStandaloneCustomName = '';
let lastStandaloneCustomPattern = '';
let lastStandaloneCustomMode = PATTERN_MODE_BOTH;
let isManagingPresets = false;
let suppressListRender = false;
let savedKeySelectionPreset = null;
let draggedPresetName = '';
let savedPatternSelection = null;
let lastPatternSelectValue = '';
let pendingPresetDeletion = null;
let hasCompletedWelcomeOnboarding = false;
let shouldShowWelcomeNextTime = true;
let playbackSessionController = null;

const WELCOME_PROGRESSIONS = Object.freeze({
  'ii-v-i-major': {
    summary: 'Suggested: II V I major, tempo 130, 2 reps per key.',
    presetName: 'II V I',
    majorMinor: false,
    repetitionsPerKey: 2,
    tempo: 130,
    chordsPerBar: 1,
    compingStyle: COMPING_STYLE_PIANO,
    drumsMode: 'full_swing',
    enabledKeys: new Array(12).fill(true)
  },
  'ii-v-i-minor': {
    summary: 'Suggested: II V I minor, tempo 130, 2 reps per key.',
    presetName: 'II V I',
    majorMinor: true,
    repetitionsPerKey: 2,
    tempo: 130,
    chordsPerBar: 1,
    compingStyle: COMPING_STYLE_PIANO,
    drumsMode: 'full_swing',
    enabledKeys: new Array(12).fill(true)
  },
  turnaround: {
    summary: 'Suggested: standard turnaround, tempo 130, 2 reps per key.',
    presetName: 'Standard turnaround',
    majorMinor: false,
    repetitionsPerKey: 2,
    tempo: 130,
    chordsPerBar: 1,
    compingStyle: COMPING_STYLE_PIANO,
    drumsMode: 'full_swing',
    enabledKeys: new Array(12).fill(true)
  }
});

const WELCOME_ONE_CHORDS = Object.freeze({
  maj7: {
    summary: 'Suggested: random maj7, tempo 90, 1 rep per key.',
    patternName: 'Random maj7',
    pattern: 'one: maj7',
    patternMode: PATTERN_MODE_BOTH,
    majorMinor: false,
    repetitionsPerKey: 1,
    tempo: 90,
    chordsPerBar: 1,
    compingStyle: COMPING_STYLE_STRINGS,
    drumsMode: 'hihats_2_4',
    enabledKeys: new Array(12).fill(true)
  },
  m9: {
    summary: 'Suggested: random m9, tempo 90, 1 rep per key.',
    patternName: 'Random m9',
    pattern: 'one: m9',
    patternMode: PATTERN_MODE_BOTH,
    majorMinor: false,
    repetitionsPerKey: 1,
    tempo: 90,
    chordsPerBar: 1,
    compingStyle: COMPING_STYLE_STRINGS,
    drumsMode: 'hihats_2_4',
    enabledKeys: new Array(12).fill(true)
  },
  lyd: {
    summary: 'Suggested: random lydian, tempo 90, 1 rep per key.',
    patternName: 'Random lydian',
    pattern: 'one: lyd',
    patternMode: PATTERN_MODE_BOTH,
    majorMinor: false,
    repetitionsPerKey: 1,
    tempo: 90,
    chordsPerBar: 1,
    compingStyle: COMPING_STYLE_STRINGS,
    drumsMode: 'hihats_2_4',
    enabledKeys: new Array(12).fill(true)
  },
  '7alt': {
    summary: 'Suggested: random altered, tempo 90, 1 rep per key.',
    patternName: 'Random altered',
    pattern: 'one: 7alt',
    patternMode: PATTERN_MODE_BOTH,
    majorMinor: false,
    repetitionsPerKey: 1,
    tempo: 90,
    chordsPerBar: 1,
    compingStyle: COMPING_STYLE_STRINGS,
    drumsMode: 'hihats_2_4',
    enabledKeys: new Array(12).fill(true)
  },
  '13sus': {
    summary: 'Suggested: random 13sus4, tempo 90, 1 rep per key.',
    patternName: 'Random 13sus4',
    pattern: 'one: 13sus',
    patternMode: PATTERN_MODE_BOTH,
    majorMinor: false,
    repetitionsPerKey: 1,
    tempo: 90,
    chordsPerBar: 1,
    compingStyle: COMPING_STYLE_STRINGS,
    drumsMode: 'hihats_2_4',
    enabledKeys: new Array(12).fill(true)
  }
});

const WELCOME_STANDARDS_FALLBACK = Object.freeze({
  'all-the-things-you-are': {
    summary: 'Suggested: All the Things You Are, single key, comfortable playback.',
    patternName: 'All the Things You Are',
    pattern: 'key: Ab | Fm7 | Bbm7 | Eb7 | Abmaj7 | Dbmaj7 | Dm7 G7 | Cmaj7 | Cmaj7 | Cm7 | Fm7 | Bb7 | Ebmaj7 | Abmaj7 | Am7 D7 | Gmaj7 | Gmaj7 | Am7 | D7 | Gmaj7 | Gmaj7 | F#m7b5 | B7b9 | Emaj7 | C7b9b13 | Fm7 | Bbm7 | Eb7 | Abmaj7 | Dbmaj7 | DbmMaj7 | Cm7 | Bdim7 | Bbm7 | Eb7 | Abmaj7 | Gm7b5 C7b9 |',
    patternMode: PATTERN_MODE_MAJOR,
    majorMinor: false,
    repetitionsPerKey: 1,
    tempo: 120,
    chordsPerBar: 4,
    compingStyle: COMPING_STYLE_PIANO,
    enabledKeys: [false, false, false, false, false, false, false, false, true, false, false, false]
  },
  'autumn-leaves': {
    summary: 'Suggested: Autumn Leaves, single key, comfortable playback.',
    patternName: 'Autumn Leaves',
    pattern: 'key: E | Am7 D7 | G | F#m7b5 B7 | Em | B7 | Em | Am7 D7 | G | F#m7b5 B7 | Em | F#m7b5 B7 | Em |',
    patternMode: PATTERN_MODE_MINOR,
    majorMinor: true,
    repetitionsPerKey: 1,
    tempo: 120,
    chordsPerBar: 4,
    compingStyle: COMPING_STYLE_PIANO,
    enabledKeys: [false, false, false, false, true, false, false, false, false, false, false, false]
  },
  'blue-bossa': {
    summary: 'Suggested: Blue Bossa, single key, relaxed playback.',
    patternName: 'Blue Bossa',
    pattern: 'key: C | Cm | Fm | Dm7b5 G7 | Cm | Ebm7 Ab7 | Db | Dm7b5 G7 | Cm G7 |',
    patternMode: PATTERN_MODE_MINOR,
    majorMinor: true,
    repetitionsPerKey: 1,
    tempo: 120,
    chordsPerBar: 4,
    compingStyle: COMPING_STYLE_PIANO,
    enabledKeys: [true, false, false, false, false, false, false, false, false, false, false, false]
  },
  solar: {
    summary: 'Suggested: Solar, single key, medium-up tempo.',
    patternName: 'Solar',
    pattern: 'key: C | Cm | Gm7 C7 | F | Fm7 Bb7 | Eb | Ebm7 Ab7 | Db | Dm7b5 G7 |',
    patternMode: PATTERN_MODE_MINOR,
    majorMinor: true,
    repetitionsPerKey: 1,
    tempo: 120,
    chordsPerBar: 4,
    compingStyle: COMPING_STYLE_PIANO,
    enabledKeys: [true, false, false, false, false, false, false, false, false, false, false, false]
  },
  'satin-doll': {
    summary: 'Suggested: Satin Doll, single key, comfortable groove.',
    patternName: 'Satin Doll',
    pattern: 'key: C [: | Dm7 G7 | Dm7 G7 | Em7 A7 | Em7 A7 | D7 | Db7 | [1 C | A7 :| [2 C | C | Gm7 | C7 | F | F | Am7 | D7 | G7 | A7 ] | Dm7 G7 | Dm7 G7 | Em7 A7 | Em7 A7 | D7 | Db7 | C | C |',
    patternMode: PATTERN_MODE_MAJOR,
    majorMinor: false,
    repetitionsPerKey: 1,
    tempo: 120,
    chordsPerBar: 4,
    compingStyle: COMPING_STYLE_PIANO,
    enabledKeys: [true, false, false, false, false, false, false, false, false, false, false, false]
  },
  'satin-doll-ireal': {
    summary: 'Suggested: Satin Doll (iReal), with repeats and explicit endings.',
    patternName: 'Satin Doll (iReal)',
    pattern: 'key: C [: | Dm7 G7 | Dm7 G7 | Em7 A7 | Em7 A7 | Am7 D7 | Abm7 Db7 | [1 Cmaj7 F7 | Em7 A7 :| [2 Cmaj7 | Cmaj7 ] [: | Gm7 C7 | Gm7 C7 | Fmaj7 | Fmaj7 | Am7 D7 | Am7 D7 | G7 | G7 :| | Dm7 G7 | Dm7 G7 | Em7 A7 | Em7 A7 | Am7 D7 | Abm7 Db7 | Cmaj7 F7 | Em7 A7 |',
    patternMode: PATTERN_MODE_MAJOR,
    majorMinor: false,
    repetitionsPerKey: 1,
    tempo: 120,
    chordsPerBar: 4,
    compingStyle: COMPING_STYLE_PIANO,
    enabledKeys: [true, false, false, false, false, false, false, false, false, false, false, false]
  },
  'there-will-never-be-another-you': {
    summary: 'Suggested: There Will Never Be Another You, single key, medium tempo.',
    patternName: 'There Will Never Be Another You',
    pattern: 'key: Eb | Eb | Dm7b5 G7 | Cm | Bbm7 Eb7 | Ab | Abm | Eb | Cm7 F7 | Fm7 Bb7 | Eb | Dm7b5 G7 | Cm | Bbm7 Eb7 | Ab | Abm | Eb C7 | Eb D7 | G7 C7 | Fm7 Bb7 | Eb |',
    patternMode: PATTERN_MODE_MAJOR,
    majorMinor: false,
    repetitionsPerKey: 1,
    tempo: 120,
    chordsPerBar: 4,
    compingStyle: COMPING_STYLE_PIANO,
    enabledKeys: [false, false, false, true, false, false, false, false, false, false, false, false]
  }
});
let welcomeStandards = { ...WELCOME_STANDARDS_FALLBACK };
let currentRawChords = [];
let nextRawChords = [];
let oneChordQualityPool = [];
let oneChordQualityPoolSignature = '';
let currentOneChordQualityValue = '';
let nextOneChordQualityValue = '';
let appliedDefaultProgressionsFingerprint = '';
let hadStoredProgressions = false;
let shouldPromptForDefaultProgressionsUpdate = false;
let defaultProgressionsVersion = '1';
let acknowledgedDefaultProgressionsVersion = '';
let shouldPersistRecoveredDefaultProgressions = false;
let appliedOneTimeMigrations = {};
let sessionStartedAt = Date.now();
let sessionStartTracked = false;
let firstPlayStartTracked = false;
let playStopSuggestionCount = 0;
let sessionEngagedTracked = false;
let sessionDurationTracked = false;
let sessionActionCount = 0;

const {
  normalizePatternMode,
  normalizePresetName,
  normalizePresetNameForInput
} = createDrillPatternNormalizationRootAppContext({
  constants: {
    patternModeBoth: PATTERN_MODE_BOTH,
    patternModeMajor: PATTERN_MODE_MAJOR,
    patternModeMinor: PATTERN_MODE_MINOR
  }
});

const {
  parseWelcomeStandardsText,
  renderWelcomeStandardOptions
} = createDrillWelcomeStandardsRootAppAssembly({
  dom,
  state: {
    getWelcomeStandards: () => welcomeStandards
  },
  constants: {
    noteLetterToSemitone: NOTE_LETTER_TO_SEMITONE,
    patternModeMinor: PATTERN_MODE_MINOR,
    compingStylePiano: COMPING_STYLE_PIANO
  },
  helpers: {
    normalizePatternMode
  }
});

const {
  loadWelcomeStandards
} = createDrillStartupDataRootAppAssembly({
  state: {
    setWelcomeStandards: (value) => { welcomeStandards = value; }
  },
  welcomeStandards: {
    fetchImpl: (...args) => fetch(...args),
    url: REVIEW_STANDARD_CONVERSIONS_URL,
    version: APP_VERSION,
    parseWelcomeStandardsText,
    renderWelcomeStandardOptions,
    welcomeStandardsFallback: WELCOME_STANDARDS_FALLBACK
  }
});

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

const {
  patternAnalysis: {
    ONE_CHORD_DEFAULT_QUALITIES,
    ONE_CHORD_DOMINANT_QUALITIES,
    normalizePatternString,
    parseOneChordSpec,
    isOneChordModeActive: isOneChordModeActiveBase,
    createOneChordToken,
    analyzePattern,
    analyzePatternCached,
    parsePattern,
    normalizeChordsPerBar: normalizeChordsPerBarBase,
    getPatternKeyOverridePitchClass: getPatternKeyOverridePitchClassBase,
    getBeatsPerChord: getBeatsPerChordBase,
    padProgression: padProgressionBase
  }
} = createDrillRuntimePrimitivesRootAppAssembly({
  patternAnalysisConstants: {
    romanToSemitones: ROMAN_TO_SEMITONES,
    noteLetterToSemitone: NOTE_LETTER_TO_SEMITONE,
    semitoneToRomanTokenMap: SEMITONE_TO_ROMAN_TOKEN,
    degreeQualityMajor: DEGREE_QUALITY_MAJOR,
    alteredSemitoneQualityMajor: ALTERED_SEMITONE_QUALITY_MAJOR,
    degreeQualityMinor: DEGREE_QUALITY_MINOR,
    alteredSemitoneQualityMinor: ALTERED_SEMITONE_QUALITY_MINOR,
    dominantQualityAliases: DOMINANT_QUALITY_ALIASES,
    qualityCategoryAliases: QUALITY_CATEGORY_ALIASES,
    defaultChordsPerBar: DEFAULT_CHORDS_PER_BAR,
    supportedChordsPerBar: SUPPORTED_CHORDS_PER_BAR
  }
});

const {
  normalizeCompingStyle,
  normalizeRepetitionsPerKey,
  normalizeChordsPerBar,
  normalizeDisplayMode,
  normalizeHarmonyDisplayMode
} = createDrillSettingsNormalizationRootAppContext({
  constants: {
    compingStyleOff: COMPING_STYLE_OFF,
    compingStyleStrings: COMPING_STYLE_STRINGS,
    compingStylePiano: COMPING_STYLE_PIANO,
    defaultRepetitionsPerKey: DEFAULT_REPETITIONS_PER_KEY,
    displayModeShowBoth: DISPLAY_MODE_SHOW_BOTH,
    displayModeChordsOnly: DISPLAY_MODE_CHORDS_ONLY,
    displayModeKeyOnly: DISPLAY_MODE_KEY_ONLY,
    harmonyDisplayModeDefault: HARMONY_DISPLAY_MODE_DEFAULT,
    harmonyDisplayModeRich: HARMONY_DISPLAY_MODE_RICH
  },
  helpers: {
    normalizeChordsPerBarBase
  }
});

function getPianoVoicingMode() {
  normalizeCompingStyle(dom.compingStyle?.value);
  return 'piano';
}

function getRepetitionsPerKey() {
  return normalizeRepetitionsPerKey(dom.repetitionsPerKey?.value);
}

const {
  createProgressionEntry,
  normalizeProgressionEntry,
  normalizeProgressionsMap,
  parseDefaultProgressionsText,
  getDefaultProgressionsFingerprint
} = createDrillDefaultProgressionsRootAppAssembly({
  constants: {
    defaultPatternMode: PATTERN_MODE_MAJOR
  },
  state: {
    getDefaultProgressions: () => DEFAULT_PROGRESSIONS
  },
  helpers: {
    createProgressionEntryBase,
    normalizeProgressionEntryBase,
    normalizeProgressionsMapBase,
    parseDefaultProgressionsTextBase,
    isModeToken: isProgressionModeToken,
    normalizePatternMode,
    normalizePatternString,
    normalizePresetName
  }
});

function clearOneChordCycleState() {
  currentRawChords = [];
  nextRawChords = [];
  oneChordQualityPool = [];
  oneChordQualityPoolSignature = '';
  currentOneChordQualityValue = '';
  nextOneChordQualityValue = '';
}

function normalizeAppliedOneTimeMigrations(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};

  return Object.fromEntries(
    Object.entries(value)
      .filter(([key, entry]) => Boolean(key) && entry && typeof entry === 'object' && !Array.isArray(entry))
      .map(([key, entry]) => [key, {
        appliedAt: typeof entry.appliedAt === 'string' ? entry.appliedAt : '',
        appVersion: typeof entry.appVersion === 'string' ? entry.appVersion : '',
        defaultPresetsVersion: typeof entry.defaultPresetsVersion === 'string' ? entry.defaultPresetsVersion : ''
      }])
  );
}

function markOneTimeMigrationApplied(migrationId) {
  if (!migrationId) return;

  appliedOneTimeMigrations = {
    ...appliedOneTimeMigrations,
    [migrationId]: {
      appliedAt: new Date().toISOString(),
      appVersion: APP_VERSION,
      defaultPresetsVersion: defaultProgressionsVersion
    }
  };
}

function hasAppliedOneTimeMigration(migrationId) {
  return Boolean(migrationId && appliedOneTimeMigrations[migrationId]);
}

function applySilentDefaultPresetResetMigration() {
  const migrationId = ONE_TIME_MIGRATIONS.silentDefaultPresetReset;
  if (!migrationId || hasAppliedOneTimeMigration(migrationId) || Object.keys(DEFAULT_PROGRESSIONS).length === 0) {
    return false;
  }

  progressions = normalizeProgressionsMap(DEFAULT_PROGRESSIONS);
  appliedDefaultProgressionsFingerprint = getDefaultProgressionsFingerprint();
  acknowledgedDefaultProgressionsVersion = defaultProgressionsVersion;
  shouldPromptForDefaultProgressionsUpdate = false;
  savedPatternSelection = Object.keys(progressions)[0] || CUSTOM_PATTERN_OPTION_VALUE;
  markOneTimeMigrationApplied(migrationId);
  return true;
}

function shouldApplyMasterVolumeDefault50Migration() {
  const migrationId = ONE_TIME_MIGRATIONS.masterVolumeDefault50;
  if (!migrationId || hasAppliedOneTimeMigration(migrationId)) {
    return false;
  }
  markOneTimeMigrationApplied(migrationId);
  return true;
}

function isOneChordModeActive(pattern = getCurrentPatternString()) {
  return isOneChordModeActiveBase(pattern);
}

function getOneChordQualitySignature(qualities) {
  return (qualities || []).join('|');
}

function matchesOneChordQualitySet(qualities, reference) {
  if (!Array.isArray(qualities) || !Array.isArray(reference)) return false;
  if (qualities.length !== reference.length) return false;
  return qualities.every((quality, index) => quality === reference[index]);
}

function takeNextOneChordQuality(qualities, excludedQuality = null) {
  const availableQualities = Array.isArray(qualities) && qualities.length > 0
    ? qualities
    : ONE_CHORD_DEFAULT_QUALITIES;
  const signature = getOneChordQualitySignature(availableQualities);
  if (oneChordQualityPoolSignature !== signature) {
    oneChordQualityPoolSignature = signature;
    oneChordQualityPool = [];
  }

  if (availableQualities.length <= 1 || excludedQuality === null) {
    if (oneChordQualityPool.length === 0) {
      oneChordQualityPool = shuffleArray(availableQualities.slice());
    }
    return oneChordQualityPool.pop();
  }

  if (oneChordQualityPool.length === 0) {
    oneChordQualityPool = shuffleArray(availableQualities.slice());
  }

  let candidateIndex = oneChordQualityPool.findIndex(quality => quality !== excludedQuality);
  if (candidateIndex === -1) {
    oneChordQualityPool = shuffleArray(availableQualities.slice());
    candidateIndex = oneChordQualityPool.findIndex(quality => quality !== excludedQuality);
  }

  if (candidateIndex === -1) {
    return oneChordQualityPool.pop();
  }

  const [candidate] = oneChordQualityPool.splice(candidateIndex, 1);
  return candidate;
}

// ---- Pattern Parser ----

function syncDoubleTimeToggle() {
  if (dom.doubleTimeToggle) {
    dom.doubleTimeToggle.checked = getSelectedChordsPerBar() >= 2;
  }
}

function normalizeChordsPerBarForCurrentPattern() {
  if (!dom.chordsPerBar) return;

  const analysis = analyzePatternCached(getCurrentPatternString());
  if (analysis.usesBarLines) {
    dom.chordsPerBar.value = '4';
    syncDoubleTimeToggle();
    return;
  }

  if (getSelectedChordsPerBar() === 4) {
    dom.chordsPerBar.value = dom.doubleTimeToggle?.checked ? '2' : String(DEFAULT_CHORDS_PER_BAR);
  }
  syncDoubleTimeToggle();
}

function getSelectedChordsPerBar() {
  return normalizeChordsPerBar(dom.chordsPerBar?.value);
}

function getPatternKeyOverridePitchClass(patternString = getCurrentPatternString()) {
  return getPatternKeyOverridePitchClassBase(patternString);
}

function getChordsPerBar(patternString = getCurrentPatternString()) {
  const analysis = analyzePatternCached(patternString);
  return normalizeChordsPerBar(analysis.resolvedChordsPerBar ?? getSelectedChordsPerBar());
}

function getBeatsPerChord(chordsPerBar = getChordsPerBar()) {
  return getBeatsPerChordBase(chordsPerBar);
}

function padProgression(chords, chordsPerBar = getChordsPerBar()) {
  return padProgressionBase(chords, chordsPerBar);
}

// Check if a progression can be loop-trimmed: last chord == first chord
// and removing it leaves an even number of measures.
function canLoopTrimProgression(rawChords, chordsPerBar = getChordsPerBar()) {
  if (rawChords.length < 3) return false;
  const first = rawChords[0];
  const last = rawChords[rawChords.length - 1];
  const firstPlayedMajor = getPlayedChordQuality(first, false);
  const lastPlayedMajor = getPlayedChordQuality(last, false);
  const firstPlayedMinor = getPlayedChordQuality(first, true);
  const lastPlayedMinor = getPlayedChordQuality(last, true);
  if (first.semitones !== last.semitones
      || (first.bassSemitones ?? first.semitones) !== (last.bassSemitones ?? last.semitones)
      || firstPlayedMajor !== lastPlayedMajor
      || firstPlayedMinor !== lastPlayedMinor) return false;
  const trimmedLength = rawChords.length - 1;
  const chordsPerMeasure = normalizeChordsPerBar(chordsPerBar);
  if (trimmedLength % chordsPerMeasure !== 0) return false;
  const measures = trimmedLength / chordsPerMeasure;
  return measures % 2 === 0;
}

// Build voicing plan for a loop rep from the template computed on the full raw
// sequence (e.g. 5 voicings for C A7 D G C).
// - isFirstRep=true  → [v0, v1, v2, v3] (trim resolution voicing)
// - isFirstRep=false → [v4, v1, v2, v3, (v4, v4, ...)] (resolution first, body, pad)
function buildLoopRepVoicings(template, paddedLength, isFirstRep) {
  if (!Array.isArray(template) || template.length === 0) {
    return new Array(Math.max(0, paddedLength)).fill(null);
  }
  const N = template.length; // number of raw chords (e.g. 5)
  const plan = [];
  if (isFirstRep) {
    // Use voicings 0..N-2, pad with voicing N-2 if needed
    for (let i = 0; i < paddedLength; i++) {
      plan.push(template[Math.min(i, N - 2)]);
    }
  } else {
    // Start with resolution voicing (last in template), then body voicings 1..N-2
    const resolve = template[N - 1];
    plan.push(resolve);
    for (let i = 1; i < paddedLength; i++) {
      if (i < N - 1) {
        plan.push(template[i]); // body voicings v1, v2, v3
      } else {
        plan.push(resolve); // pad with resolution voicing
      }
    }
  }
  return plan;
}

// ---- Audio Engine ----

let audioCtx = null;
let mixerNodes = null;
const sampleBuffers = { bass: {}, cello: {}, violin: {}, piano: {}, drums: {} };
const sampleFileBuffers = new Map();
const sampleLoadPromises = {
  bass: new Map(),
  cello: new Map(),
  violin: new Map(),
  piano: new Map(),
  drums: new Map()
};
const sampleFileFetchPromises = new Map();
const DRUM_MODE_OFF = 'off';
const DRUM_MODE_METRONOME_24 = 'metronome_2_4';
const DRUM_MODE_HIHATS_24 = 'hihats_2_4';
const DRUM_MODE_FULL_SWING = 'full_swing';
const PORTAMENTO_ALWAYS_ON = true;
const METRONOME_GAIN_MULTIPLIER = 2.4;
const DRUMS_GAIN_MULTIPLIER = 1.18;
const DEFAULT_MASTER_VOLUME_PERCENT = '50';
const MIXER_CHANNEL_CALIBRATION = Object.freeze({
  master: 2,
  bass: 0.74,
  strings: 1,
  drums: 0.87,
});
const SAFE_PRELOAD_MEASURES = 4;
const DRUM_HIHAT_SAMPLE_URL = 'assets/13_heavy_hi-hat_chick.mp3';
const DRUM_RIDE_SAMPLE_URLS = [
  'assets/ride/20_bright_ride_body.mp3',
  'assets/ride/20_cool_ride_body.mp3',
  'assets/ride/20_crush_ride_body.mp3',
  'assets/ride/20_deep_full_ride_body.mp3',
  'assets/ride/20_dry_heavy_ride_body.mp3',
  'assets/ride/20_dry_ride_body.mp3',
  'assets/ride/20_power_ride_body.mp3',
  'assets/ride/21_dark_full_ride_body.mp3',
  'assets/ride/21_full_ride_body.mp3',
  'assets/ride/21_silver_mellow_ride_body.mp3',
  'assets/ride/22_dark_metal_ride_body.mp3',
  'assets/ride/22_dry_ride_body.mp3',
  'assets/ride/22_mellow_ride_body.mp3',
];
let applyDrillAudioMixerSettingsDelegate = null;
const {
  playbackSettingsRuntime: drillPlaybackSettingsRuntime
} = createDrillRuntimePrimitivesRootAppAssembly({
  playbackSettingsDom: dom,
  playbackSettingsMixer: {
    getMixerNodes: () => mixerNodes,
    getAudioContext: () => audioCtx,
    applyAudioMixerSettings: (options) => applyDrillAudioMixerSettingsDelegate?.(options)
  },
  playbackSettingsHelpers: {
    normalizeCompingStyle
  },
  playbackSettingsConstants: {
    compingStyleOff: COMPING_STYLE_OFF,
    mixerChannelCalibration: MIXER_CHANNEL_CALIBRATION,
    drumModeOff: DRUM_MODE_OFF,
    bassLow: BASS_LOW
  }
});
const {
  sliderValueToGain,
  getCompingStyle,
  isChordsEnabled,
  isWalkingBassEnabled,
  isWalkingBassDebugEnabled,
  bassMidiToNoteName,
  updateMixerValueLabel,
  applyMixerSettings,
  getDrumsMode,
  getBassMidi
} = drillPlaybackSettingsRuntime;




const NOTE_FADEOUT = 0.26;  // seconds — bass fadeout before next note
const BASS_NOTE_ATTACK = 0.005; // seconds — tiny fade-in to avoid clicks on re-attacks
const BASS_NOTE_OVERLAP = 0.11; // seconds - let bass notes overlap slightly
const BASS_NOTE_RELEASE = 0.075; // seconds - fixed tail fade for walking bass notes
const BASS_GAIN_RELEASE_TIMECONSTANT = 0.012; // seconds - smooth release to avoid clicks
const CHORD_FADE_BEFORE = 0.1; // seconds — chord fade starts this long before end
const CHORD_FADE_DUR = 0.2;    // seconds — chord fade duration
const CHORD_VOLUME_MULTIPLIER = 1.35;
// Bass samples are now loudness-normalized around LUFS-S -16, so we only keep a light trim here
// instead of the stronger attenuation that made sense with the older peak-normalized files.
const BASS_GAIN = 0.8 * Math.pow(10, -2 / 20);
const STRING_LOOP_START = 2.0;
const STRING_LOOP_END = 9.0;
const STRING_LOOP_CROSSFADE = 0.12;
const STRING_LEGATO_MAX_DISTANCE = 2; // semitones

function clamp01(value) {
  return Math.min(1, Math.max(0, value));
}

function clampRange(value, min, max, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function createDefaultPianoFadeSettings(overrides = {}) {
  return {
    ...DEFAULT_PIANO_FADE_SETTINGS,
    ...overrides
  };
}

function normalizePianoFadeSettings(candidate = {}) {
  return {
    timeConstantLow: clampRange(candidate.timeConstantLow, 0.01, 1.5, DEFAULT_PIANO_FADE_SETTINGS.timeConstantLow),
    timeConstantHigh: clampRange(candidate.timeConstantHigh, 0.01, 1.5, DEFAULT_PIANO_FADE_SETTINGS.timeConstantHigh)
  };
}

function normalizePianoMidiSettings(candidate = {}) {
  return {
    enabled: Boolean(candidate.enabled),
    inputId: typeof candidate.inputId === 'string' ? candidate.inputId : DEFAULT_PIANO_MIDI_SETTINGS.inputId,
    sustainPedalEnabled: candidate.sustainPedalEnabled !== undefined
      ? Boolean(candidate.sustainPedalEnabled)
      : DEFAULT_PIANO_MIDI_SETTINGS.sustainPedalEnabled
  };
}

function getPianoFadeProfile(midi, volume, maxDuration) {
  const midiNorm = clamp01(((Number(midi) || 60) - 45) / 44);
  const volumeNorm = clamp01((Number(volume) || 0) / 0.42);
  const timeConstantBase = pianoFadeSettings.timeConstantLow + ((pianoFadeSettings.timeConstantHigh - pianoFadeSettings.timeConstantLow) * midiNorm);
  const timeConstant = Math.max(0.024, timeConstantBase + (volumeNorm * 0.006));
  const fadeBefore = maxDuration > 0
    ? Math.min(Math.max(0.02, timeConstant * 0.9), Math.max(0.02, maxDuration * 0.28))
    : Math.max(0.02, timeConstant * 0.9);
  return {
    fadeBefore,
    timeConstant
  };
}
const STRING_LEGATO_GLIDE_TIME = 0.05; // seconds
const STRING_LEGATO_PRE_DIP_TIME = 0.05; // seconds
const STRING_LEGATO_PRE_DIP_RATIO = 0.7;
const STRING_LEGATO_HOLD_TIME = 0.1; // seconds
const STRING_LEGATO_FADE_TIME = 0.2; // seconds
const AUTOMATION_CURVE_STEPS = 32;
let activeNoteGain = null; // current bass note's GainNode for early cutoff
let activeNoteFadeOut = NOTE_FADEOUT;
let pianoFadeSettings = createDefaultPianoFadeSettings();
let pianoMidiSettings = normalizePianoMidiSettings(DEFAULT_PIANO_MIDI_SETTINGS);
let midiAccess = null;
let midiAccessPromise = null;
let currentMidiInput = null;
let midiSustainPedalDown = false;
let midiPianoRangePreloadPromise = null;
const pendingMidiNoteTokens = new Map();
const activeMidiPianoVoices = new Map();
const sustainedMidiNotes = new Set();
const drillAudioRuntimeAssembly = createDrillAudioRuntimeRootAppAssembly({
  audioRuntime: {
    audioState: {
      getAudioContext: () => audioCtx
    },
    cacheState: {
      sampleBuffers,
      sampleLoadPromises,
      sampleFileBuffers,
      sampleFileFetchPromises
    },
    constants: {
      appVersion: APP_VERSION
    }
  },
  samplePreload: {
    playbackSettings: {
      getBassPreloadRange,
      getBassMidi,
      getBeatsPerChord,
      getChordsPerBar,
      getCompingStyle,
      getDrumsMode
    },
    progressionState: {
      getCurrentChords: () => paddedChords,
      getCurrentKey: () => currentKey,
      getCurrentVoicingPlan: () => currentVoicingPlan,
      getCurrentBassPlan: () => currentBassPlan,
      getNextChords: () => nextPaddedChords,
      getNextKey: () => nextKeyValue,
      getNextVoicingPlan: () => nextVoicingPlan
    },
    sampleLoading: {
      collectCompingSampleNotes: (style, voicing, noteSets) => {
        compingEngine.collectSampleNotes(style, voicing, noteSets);
      },
      loadSample: (category, folder, midi) => loadDrillAudioSample(category, folder, midi),
      loadPianoSampleList: (midiValues) => loadDrillPianoSampleList(midiValues),
      loadFileSample: (category, key, baseUrl) => loadDrillFileSample(category, key, baseUrl),
      fetchArrayBufferFromUrl: (baseUrl) => fetchDrillSampleArrayBuffer(baseUrl)
    },
    constants: {
      drumHihatSampleUrl: DRUM_HIHAT_SAMPLE_URL,
      drumRideSampleUrls: DRUM_RIDE_SAMPLE_URLS,
      drumModeHihats24: DRUM_MODE_HIHATS_24,
      drumModeFullSwing: DRUM_MODE_FULL_SWING,
      safePreloadMeasures: SAFE_PRELOAD_MEASURES
    }
  },
  scheduledAudio: {
    audioState: {
      getAudioContext: () => audioCtx
    },
    audioHelpers: {
      stopActiveComping: (stopTime, fadeDuration) => {
        compingEngine.stopActiveComping(stopTime, fadeDuration);
      }
    },
    constants: {
      getDefaultFadeDuration: () => NOTE_FADEOUT
    }
  },
  audioPlayback: {
    audioState: {
      getAudioContext: () => audioCtx,
      setAudioContext: (value) => { audioCtx = value; },
      getMixerNodes: () => mixerNodes,
      setMixerNodes: (value) => { mixerNodes = value; },
      sampleBuffers
    },
    audioHelpers: {
      createAudioContext: () => new (window.AudioContext || window.webkitAudioContext)(),
      applyMixerSettings,
      trackScheduledSource: (source, gainNodes) => drillAudioRuntimeAssembly.audioStack.scheduledAudio.trackScheduledSource(source, gainNodes)
    },
    playbackSettings: {
      getDrumsMode,
      getSwingRatio
    },
    constants: {
      metronomeGainMultiplier: METRONOME_GAIN_MULTIPLIER,
      drumsGainMultiplier: DRUMS_GAIN_MULTIPLIER,
      drumModeOff: DRUM_MODE_OFF,
      drumModeMetronome24: DRUM_MODE_METRONOME_24,
      drumModeHihats24: DRUM_MODE_HIHATS_24,
      drumModeFullSwing: DRUM_MODE_FULL_SWING,
      drumRideSampleUrls: DRUM_RIDE_SAMPLE_URLS
    }
  },
  samplePlayback: {
    audioState: {
      getAudioContext: () => audioCtx,
      sampleBuffers
    },
    audioHelpers: {
      getMixerDestination: (channel) => drillAudioRuntimeAssembly.audioStack.audioPlayback.getMixerDestination(channel),
      trackScheduledSource: (source, gainNodes) => drillAudioRuntimeAssembly.audioStack.scheduledAudio.trackScheduledSource(source, gainNodes),
      loadSample: (category, folder, midi) => loadDrillAudioSample(category, folder, midi),
      getPianoFadeProfile
    },
    playbackState: {
      getActiveNoteGain: () => activeNoteGain,
      setActiveNoteGain: (value) => { activeNoteGain = value; },
      setActiveNoteFadeOut: (value) => { activeNoteFadeOut = value; }
    },
    constants: {
      noteFadeout: NOTE_FADEOUT,
      bassNoteAttack: BASS_NOTE_ATTACK,
      bassNoteOverlap: BASS_NOTE_OVERLAP,
      bassNoteRelease: BASS_NOTE_RELEASE,
      bassGainReleaseTimeConstant: BASS_GAIN_RELEASE_TIMECONSTANT,
      chordFadeBefore: CHORD_FADE_BEFORE,
      chordFadeDuration: CHORD_FADE_DUR,
      bassGain: BASS_GAIN,
      stringLoopStart: STRING_LOOP_START,
      stringLoopEnd: STRING_LOOP_END,
      stringLoopCrossfade: STRING_LOOP_CROSSFADE
    }
  },
  audioFacade: {
    getCurrentTime: () => audioCtx?.currentTime ?? 0,
    defaultFadeDuration: NOTE_FADEOUT
  }
});
const {
  audioStack: drillAudioStack,
  audioFacade: drillAudioFacade,
  audioSurface: drillAudioSurface
} = drillAudioRuntimeAssembly;
const {
  applyDrillAudioMixerSettings,
  loadDrillAudioSample,
  loadDrillPianoSample,
  loadDrillPianoSampleList,
  loadDrillFileSample,
  fetchDrillSampleArrayBuffer,
  loadDrillBufferFromUrl,
  preloadAllDrillSamples,
  preloadDrillStartupSamples,
  preloadDrillNearTermSamples,
  ensureDrillNearTermSamplePreload,
  ensureDrillPageSampleWarmup,
  ensureDrillBackgroundSamplePreload,
  getDrillNearTermSamplePreloadPromise,
  setDrillNearTermSamplePreloadPromise,
  getDrillStartupSamplePreloadInProgress,
  setDrillStartupSamplePreloadInProgress,
  trackDrillScheduledSource,
  clearDrillScheduledDisplays,
  stopDrillScheduledAudio,
  stopDrillActiveChordVoices,
  getDrillPendingDisplayTimeouts,
  initDrillAudioPlayback,
  initDrillMixerNodes,
  getDrillMixerDestination,
  playDrillClick,
  playDrillDrumSample,
  playDrillHiHat,
  getNextDrillRideSampleName,
  playDrillRide,
  scheduleDrillDrumsForBeat,
  getDrillNearestLoadedBassSampleMidi,
  getDrillAdaptiveBassFadeDuration,
  scheduleDrillBassGainRelease,
  playDrillNote,
  scheduleDrillSampleSegment,
  playDrillLoopedStringSample,
  playDrillSample
} = drillAudioSurface;
applyDrillAudioMixerSettingsDelegate = applyDrillAudioMixerSettings;
const trackScheduledSource = trackDrillScheduledSource;
const clearScheduledDisplays = clearDrillScheduledDisplays;
const stopScheduledAudio = stopDrillScheduledAudio;
const stopActiveChordVoices = stopDrillActiveChordVoices;
const initAudio = initDrillAudioPlayback;
const initMixerNodes = initDrillMixerNodes;
const getMixerDestination = getDrillMixerDestination;
const preloadSamples = preloadAllDrillSamples;
const loadSample = loadDrillAudioSample;
const loadPianoSample = loadDrillPianoSample;
const loadPianoSampleList = loadDrillPianoSampleList;
const loadFileSample = loadDrillFileSample;
const fetchArrayBufferFromUrl = fetchDrillSampleArrayBuffer;
const loadBufferFromUrl = loadDrillBufferFromUrl;

const CHORD_ANTICIPATION = 0.25; // seconds — strings start before the beat
const playSample = playDrillSample;
const playNote = playDrillNote;
const PIANO_COMP_DURATION_RATIO = 0.4;
const PIANO_COMP_MIN_DURATION = 0.12;
const PIANO_COMP_MAX_DURATION = 0.24;
const PIANO_VOLUME_MULTIPLIER = 0.27;

function getNextDifferentChord(...args) {
  return getNextDifferentDrillChord(...args);
}

function getVoicingAtIndex(...args) {
  return getDrillVoicingAtIndex(...args);
}

function getPreparedNextProgression(...args) {
  return getDrillPreparedNextProgression(...args);
}

const compingEngine = createDrillCompingEngineRootAppAssembly({
  constants: {
    AUTOMATION_CURVE_STEPS,
    CHORD_ANTICIPATION,
    CHORD_FADE_DUR,
    CHORD_VOLUME_MULTIPLIER,
    NOTE_FADEOUT,
    PIANO_COMP_DURATION_RATIO,
    PIANO_COMP_MAX_DURATION,
    PIANO_COMP_MIN_DURATION,
    PIANO_VOLUME_MULTIPLIER,
    PORTAMENTO_ALWAYS_ON,
    STRING_LEGATO_FADE_TIME,
    STRING_LEGATO_GLIDE_TIME,
    STRING_LEGATO_HOLD_TIME,
    STRING_LEGATO_MAX_DISTANCE,
    STRING_LEGATO_PRE_DIP_RATIO,
    STRING_LEGATO_PRE_DIP_TIME,
  },
  helpers: {
    getAudioContext: () => audioCtx,
    getPreparedNextProgression,
    getPianoVoicingMode,
    getSecondsPerBeat,
    getSwingRatio,
    getVoicingAtIndex,
    playSample,
  },
});

const playClick = playDrillClick;
const playDrumSample = playDrillDrumSample;
const playHiHat = playDrillHiHat;
const getNextRideSampleName = getNextDrillRideSampleName;
const playRide = playDrillRide;
const scheduleDrumsForBeat = scheduleDrillDrumsForBeat;

// ---- Voicing Computation ----
const {
  classifyQuality: classifySharedVoicingQuality,
  getPlayedChordQuality: getSharedPlayedChordQuality,
  createVoicingSlot: createSharedVoicingSlot,
  buildVoicingPlanForSlots: buildSharedVoicingPlanForSlots,
  buildLegacyVoicingPlan: buildSharedLegacyVoicingPlan,
  buildVoicingPlan: buildSharedVoicingPlan,
  getVoicing: getSharedVoicing,
  getVoicingPlanForProgression: getSharedVoicingPlanForProgression
} = createDrillVoicingRuntimeRootAppAssembly({
  qualityCategoryAliases: QUALITY_CATEGORY_ALIASES,
  dominantDefaultQualityMajor: DOMINANT_DEFAULT_QUALITY_MAJOR,
  dominantDefaultQualityMinor: DOMINANT_DEFAULT_QUALITY_MINOR,
  colorTones: COLOR_TONES,
  dominantColorTones: DOMINANT_COLOR_TONES,
  guideTones: GUIDE_TONES,
  dominantGuideTones: DOMINANT_GUIDE_TONES,
  intervalSemitones: INTERVAL_SEMITONES,
  violinLow: VIOLIN_LOW,
  violinHigh: VIOLIN_HIGH,
  celloLow: CELLO_LOW,
  guideToneLow: GUIDE_TONE_LOW,
  guideToneHigh: GUIDE_TONE_HIGH,
  applyContextualQualityRules,
  applyPriorityDominantResolutionRules,
  getCurrentPaddedChords: () => paddedChords,
  getCurrentKey: () => currentKey,
  getCurrentVoicingPlan: () => currentVoicingPlan,
  getNextPaddedChords: () => nextPaddedChords,
  getNextKeyValue: () => nextKeyValue,
  getNextVoicingPlan: () => nextVoicingPlan
});

function classifyQuality(...args) {
  return classifySharedVoicingQuality(...args);
}

function getPlayedChordQuality(...args) {
  return getSharedPlayedChordQuality(...args);
}

function getDisplayAliasQuality(quality, displayMode) {
  if (!quality) return quality;
  if (displayMode === HARMONY_DISPLAY_MODE_RICH) {
    return RICH_DISPLAY_QUALITY_ALIASES[quality] || quality;
  }
  return DEFAULT_DISPLAY_QUALITY_ALIASES[quality] || quality;
}

function getBassPreloadRange() {
  return { low: BASS_LOW, high: BASS_HIGH };
}

const walkingBassGenerator = createDrillWalkingBassRootAppAssembly({
  constants: {
    BASS_LOW,
    BASS_HIGH
  }
});

const {
  playbackPreparation: {
    getNextDifferentChord: getNextDifferentDrillChord,
    getVoicingAtIndex: getDrillVoicingAtIndex,
    getPreparedNextProgression: getDrillPreparedNextProgression,
    rebuildPreparedCompingPlans: rebuildDrillPreparedCompingPlans,
    ensureWalkingBassGenerator: ensureDrillWalkingBassGenerator,
    buildPreparedBassPlan: buildDrillPreparedBassPlan
  },
  playbackResourcesFacade: drillPlaybackResourcesFacade
} = createDrillPlaybackResourcesRootAppAssembly({
  harmony: {
    getPlayedChordQuality: getSharedPlayedChordQuality,
    getVoicingPlanForProgression: getSharedVoicingPlanForProgression,
    getVoicing: getSharedVoicing
  },
  progressionState: {
    getNextKeyValue: () => nextKeyValue,
    getNextPaddedChords: () => nextPaddedChords,
    getNextVoicingPlan: () => nextVoicingPlan,
    getNextCompingPlan: () => nextCompingPlan,
    setCurrentCompingPlan: (value) => { currentCompingPlan = value; },
    setNextCompingPlan: (value) => { nextCompingPlan = value; },
    getPaddedChords: () => paddedChords,
    getCurrentKey: () => currentKey,
    getCurrentVoicingPlan: () => currentVoicingPlan,
    getCurrentBassPlan: () => currentBassPlan,
    setCurrentBassPlan: (value) => { currentBassPlan = value; },
    getNextPaddedChordsForBass: () => nextPaddedChords,
    getNextKeyForBass: () => nextKeyValue
  },
  playbackSettings: {
    getIsMinorMode: () => dom.majorMinor.checked,
    getBeatsPerChord,
    getCompingStyle,
    getTempoBpm: () => Number(dom.tempoSlider?.value || 120),
    isWalkingBassEnabled,
    getSwingRatio
  },
  runtime: {
    compingEngine,
    walkingBassGenerator
  },
  audioFacade: drillAudioFacade
});

const {
  rebuildPreparedCompingPlans,
  ensureWalkingBassGenerator,
  buildPreparedBassPlan,
  preloadStartupSamples,
  preloadNearTermSamples,
  ensureNearTermSamplePreload,
  ensurePageSampleWarmup,
  ensureBackgroundSamplePreload
} = drillPlaybackResourcesFacade;

function buildChordVoicingBase(
  rootPitchClass,
  qualityCategory,
  colorToneIntervals,
  guideToneIntervals = null,
  bassPitchClass = rootPitchClass
) {
  let bassNote = bassPitchClass;
  while (bassNote < CELLO_LOW) bassNote += 12;

  // Guide tones: unique MIDI in C#3–C4 (49–60) for each pitch class
  const guideIntervals = resolveIntervalList(guideToneIntervals || GUIDE_TONES[qualityCategory]);
  const guideTones = guideIntervals.map(interval => {
    const pc = (rootPitchClass + interval) % 12;
    return pc === 0 ? 60 : 48 + pc;
  });

  const bassMatchesGuideIndex = guideTones.findIndex(midi => (midi % 12) === bassPitchClass);
  if (bassMatchesGuideIndex !== -1) {
    let rootGuideReplacement = rootPitchClass;
    while (rootGuideReplacement <= bassNote || rootGuideReplacement < GUIDE_TONE_LOW) rootGuideReplacement += 12;
    while (rootGuideReplacement > GUIDE_TONE_HIGH) rootGuideReplacement -= 12;
    if (rootGuideReplacement < GUIDE_TONE_LOW) rootGuideReplacement += 12;
    guideTones[bassMatchesGuideIndex] = rootGuideReplacement;
  }
  const uniqueGuideTones = [...new Set(guideTones)];

  // Top guide tone = highest MIDI among guide tones
  const topGuide = Math.max(...uniqueGuideTones);

  const colorPitchClasses = [...new Set(
    colorToneIntervals.map(interval => (rootPitchClass + interval) % 12)
  )];
  if (bassPitchClass !== rootPitchClass && bassMatchesGuideIndex === -1 && !colorPitchClasses.includes(rootPitchClass)) {
    colorPitchClasses.push(rootPitchClass);
  }

  return {
    bassNote,
    guideTones: uniqueGuideTones,
    colorPitchClasses,
    topGuide,
  };
}

function getCandidateMidisForPitchClass(pitchClass, minExclusive, low = VIOLIN_LOW, high = VIOLIN_HIGH) {
  const midis = [];
  let midi = pitchClass;
  while (midi <= minExclusive || midi < low) midi += 12;
  while (midi <= high) {
    midis.push(midi);
    midi += 12;
  }
  return midis;
}

function getGapFillCandidates(lowerNote, upperNote, colorPitchClasses, existingNotes) {
  const candidates = [];
  const seen = new Set();

  for (const pitchClass of colorPitchClasses) {
    let midi = pitchClass;
    while (midi <= lowerNote || midi < VIOLIN_LOW) midi += 12;
    while (midi < upperNote && midi <= VIOLIN_HIGH) {
      if (!existingNotes.has(midi) && !seen.has(midi)) {
        candidates.push(midi);
        seen.add(midi);
      }
      midi += 12;
    }
  }

  return candidates;
}

function pickBestGapFill(lowerNote, upperNote, candidates) {
  if (!candidates.length) return null;
  const midpoint = (lowerNote + upperNote) / 2;

  return candidates.slice().sort((left, right) => {
    const leftLargestGap = Math.max(left - lowerNote, upperNote - left);
    const rightLargestGap = Math.max(right - lowerNote, upperNote - right);
    if (leftLargestGap !== rightLargestGap) return leftLargestGap - rightLargestGap;

    const leftMidDistance = Math.abs(left - midpoint);
    const rightMidDistance = Math.abs(right - midpoint);
    if (leftMidDistance !== rightMidDistance) return leftMidDistance - rightMidDistance;

    return left - right;
  })[0];
}

function fillVoicingUpperGaps(guideTones, colorTones, colorPitchClasses) {
  const augmentedColorTones = [...colorTones];

  while (true) {
    const upperNotes = [...guideTones, ...augmentedColorTones].sort((a, b) => a - b);
    let widestGap = null;

    for (let i = 1; i < upperNotes.length; i++) {
      const lowerNote = upperNotes[i - 1];
      const upperNote = upperNotes[i];
      const gap = upperNote - lowerNote;
      if (gap > 12 && (!widestGap || gap > widestGap.gap)) {
        widestGap = { lowerNote, upperNote, gap };
      }
    }

    if (!widestGap) {
      return augmentedColorTones.sort((a, b) => a - b);
    }

    const existingNotes = new Set(upperNotes);
    const fillCandidates = getGapFillCandidates(
      widestGap.lowerNote,
      widestGap.upperNote,
      colorPitchClasses,
      existingNotes
    );
    const filler = pickBestGapFill(widestGap.lowerNote, widestGap.upperNote, fillCandidates);
    if (filler === null) {
      return null;
    }

    augmentedColorTones.push(filler);
  }
}

function enumerateChordVoicingCandidates(
  rootPitchClass,
  qualityCategory,
  colorToneIntervals,
  guideToneIntervals = null,
  bassPitchClass = rootPitchClass
) {
  const base = buildChordVoicingBase(
    rootPitchClass,
    qualityCategory,
    colorToneIntervals,
    guideToneIntervals,
    bassPitchClass
  );
  const { bassNote, guideTones, colorPitchClasses, topGuide } = base;
  if (colorPitchClasses.length === 0) {
    return [{ bassNote, guideTones, colorTones: [] }];
  }

  const colorToneOptions = colorPitchClasses.map(pc => getCandidateMidisForPitchClass(pc, topGuide));
  if (colorToneOptions.some(options => options.length === 0)) {
    return [];
  }

  const candidateMap = new Map();
  const current = new Array(colorToneOptions.length);

  function visitOption(optionIndex) {
    if (optionIndex >= colorToneOptions.length) {
      const colorTones = [...current].sort((a, b) => a - b);
      const filledColorTones = fillVoicingUpperGaps(guideTones, colorTones, colorPitchClasses);
      if (!filledColorTones) {
        return;
      }
      const key = filledColorTones.join(',');
      if (!candidateMap.has(key)) {
        candidateMap.set(key, { bassNote, guideTones, colorTones: filledColorTones });
      }
      return;
    }

    for (const midi of colorToneOptions[optionIndex]) {
      current[optionIndex] = midi;
      visitOption(optionIndex + 1);
    }
  }

  visitOption(0);

  return [...candidateMap.values()].sort((a, b) => {
    const topDiff = getVoicingTopNote(a) - getVoicingTopNote(b);
    if (topDiff !== 0) return topDiff;
    const sumDiff = sumNotes(a.colorTones) - sumNotes(b.colorTones);
    if (sumDiff !== 0) return sumDiff;
    return a.colorTones.join(',').localeCompare(b.colorTones.join(','));
  });
}

function computeChordVoicing(
  rootPitchClass,
  qualityCategory,
  colorToneIntervals,
  guideToneIntervals = null,
  bassPitchClass = rootPitchClass
) {
  return enumerateChordVoicingCandidates(
    rootPitchClass,
    qualityCategory,
    colorToneIntervals,
    guideToneIntervals,
    bassPitchClass
  )[0] || null;
}

function sumNotes(notes) {
  return notes.reduce((total, note) => total + note, 0);
}

function getVoicingUpperSpan(voicing) {
  const upperNotes = [...(voicing?.guideTones || []), ...(voicing?.colorTones || [])].sort((a, b) => a - b);
  if (upperNotes.length < 2) return 0;
  return upperNotes[upperNotes.length - 1] - upperNotes[0];
}

function getVoicingTopNote(voicing) {
  if (!voicing?.colorTones?.length) {
    return Math.max(voicing?.bassNote || -Infinity, ...(voicing?.guideTones || []));
  }
  return voicing.colorTones[voicing.colorTones.length - 1];
}

const VOICING_RANDOMIZATION_CHANCE = 0.3;
const VOICING_BOUNDARY_RANDOMIZATION_CHANCE = 0.3;
const VOICING_RANDOM_TOP_SLACK = 1;
const VOICING_RANDOM_BOUNDARY_SLACK = 2;
const VOICING_RANDOM_CENTER_SLACK = 5;
const VOICING_RANDOM_SUM_SLACK = 10;
const VOICING_RANDOM_INNER_SLACK = 6;

function isVoiceLeadingV2Enabled() {
  return true;
}

function getVoicingInnerMovement(fromVoicing, toVoicing) {
  if (!fromVoicing?.colorTones?.length || !toVoicing?.colorTones?.length) return 0;

  const fromNotes = [...fromVoicing.colorTones].sort((a, b) => a - b);
  const toNotes = [...toVoicing.colorTones].sort((a, b) => a - b);
  const limit = Math.min(fromNotes.length, toNotes.length);
  let movement = 0;

  for (let i = 0; i < limit; i++) {
    movement += Math.abs(toNotes[i] - fromNotes[i]);
  }

  if (fromNotes.length === toNotes.length) return movement;

  const longerNotes = fromNotes.length > toNotes.length ? fromNotes : toNotes;
  const shorterNotes = fromNotes.length > toNotes.length ? toNotes : fromNotes;
  const fallbackNote = shorterNotes.length > 0
    ? shorterNotes[shorterNotes.length - 1]
    : getVoicingTopNote(fromNotes.length > toNotes.length ? toVoicing : fromVoicing);

  for (let i = limit; i < longerNotes.length; i++) {
    movement += Math.abs(longerNotes[i] - fallbackNote);
  }

  return movement;
}

function createVoicingSlot(chord, key, isMinor, segment = 'current', nextChord = null) {
  return createSharedVoicingSlot(chord, key, isMinor, segment, nextChord);
}

function buildVoicingPlanForSlots(slots) {
  return buildSharedVoicingPlanForSlots(slots);
}

function compareVoicingPathScores(left, right) {
  if (!left) return 1;
  if (!right) return -1;
  if (left.totalTopMovement !== right.totalTopMovement) {
    return left.totalTopMovement - right.totalTopMovement;
  }
  if (left.totalBoundaryCenterDistance !== right.totalBoundaryCenterDistance) {
    return left.totalBoundaryCenterDistance - right.totalBoundaryCenterDistance;
  }
  if (left.totalBoundaryTopMovement !== right.totalBoundaryTopMovement) {
    return left.totalBoundaryTopMovement - right.totalBoundaryTopMovement;
  }
  if (left.totalUpperSpan !== right.totalUpperSpan) {
    return right.totalUpperSpan - left.totalUpperSpan;
  }
  if (left.totalTopSum !== right.totalTopSum) {
    return left.totalTopSum - right.totalTopSum;
  }
  if (left.totalInnerMovement !== right.totalInnerMovement) {
    return left.totalInnerMovement - right.totalInnerMovement;
  }
  return left.signature.localeCompare(right.signature);
}

function compareLegacyVoicingPathScores(left, right) {
  if (!left) return 1;
  if (!right) return -1;
  if (left.totalTopMovement !== right.totalTopMovement) {
    return left.totalTopMovement - right.totalTopMovement;
  }
  if (left.totalTopSum !== right.totalTopSum) {
    return left.totalTopSum - right.totalTopSum;
  }
  return left.signature.localeCompare(right.signature);
}

function isVoicingScoreNearBest(score, bestScore) {
  if (!score || !bestScore) return false;
  return score.totalTopMovement <= bestScore.totalTopMovement + VOICING_RANDOM_TOP_SLACK
    && score.totalBoundaryCenterDistance <= bestScore.totalBoundaryCenterDistance + VOICING_RANDOM_CENTER_SLACK
    && score.totalBoundaryTopMovement <= bestScore.totalBoundaryTopMovement + VOICING_RANDOM_BOUNDARY_SLACK
    && score.totalTopSum <= bestScore.totalTopSum + VOICING_RANDOM_SUM_SLACK
    && score.totalInnerMovement <= bestScore.totalInnerMovement + VOICING_RANDOM_INNER_SLACK;
}

function getVoicingScorePenalty(score, bestScore) {
  if (!score || !bestScore) return Infinity;
  return (score.totalTopMovement - bestScore.totalTopMovement) * 6
    + (score.totalBoundaryCenterDistance - bestScore.totalBoundaryCenterDistance) * 2
    + (score.totalBoundaryTopMovement - bestScore.totalBoundaryTopMovement) * 4
    + Math.max(0, bestScore.totalUpperSpan - score.totalUpperSpan) * 0.75
    + (score.totalTopSum - bestScore.totalTopSum) * 0.25
    + (score.totalInnerMovement - bestScore.totalInnerMovement) * 0.5;
}

function pickWeightedRandomScore(scores, bestScore) {
  let totalWeight = 0;
  const weightedScores = scores.map(score => {
    const penalty = Math.max(0, getVoicingScorePenalty(score, bestScore));
    const weight = 1 / (1 + penalty);
    totalWeight += weight;
    return { score, weight };
  });

  if (totalWeight <= 0) return bestScore;

  let cursor = Math.random() * totalWeight;
  for (const entry of weightedScores) {
    cursor -= entry.weight;
    if (cursor <= 0) return entry.score;
  }

  return weightedScores[weightedScores.length - 1]?.score || bestScore;
}

function pickVoicingScore(scores, randomizationChance = VOICING_RANDOMIZATION_CHANCE) {
  const availableScores = scores.filter(Boolean);
  if (availableScores.length === 0) return null;

  let bestScore = availableScores[0];
  for (let i = 1; i < availableScores.length; i++) {
    if (compareVoicingPathScores(availableScores[i], bestScore) < 0) {
      bestScore = availableScores[i];
    }
  }

  const shortlist = availableScores.filter(score => isVoicingScoreNearBest(score, bestScore));
  if (shortlist.length <= 1 || Math.random() >= randomizationChance) {
    return bestScore;
  }

  return pickWeightedRandomScore(shortlist, bestScore);
}

function buildLegacyVoicingPlan(chords, key, isMinor) {
  return buildSharedLegacyVoicingPlan(chords, key, isMinor);
}

function buildVoicingPlan(chords, key, isMinor) {
  return buildSharedVoicingPlan(chords, key, isMinor);
}

function getVoicing(key, chord, isMinor, nextChord = null) {
  return getSharedVoicing(key, chord, isMinor, nextChord);
}

function getVoicingPlanForProgression(chords, key, isMinor) {
  return getSharedVoicingPlanForProgression(chords, key, isMinor);
}

// ---- Key Pool ----

let keyPool = [];
let enabledKeys = [true,true,true,true,true,true,true,true,true,true,true,true];

const {
  shuffleArray,
  getEffectiveKeyPool,
  nextKey
} = createDrillRuntimeStateRootAppAssembly({
  keyPoolState: {
    getEnabledKeys: () => enabledKeys,
    getKeyPool: () => keyPool,
    setKeyPool: (value) => { keyPool = value; }
  }
}).keyPoolRuntime;

// ---- Display helpers ----

function getDisplayTranspositionSemitones() {
  return Number(dom.transpositionSelect?.value || 0);
}

function transposeDisplayPitchClass(pitchClass) {
  return (pitchClass + getDisplayTranspositionSemitones() + 12) % 12;
}

function getDisplayedQuality(chord, isMinor, nextChord = null) {
  const playedQuality = getPlayedChordQuality(chord, isMinor, nextChord);
  return getDisplayAliasQuality(
    playedQuality,
    normalizeHarmonyDisplayMode(dom.harmonyDisplayMode?.value)
  );
}

function normalizeDisplayedRootName(rootName) {
  const enharmonicMap = {
    'F♭': 'E',
    'E♯': 'F',
    'C♭': 'B',
    'B♯': 'C',
    Fb: 'E',
    'E#': 'F',
    Cb: 'B',
    'B#': 'C'
  };
  return enharmonicMap[rootName] || rootName;
}

const {
  harmonyDisplayHelpers: {
    keyName,
    keyNameHtml,
    renderPickerKeyHtml,
    degreeRootName,
    chordSymbol,
    chordSymbolHtml
  },
  previewTimingHelpers: {
    getRemainingBeatsUntilNextProgression,
    shouldShowNextPreview
  },
  harmonyLayoutHelpers: {
    applyDisplaySideLayout,
    fitHarmonyDisplay
  }
} = createDrillDisplayRuntimeRootAppAssembly({
  harmonyDisplay: {
    keyNamesMajor: KEY_NAMES_MAJOR,
    keyNamesMinor: KEY_NAMES_MINOR,
    letters: LETTERS,
    naturalSemitones: NATURAL_SEMITONES,
    degreeIndices: DEGREE_INDICES,
    escapeHtml,
    renderChordSymbolHtml,
    getDisplayTranspositionSemitones,
    isOneChordModeActive,
    isMinorMode: () => dom.majorMinor.checked,
    getDisplayedQuality,
    normalizeDisplayedRootName,
    normalizeHarmonyDisplayMode,
    getUseMajorTriangleSymbol: () => dom.useMajorTriangleSymbol?.checked,
    getUseHalfDiminishedSymbol: () => dom.useHalfDiminishedSymbol?.checked,
    getUseDiminishedSymbol: () => dom.useDiminishedSymbol?.checked
  },
  previewTiming: {
    getChordsPerBar,
    getSecondsPerBeat,
    getNextPreviewLeadSeconds,
    getCurrentChordIdx: () => currentChordIdx,
    getCurrentBeat: () => currentBeat,
    getChordCount: () => paddedChords.length
  },
  harmonyLayout: {
    requestAnimationFrameImpl: (callback) => window.requestAnimationFrame(callback),
    getDisplayElement: () => document.getElementById('display'),
    getChordDisplayElement: () => dom.chordDisplay,
    getNextChordDisplayElement: () => dom.nextChordDisplay,
    getBaseChordDisplaySize,
    isCurrentHarmonyHidden
  }
});

function isCurrentHarmonyHidden() {
  return dom.hideCurrentHarmony?.checked === true;
}

function getBaseChordDisplaySize() {
  const mode = normalizeDisplayMode(dom.displayMode?.value);
  const isMobile = window.matchMedia('(max-width: 720px)').matches;

  if (mode === DISPLAY_MODE_CHORDS_ONLY) {
    return isMobile ? 3.5 : 6;
  }
  return isMobile ? 3.0 : 5;
}

const {
  applyBeatIndicatorVisibility,
  applyCurrentHarmonyVisibility,
  applyDisplayMode
} = createDrillDisplayControlsRootAppFacade({
  getBeatIndicator: () => dom.beatIndicator,
  getShowBeatIndicatorEnabled: () => dom.showBeatIndicator?.checked !== false,
  getDisplayElement: () => document.getElementById('display'),
  getCurrentHarmonyHidden: () => dom.hideCurrentHarmony?.checked === true,
  getDisplayMode: () => normalizeDisplayMode(dom.displayMode?.value),
  applyDisplaySideLayout,
  fitHarmonyDisplay
});

const {
  showNextCol,
  hideNextCol,
  setDisplayPlaceholderVisible,
  setDisplayPlaceholderMessage,
  updateBeatDots,
  clearBeatDots
} = createDrillDisplayShellRootAppFacade({
  dom,
  fitHarmonyDisplay,
  defaultDisplayPlaceholderMessage: DEFAULT_DISPLAY_PLACEHOLDER_MESSAGE
});

setDisplayPlaceholderMessage();

const drillDisplayRender = createDrillDisplayRenderRootAppFacade({
  dom,
  state: {
    getIsPlaying: () => isPlaying,
    getIsIntro: () => isIntro,
    getCurrentKey: () => currentKey,
    getNextKeyValue: () => nextKeyValue,
    getCurrentChordIdx: () => currentChordIdx,
    getPaddedChords: () => paddedChords,
    getNextRawChords: () => nextRawChords
  },
  constants: {
    keyNamesMajor: KEY_NAMES_MAJOR
  },
  helpers: {
    transposeDisplayPitchClass,
    getUpdateKeyCheckboxVisualState: () => updateKeyCheckboxVisualState,
    getSyncSelectedKeysSummary: () => syncSelectedKeysSummary,
    getRemainingBeatsUntilNextProgression,
    shouldShowNextPreview,
    keyNameHtml,
    chordSymbolHtml,
    showNextCol,
    hideNextCol,
    applyDisplaySideLayout,
    applyCurrentHarmonyVisibility,
    fitHarmonyDisplay
  }
});

// ---- Scheduler / Playback State ----

let isPlaying = false;
let isPaused = false;
let schedulerTimer = null;
let nextBeatTime = 0;   // audioCtx time of next beat
let currentBeat = 0;    // 0–3 within current measure
let currentChordIdx = 0; // index in padded progression
let isIntro = true;      // true during count-in measure
let currentKey = 0;
let nextKeyValue = null;
let currentKeyRepetition = 0;
let paddedChords = [];
let currentBassPlan = [];
let currentVoicingPlan = [];
let currentCompingPlan = null;
let nextPaddedChords = [];
let nextVoicingPlan = [];
let nextCompingPlan = null;
let loopVoicingTemplate = null; // saved voicing plan from first loop iteration
let lastPlayedChordIdx = -1; // track last chord to avoid re-triggering sustained chords
let nextPreviewLeadValue = DEFAULT_NEXT_PREVIEW_LEAD_BARS;
let nextPreviewLeadUnit = NEXT_PREVIEW_UNIT_BARS;
const CUSTOM_PATTERN_OPTION_VALUE = '__custom__';

function getSecondsPerBeat() {
  return 60 / Number(dom.tempoSlider.value);
}

function getSwingRatio() {
  const tempo = Number(dom.tempoSlider?.value || 0);
  if (!Number.isFinite(tempo) || tempo <= 150) return DEFAULT_SWING_RATIO;
  if (tempo >= 300) return 0.5;
  const progress = (tempo - 150) / 150;
  return DEFAULT_SWING_RATIO + ((0.5 - DEFAULT_SWING_RATIO) * progress);
}

let getNextPreviewLeadSecondsImpl = () => 0;

function getNextPreviewLeadSeconds(...args) {
  return getNextPreviewLeadSecondsImpl(...args);
}

const {
  normalizeNextPreviewUnit,
  normalizeNextPreviewLeadValue,
  formatPreviewNumber,
  barsToSeconds,
  secondsToBars,
  getNextPreviewInputUnit,
  setNextPreviewInputUnit,
  getNextPreviewLeadSeconds: nextPreviewGetNextPreviewLeadSeconds,
  getNextPreviewLeadBars,
  formatBarsLabel,
  syncNextPreviewControlDisplay,
  commitNextPreviewValueFromInput,
  convertNextPreviewValueToUnit
} = createDrillNextPreviewRootAppFacade({
  dom,
  state: {
    getNextPreviewLeadUnit: () => nextPreviewLeadUnit,
    setNextPreviewLeadUnit: (value) => { nextPreviewLeadUnit = value; },
    getNextPreviewLeadValue: () => nextPreviewLeadValue,
    setNextPreviewLeadValue: (value) => { nextPreviewLeadValue = value; }
  },
  constants: {
    NEXT_PREVIEW_UNIT_BARS,
    NEXT_PREVIEW_UNIT_SECONDS,
    DEFAULT_NEXT_PREVIEW_LEAD_BARS
  },
  helpers: {
    getSecondsPerBeat,
    refreshDisplayedHarmony,
    formatNumber: (value, maximumFractionDigits = 2) => {
      const rounded = Math.round(Number(value || 0) * 100) / 100;
      return new Intl.NumberFormat('en-US', {
        maximumFractionDigits,
        minimumFractionDigits: 0
      }).format(rounded);
    }
  }
});

getNextPreviewLeadSecondsImpl = nextPreviewGetNextPreviewLeadSeconds;

function toAnalyticsToken(value, fallback = 'unknown') {
  const normalized = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return normalized || fallback;
}

const {
  getEnabledKeyCount,
  persistKeySelectionPreset,
  syncSelectedKeysSummary,
  restoreAllKeysIfNoneSelectedOnClose: keySelectionRestoreAllKeysIfNoneSelectedOnClose,
  isBlackDisplayPitchClass,
  updateKeyCheckboxVisualState,
  syncKeyCheckboxStates,
  applyEnabledKeys,
  saveCurrentKeySelectionPreset,
  loadKeySelectionPreset
} = createDrillKeySelectionRootAppFacade({
  dom,
  state: {
    getEnabledKeys: () => enabledKeys,
    setEnabledKeys: (value) => { enabledKeys = value; },
    setKeyPool: (value) => { keyPool = value; },
    getSavedKeySelectionPreset: () => savedKeySelectionPreset,
    setSavedKeySelectionPreset: (value) => { savedKeySelectionPreset = value; }
  },
  constants: {
    PIANO_BLACK_KEY_COLUMNS,
    PIANO_WHITE_KEY_COLUMNS
  },
  helpers: {
    getDisplayTranspositionSemitones,
    keyLabelForPicker,
    renderAccidentalTextHtml: renderPickerKeyHtml,
    saveStoredKeySelectionPreset,
    saveSettings,
    trackEvent,
    alert: (message) => window.alert(message)
  }
});

restoreAllKeysIfNoneSelectedOnCloseImpl = keySelectionRestoreAllKeysIfNoneSelectedOnClose;

const {
  initialize: initializeKeyPicker,
  buildKeyCheckboxes,
  setAllKeysEnabled,
  invertKeysEnabled
} = createDrillKeyPickerRootAppAssembly({
  dom,
  state: {
    getEnabledKeys: () => enabledKeys,
    setEnabledKeys: (value) => { enabledKeys = value; },
    setKeyPool: (value) => { keyPool = value; }
  },
  helpers: {
    setKeyPickerOpen,
    stopPlaybackIfRunning,
    restoreAllKeysIfNoneSelectedOnClose,
    updateKeyCheckboxVisualState,
    syncSelectedKeysSummary,
    saveSettings,
    trackEvent,
    getEnabledKeyCount,
    applyEnabledKeys
  }
});

initializeKeyPicker();

const {
  getCheckedInputValue,
  setWelcomeOverlayVisible,
  getSelectedWelcomeRecommendation,
  updateWelcomePanelVisibility,
  updateWelcomeSummary,
  markWelcomeOnboardingCompleted,
  syncWelcomeShowNextTimePreference,
  applyWelcomeRecommendation,
  skipWelcomeOverlay,
  maybeShowWelcomeOverlay
} = createDrillWelcomeRootAppFacade({
  dom,
  state: {
    getHasCompletedWelcomeOnboarding: () => hasCompletedWelcomeOnboarding,
    setHasCompletedWelcomeOnboarding: (value) => { hasCompletedWelcomeOnboarding = value; },
    getShouldShowWelcomeNextTime: () => shouldShowWelcomeNextTime,
    setShouldShowWelcomeNextTime: (value) => { shouldShowWelcomeNextTime = value; },
    getWelcomeStandards: () => welcomeStandards,
    getProgressions: () => progressions,
    setSuppressPatternSelectChange: (value) => { suppressPatternSelectChange = value; },
    setProgressionSelectionBeforeEditing: (value) => { progressionSelectionBeforeEditing = value; },
    setIsCreatingProgression: (value) => { isCreatingProgression = value; },
    setLastPatternSelectValue: (value) => { lastPatternSelectValue = value; },
    setNextPreviewLeadValue: (value) => { nextPreviewLeadValue = value; },
    getDefaultEnabledKeys: () => new Array(12).fill(true)
  },
  constants: {
    CUSTOM_PATTERN_OPTION_VALUE,
    DEFAULT_CHORDS_PER_BAR,
    DRUM_MODE_FULL_SWING,
    IS_EMBEDDED_DRILL_MODE,
    NEXT_PREVIEW_UNIT_BARS,
    PATTERN_MODE_BOTH,
    WELCOME_GOAL_ONE_CHORD,
    WELCOME_GOAL_PROGRESSION,
    WELCOME_GOAL_STANDARD,
    WELCOME_ONE_CHORDS,
    WELCOME_PROGRESSIONS,
    WELCOME_STANDARDS_FALLBACK
  },
  helpers: {
    createDefaultAppSettings,
    normalizeRepetitionsPerKey,
    normalizeChordsPerBar,
    normalizeCompingStyle,
    normalizeDisplayMode,
    clearProgressionEditingState,
    closeProgressionManager,
    setPatternSelectValue,
    getSelectedProgressionName,
    getSelectedProgressionPattern,
    setEditorPatternMode,
    getSelectedProgressionMode,
    syncPatternSelectionFromInput,
    syncDoubleTimeToggle,
    applyEnabledKeys,
    syncCustomPatternUI,
    normalizeChordsPerBarForCurrentPattern,
    syncProgressionManagerState,
    applyPatternModeAvailability,
    validateCustomPattern,
    syncPatternPreview,
    syncNextPreviewControlDisplay,
    applyDisplayMode,
    applyBeatIndicatorVisibility,
    applyCurrentHarmonyVisibility,
    applyMixerSettings,
    updateKeyPickerLabels,
    refreshDisplayedHarmony,
    saveSettings,
    start,
    trackEvent,
    setNextPreviewInputUnit,
    normalizeNextPreviewLeadValue
  }
});

const {
  getTempoBucket,
  getSessionDurationBucket,
  ensureSessionStarted,
  registerSessionAction,
  trackSessionDuration,
  getProgressionAnalyticsProps,
  getPlaybackAnalyticsProps,
  trackProgressionEvent,
  trackProgressionOccurrence
} = createDrillRuntimeStateRootAppAssembly({
  sessionAnalyticsDom: dom,
  sessionAnalyticsState: {
      getSessionStartedAt: () => sessionStartedAt,
      getSessionStartTracked: () => sessionStartTracked,
      setSessionStartTracked: (value) => { sessionStartTracked = value; },
      getSessionEngagedTracked: () => sessionEngagedTracked,
      setSessionEngagedTracked: (value) => { sessionEngagedTracked = value; },
      getSessionDurationTracked: () => sessionDurationTracked,
      setSessionDurationTracked: (value) => { sessionDurationTracked = value; },
      getSessionActionCount: () => sessionActionCount,
      setSessionActionCount: (value) => { sessionActionCount = value; }
    },
  sessionAnalyticsHelpers: {
      trackEvent,
      getCurrentPatternString: (...args) => getCurrentPatternString(...args),
      parseOneChordSpec,
      getCurrentPatternMode: (...args) => getCurrentPatternMode(...args),
      getPatternModeLabel: (...args) => getPatternModeLabel(...args),
      hasSelectedProgression: (...args) => hasSelectedProgression(...args),
      toAnalyticsToken: (...args) => toAnalyticsToken(...args),
      analyzePattern,
      matchesOneChordQualitySet,
      getChordsPerBar,
      getRepetitionsPerKey,
      getCompingStyle,
      normalizeDisplayMode,
      normalizeHarmonyDisplayMode,
      getEnabledKeyCount
    },
  sessionAnalyticsConstants: {
      oneChordDefaultQualities: ONE_CHORD_DEFAULT_QUALITIES,
      oneChordDominantQualities: ONE_CHORD_DOMINANT_QUALITIES
    }
}).sessionAnalytics;


const {
  applyPatternModeAvailability: progressionApplyPatternModeAvailability,
  cancelProgressionEdit,
  clearAllProgressions,
  clearProgressionEditingState: progressionClearProgressionEditingState,
  clearProgressionManagerDropMarkers,
  closeProgressionManager: progressionCloseProgressionManager,
  deleteProgressionByName,
  deleteProgressionInline,
  deleteSelectedProgression,
  duplicateProgression,
  editSelectedProgression,
  getCurrentPatternMode,
  getCurrentPatternName,
  getCurrentPatternString,
  getPatternModeLabel,
  getProgressionEntry,
  getProgressionLabel,
  getProgressionNames,
  getSelectedProgressionMode: progressionGetSelectedProgressionMode,
  getSelectedProgressionName: progressionGetSelectedProgressionName,
  getSelectedProgressionPattern: progressionGetSelectedProgressionPattern,
  hasSelectedProgression,
  hasStandaloneCustomDraft,
  isCustomPatternSelected,
  isEditingProgression: isEditingPreset,
  markDefaultProgressionsPromptHandled,
  mergeUpdatedDefaultProgressions,
  promptForUpdatedDefaultProgressions,
  refreshProgressionUIAfterChange,
  renderProgressionManagerList,
  renderProgressionOptions,
  replaceProgressionsWithDefaultList,
  rememberStandaloneCustomDraft,
  restoreDefaultProgressions,
  saveCurrentProgression,
  resetStandaloneCustomDraft,
  setEditorPatternMode: progressionSetEditorPatternMode,
  setPatternSelectValue: progressionSetPatternSelectValue,
  setProgressionFeedback,
  setProgressionUpdateModalVisibility,
  startNewProgression,
  syncCustomPatternUI: progressionSyncCustomPatternUI,
  syncPatternPreview: progressionSyncPatternPreview,
  syncPatternSelectionFromInput: progressionSyncPatternSelectionFromInput,
  syncProgressionManagerPanel,
  syncProgressionManagerState: progressionSyncProgressionManagerState,
  toggleProgressionManager,
  undoProgressionDeletion
} = createDrillProgressionRootAppAssembly({
  dom,
  editorState: {
    getProgressions: () => progressions,
    setProgressions: (value) => { progressions = value; },
    getEditingProgressionName: () => editingProgressionName,
    setEditingProgressionName: (value) => { editingProgressionName = value; },
    getEditingProgressionSnapshot: () => editingProgressionSnapshot,
    setEditingProgressionSnapshot: (value) => { editingProgressionSnapshot = value; },
    getProgressionSelectionBeforeEditing: () => progressionSelectionBeforeEditing,
    setProgressionSelectionBeforeEditing: (value) => { progressionSelectionBeforeEditing = value; },
    getIsCreatingProgression: () => isCreatingProgression,
    setIsCreatingProgression: (value) => { isCreatingProgression = value; },
    getIsManagingProgressions: () => isManagingPresets,
    setIsManagingProgressions: (value) => { isManagingPresets = value; },
    getLastStandaloneCustomName: () => lastStandaloneCustomName,
    setLastStandaloneCustomName: (value) => { lastStandaloneCustomName = value; },
    getLastStandaloneCustomPattern: () => lastStandaloneCustomPattern,
    setLastStandaloneCustomPattern: (value) => { lastStandaloneCustomPattern = value; },
    getLastStandaloneCustomMode: () => lastStandaloneCustomMode,
    setLastStandaloneCustomMode: (value) => { lastStandaloneCustomMode = value; },
    getSuppressPatternSelectChange: () => suppressPatternSelectChange,
    setSuppressPatternSelectChange: (value) => { suppressPatternSelectChange = value; },
    getKeyPool: () => keyPool,
    setKeyPool: (value) => { keyPool = value; }
  },
  editorConstants: {
    CUSTOM_PATTERN_OPTION_VALUE,
    PATTERN_MODE_BOTH,
    PATTERN_MODE_MAJOR,
    PATTERN_MODE_MINOR,
    ONE_CHORD_DEFAULT_QUALITIES,
    ONE_CHORD_DOMINANT_QUALITIES
  },
  editorHelpers: {
    analyzePattern,
    chordSymbol,
    getDisplayTranspositionSemitones,
    getSelectedChordsPerBar,
    isOneChordModeActive,
    matchesOneChordQualitySet,
    normalizePatternMode,
    normalizePatternString,
    normalizePresetName,
    parseOneChordSpec,
    refreshDisplayedHarmony,
    updateKeyPickerLabels
  },
  managerState: {
    getProgressions: () => progressions,
    setProgressions: (value) => { progressions = value; },
    getIsManagingProgressions: () => isManagingPresets,
    setIsManagingProgressions: (value) => { isManagingPresets = value; },
    getSuppressListRender: () => suppressListRender,
    setSuppressListRender: (value) => { suppressListRender = value; },
    getDraggedProgressionName: () => draggedPresetName,
    setDraggedProgressionName: (value) => { draggedPresetName = value; },
    getPendingProgressionDeletion: () => pendingPresetDeletion,
    setPendingProgressionDeletion: (value) => { pendingPresetDeletion = value; },
    getEditingProgressionName: () => editingProgressionName,
    setEditingProgressionName: (value) => { editingProgressionName = value; },
    getEditingProgressionSnapshot: () => editingProgressionSnapshot,
    setEditingProgressionSnapshot: (value) => { editingProgressionSnapshot = value; },
    getProgressionSelectionBeforeEditing: () => progressionSelectionBeforeEditing,
    setProgressionSelectionBeforeEditing: (value) => { progressionSelectionBeforeEditing = value; },
    getIsCreatingProgression: () => isCreatingProgression,
    setIsCreatingProgression: (value) => { isCreatingProgression = value; },
    getAppliedDefaultProgressionsFingerprint: () => appliedDefaultProgressionsFingerprint,
    setAppliedDefaultProgressionsFingerprint: (value) => { appliedDefaultProgressionsFingerprint = value; },
    getAcknowledgedDefaultProgressionsVersion: () => acknowledgedDefaultProgressionsVersion,
    setAcknowledgedDefaultProgressionsVersion: (value) => { acknowledgedDefaultProgressionsVersion = value; },
    getShouldPromptForDefaultProgressionsUpdate: () => shouldPromptForDefaultProgressionsUpdate,
    setShouldPromptForDefaultProgressionsUpdate: (value) => { shouldPromptForDefaultProgressionsUpdate = value; },
    getDefaultProgressionsVersion: () => defaultProgressionsVersion,
    setDefaultProgressionsVersion: (value) => { defaultProgressionsVersion = value; },
    getDefaultProgressions: () => DEFAULT_PROGRESSIONS,
    setDefaultProgressions: (value) => { DEFAULT_PROGRESSIONS = value; },
    getLastStandaloneCustomName: () => lastStandaloneCustomName,
    setLastStandaloneCustomName: (value) => { lastStandaloneCustomName = value; },
    getLastStandaloneCustomPattern: () => lastStandaloneCustomPattern,
    setLastStandaloneCustomPattern: (value) => { lastStandaloneCustomPattern = value; },
    getLastStandaloneCustomMode: () => lastStandaloneCustomMode,
    setLastStandaloneCustomMode: (value) => { lastStandaloneCustomMode = value; },
    getLastPatternSelectValue: () => lastPatternSelectValue,
    setLastPatternSelectValue: (value) => { lastPatternSelectValue = value; }
  },
  managerConstants: {
    CUSTOM_PATTERN_OPTION_VALUE
  },
  managerHelpers: {
    createProgressionEntry,
    getDefaultProgressionsFingerprint,
    normalizePatternMode,
    normalizePatternString,
    normalizeProgressionEntry,
    normalizeProgressionsMap,
    saveSettings,
    trackEvent,
    trackProgressionEvent,
    validateCustomPattern: () => validateCustomPattern()
  },
  controlsState: {
    getSuppressPatternSelectChange: () => suppressPatternSelectChange,
    setSuppressPatternSelectChange: (value) => { suppressPatternSelectChange = value; },
    getLastPatternSelectValue: () => lastPatternSelectValue,
    setLastPatternSelectValue: (value) => { lastPatternSelectValue = value; },
    getKeyPool: () => keyPool,
    setKeyPool: (value) => { keyPool = value; }
  },
  controlsConstants: {
    PATTERN_MODE_BOTH,
    PATTERN_MODE_MAJOR,
    PATTERN_MODE_MINOR
  },
  controlsHelpers: {
    clearOneChordCycleState,
    ensureSessionStarted,
    getProgressionAnalyticsProps,
    isOneChordModeActive,
    normalizePatternString,
    normalizePresetName,
    normalizePresetNameForInput,
    refreshDisplayedHarmony,
    registerSessionAction,
    stopPlaybackIfRunning,
    toAnalyticsToken,
    trackEvent,
    trackProgressionEvent,
    updateKeyPickerLabels,
    validateCustomPattern: () => validateCustomPattern()
  }
});

applyPatternModeAvailabilityImpl = progressionApplyPatternModeAvailability;
clearProgressionEditingStateImpl = progressionClearProgressionEditingState;
closeProgressionManagerImpl = progressionCloseProgressionManager;
getSelectedProgressionModeImpl = progressionGetSelectedProgressionMode;
getSelectedProgressionNameImpl = progressionGetSelectedProgressionName;
getSelectedProgressionPatternImpl = progressionGetSelectedProgressionPattern;
setEditorPatternModeImpl = progressionSetEditorPatternMode;
setPatternSelectValueImpl = progressionSetPatternSelectValue;
syncCustomPatternUIImpl = progressionSyncCustomPatternUI;
syncPatternPreviewImpl = progressionSyncPatternPreview;
syncPatternSelectionFromInputImpl = progressionSyncPatternSelectionFromInput;
syncProgressionManagerStateImpl = progressionSyncProgressionManagerState;

function buildProgression() {
  if (currentRawChords.length > 0) return currentRawChords;

  const oneChordSpec = parseOneChordSpec(getCurrentPatternString());
  if (oneChordSpec.active) {
    const fallbackQuality = oneChordSpec.qualities[0] || ONE_CHORD_DEFAULT_QUALITIES[0];
    return [createOneChordToken(fallbackQuality)];
  }

  const raw = parsePattern(getCurrentPatternString());
  if (raw.length === 0) return parsePattern('II-V-I'); // fallback
  return raw;
}

const {
  prepareNextProgressionPlayback,
  scheduleBeatPlayback,
  scheduleDisplayPlayback,
  start: playbackStart,
  stop,
  togglePause
} = createDrillPlaybackRuntimeHostRootAppAssembly({
  dom,
  runtimeState: {
    getAudioContext: () => audioCtx,
    getCurrentBassPlan: () => currentBassPlan,
    setCurrentBassPlan: (value) => { currentBassPlan = value; },
    getCurrentBeat: () => currentBeat,
    setCurrentBeat: (value) => { currentBeat = value; },
    getCurrentChordIdx: () => currentChordIdx,
    setCurrentChordIdx: (value) => { currentChordIdx = value; },
    getCurrentCompingPlan: () => currentCompingPlan,
    setCurrentCompingPlan: (value) => { currentCompingPlan = value; },
    getCurrentKey: () => currentKey,
    setCurrentKey: (value) => { currentKey = value; },
    getCurrentKeyRepetition: () => currentKeyRepetition,
    setCurrentKeyRepetition: (value) => { currentKeyRepetition = value; },
    getCurrentOneChordQualityValue: () => currentOneChordQualityValue,
    setCurrentOneChordQualityValue: (value) => { currentOneChordQualityValue = value; },
    getCurrentRawChords: () => currentRawChords,
    setCurrentRawChords: (value) => { currentRawChords = value; },
    getCurrentVoicingPlan: () => currentVoicingPlan,
    setCurrentVoicingPlan: (value) => { currentVoicingPlan = value; },
    getIsIntro: () => isIntro,
    setIsIntro: (value) => { isIntro = value; },
    getIsPaused: () => isPaused,
    setIsPaused: (value) => { isPaused = value; },
    getIsPlaying: () => isPlaying,
    setIsPlaying: (value) => { isPlaying = value; },
    getLastPlayedChordIdx: () => lastPlayedChordIdx,
    setLastPlayedChordIdx: (value) => { lastPlayedChordIdx = value; },
    getLoopVoicingTemplate: () => loopVoicingTemplate,
    setLoopVoicingTemplate: (value) => { loopVoicingTemplate = value; },
    getNextBeatTime: () => nextBeatTime,
    setNextBeatTime: (value) => { nextBeatTime = value; },
    getNextCompingPlan: () => nextCompingPlan,
    setNextCompingPlan: (value) => { nextCompingPlan = value; },
    getNextKeyValue: () => nextKeyValue,
    setNextKeyValue: (value) => { nextKeyValue = value; },
    getNextOneChordQualityValue: () => nextOneChordQualityValue,
    setNextOneChordQualityValue: (value) => { nextOneChordQualityValue = value; },
    getNextPaddedChords: () => nextPaddedChords,
    setNextPaddedChords: (value) => { nextPaddedChords = value; },
    getNextRawChords: () => nextRawChords,
    setNextRawChords: (value) => { nextRawChords = value; },
    getNextVoicingPlan: () => nextVoicingPlan,
    setNextVoicingPlan: (value) => { nextVoicingPlan = value; },
    getPaddedChords: () => paddedChords,
    setPaddedChords: (value) => { paddedChords = value; },
    getActiveNoteGain: () => activeNoteGain,
    setActiveNoteGain: (value) => { activeNoteGain = value; },
    getFirstPlayStartTracked: () => firstPlayStartTracked,
    setFirstPlayStartTracked: (value) => { firstPlayStartTracked = value; },
    getPlayStopSuggestionCount: () => playStopSuggestionCount,
    setPlayStopSuggestionCount: (value) => { playStopSuggestionCount = value; },
    getKeyPool: () => keyPool,
    setKeyPool: (value) => { keyPool = value; },
    getSchedulerTimer: () => schedulerTimer,
    setSchedulerTimer: (value) => { schedulerTimer = value; }
  },
  audioState: {
    getAudioContext: () => audioCtx,
    setAudioContext: (value) => { audioCtx = value; },
    getActiveNoteGain: () => activeNoteGain,
    setActiveNoteGain: (value) => { activeNoteGain = value; }
  },
  preloadState: {
    getPendingDisplayTimeouts: getDrillPendingDisplayTimeouts,
    getNearTermSamplePreloadPromise: getDrillNearTermSamplePreloadPromise,
    setNearTermSamplePreloadPromise: setDrillNearTermSamplePreloadPromise,
    getStartupSamplePreloadInProgress: getDrillStartupSamplePreloadInProgress,
    setStartupSamplePreloadInProgress: setDrillStartupSamplePreloadInProgress
  },
  playbackConstants: {
    scheduleAhead: SCHEDULE_AHEAD,
    noteFadeout: NOTE_FADEOUT,
    scheduleInterval: SCHEDULE_INTERVAL
  },
  runtimeHelpers: {
    applyDisplaySideLayout,
    buildPreparedBassPlan,
    buildLegacyVoicingPlan,
    buildLoopRepVoicings,
    buildPreparedCompingPlans: rebuildPreparedCompingPlans,
    buildVoicingPlanForSlots: buildSharedVoicingPlanForSlots,
    bassMidiToNoteName,
    canLoopTrimProgression,
    chordSymbolHtml,
    chordSymbol,
    compingEngine,
    createOneChordToken,
    createVoicingSlot: createSharedVoicingSlot,
    fitHarmonyDisplay,
    getBassMidi,
    getBeatsPerChord,
    getChordsPerBar,
    getCompingStyle,
    getCurrentPatternString,
    getPatternKeyOverridePitchClass,
    isWalkingBassDebugEnabled,
    getRemainingBeatsUntilNextProgression,
    getRepetitionsPerKey,
    getSecondsPerBeat,
    hideNextCol,
    ensureNearTermSamplePreload,
    isWalkingBassEnabled,
    isChordsEnabled,
    isVoiceLeadingV2Enabled,
    keyName,
    nextKey,
    padProgression,
    parseOneChordSpec,
    parsePattern,
    playClick,
    playNote,
    keyNameHtml,
    renderAccidentalTextHtml,
    scheduleDrumsForBeat,
    shouldShowNextPreview,
    showNextCol,
    takeNextOneChordQuality,
    trackProgressionOccurrence,
    updateBeatDots,
    clearBeatDots,
    clearScheduledDisplays,
    ensureWalkingBassGenerator,
    ensureNearTermSamplePreload,
    ensureSessionStarted,
    fitHarmonyDisplay,
    getPlaybackAnalyticsProps,
    getProgressionAnalyticsProps,
    hideNextCol,
    initAudio,
    preloadStartupSamples,
    registerSessionAction,
    setDisplayPlaceholderMessage,
    setDisplayPlaceholderVisible,
    stopActiveComping: compingEngine.stopActiveComping,
    stopScheduledAudio,
    trackEvent,
    trackProgressionEvent
  }
});

startImpl = playbackStart;

// ---- UI Wiring ----

// ---- Key Picker ----

function keyLabelForPicker(majorIndex) {
  return drillDisplayRender.keyLabelForPicker(majorIndex);
}

function updateKeyPickerLabels() {
  return drillDisplayRender.updateKeyPickerLabels();
}

function refreshDisplayedHarmony() {
  return drillDisplayRender.refreshDisplayedHarmony();
}

function validateCustomPattern() {
  return validateDrillCustomPattern({
    isCustomPatternSelected,
    getCustomPatternValue: () => String(dom.customPattern?.value || ''),
    normalizePatternString,
    analyzePattern,
    patternErrorElement: dom.patternError
  });
}











// ---- Persistence (localStorage) ----

const APP_BASE_URL = (import.meta?.env?.BASE_URL) || './';
const PATTERN_HELP_URL = `${APP_BASE_URL}progression-suffixes.txt`;
const PATTERN_HELP_VERSION = APP_VERSION;

const {
  createDefaultAppSettings: settingsCreateDefaultAppSettings,
  buildSettingsSnapshot,
  applyLoadedSettings,
  finalizeLoadedSettings,
  resetPlaybackSettings
} = createDrillSettingsRootAppAssembly({
  defaults: {
    majorMinor: false,
    tempo: 120,
    repetitionsPerKey: 2,
    transposition: '0',
    nextPreviewLeadValue: DEFAULT_NEXT_PREVIEW_LEAD_BARS,
    nextPreviewUnit: NEXT_PREVIEW_UNIT_BARS,
    chordsPerBar: DEFAULT_CHORDS_PER_BAR,
    displayMode: DISPLAY_MODE_SHOW_BOTH,
    harmonyDisplayMode: HARMONY_DISPLAY_MODE_DEFAULT,
    useMajorTriangleSymbol: true,
    useHalfDiminishedSymbol: true,
    useDiminishedSymbol: true,
    showBeatIndicator: true,
    hideCurrentHarmony: false,
    compingStyle: COMPING_STYLE_PIANO,
    customMediumSwingBass: true,
    drumsMode: DRUM_MODE_FULL_SWING,
    masterVolume: DEFAULT_MASTER_VOLUME_PERCENT,
    bassVolume: '100',
    stringsVolume: '100',
    drumsVolume: '100',
    enabledKeys: new Array(12).fill(true),
    pianoFadeSettings: { ...DEFAULT_PIANO_FADE_SETTINGS },
    pianoMidiSettings: { ...DEFAULT_PIANO_MIDI_SETTINGS }
  },
  dom,
  snapshotConstants: {
    welcomeOnboardingSettingsKey: WELCOME_ONBOARDING_SETTINGS_KEY,
    welcomeShowNextTimeSettingsKey: WELCOME_SHOW_NEXT_TIME_SETTINGS_KEY,
    welcomeVersionSettingsKey: WELCOME_VERSION_SETTINGS_KEY,
    welcomeVersion: WELCOME_VERSION
  },
  snapshotState: {
      getHasCompletedWelcomeOnboarding: () => hasCompletedWelcomeOnboarding,
      getShouldShowWelcomeNextTime: () => shouldShowWelcomeNextTime,
      getProgressions: () => progressions,
      getAppliedDefaultProgressionsFingerprint: () => appliedDefaultProgressionsFingerprint,
      getAcknowledgedDefaultProgressionsVersion: () => acknowledgedDefaultProgressionsVersion,
      getAppliedOneTimeMigrations: () => appliedOneTimeMigrations,
      getEditingProgressionName: () => editingProgressionName,
      getProgressionSelectionBeforeEditing: () => progressionSelectionBeforeEditing,
      getEditingProgressionSnapshot: () => editingProgressionSnapshot,
      getIsCreatingProgression: () => isCreatingProgression,
      getNextPreviewLeadValue: () => nextPreviewLeadValue,
      getEnabledKeys: () => enabledKeys,
      getPianoFadeSettings: () => pianoFadeSettings,
      getPianoMidiSettings: () => pianoMidiSettings
  },
  snapshotHelpers: {
      isEditingPreset,
      getDefaultProgressionsFingerprint,
      getCurrentPatternName,
      normalizePatternString,
      getCurrentPatternMode,
      getRepetitionsPerKey,
      getNextPreviewInputUnit,
      getSelectedChordsPerBar,
      normalizeDisplayMode,
      normalizeHarmonyDisplayMode,
      getCompingStyle,
      isWalkingBassEnabled,
      isChordsEnabled,
      getDrumsMode
  },
  loadApplierConstants: {
    welcomeOnboardingSettingsKey: WELCOME_ONBOARDING_SETTINGS_KEY,
    welcomeShowNextTimeSettingsKey: WELCOME_SHOW_NEXT_TIME_SETTINGS_KEY,
    welcomeVersionSettingsKey: WELCOME_VERSION_SETTINGS_KEY,
    welcomeVersion: WELCOME_VERSION,
    defaultProgressions: DEFAULT_PROGRESSIONS,
    nextPreviewUnitBars: NEXT_PREVIEW_UNIT_BARS,
    defaultChordsPerBar: DEFAULT_CHORDS_PER_BAR,
    displayModeKeyOnly: DISPLAY_MODE_KEY_ONLY,
    displayModeShowBoth: DISPLAY_MODE_SHOW_BOTH,
    drumModeMetronome24: DRUM_MODE_METRONOME_24,
    drumModeOff: DRUM_MODE_OFF,
    defaultMasterVolumePercent: DEFAULT_MASTER_VOLUME_PERCENT,
    defaultPianoFadeSettings: DEFAULT_PIANO_FADE_SETTINGS,
    defaultPianoMidiSettings: DEFAULT_PIANO_MIDI_SETTINGS,
    customPatternOptionValue: CUSTOM_PATTERN_OPTION_VALUE
  },
  loadApplierState: {
      setHasCompletedWelcomeOnboarding: (value) => { hasCompletedWelcomeOnboarding = value; },
      setShouldShowWelcomeNextTime: (value) => { shouldShowWelcomeNextTime = value; },
      getShouldShowWelcomeNextTime: () => shouldShowWelcomeNextTime,
      setHadStoredProgressions: (value) => { hadStoredProgressions = value; },
      getHadStoredProgressions: () => hadStoredProgressions,
      setAppliedOneTimeMigrations: (value) => { appliedOneTimeMigrations = value; },
      setAppliedDefaultProgressionsFingerprint: (value) => { appliedDefaultProgressionsFingerprint = value; },
      setAcknowledgedDefaultProgressionsVersion: (value) => { acknowledgedDefaultProgressionsVersion = value; },
      getAcknowledgedDefaultProgressionsVersion: () => acknowledgedDefaultProgressionsVersion,
      setSavedPatternSelection: (value) => { savedPatternSelection = value; },
      setProgressions: (value) => { progressions = value; },
      getProgressions: () => progressions,
      setShouldPersistRecoveredDefaultProgressions: (value) => { shouldPersistRecoveredDefaultProgressions = value; },
      setNextPreviewLeadValue: (value) => { nextPreviewLeadValue = value; },
      setEnabledKeys: (value) => { enabledKeys = value; },
      setPianoFadeSettings: (value) => { pianoFadeSettings = value; },
      setPianoMidiSettings: (value) => { pianoMidiSettings = value; },
      setEditingProgressionName: (value) => { editingProgressionName = value; },
      setProgressionSelectionBeforeEditing: (value) => { progressionSelectionBeforeEditing = value; },
      setEditingProgressionSnapshot: (value) => { editingProgressionSnapshot = value; },
      setIsCreatingProgression: (value) => { isCreatingProgression = value; },
      setShouldPromptForDefaultProgressionsUpdate: (value) => { shouldPromptForDefaultProgressionsUpdate = value; },
      getDefaultProgressionsVersion: () => defaultProgressionsVersion
  },
  loadApplierHelpers: {
      normalizeAppliedOneTimeMigrations,
      normalizeProgressionsMap,
      renderProgressionOptions,
      normalizePresetName,
      normalizePatternString,
      setEditorPatternMode,
      normalizePatternMode,
      normalizeRepetitionsPerKey,
      normalizeNextPreviewLeadValue,
      setNextPreviewInputUnit,
      normalizeChordsPerBar,
      syncDoubleTimeToggle,
      normalizeDisplayMode,
      normalizeHarmonyDisplayMode,
      normalizeCompingStyle,
      shouldApplyMasterVolumeDefault50Migration,
      normalizePianoFadeSettings,
      normalizePianoMidiSettings,
      getProgressionEntry
  },
  loadFinalizerConstants: {
    customPatternOptionValue: CUSTOM_PATTERN_OPTION_VALUE
  },
  loadFinalizerState: {
      getAppliedDefaultProgressionsFingerprint: () => appliedDefaultProgressionsFingerprint,
      setAppliedDefaultProgressionsFingerprint: (value) => { appliedDefaultProgressionsFingerprint = value; },
      getHadStoredProgressions: () => hadStoredProgressions,
      getSavedPatternSelection: () => savedPatternSelection,
      getIsCreatingProgression: () => isCreatingProgression,
      setLastStandaloneCustomName: (value) => { lastStandaloneCustomName = value; },
      setLastStandaloneCustomPattern: (value) => { lastStandaloneCustomPattern = value; },
      setLastStandaloneCustomMode: (value) => { lastStandaloneCustomMode = value; },
      getShouldPersistRecoveredDefaultProgressions: () => shouldPersistRecoveredDefaultProgressions,
      setShouldPersistRecoveredDefaultProgressions: (value) => { shouldPersistRecoveredDefaultProgressions = value; }
  },
  loadFinalizerHelpers: {
      getDefaultProgressionsFingerprint,
      syncPianoToolsUi: (...args) => syncPianoToolsUi(...args),
      applyMixerSettings,
      syncNextPreviewControlDisplay,
      applyBeatIndicatorVisibility,
      applyCurrentHarmonyVisibility,
      getRepetitionsPerKey,
      normalizePresetName,
      normalizePatternString,
      normalizePatternMode,
      resetStandaloneCustomDraft,
      getAnalyticsDebugEnabled,
      syncProgressionManagerState,
      applyPatternModeAvailability,
      saveSettings
  },
  resetterState: {
      getProgressions: () => progressions,
      setLastPatternSelectValue: (value) => { lastPatternSelectValue = value; },
      setPianoFadeSettings: (value) => { pianoFadeSettings = value; },
      setPianoMidiSettings: (value) => { pianoMidiSettings = value; },
      setNextPreviewLeadValue: (value) => { nextPreviewLeadValue = value; }
  },
  resetterHelpers: {
      clearProgressionEditingState,
      closeProgressionManager,
      setPatternSelectValue,
      getSelectedProgressionName,
      setEditorPatternMode,
      getSelectedProgressionMode,
      syncDoubleTimeToggle,
      applyEnabledKeys,
      normalizePianoFadeSettings,
      normalizePianoMidiSettings,
      stopAllMidiPianoVoices,
      syncPianoToolsUi: (...args) => syncPianoToolsUi(...args),
      attachMidiInput,
      setNextPreviewInputUnit,
      applyMixerSettings,
      syncNextPreviewControlDisplay,
      applyDisplayMode,
      applyBeatIndicatorVisibility,
      applyCurrentHarmonyVisibility,
      syncCustomPatternUI,
      syncProgressionManagerState,
      applyPatternModeAvailability,
      syncPatternPreview,
      refreshDisplayedHarmony,
      saveSettings,
      trackEvent
  }
});

createDefaultAppSettingsImpl = settingsCreateDefaultAppSettings;
const drillSettingsPersistence = createDrillSettingsPersistenceRootAppAssembly({
  dom,
  constants: {
    defaultMixerVolumes: {
      masterVolume: Number(DEFAULT_MASTER_VOLUME_PERCENT),
      bassVolume: 100,
      stringsVolume: 100,
      drumsVolume: 100
    }
  },
  helpers: {
    saveSharedPlaybackSettings,
    saveStoredProgressionSettings,
    buildSettingsSnapshot,
    getCompingStyle,
    getDrumsMode,
    isWalkingBassEnabled,
    loadStoredProgressionSettings,
    loadStoredKeySelectionPreset,
    applyLoadedSettings,
    finalizeLoadedSettings
  },
  state: {
    setSavedKeySelectionPreset: (value) => {
      savedKeySelectionPreset = value;
    }
  }
});

saveSettingsImpl = (...args) => drillSettingsPersistence.saveSettings(...args);
loadSettingsImpl = (...args) => drillSettingsPersistence.loadSettings(...args);

let attachMidiInputImpl = () => {};

function attachMidiInput(...args) {
  return attachMidiInputImpl(...args);
}

const {
  setPianoMidiStatus,
  refreshPianoSettingsJson,
  syncPianoToolsUi,
  readPianoFadeSettingsFromControls,
  applyPianoFadeSettings,
  applyPianoMidiSettings,
  applyPianoPresetFromJsonText
} = createDrillPianoToolsRootAppFacade({
  dom,
  version: PIANO_SETTINGS_PRESET_VERSION,
  getPianoFadeSettings: () => pianoFadeSettings,
  setPianoFadeSettings: (value) => { pianoFadeSettings = value; },
  normalizePianoFadeSettings,
  getPianoMidiSettings: () => pianoMidiSettings,
  setPianoMidiSettings: (value) => { pianoMidiSettings = value; },
  normalizePianoMidiSettings,
  attachMidiInput: (...args) => attachMidiInput(...args),
  saveSettings: (...args) => saveSettings(...args)
});

function dbToGain(db) {
  return Math.pow(10, Number(db || 0) / 20);
}

const midiToPianoNoteLabel = bassMidiToNoteName;

function getPianoSampleLayerForVolume(finalVolume) {
  const thresholds = pianoRhythmConfig.pianoSampleLayerThresholds || {};
  if (finalVolume >= (thresholds.f ?? Number.POSITIVE_INFINITY)) return 'f';
  if (finalVolume >= (thresholds.mf ?? Number.POSITIVE_INFINITY)) return 'mf';
  return 'p';
}

function smoothstep01(value) {
  const clamped = clamp01(value);
  return clamped * clamped * (3 - (2 * clamped));
}

function getPianoSampleLayerBoundaryLiftDb(finalVolume, layer) {
  const thresholds = pianoRhythmConfig.pianoSampleLayerThresholds || {};
  const smoothing = pianoRhythmConfig.pianoSampleLayerSmoothing || {};
  const boundaryWindow = clampRange(smoothing.boundaryWindow, 0.001, 0.2, 0.045);

  if (layer === 'p' && Number.isFinite(thresholds.mf)) {
    const start = thresholds.mf - boundaryWindow;
    return smoothstep01((finalVolume - start) / boundaryWindow)
      * clampRange(smoothing.pToMfLiftDb, 0, 12, 2.25);
  }

  if (layer === 'mf') {
    let liftDb = 0;
    if (Number.isFinite(thresholds.mf)) {
      liftDb += (1 - smoothstep01((finalVolume - thresholds.mf) / boundaryWindow))
        * clampRange(smoothing.mfFromPLiftDb, 0, 12, 2.25);
    }
    if (Number.isFinite(thresholds.f)) {
      const start = thresholds.f - boundaryWindow;
      liftDb += smoothstep01((finalVolume - start) / boundaryWindow)
        * clampRange(smoothing.mfToFLiftDb, 0, 12, 1.5);
    }
    return liftDb;
  }

  if (layer === 'f' && Number.isFinite(thresholds.f)) {
    return (1 - smoothstep01((finalVolume - thresholds.f) / boundaryWindow))
      * clampRange(smoothing.fFromMfLiftDb, 0, 12, 1.5);
  }

  return 0;
}

function getPianoSampleLayerGainForVolume(finalVolume) {
  const layer = getPianoSampleLayerForVolume(finalVolume);
  const layerGainDb = pianoRhythmConfig.pianoSampleLayerGainDb || {};
  const boundaryLiftDb = getPianoSampleLayerBoundaryLiftDb(finalVolume, layer);
  return {
    layer,
    adjustedVolume: finalVolume * dbToGain((layerGainDb[layer] ?? 0) + boundaryLiftDb)
  };
}

function getMidiVelocityProfile(velocity) {
  const midiVelocityConfig = pianoRhythmConfig.pianoMidiVelocity || {};
  const thresholds = pianoRhythmConfig.pianoSampleLayerThresholds || {};
  const basePianoVolume = PIANO_VOLUME_MULTIPLIER;
  const normalizedVelocity = clamp01((Number(velocity) || 0) / 127);
  const curvePower = clampRange(midiVelocityConfig.curvePower, 0.3, 4, 1.9);
  const shapedVelocity = Math.pow(normalizedVelocity, curvePower);
  const fallbackMinVolume = Math.max(0.12, Math.min((thresholds.mf ?? basePianoVolume) * 0.9, basePianoVolume * 0.82));
  const fallbackMaxVolume = Math.max((thresholds.f ?? basePianoVolume) * 1.12, basePianoVolume * 1.32);
  const minVolume = clampRange(midiVelocityConfig.minVolume, 0, 1, fallbackMinVolume);
  const maxVolume = clampRange(midiVelocityConfig.maxVolume, minVolume, 1, fallbackMaxVolume);
  const attackMin = clampRange(midiVelocityConfig.attackMin, 0.0005, 0.03, 0.0015);
  const attackMax = clampRange(midiVelocityConfig.attackMax, attackMin, 0.05, 0.006);

  return {
    normalizedVelocity,
    shapedVelocity,
    targetVolume: minVolume + (shapedVelocity * (maxVolume - minVolume)),
    attackDuration: attackMax - (shapedVelocity * (attackMax - attackMin))
  };
}

function getNearestPianoSourceMidi(targetMidi) {
  return Math.round(clampRange(targetMidi, PIANO_SAMPLE_LOW, PIANO_SAMPLE_HIGH, 60));
}

async function ensurePianoSampleAvailable(midi, layer) {
  const sourceMidi = getNearestPianoSourceMidi(midi);
  const sampleKey = `${layer}:${sourceMidi}`;
  if (sampleBuffers.piano[sampleKey]) {
    return {
      buffer: sampleBuffers.piano[sampleKey],
      sourceMidi
    };
  }
  await loadPianoSample(layer, sourceMidi);
  return {
    buffer: sampleBuffers.piano[sampleKey] || null,
    sourceMidi
  };
}

function ensureMidiPianoRangePreload() {
  if (!audioCtx) return Promise.resolve(null);
  if (midiPianoRangePreloadPromise) return midiPianoRangePreloadPromise;

  const midiValues = [];
  for (let midi = PIANO_SAMPLE_LOW; midi <= PIANO_SAMPLE_HIGH; midi++) {
    midiValues.push(midi);
  }

  midiPianoRangePreloadPromise = loadPianoSampleList(new Set(midiValues))
    .catch(() => {
      midiPianoRangePreloadPromise = null;
      return null;
    });

  return midiPianoRangePreloadPromise;
}

function stopMidiPianoVoice(midi, releaseImmediately = false) {
  const voice = activeMidiPianoVoices.get(midi);
  if (!voice || !audioCtx) return;

  activeMidiPianoVoices.delete(midi);
  sustainedMidiNotes.delete(midi);

  const releaseStart = audioCtx.currentTime;
  const profile = getPianoFadeProfile(voice.midi, voice.volume, 0);
  const releaseTimeConstant = releaseImmediately ? 0.012 : profile.timeConstant;
  const releaseStopTime = releaseStart + Math.max(0.03, releaseTimeConstant * 6);

  try {
    if (typeof voice.gain.gain.cancelAndHoldAtTime === 'function') {
      voice.gain.gain.cancelAndHoldAtTime(releaseStart);
    } else {
      const currentValue = voice.gain.gain.value;
      voice.gain.gain.cancelScheduledValues(releaseStart);
      voice.gain.gain.setValueAtTime(currentValue, releaseStart);
    }
    voice.gain.gain.setTargetAtTime(0.0001, releaseStart, releaseTimeConstant);
  } catch (err) {
    // Ignore already ended voices.
  }

  try {
    voice.source.stop(releaseStopTime);
  } catch (err) {
    // Ignore duplicate stop scheduling.
  }
}

function stopAllMidiPianoVoices(releaseImmediately = false) {
  for (const midi of [...activeMidiPianoVoices.keys()]) {
    stopMidiPianoVoice(midi, releaseImmediately);
  }
  sustainedMidiNotes.clear();
  midiSustainPedalDown = false;
}

async function playMidiPianoNote(midi, velocity = 96) {
  if (!pianoMidiSettings.enabled) return;
  const noteToken = (pendingMidiNoteTokens.get(midi) || 0) + 1;
  pendingMidiNoteTokens.set(midi, noteToken);

  initAudio();
  ensureMidiPianoRangePreload();
  if (audioCtx.state === 'suspended') {
    try {
      await audioCtx.resume();
    } catch {}
  }

  const velocityProfile = getMidiVelocityProfile(velocity);
  const pianoLayer = getPianoSampleLayerGainForVolume(velocityProfile.targetVolume);
  const { buffer, sourceMidi } = await ensurePianoSampleAvailable(midi, pianoLayer.layer);
  if (!buffer || !audioCtx || pendingMidiNoteTokens.get(midi) !== noteToken) return;

  stopMidiPianoVoice(midi, true);

  const source = audioCtx.createBufferSource();
  source.buffer = buffer;
  if (sourceMidi !== midi) {
    source.playbackRate.value = Math.pow(2, (midi - sourceMidi) / 12);
  }

  const gain = audioCtx.createGain();
  const now = audioCtx.currentTime;
  const attackEnd = now + velocityProfile.attackDuration;
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(pianoLayer.adjustedVolume, attackEnd);
  source.connect(gain).connect(getMixerDestination('strings'));
  source.start(now);
  trackScheduledSource(source, [gain]);

  const voice = {
    midi,
    source,
    gain,
    volume: pianoLayer.adjustedVolume
  };
  activeMidiPianoVoices.set(midi, voice);
  source.addEventListener('ended', () => {
    if (activeMidiPianoVoices.get(midi) === voice) {
      activeMidiPianoVoices.delete(midi);
    }
    sustainedMidiNotes.delete(midi);
  }, { once: true });

  setPianoMidiStatus(`MIDI: ${midiToPianoNoteLabel(midi)} vel ${velocity} layer ${pianoLayer.layer} vol ${pianoLayer.adjustedVolume.toFixed(3)}`);
}

function handleMidiNoteOff(midi) {
  if (!pianoMidiSettings.enabled) return;
  pendingMidiNoteTokens.set(midi, (pendingMidiNoteTokens.get(midi) || 0) + 1);
  if (pianoMidiSettings.sustainPedalEnabled && midiSustainPedalDown) {
    sustainedMidiNotes.add(midi);
    return;
  }
  stopMidiPianoVoice(midi);
}

function handleMidiSustainChange(value) {
  if (!pianoMidiSettings.sustainPedalEnabled) return;
  const isDown = Number(value) >= 64;
  midiSustainPedalDown = isDown;
  if (isDown) return;
  for (const midi of [...sustainedMidiNotes]) {
    stopMidiPianoVoice(midi);
  }
  sustainedMidiNotes.clear();
}

function handleMidiMessage(event) {
  const [status = 0, data1 = 0, data2 = 0] = event.data || [];
  const command = status & 0xf0;

  if (command === 0x90 && data2 > 0) {
    playMidiPianoNote(data1, data2).catch(() => {});
    return;
  }

  if (command === 0x80 || (command === 0x90 && data2 === 0)) {
    handleMidiNoteOff(data1);
    return;
  }

  if (command === 0xb0 && data1 === 64) {
    handleMidiSustainChange(data2);
  }
}

const {
  attachMidiInput: pianoMidiAttachInput,
  refreshMidiInputs
} = createDrillPianoMidiRuntimeRootAppAssembly({
  dom,
  runtimeState: {
    getMidiAccess: () => midiAccess,
    setMidiAccess: (value) => { midiAccess = value; },
    getMidiAccessPromise: () => midiAccessPromise,
    setMidiAccessPromise: (value) => { midiAccessPromise = value; },
    getCurrentMidiInput: () => currentMidiInput,
    setCurrentMidiInput: (value) => { currentMidiInput = value; },
    getPianoMidiSettings: () => pianoMidiSettings
  },
  runtimeHelpers: {
    normalizePianoMidiSettings,
    setPianoMidiSettings: (value) => { pianoMidiSettings = value; },
    refreshPianoSettingsJson,
    setPianoMidiStatus,
    handleMidiMessage,
    ensureMidiPianoRangePreload,
    getAudioContext: () => audioCtx,
    requestMIDIAccess: (...args) => navigator.requestMIDIAccess?.(...args),
    createOptionElement: () => document.createElement('option')
  }
});

attachMidiInputImpl = pianoMidiAttachInput;

function legacyPopulateMidiInputs() {
  return;
  const currentValue = pianoMidiSettings.inputId;
  dom.pianoMidiInput.innerHTML = '';

  const emptyOption = document.createElement('option');
  emptyOption.value = '';
  emptyOption.textContent = inputs.length ? 'Choisir une entrée' : 'Aucune entrée détectée';
  dom.pianoMidiInput.append(emptyOption);

  for (const input of inputs) {
    const option = document.createElement('option');
    option.value = input.id;
    option.textContent = input.name || `MIDI ${input.id}`;
    dom.pianoMidiInput.append(option);
  }

  const nextValue = inputs.some((input) => input.id === currentValue)
    ? currentValue
    : (inputs[0]?.id || '');
  dom.pianoMidiInput.value = nextValue;
  pianoMidiSettings = normalizePianoMidiSettings({
    ...pianoMidiSettings,
    inputId: nextValue
  });
  refreshPianoSettingsJson();
}

function legacyDetachMidiInput() {
  return;
}

function legacyAttachMidiInput() {
  return;
  legacyDetachMidiInput();
  if (!pianoMidiSettings.enabled) {
    setPianoMidiStatus('MIDI inactif');
    return;
  }

  const input = legacyGetAvailableMidiInputs().find((candidate) => candidate.id === pianoMidiSettings.inputId) || null;
  if (!input) {
    setPianoMidiStatus('Aucune entrée MIDI active');
    return;
  }

  currentMidiInput = input;
  currentMidiInput.onmidimessage = handleMidiMessage;
  setPianoMidiStatus(`Entrée: ${input.name || 'MIDI'}`);
}

async function legacyEnsureMidiAccess() {
  return null;
  if (!navigator.requestMIDIAccess) {
    setPianoMidiStatus('Web MIDI non supporté par ce navigateur');
    return null;
  }
  if (midiAccess) return midiAccess;
  if (!midiAccessPromise) {
    midiAccessPromise = navigator.requestMIDIAccess()
      .then((access) => {
        midiAccess = access;
        midiAccess.onstatechange = () => {
          legacyPopulateMidiInputs();
          legacyAttachMidiInput();
          refreshPianoSettingsJson();
        };
        return access;
      })
      .catch((err) => {
        midiAccessPromise = null;
        setPianoMidiStatus('Accès MIDI refusé');
        throw err;
      });
  }
  return midiAccessPromise;
}

async function legacyRefreshMidiInputs() {
  return;
  try {
    await legacyEnsureMidiAccess();
    legacyPopulateMidiInputs();
    legacyAttachMidiInput();
    if (pianoMidiSettings.enabled && audioCtx) {
      ensureMidiPianoRangePreload();
    }
  } catch {}
}

const {
  loadPatternHelp,
  loadDefaultProgressions
} = createDrillStartupDataRootAppAssembly({
  state: {
    setDefaultProgressionsVersion: (value) => { defaultProgressionsVersion = value; },
    setDefaultProgressions: (value) => { DEFAULT_PROGRESSIONS = value; },
    setProgressions: (value) => { progressions = value; }
  },
  patternHelp: {
    loadDrillPatternHelp,
    dom,
    url: PATTERN_HELP_URL,
    version: PATTERN_HELP_VERSION
  },
  defaultProgressions: {
    fetchImpl: (...args) => fetch(...args),
    url: DEFAULT_PROGRESSIONS_URL,
    appVersion: APP_VERSION,
    parseDefaultProgressionsText,
    normalizeProgressionsMap,
    getDefaultProgressions: () => DEFAULT_PROGRESSIONS
  }
});

async function initializeApp() {
  await drillUiBootstrap.initializeScreen();
}

const drillUiBootstrapScreen = createDrillUiBootstrapScreenRootAppContext({
  dom,
  state: {
    getProgressions: () => progressions,
    getSavedPatternSelection: () => savedPatternSelection,
    getShouldPromptForDefaultProgressionsUpdate: () => shouldPromptForDefaultProgressionsUpdate,
    getAppliedDefaultProgressionsFingerprint: () => appliedDefaultProgressionsFingerprint,
    setAppliedDefaultProgressionsFingerprint: (value) => { appliedDefaultProgressionsFingerprint = value; },
    setLastPatternSelectValue: (value) => { lastPatternSelectValue = value; }
  },
  constants: {
    customPatternOptionValue: CUSTOM_PATTERN_OPTION_VALUE
  },
  helpers: {
    initializeSocialShareLinks,
    loadDefaultProgressions,
    loadPatternHelp,
    loadWelcomeStandards,
    renderProgressionOptions,
    loadSettings,
    applySilentDefaultPresetResetMigration,
    saveSettings,
    buildKeyCheckboxes,
    updateKeyPickerLabels,
    applyDisplayMode,
    getSelectedProgressionPattern,
    hasSelectedProgression,
    getSelectedProgressionName,
    normalizePresetName,
    setEditorPatternMode,
    getSelectedProgressionMode,
    normalizePatternMode,
    syncPatternSelectionFromInput,
    syncProgressionManagerState,
    syncCustomPatternUI,
    normalizeChordsPerBarForCurrentPattern,
    applyPatternModeAvailability,
    promptForUpdatedDefaultProgressions,
    getDefaultProgressionsFingerprint,
    ensurePageSampleWarmup,
    consumePendingDrillSessionIntoUi: ({ afterApply }) => consumePendingDrillSessionIntoUi({
      applyEmbeddedPattern,
      applyEmbeddedPlaybackSettings,
      afterApply
    }),
    setWelcomeOverlayVisible,
    maybeShowWelcomeOverlay
  }
});

const drillRuntimeControls = createDrillRuntimeControlsRootAppContext({
  dom,
  state: {
    getIsPlaying: () => isPlaying,
    getAudioContext: () => audioCtx,
    getCurrentKey: () => currentKey,
    getNextPreviewLeadUnit: () => nextPreviewLeadUnit,
    getNextPreviewInputUnit: () => getNextPreviewInputUnit()
  },
  constants: {
    noteFadeout: NOTE_FADEOUT,
    nextPreviewUnitBars: NEXT_PREVIEW_UNIT_BARS,
    nextPreviewUnitSeconds: NEXT_PREVIEW_UNIT_SECONDS
  },
  helpers: {
    stop,
    start,
    togglePause,
    syncNextPreviewControlDisplay,
    refreshDisplayedHarmony,
    stopActiveChordVoices,
    rebuildPreparedCompingPlans,
    buildPreparedBassPlan,
    commitNextPreviewValueFromInput,
    saveSettings,
    trackEvent,
    formatPreviewNumber,
    getNextPreviewLeadBars,
    getNextPreviewLeadSeconds,
    convertNextPreviewValueToUnit,
    setNextPreviewInputUnit,
    setAllKeysEnabled,
    getEnabledKeyCount,
    invertKeysEnabled,
    saveCurrentKeySelectionPreset,
    loadKeySelectionPreset,
    updateKeyPickerLabels,
    syncPatternPreview,
    applyDisplayMode,
    normalizeDisplayMode,
    normalizeHarmonyDisplayMode,
    applyBeatIndicatorVisibility,
    applyCurrentHarmonyVisibility,
    fitHarmonyDisplay,
    applyMixerSettings
  }
});

const drillUiBootstrap = createDrillUiBootstrapRootAppAssembly({
  screen: drillUiBootstrapScreen,
  pianoControls: {
    dom,
    readPianoFadeSettingsFromControls,
    refreshPianoSettingsJson,
    applyPianoFadeSettings: (nextSettings) => {
      applyPianoFadeSettings(nextSettings);
    },
    refreshMidiInputs,
    stopAllMidiPianoVoices,
    applyPianoMidiSettings: (nextSettings, options) => {
      if (nextSettings?.sustainPedalEnabled === false) {
        midiSustainPedalDown = false;
        for (const midi of [...sustainedMidiNotes]) {
          stopMidiPianoVoice(midi);
        }
        sustainedMidiNotes.clear();
      }
      applyPianoMidiSettings(nextSettings, options);
    },
    getPianoMidiSettings: () => pianoMidiSettings,
    ensureMidiPianoRangePreload
  },
  runtimeControls: drillRuntimeControls,
  harmonyDisplayObservers: {
    fitHarmonyDisplay,
    chordDisplay: dom.chordDisplay,
    nextChordDisplay: dom.nextChordDisplay,
    displayColumns: document.getElementById('display-columns')
  }
});

const drillUiEventBindings = createDrillUiEventBindingsRootAppAssembly({
  welcomeControls: {
    updateWelcomePanelVisibility,
    updateWelcomeSummary,
    trackEvent,
    syncWelcomeShowNextTimePreference,
    saveSettings,
    applyWelcomeRecommendation,
    skipWelcomeOverlay,
    setWelcomeOverlayVisible,
    welcomeStandardSelect: dom.welcomeStandardSelect,
    welcomeShowNextTime: dom.welcomeShowNextTime,
    welcomeApply: dom.welcomeApply,
    welcomeSkip: dom.welcomeSkip,
    reopenWelcome: dom.reopenWelcome
  },
  analyticsLink: {
    element: document.querySelector('[data-analytics-link="demo"]'),
    trackEvent
  },
  settingsControls: {
    dom,
    saveSettings,
    stopPlaybackIfRunning,
    trackEvent,
    getTempoBucket,
    getRepetitionsPerKey,
    getSelectedChordsPerBar,
    isPlaying: () => isPlaying,
    getAudioContext: () => audioCtx,
    noteFadeout: NOTE_FADEOUT,
    stopActiveChordVoices,
    rebuildPreparedCompingPlans,
    getCurrentKey: () => currentKey,
    preloadNearTermSamples: () => preloadNearTermSamples(),
    getCompingStyle,
    isWalkingBassEnabled,
    ensureWalkingBassGenerator,
    buildPreparedBassPlan,
    applyMixerSettings,
    isChordsEnabled,
    setAnalyticsDebugEnabled,
    resetPlaybackSettings
  },
  pianoPresetControls: {
    dom,
    refreshPianoSettingsJson,
    setPianoMidiStatus,
    applyPianoPresetFromJsonText,
    getPianoMidiSettings: () => pianoMidiSettings,
    refreshMidiInputs,
    normalizePianoFadeSettings,
    normalizePianoMidiSettings,
    defaultPianoFadeSettings: DEFAULT_PIANO_FADE_SETTINGS,
    defaultPianoMidiSettings: DEFAULT_PIANO_MIDI_SETTINGS,
    setPianoFadeSettings: (value) => { pianoFadeSettings = value; },
    setPianoMidiSettings: (value) => { pianoMidiSettings = value; },
    stopAllMidiPianoVoices,
    syncPianoToolsUi,
    attachMidiInput,
    saveSettings,
    clipboard: navigator.clipboard,
    alert: (message) => window.alert(message)
  },
  lifecycleTarget: window,
  trackSessionDuration
});

drillUiEventBindings.bindAnalyticsLink();
drillUiEventBindings.bindWelcomeEvents();
drillUiEventBindings.bindSettingsEvents();
drillUiBootstrap.initializePianoControls();
drillUiEventBindings.bindPianoPresetEvents();
drillUiBootstrap.initializeRuntimeControls();

drillUiBootstrap.initializeHarmonyDisplayObservers();

drillUiEventBindings.bindLifecycleEvents();

const drillSharedPlaybackHost = createDrillSharedPlaybackHostRootAppContext({
  dom,
  state: {
    getLastPatternSelectValue: () => lastPatternSelectValue,
    setLastPatternSelectValue: (value) => { lastPatternSelectValue = value; },
    getIsPlaying: () => isPlaying,
    getIsPaused: () => isPaused,
    getIsIntro: () => isIntro,
    getCurrentBeat: () => currentBeat,
    getCurrentChordIdx: () => currentChordIdx,
    getPaddedChordCount: () => (Array.isArray(paddedChords) ? paddedChords.length : 0),
    getCurrentKey: () => currentKey,
    getAudioContext: () => audioCtx
  },
  constants: {
    customPatternOptionValue: CUSTOM_PATTERN_OPTION_VALUE
  },
  helpers: {
    setSuppressPatternSelectChange: (value) => { suppressPatternSelectChange = value; },
    setPatternSelectValue,
    setEditorPatternMode,
    syncPatternSelectionFromInput,
    startPlayback: () => start(),
    stopPlayback: () => stop(),
    togglePausePlayback: () => togglePause()
  }
});

const drillSharedPlaybackPatternUi = createDrillSharedPlaybackPatternUiRootAppContext({
  helpers: {
    clearProgressionEditingState,
    closeProgressionManager,
    syncCustomPatternUI,
    normalizeChordsPerBarForCurrentPattern,
    applyPatternModeAvailability,
    syncPatternPreview,
    applyDisplayMode,
    applyBeatIndicatorVisibility,
    applyCurrentHarmonyVisibility,
    updateKeyPickerLabels,
    refreshDisplayedHarmony,
    fitHarmonyDisplay,
    validateCustomPattern: () => validateCustomPattern(),
    getCurrentPatternString,
    getCurrentPatternMode
  }
});

const drillSharedPlaybackDirectRuntime = createDrillSharedPlaybackDirectRuntimeRootAppContext({
  state: {
    getAudioContext: () => audioCtx,
    getCurrentKey: () => currentKey
  },
  constants: {
    noteFadeout: NOTE_FADEOUT
  },
  helpers: {
    ensureWalkingBassGenerator,
    stopActiveChordVoices,
    rebuildPreparedCompingPlans,
    buildPreparedBassPlan,
    preloadNearTermSamples,
    validateCustomPattern: () => validateCustomPattern()
  }
});

const {
  playbackController: embeddedPlaybackController,
  applyEmbeddedPattern,
  applyEmbeddedPlaybackSettings,
  getEmbeddedPlaybackState
} = createDrillSharedPlaybackRootAppAssembly({
  dom,
  host: drillSharedPlaybackHost,
  patternUi: drillSharedPlaybackPatternUi,
  normalization: {
      normalizePatternString,
      normalizePresetName,
      normalizePatternMode,
      normalizeCompingStyle,
      normalizeRepetitionsPerKey,
      normalizeDisplayMode,
      normalizeHarmonyDisplayMode
    },
  playbackSettings: {
      getSwingRatio,
      getCompingStyle,
      getDrumsMode,
      isWalkingBassEnabled,
      getRepetitionsPerKey,
      applyMixerSettings
    },
  embeddedPlaybackState: {
      isEmbeddedMode: IS_EMBEDDED_DRILL_MODE
    },
  embeddedPlaybackRuntime: {
      ensureWalkingBassGenerator,
      stopActiveChordVoices,
      noteFadeout: NOTE_FADEOUT,
      rebuildPreparedCompingPlans,
      buildPreparedBassPlan,
      preloadNearTermSamples
    },
  embeddedTransportActions: {},
  directPlaybackRuntime: drillSharedPlaybackDirectRuntime,
  directPlaybackState: {
      getIsPlaying: () => isPlaying
    },
  directTransportActions: {
      startPlayback: () => start(),
      stopPlayback: () => stop(),
      togglePausePlayback: () => togglePause()
    }
});

function getPlaybackSessionController() {
  if (playbackSessionController) {
    return playbackSessionController;
  }

  playbackSessionController = embeddedPlaybackController;
  return playbackSessionController;
}

initializeApp();
setDisplayPlaceholderVisible(true);




