import { getAnalyticsDebugEnabled, setAnalyticsDebugEnabled, trackEvent } from './analytics.js';
import {
  createProgressionEntry as createProgressionEntryBase,
  isProgressionModeToken,
  normalizeProgressionEntry as normalizeProgressionEntryBase,
  normalizeProgressionsMap as normalizeProgressionsMapBase,
  parseDefaultProgressionsText as parseDefaultProgressionsTextBase
} from './progression-library.js';
import { bindProgressionControls } from './progression-bindings.js';
import { createProgressionEditor } from './progression-editor.js';
import { createProgressionManager } from './progression-manager.js';
import { createWalkingBassGenerator } from './walking-bass.js';
import {
  loadStoredKeySelectionPreset,
  loadStoredProgressionSettings,
  saveStoredKeySelectionPreset,
  saveStoredProgressionSettings
} from './progression-storage.js';
import { createCompingEngine } from './comping-engine.js';
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
import { createDrillAudioRuntimeAppAssembly } from './features/drill/drill-audio-runtime-app-assembly.js';
import { createDrillAudioRuntimeAppBindings } from './features/drill/drill-audio-runtime-app-bindings.js';
import { createDrillCompingEngineAppBindings } from './features/drill/drill-comping-engine-app-bindings.js';
import { loadDrillPatternHelp } from './features/drill/drill-pattern-help.js';
import { validateDrillCustomPattern } from './features/drill/drill-pattern-validation.js';
import { createDrillPlaybackResourcesRuntimeAppBindings } from './features/drill/drill-playback-resources-runtime-app-bindings.js';
import { createDrillPlaybackResourcesAppBindings } from './features/drill/drill-playback-resources-app-bindings.js';
import { createDrillPlaybackResourcesAppAssembly } from './features/drill/drill-playback-resources-app-assembly.js';
import {
  buildDrillKeyCheckboxes,
  invertDrillKeysEnabled,
  setAllDrillKeysEnabled
} from './features/drill/drill-key-selection.js';
import { createDrillVoicingRuntimeAppBindings } from './features/drill/drill-voicing-runtime-app-bindings.js';
import { createDrillVoicingRuntime } from './features/drill/drill-voicing-runtime.js';
import { createDrillWalkingBassAppBindings } from './features/drill/drill-walking-bass-app-bindings.js';
import { initializeDrillRuntimeControls } from './features/drill/drill-runtime-controls.js';
import { bindDrillWelcomeControls } from './features/drill/drill-welcome.js';
import {
  createDrillPianoToolsAppFacade,
  initializeDrillPianoControls
} from './features/drill/drill-piano-tools.js';
import { createDrillPianoToolsAppBindings } from './features/drill/drill-piano-tools-app-bindings.js';
import {
  applyDrillBeatIndicatorVisibility,
  applyDrillCurrentHarmonyVisibility,
  applyDrillDisplayMode,
  createDrillHarmonyDisplayHelpers,
  createDrillHarmonyLayoutHelpers,
  createDrillPreviewTimingHelpers,
  refreshDrillDisplayedHarmony,
  updateDrillKeyPickerLabels
} from './features/drill/drill-display-runtime.js';
import {
  loadDrillSettings,
  saveDrillSettings
} from './features/drill/drill-settings.js';
import { createDrillSettingsAppBindings } from './features/drill/drill-settings-app-bindings.js';
import { createDrillSettingsRuntimeAppBindings } from './features/drill/drill-settings-runtime-app-bindings.js';
import { createDrillSettingsAppAssembly } from './features/drill/drill-settings-app-assembly.js';
import { initializeAppShell } from './features/app/app-shell.js';
import { consumePendingDrillSessionIntoUi } from './features/drill/drill-session-import.js';
import { initializeDrillScreen } from './features/drill/drill-ui-shell.js';
import {
  initializeHarmonyDisplayObservers,
  initializeKeyPickerUi,
  initializeSocialShareLinks
} from './features/drill/drill-ui-runtime.js';
import { createDrillSharedPlaybackAppBindings } from './features/drill/drill-shared-playback-app-bindings.js';
import { createDrillSharedPlaybackRuntimeAppBindings } from './features/drill/drill-shared-playback-runtime-app-bindings.js';
import { createDrillSharedPlaybackAppAssembly } from './features/drill/drill-shared-playback-app-assembly.js';
import { createDrillPlaybackRuntimeAppBindings } from './features/drill/drill-playback-runtime-app-bindings.js';
import { createDrillPlaybackRuntimeHostAppBindings } from './features/drill/drill-playback-runtime-host-app-bindings.js';
import { createDrillPlaybackRuntimeAppHostAssembly } from './features/drill/drill-playback-runtime-app-host-assembly.js';
import { createDrillRuntimePrimitivesAppBindings } from './features/drill/drill-runtime-primitives-app-bindings.js';
import { createDrillRuntimePrimitivesRuntimeAppBindings } from './features/drill/drill-runtime-primitives-runtime-app-bindings.js';
import { createDrillRuntimePrimitivesAppAssembly } from './features/drill/drill-runtime-primitives-app-assembly.js';
import { createDrillRuntimeStateAppBindings } from './features/drill/drill-runtime-state-app-bindings.js';
import { createDrillRuntimeStateAppAssembly } from './features/drill/drill-runtime-state-app-assembly.js';

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

function stopPlaybackIfRunning() {
  if (!isPlaying) return;
  stop();
}

initializeKeyPickerUi({
  keyPicker: dom.keyPicker,
  keyPickerBackdrop: dom.keyPickerBackdrop,
  closeKeyPickerButton: dom.closeKeyPicker,
  selectedKeysSummary: dom.selectedKeysSummary,
  setKeyPickerOpen,
  stopPlaybackIfRunning,
  restoreAllKeysIfNoneSelectedOnClose
});

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

function normalizePatternMode(mode) {
  if (mode === 'major/minor') return PATTERN_MODE_BOTH;
  return [PATTERN_MODE_MAJOR, PATTERN_MODE_MINOR, PATTERN_MODE_BOTH].includes(mode)
    ? mode
    : PATTERN_MODE_MAJOR;
}

function normalizePresetName(name) {
  return String(name || '')
    .trim()
    .replace(/\s+/g, ' ');
}

function slugifyWelcomeStandardName(name) {
  return normalizePresetName(name)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'standard';
}

function parsePitchClassFromKeyName(name) {
  const normalized = String(name || '').trim();
  const match = normalized.match(/^([A-Ga-g])([b#]?)/);
  if (!match) return null;
  const letter = match[1].toUpperCase();
  const accidental = match[2] || '';
  let pitchClass = NOTE_LETTER_TO_SEMITONE[letter];
  if (!Number.isFinite(pitchClass)) return null;
  if (accidental === 'b') pitchClass = (pitchClass + 11) % 12;
  if (accidental === '#') pitchClass = (pitchClass + 1) % 12;
  return pitchClass;
}

function buildSingleEnabledKeySelectionFromPattern(pattern) {
  const match = String(pattern || '').match(/\bkey:\s*([A-G](?:b|#)?)/i);
  const pitchClass = parsePitchClassFromKeyName(match?.[1] || '');
  if (!Number.isFinite(pitchClass)) return [true, false, false, false, false, false, false, false, false, false, false, false];
  return Array.from({ length: 12 }, (_, index) => index === pitchClass);
}

function parseWelcomeStandardsText(text) {
  const entries = {};
  const lines = String(text || '').split(/\r?\n/);
  let pendingTempo = 120;

  // Accumulate multi-line entries: header on one line, bars on following lines
  let pendingName = null;
  let pendingMode = null;
  let pendingPatternParts = [];

  function flushPending() {
    if (!pendingName) return;
    const pattern = pendingPatternParts.join(' | ');
    const normalizedMode = normalizePatternMode(pendingMode);
    const keyMatch = pattern.match(/\bkey:\s*([A-G](?:b|#)?)/i);
    const keyName = keyMatch?.[1] || 'C';
    const isMinor = normalizedMode === PATTERN_MODE_MINOR;
    const keyPitchClass = parsePitchClassFromKeyName(keyName);
    const fallbackPitchClass = Number.isFinite(keyPitchClass) ? keyPitchClass : 0;
    entries[slugifyWelcomeStandardName(pendingName)] = {
      summary: `Suggested: ${pendingName}, single key, ${pendingTempo >= 140 ? 'up-tempo' : 'comfortable'} groove.`,
      patternName: pendingName,
      pattern,
      patternMode: normalizedMode,
      majorMinor: isMinor,
      repetitionsPerKey: 1,
      tempo: pendingTempo,
      chordsPerBar: 4,
      compingStyle: COMPING_STYLE_PIANO,
      enabledKeys: buildSingleEnabledKeySelectionFromPattern(pattern),
      sourcePitchClass: fallbackPitchClass
    };
    pendingName = null;
    pendingMode = null;
    pendingPatternParts = [];
  }

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('#')) {
      const tempoMatch = trimmed.match(/\bTempo:\s*(\d+)/i);
      if (tempoMatch) pendingTempo = Number.parseInt(tempoMatch[1], 10) || 120;
      continue;
    }
    if (!trimmed) {
      flushPending();
      continue;
    }

    const entryMatch = trimmed.match(/^([^|]+)\|([^|]+)\|(.*)$/);
    if (!entryMatch) continue;

    const col1 = entryMatch[1].trim();
    const col2 = entryMatch[2].trim();
    const col3 = entryMatch[3].trim();

    // Detect a header line: col2 is a mode word and col3 starts with "key:"
    const isHeader = /^(major|minor)$/i.test(col2) && /^key:/i.test(col3);
    if (isHeader) {
      flushPending();
      pendingName = col1;
      pendingMode = col2;
      pendingPatternParts = [col3];
      continue;
    }

    // If we have a pending entry, this is a continuation bars line
    if (pendingName) {
      // This line has bars separated by |, re-join them
      pendingPatternParts.push(trimmed);
      continue;
    }

    // Legacy single-line format fallback
    const patternName = col1;
    const rawMode = col2;
    const pattern = col3;
    const normalizedMode = normalizePatternMode(rawMode);
    const keyMatch = pattern.match(/\bkey:\s*([A-G](?:b|#)?)/i);
    const keyName = keyMatch?.[1] || 'C';
    const isMinor = normalizedMode === PATTERN_MODE_MINOR;
    const keyPitchClass = parsePitchClassFromKeyName(keyName);
    const fallbackPitchClass = Number.isFinite(keyPitchClass) ? keyPitchClass : 0;

    entries[slugifyWelcomeStandardName(patternName)] = {
      summary: `Suggested: ${patternName}, single key, ${pendingTempo >= 140 ? 'up-tempo' : 'comfortable'} groove.`,
      patternName,
      pattern,
      patternMode: normalizedMode,
      majorMinor: isMinor,
      repetitionsPerKey: 1,
      tempo: pendingTempo,
      chordsPerBar: 4,
      compingStyle: COMPING_STYLE_PIANO,
      enabledKeys: buildSingleEnabledKeySelectionFromPattern(pattern),
      sourcePitchClass: fallbackPitchClass
    };
  }

  flushPending();
  return entries;
}

function renderWelcomeStandardOptions() {
  if (!dom.welcomeStandardSelect) return;

  const previousValue = dom.welcomeStandardSelect.value;
  const entries = Object.entries(welcomeStandards);
  dom.welcomeStandardSelect.innerHTML = '';

  entries.forEach(([key, entry], index) => {
    const option = document.createElement('option');
    option.value = key;
    option.textContent = entry.patternName || key;
    if ((previousValue && previousValue === key) || (!previousValue && index === 0)) {
      option.selected = true;
    }
    dom.welcomeStandardSelect.append(option);
  });
}

async function loadWelcomeStandards() {
  try {
    const response = await fetch(`${REVIEW_STANDARD_CONVERSIONS_URL}?v=${encodeURIComponent(APP_VERSION)}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const parsed = parseWelcomeStandardsText(await response.text());
    if (Object.keys(parsed).length > 0) {
      welcomeStandards = parsed;
    }
  } catch (error) {
    welcomeStandards = { ...WELCOME_STANDARDS_FALLBACK };
  }

  renderWelcomeStandardOptions();
}

function normalizePresetNameForInput(name) {
  return String(name || '')
    .replace(/\s{2,}/g, ' ');
}

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function normalizeCompingStyle(style) {
  if (style === 'piano-one-hand' || style === 'piano-two-hand') return COMPING_STYLE_PIANO;
  return [
    COMPING_STYLE_OFF,
    COMPING_STYLE_STRINGS,
    COMPING_STYLE_PIANO
  ].includes(style)
    ? style
    : COMPING_STYLE_STRINGS;
}

function getPianoVoicingMode() {
  normalizeCompingStyle(dom.compingStyle?.value);
  return 'piano';
}

function normalizeRepetitionsPerKey(value) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return DEFAULT_REPETITIONS_PER_KEY;
  return Math.min(8, Math.max(1, parsed));
}

function getRepetitionsPerKey() {
  return normalizeRepetitionsPerKey(dom.repetitionsPerKey?.value);
}

function createProgressionEntry(pattern, mode = PATTERN_MODE_MAJOR, name = '') {
  return createProgressionEntryBase(
    pattern,
    normalizePatternMode,
    normalizePatternString,
    mode,
    name,
    normalizePresetName
  );
}

function normalizeProgressionEntry(name, entry) {
  return normalizeProgressionEntryBase(name, entry, {
    createEntry: createProgressionEntry,
    defaultMode: PATTERN_MODE_MAJOR
  });
}

function normalizeProgressionsMap(source) {
  return normalizeProgressionsMapBase(source, DEFAULT_PROGRESSIONS, normalizeProgressionEntry);
}

function parseDefaultProgressionsText(source) {
  return parseDefaultProgressionsTextBase(source, {
    createEntry: createProgressionEntry,
    isModeToken: isProgressionModeToken
  });
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
} = createDrillRuntimePrimitivesAppAssembly(createDrillRuntimePrimitivesAppBindings(createDrillRuntimePrimitivesRuntimeAppBindings({
  patternAnalysis: {
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
})));

function clearOneChordCycleState() {
  currentRawChords = [];
  nextRawChords = [];
  oneChordQualityPool = [];
  oneChordQualityPoolSignature = '';
  currentOneChordQualityValue = '';
  nextOneChordQualityValue = '';
}

function getDefaultProgressionsFingerprint(source = DEFAULT_PROGRESSIONS) {
  return JSON.stringify(
    Object.entries(source || {}).map(([name, entry]) => {
      const normalized = normalizeProgressionEntry(name, entry);
      return [name, normalized.name || '', normalized.mode || PATTERN_MODE_MAJOR];
    })
  );
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

function normalizeChordsPerBar(value) {
  return normalizeChordsPerBarBase(value);
}

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
} = createDrillRuntimePrimitivesAppAssembly(createDrillRuntimePrimitivesAppBindings(createDrillRuntimePrimitivesRuntimeAppBindings({
  playbackSettings: {
    dom,
    mixer: {
      getMixerNodes: () => mixerNodes,
      getAudioContext: () => audioCtx,
      applyAudioMixerSettings: (options) => applyDrillAudioMixerSettingsDelegate?.(options)
    },
    helpers: {
      normalizeCompingStyle
    },
    constants: {
      compingStyleOff: COMPING_STYLE_OFF,
      mixerChannelCalibration: MIXER_CHANNEL_CALIBRATION,
      drumModeOff: DRUM_MODE_OFF,
      bassLow: BASS_LOW
    }
  }
})));
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
const drillAudioRuntimeAssembly = createDrillAudioRuntimeAppAssembly(createDrillAudioRuntimeAppBindings({
  audioStack: {
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
    }
  },
  audioFacade: {
    getCurrentTime: () => audioCtx?.currentTime ?? 0,
    defaultFadeDuration: NOTE_FADEOUT
  }
}));
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

const compingEngine = createCompingEngine({
  ...createDrillCompingEngineAppBindings({
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
  }),
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
} = createDrillVoicingRuntime(createDrillVoicingRuntimeAppBindings({
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
}));

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

const walkingBassGenerator = createWalkingBassGenerator({
  ...createDrillWalkingBassAppBindings({
    constants: {
      BASS_LOW,
      BASS_HIGH
    }
  })
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
} = createDrillPlaybackResourcesAppAssembly({
  ...createDrillPlaybackResourcesAppBindings(createDrillPlaybackResourcesRuntimeAppBindings({
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
  }))
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
} = createDrillRuntimeStateAppAssembly(createDrillRuntimeStateAppBindings({
  keyPool: {
    getEnabledKeys: () => enabledKeys,
    getKeyPool: () => keyPool,
    setKeyPool: (value) => { keyPool = value; }
  }
})).keyPoolRuntime;

// ---- Display helpers ----

function getDisplayTranspositionSemitones() {
  return Number(dom.transpositionSelect?.value || 0);
}

function transposeDisplayPitchClass(pitchClass) {
  return (pitchClass + getDisplayTranspositionSemitones() + 12) % 12;
}

function keyName(key) {
  return buildDisplayedKeyName(key);
}

function keyNameHtml(key) {
  return buildDisplayedKeyNameHtml(key);
}

function renderPickerKeyHtml(value) {
  return buildPickerKeyHtml(value);
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
  keyName: buildDisplayedKeyName,
  keyNameHtml: buildDisplayedKeyNameHtml,
  renderPickerKeyHtml: buildPickerKeyHtml,
  degreeRootName: buildDegreeRootName,
  chordSymbol: buildChordSymbol,
  chordSymbolHtml: buildChordSymbolHtml,
  getChordSymbolRenderOptions: buildChordSymbolRenderOptions
} = createDrillHarmonyDisplayHelpers({
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
});
const {
  getRemainingBeatsUntilNextProgression: buildRemainingBeatsUntilNextProgression,
  shouldShowNextPreview: buildShouldShowNextPreview
} = createDrillPreviewTimingHelpers({
  getChordsPerBar,
  getSecondsPerBeat,
  getNextPreviewLeadSeconds,
  getCurrentChordIdx: () => currentChordIdx,
  getCurrentBeat: () => currentBeat,
  getChordCount: () => paddedChords.length
});
const {
  applyDisplaySideLayout: applySharedDisplaySideLayout,
  fitChordDisplay: fitSharedChordDisplay,
  refreshChordDisplayLayout: refreshSharedChordDisplayLayout,
  fitHarmonyDisplay: fitSharedHarmonyDisplay
} = createDrillHarmonyLayoutHelpers({
  requestAnimationFrameImpl: (callback) => window.requestAnimationFrame(callback),
  getDisplayElement: () => document.getElementById('display'),
  getChordDisplayElement: () => dom.chordDisplay,
  getNextChordDisplayElement: () => dom.nextChordDisplay,
  getBaseChordDisplaySize,
  isCurrentHarmonyHidden
});

function getDisplayedBassName(key, chord, isMinor) {
  if (!chord || (chord.bassSemitones ?? chord.semitones) === chord.semitones) return null;
  return normalizeDisplayedRootName(
    degreeRootName(transposeDisplayPitchClass(key), chord.roman, chord.bassSemitones, isMinor)
  );
}

function chordSymbol(key, chord, isMinorOverride = null, nextChord = null) {
  return buildChordSymbol(key, chord, isMinorOverride, nextChord);
}

function chordSymbolHtml(key, chord, isMinorOverride = null, nextChord = null) {
  return buildChordSymbolHtml(key, chord, isMinorOverride, nextChord);
}

function getChordSymbolRenderOptions() {
  return buildChordSymbolRenderOptions();
}

function refreshChordDisplayLayout(element, baseRem) {
  if (!element) return;
  fitChordDisplay(element, baseRem);
}

// Compute the displayed note name from the parsed pitch class so display matches playback.
function degreeRootName(keyIndex, roman, semitoneOffset, isMinor) {
  return buildDegreeRootName(keyIndex, roman, semitoneOffset, isMinor);
}

function showNextCol() {
  dom.nextHeader.textContent = 'Next';
  dom.nextHeader.classList.remove('hidden');
  dom.nextKeyDisplay.classList.remove('hidden');
  dom.nextChordDisplay.classList.remove('hidden');
  fitHarmonyDisplay();
}
function hideNextCol() {
  dom.nextHeader.textContent = '';
  dom.nextHeader.classList.add('hidden');
  dom.nextKeyDisplay.classList.add('hidden');
  dom.nextChordDisplay.classList.add('hidden');
  fitHarmonyDisplay();
}

function setDisplayPlaceholderVisible(visible) {
  dom.displayPlaceholder?.classList.toggle('hidden', !visible);
  dom.reopenWelcome?.classList.toggle('hidden', !visible);
}

function setDisplayPlaceholderMessage(message = DEFAULT_DISPLAY_PLACEHOLDER_MESSAGE) {
  if (!dom.displayPlaceholderMessage) return;
  dom.displayPlaceholderMessage.textContent = message;
}

setDisplayPlaceholderMessage();

function getRemainingBeatsUntilNextProgression(chordIndex = currentChordIdx, beatInMeasure = currentBeat, chordCount = paddedChords.length) {
  return buildRemainingBeatsUntilNextProgression(chordIndex, beatInMeasure, chordCount);
}

function shouldShowNextPreview(currentKeyValue, upcomingKeyValue, remainingBeats = getRemainingBeatsUntilNextProgression()) {
  return buildShouldShowNextPreview(currentKeyValue, upcomingKeyValue, remainingBeats);
}

function applyDisplaySideLayout() {
  applySharedDisplaySideLayout();
}

function fitChordDisplay(element, baseRem) {
  fitSharedChordDisplay(element, baseRem);
}

function getBaseChordDisplaySize() {
  const mode = normalizeDisplayMode(dom.displayMode?.value);
  const isMobile = window.matchMedia('(max-width: 720px)').matches;

  if (mode === DISPLAY_MODE_CHORDS_ONLY) {
    return isMobile ? 3.5 : 6;
  }
  return isMobile ? 3.0 : 5;
}

function fitHarmonyDisplay() {
  fitSharedHarmonyDisplay();
}

function updateBeatDots(beat, isIntro) {
  dom.beatDots.forEach((dot, i) => {
    dot.classList.toggle('active', i === beat && !isIntro);
    dot.classList.toggle('intro', i === beat && isIntro);
  });
}

function clearBeatDots() {
  dom.beatDots.forEach(d => { d.classList.remove('active', 'intro'); });
}

function applyBeatIndicatorVisibility() {
  applyDrillBeatIndicatorVisibility({
    beatIndicator: dom.beatIndicator,
    showBeatIndicatorEnabled: dom.showBeatIndicator?.checked !== false
  });
}

function isCurrentHarmonyHidden() {
  return dom.hideCurrentHarmony?.checked === true;
}

function applyCurrentHarmonyVisibility() {
  applyDrillCurrentHarmonyVisibility({
    displayElement: document.getElementById('display'),
    currentHarmonyHidden: isCurrentHarmonyHidden()
  });
}

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

function normalizeNextPreviewUnit(unit) {
  return unit === NEXT_PREVIEW_UNIT_SECONDS ? NEXT_PREVIEW_UNIT_SECONDS : NEXT_PREVIEW_UNIT_BARS;
}

function normalizeNextPreviewLeadValue(value) {
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed)) return DEFAULT_NEXT_PREVIEW_LEAD_BARS;
  return Math.min(32, Math.max(0, Math.round(parsed * 100) / 100));
}

function formatPreviewNumber(value, maximumFractionDigits = 2) {
  const rounded = Math.round(Number(value || 0) * 100) / 100;
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits,
    minimumFractionDigits: 0
  }).format(rounded);
}

function barsToSeconds(bars) {
  return normalizeNextPreviewLeadValue(bars) * 4 * getSecondsPerBeat();
}

function secondsToBars(seconds) {
  const parsed = Number.parseFloat(seconds);
  if (!Number.isFinite(parsed)) return nextPreviewLeadUnit === NEXT_PREVIEW_UNIT_BARS ? nextPreviewLeadValue : DEFAULT_NEXT_PREVIEW_LEAD_BARS;
  return normalizeNextPreviewLeadValue(parsed / (4 * getSecondsPerBeat()));
}

function getNextPreviewInputUnit() {
  return nextPreviewLeadUnit;
}

function setNextPreviewInputUnit(unit) {
  nextPreviewLeadUnit = normalizeNextPreviewUnit(unit);
  if (!dom.nextPreviewUnitToggle) return;
  dom.nextPreviewUnitToggle.checked = nextPreviewLeadUnit === NEXT_PREVIEW_UNIT_SECONDS;
}

function getNextPreviewLeadSeconds() {
  return nextPreviewLeadUnit === NEXT_PREVIEW_UNIT_SECONDS
    ? nextPreviewLeadValue
    : barsToSeconds(nextPreviewLeadValue);
}

function getNextPreviewLeadBars() {
  return nextPreviewLeadUnit === NEXT_PREVIEW_UNIT_BARS
    ? nextPreviewLeadValue
    : secondsToBars(nextPreviewLeadValue);
}

function formatBarsLabel(value) {
  return `${formatPreviewNumber(value)} ${value === 1 ? 'bar' : 'bars'}`;
}

function syncNextPreviewControlDisplay() {
  const unit = getNextPreviewInputUnit();
  if (dom.nextPreviewValue) {
    dom.nextPreviewValue.value = formatPreviewNumber(nextPreviewLeadValue, unit === NEXT_PREVIEW_UNIT_SECONDS ? 1 : 2);
    dom.nextPreviewValue.step = unit === NEXT_PREVIEW_UNIT_SECONDS ? '0.1' : '0.25';
  }
  if (dom.nextPreviewHint) {
    const tempo = Number(dom.tempoSlider?.value || 120);
    dom.nextPreviewHint.textContent = unit === NEXT_PREVIEW_UNIT_SECONDS
      ? `${formatBarsLabel(getNextPreviewLeadBars())} at ${tempo} BPM`
      : `${formatPreviewNumber(getNextPreviewLeadSeconds(), 1)} seconds at ${tempo} BPM`;
  }
}

function commitNextPreviewValueFromInput() {
  const rawValue = Number.parseFloat(dom.nextPreviewValue?.value ?? '');
  if (!Number.isFinite(rawValue)) {
    syncNextPreviewControlDisplay();
    return;
  }
  nextPreviewLeadValue = normalizeNextPreviewLeadValue(rawValue);
  syncNextPreviewControlDisplay();
  refreshDisplayedHarmony();
}

function convertNextPreviewValueToUnit(nextUnit) {
  const normalizedNextUnit = normalizeNextPreviewUnit(nextUnit);
  if (normalizedNextUnit === nextPreviewLeadUnit) return;

  const valueInSeconds = getNextPreviewLeadSeconds();
  nextPreviewLeadUnit = normalizedNextUnit;
  nextPreviewLeadValue = normalizedNextUnit === NEXT_PREVIEW_UNIT_SECONDS
    ? normalizeNextPreviewLeadValue(valueInSeconds)
    : secondsToBars(valueInSeconds);
}

function toAnalyticsToken(value, fallback = 'unknown') {
  const normalized = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return normalized || fallback;
}

function getEnabledKeyCount() {
  return enabledKeys.filter(Boolean).length;
}

function persistKeySelectionPreset() {
  saveStoredKeySelectionPreset(savedKeySelectionPreset);
}

function syncSelectedKeysSummary() {
  if (!dom.selectedKeysSummary) return;

  const selectedKeys = enabledKeys
    .map((isEnabled, index) => (isEnabled ? keyLabelForPicker(index) : ''))
    .filter(Boolean);

  if (selectedKeys.length === 0) {
    dom.selectedKeysSummary.textContent = 'Keys: none';
    dom.selectedKeysSummary.setAttribute('aria-label', 'Open key selection. Current selection: none');
    return;
  }

  if (selectedKeys.length === 12) {
    dom.selectedKeysSummary.textContent = 'Keys: all (click to select)';
    dom.selectedKeysSummary.setAttribute('aria-label', 'Open key selection. Current selection: all. Click to select keys.');
    return;
  }

  dom.selectedKeysSummary.innerHTML = `Keys: ${selectedKeys.map(renderPickerKeyHtml).join(' &middot; ')}`;
  dom.selectedKeysSummary.setAttribute('aria-label', `Open key selection. Current selection: ${selectedKeys.join(', ')}`);
}

function restoreAllKeysIfNoneSelectedOnClose() {
  if (getEnabledKeyCount() !== 0) return;
  applyEnabledKeys(enabledKeys.map(() => true));
  saveSettings();
}

function isBlackDisplayPitchClass(pitchClass) {
  return Object.prototype.hasOwnProperty.call(PIANO_BLACK_KEY_COLUMNS, pitchClass);
}

function updateKeyCheckboxVisualState(label, checkbox, keyIndex) {
  const displayPitchClass = transposeDisplayPitchClass(keyIndex);
  const isBlackKey = isBlackDisplayPitchClass(displayPitchClass);
  const text = label.querySelector('.key-checkbox-text');

  label.classList.toggle('is-selected', checkbox.checked);
  label.classList.toggle('key-checkbox-black', isBlackKey);
  label.classList.toggle('key-checkbox-white', !isBlackKey);
  label.style.gridRow = isBlackKey ? '1' : '2';
  label.style.gridColumn = String(
    isBlackKey
      ? PIANO_BLACK_KEY_COLUMNS[displayPitchClass]
      : PIANO_WHITE_KEY_COLUMNS[displayPitchClass]
  );

  if (text) {
    text.innerHTML = renderAccidentalTextHtml(keyLabelForPicker(keyIndex));
  }
}

function syncKeyCheckboxStates() {
  dom.keyCheckboxes.querySelectorAll('.key-checkbox-label').forEach((label, index) => {
    const checkbox = label.querySelector('input[type="checkbox"]');
    if (!checkbox) return;
    checkbox.checked = enabledKeys[index];
    updateKeyCheckboxVisualState(label, checkbox, index);
  });
}

function applyEnabledKeys(nextEnabledKeys) {
  if (!Array.isArray(nextEnabledKeys) || nextEnabledKeys.length !== 12) return;
  enabledKeys = nextEnabledKeys.map(Boolean);
  keyPool = [];
  syncKeyCheckboxStates();
  syncSelectedKeysSummary();
}

function saveCurrentKeySelectionPreset() {
  savedKeySelectionPreset = enabledKeys.map(Boolean);
  persistKeySelectionPreset();
  trackEvent('key_preset_saved', {
    enabled_keys: getEnabledKeyCount()
  });
}

function loadKeySelectionPreset() {
  if (!Array.isArray(savedKeySelectionPreset) || savedKeySelectionPreset.length !== 12) {
    window.alert('No saved key preset yet.');
    return;
  }

  applyEnabledKeys(savedKeySelectionPreset);
  saveSettings();
  trackEvent('key_preset_loaded', {
    enabled_keys: getEnabledKeyCount()
  });
}

function getCheckedInputValue(name, fallback = '') {
  return document.querySelector(`input[name="${name}"]:checked`)?.value || fallback;
}

function setWelcomeOverlayVisible(isVisible) {
  if (!dom.welcomeOverlay) return;
  if (!isVisible) {
    const activeElement = document.activeElement;
    if (activeElement instanceof HTMLElement && dom.welcomeOverlay.contains(activeElement)) {
      const nextFocusTarget = dom.reopenWelcome || dom.startStop || document.body;
      if (nextFocusTarget instanceof HTMLElement) {
        nextFocusTarget.focus();
      } else {
        activeElement.blur();
      }
    }
  }
  dom.welcomeOverlay.classList.toggle('hidden', !isVisible);
  dom.welcomeOverlay.setAttribute('aria-hidden', isVisible ? 'false' : 'true');
  dom.welcomeOverlay.toggleAttribute('inert', !isVisible);
  document.body.classList.toggle('welcome-open', isVisible);
  if (isVisible) {
    window.requestAnimationFrame(() => {
      dom.welcomeApply?.focus();
    });
  }
}

function getSelectedWelcomeRecommendation() {
  const goal = getCheckedInputValue('welcome-goal', WELCOME_GOAL_PROGRESSION);
  const instrument = getCheckedInputValue('welcome-instrument', '0');

  const baseConfig = createDefaultAppSettings({
    goal,
    instrument
  });

  if (goal === WELCOME_GOAL_ONE_CHORD) {
    const quality = getCheckedInputValue('welcome-one-chord', 'maj7');
    return {
      ...baseConfig,
      ...WELCOME_ONE_CHORDS[quality],
      customMediumSwingBass: false,
      nextPreviewLeadValue: 2,
      nextPreviewUnit: NEXT_PREVIEW_UNIT_BARS
    };
  }

  if (goal === WELCOME_GOAL_STANDARD) {
    const standard = dom.welcomeStandardSelect?.value || Object.keys(welcomeStandards)[0] || 'all-the-things-you-are';
    return {
      ...baseConfig,
      ...(welcomeStandards[standard] || WELCOME_STANDARDS_FALLBACK[standard] || Object.values(welcomeStandards)[0] || Object.values(WELCOME_STANDARDS_FALLBACK)[0]),
      enabledKeys: [...createDefaultAppSettings().enabledKeys]
    };
  }

  const progression = getCheckedInputValue('welcome-progression', 'ii-v-i-major');
  return {
    ...baseConfig,
    ...WELCOME_PROGRESSIONS[progression]
  };
}

function updateWelcomePanelVisibility() {
  const goal = getCheckedInputValue('welcome-goal', WELCOME_GOAL_PROGRESSION);
  dom.welcomeGoalPanels?.forEach((panel) => {
    panel.classList.toggle('hidden', panel.dataset.welcomePanel !== goal);
  });
}

function updateWelcomeSummary() {
  const recommendation = getSelectedWelcomeRecommendation();
  if (dom.welcomeSummary) {
    dom.welcomeSummary.textContent = recommendation.summary || 'Suggested preset: moderate tempo and adapted playback settings.';
  }
}

function markWelcomeOnboardingCompleted() {
  hasCompletedWelcomeOnboarding = true;
}

function syncWelcomeShowNextTimePreference() {
  shouldShowWelcomeNextTime = dom.welcomeShowNextTime?.checked !== false;
}

function applyWelcomeRecommendation() {
  const recommendation = getSelectedWelcomeRecommendation();

  clearProgressionEditingState();
  closeProgressionManager();

  suppressPatternSelectChange = true;
  if (recommendation.presetName) {
    setPatternSelectValue(recommendation.presetName);
    dom.patternName.value = getSelectedProgressionName();
    dom.customPattern.value = getSelectedProgressionPattern();
    setEditorPatternMode(getSelectedProgressionMode());
  } else {
    progressionSelectionBeforeEditing = Object.keys(progressions)[0] || '';
    isCreatingProgression = true;
    setPatternSelectValue(CUSTOM_PATTERN_OPTION_VALUE);
    dom.patternName.value = recommendation.patternName || '';
    dom.customPattern.value = recommendation.pattern || '';
    setEditorPatternMode(recommendation.patternMode || PATTERN_MODE_BOTH);
    syncPatternSelectionFromInput();
  }
  suppressPatternSelectChange = false;
  lastPatternSelectValue = dom.patternSelect.value;

  dom.majorMinor.checked = Boolean(recommendation.majorMinor);
  dom.transpositionSelect.value = String(recommendation.instrument || '0');
  dom.tempoSlider.value = String(recommendation.tempo || 120);
  dom.tempoValue.textContent = dom.tempoSlider.value;
  if (dom.repetitionsPerKey) {
    dom.repetitionsPerKey.value = String(normalizeRepetitionsPerKey(recommendation.repetitionsPerKey));
  }
  if (dom.chordsPerBar) {
    const recommendedChordsPerBar = recommendation.chordsPerBar !== undefined
      ? recommendation.chordsPerBar
      : (recommendation.doubleTime ? 2 : DEFAULT_CHORDS_PER_BAR);
    dom.chordsPerBar.value = String(normalizeChordsPerBar(recommendedChordsPerBar));
    syncDoubleTimeToggle();
  }
  if (dom.compingStyle) {
    dom.compingStyle.value = normalizeCompingStyle(recommendation.compingStyle);
  }
  if (dom.walkingBass) {
    dom.walkingBass.checked = recommendation.customMediumSwingBass !== false;
  }
  if (dom.drumsSelect) {
    dom.drumsSelect.value = recommendation.drumsMode || DRUM_MODE_FULL_SWING;
  }
  if (dom.displayMode) {
    dom.displayMode.value = normalizeDisplayMode(recommendation.displayMode);
  }
  if (dom.showBeatIndicator) {
    dom.showBeatIndicator.checked = recommendation.showBeatIndicator !== false;
  }
  if (dom.hideCurrentHarmony) {
    dom.hideCurrentHarmony.checked = recommendation.hideCurrentHarmony === true;
  }
  if (dom.masterVolume) dom.masterVolume.value = recommendation.masterVolume || '100';
  if (dom.bassVolume) dom.bassVolume.value = recommendation.bassVolume || '100';
  if (dom.stringsVolume) dom.stringsVolume.value = recommendation.stringsVolume || '100';
  if (dom.drumsVolume) dom.drumsVolume.value = recommendation.drumsVolume || '100';

  nextPreviewLeadValue = normalizeNextPreviewLeadValue(recommendation.nextPreviewLeadValue);
  setNextPreviewInputUnit(recommendation.nextPreviewUnit);
  applyEnabledKeys(
    Array.isArray(recommendation.enabledKeys) && recommendation.enabledKeys.length === 12
      ? recommendation.enabledKeys
      : new Array(12).fill(true)
  );

  syncCustomPatternUI();
  normalizeChordsPerBarForCurrentPattern();
  syncProgressionManagerState();
  applyPatternModeAvailability();
  validateCustomPattern();
  syncPatternPreview();
  syncNextPreviewControlDisplay();
  applyDisplayMode();
  applyBeatIndicatorVisibility();
  applyCurrentHarmonyVisibility();
  applyMixerSettings();
  updateKeyPickerLabels();
  refreshDisplayedHarmony();

  syncWelcomeShowNextTimePreference();
  markWelcomeOnboardingCompleted();
  saveSettings();
  setWelcomeOverlayVisible(false);
  start();

  trackEvent('welcome_preset_applied', {
    welcome_goal: recommendation.goal,
    welcome_progression: getCheckedInputValue('welcome-progression', 'ii-v-i-major'),
    welcome_one_chord: getCheckedInputValue('welcome-one-chord', 'maj7'),
    welcome_standard: dom.welcomeStandardSelect?.value || '',
    transposition: recommendation.instrument || '0',
    progression_mode: recommendation.majorMinor ? 'minor' : 'major'
  });
}

function skipWelcomeOverlay() {
  syncWelcomeShowNextTimePreference();
  markWelcomeOnboardingCompleted();
  saveSettings();
  setWelcomeOverlayVisible(false);
  trackEvent('welcome_skipped');
}

function maybeShowWelcomeOverlay() {
  if (IS_EMBEDDED_DRILL_MODE) return;
  if (!shouldShowWelcomeNextTime || !dom.welcomeOverlay) return;
  updateWelcomePanelVisibility();
  updateWelcomeSummary();
  setWelcomeOverlayVisible(true);
}

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
} = createDrillRuntimeStateAppAssembly(createDrillRuntimeStateAppBindings({
  sessionAnalytics: {
    dom,
    state: {
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
    helpers: {
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
    constants: {
      oneChordDefaultQualities: ONE_CHORD_DEFAULT_QUALITIES,
      oneChordDominantQualities: ONE_CHORD_DOMINANT_QUALITIES
    }
  }
})).sessionAnalytics;


const progressionEditorState = {
  get progressions() { return progressions; },
  set progressions(value) { progressions = value; },
  get editingProgressionName() { return editingProgressionName; },
  set editingProgressionName(value) { editingProgressionName = value; },
  get editingProgressionSnapshot() { return editingProgressionSnapshot; },
  set editingProgressionSnapshot(value) { editingProgressionSnapshot = value; },
  get progressionSelectionBeforeEditing() { return progressionSelectionBeforeEditing; },
  set progressionSelectionBeforeEditing(value) { progressionSelectionBeforeEditing = value; },
  get isCreatingProgression() { return isCreatingProgression; },
  set isCreatingProgression(value) { isCreatingProgression = value; },
  get isManagingProgressions() { return isManagingPresets; },
  set isManagingProgressions(value) { isManagingPresets = value; },
  get lastStandaloneCustomName() { return lastStandaloneCustomName; },
  set lastStandaloneCustomName(value) { lastStandaloneCustomName = value; },
  get lastStandaloneCustomPattern() { return lastStandaloneCustomPattern; },
  set lastStandaloneCustomPattern(value) { lastStandaloneCustomPattern = value; },
  get lastStandaloneCustomMode() { return lastStandaloneCustomMode; },
  set lastStandaloneCustomMode(value) { lastStandaloneCustomMode = value; },
  get suppressPatternSelectChange() { return suppressPatternSelectChange; },
  set suppressPatternSelectChange(value) { suppressPatternSelectChange = value; },
  get keyPool() { return keyPool; },
  set keyPool(value) { keyPool = value; }
};

const {
  applyPatternModeAvailability,
  clearProgressionEditingState,
  closeProgressionManager,
  getCurrentPatternMode,
  getCurrentPatternName,
  getCurrentPatternString,
  getPatternModeLabel,
  getProgressionEntry,
  getProgressionLabel,
  getSelectedProgressionMode,
  getSelectedProgressionName,
  getSelectedProgressionPattern,
  hasSelectedProgression,
  hasStandaloneCustomDraft,
  isCustomPatternSelected,
  isEditingProgression: isEditingPreset,
  rememberStandaloneCustomDraft,
  resetStandaloneCustomDraft,
  setEditorPatternMode,
  setPatternSelectValue,
  syncCustomPatternUI,
  syncPatternPreview,
  syncPatternSelectionFromInput
} = createProgressionEditor({
  dom,
  state: progressionEditorState,
  constants: {
    CUSTOM_PATTERN_OPTION_VALUE,
    PATTERN_MODE_BOTH,
    PATTERN_MODE_MAJOR,
    PATTERN_MODE_MINOR,
    ONE_CHORD_DEFAULT_QUALITIES,
    ONE_CHORD_DOMINANT_QUALITIES
  },
  helpers: {
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
  }
});

const progressionManagerState = {
  get progressions() { return progressions; },
  set progressions(value) { progressions = value; },
  get isManagingProgressions() { return isManagingPresets; },
  set isManagingProgressions(value) { isManagingPresets = value; },
  get suppressListRender() { return suppressListRender; },
  set suppressListRender(value) { suppressListRender = value; },
  get draggedProgressionName() { return draggedPresetName; },
  set draggedProgressionName(value) { draggedPresetName = value; },
  get pendingProgressionDeletion() { return pendingPresetDeletion; },
  set pendingProgressionDeletion(value) { pendingPresetDeletion = value; },
  get editingProgressionName() { return editingProgressionName; },
  set editingProgressionName(value) { editingProgressionName = value; },
  get editingProgressionSnapshot() { return editingProgressionSnapshot; },
  set editingProgressionSnapshot(value) { editingProgressionSnapshot = value; },
  get progressionSelectionBeforeEditing() { return progressionSelectionBeforeEditing; },
  set progressionSelectionBeforeEditing(value) { progressionSelectionBeforeEditing = value; },
  get isCreatingProgression() { return isCreatingProgression; },
  set isCreatingProgression(value) { isCreatingProgression = value; },
  get appliedDefaultProgressionsFingerprint() { return appliedDefaultProgressionsFingerprint; },
  set appliedDefaultProgressionsFingerprint(value) { appliedDefaultProgressionsFingerprint = value; },
  get acknowledgedDefaultProgressionsVersion() { return acknowledgedDefaultProgressionsVersion; },
  set acknowledgedDefaultProgressionsVersion(value) { acknowledgedDefaultProgressionsVersion = value; },
  get shouldPromptForDefaultProgressionsUpdate() { return shouldPromptForDefaultProgressionsUpdate; },
  set shouldPromptForDefaultProgressionsUpdate(value) { shouldPromptForDefaultProgressionsUpdate = value; },
  get defaultProgressionsVersion() { return defaultProgressionsVersion; },
  set defaultProgressionsVersion(value) { defaultProgressionsVersion = value; },
  get defaultProgressions() { return DEFAULT_PROGRESSIONS; },
  set defaultProgressions(value) { DEFAULT_PROGRESSIONS = value; },
  get lastStandaloneCustomName() { return lastStandaloneCustomName; },
  set lastStandaloneCustomName(value) { lastStandaloneCustomName = value; },
  get lastStandaloneCustomPattern() { return lastStandaloneCustomPattern; },
  set lastStandaloneCustomPattern(value) { lastStandaloneCustomPattern = value; },
  get lastStandaloneCustomMode() { return lastStandaloneCustomMode; },
  set lastStandaloneCustomMode(value) { lastStandaloneCustomMode = value; },
  get lastPatternSelectValue() { return lastPatternSelectValue; },
  set lastPatternSelectValue(value) { lastPatternSelectValue = value; }
};

const {
  cancelProgressionEdit,
  clearAllProgressions,
  clearProgressionManagerDropMarkers,
  deleteProgressionByName,
  deleteProgressionInline,
  deleteSelectedProgression,
  duplicateProgression,
  editSelectedProgression,
  getProgressionNames,
  markDefaultProgressionsPromptHandled,
  mergeUpdatedDefaultProgressions,
  promptForUpdatedDefaultProgressions,
  refreshProgressionUIAfterChange,
  renderProgressionManagerList,
  renderProgressionOptions,
  replaceProgressionsWithDefaultList,
  restoreDefaultProgressions,
  saveCurrentProgression,
  setProgressionFeedback,
  setProgressionUpdateModalVisibility,
  startNewProgression,
  syncProgressionManagerPanel,
  syncProgressionManagerState,
  toggleProgressionManager,
  undoProgressionDeletion
} = createProgressionManager({
  dom,
  state: progressionManagerState,
  constants: {
    CUSTOM_PATTERN_OPTION_VALUE
  },
  helpers: {
    applyPatternModeAvailability,
    clearProgressionEditingState,
    createProgressionEntry,
    getCurrentPatternMode,
    getCurrentPatternName,
    getDefaultProgressionsFingerprint,
    getProgressionEntry,
    getProgressionLabel,
    getSelectedProgressionMode,
    getSelectedProgressionName,
    getSelectedProgressionPattern,
    hasSelectedProgression,
    hasStandaloneCustomDraft,
    isEditingProgression: isEditingPreset,
    normalizePatternMode,
    normalizePatternString,
    normalizeProgressionEntry,
    normalizeProgressionsMap,
    resetStandaloneCustomDraft,
    saveSettings,
    setEditorPatternMode,
    setPatternSelectValue,
    syncCustomPatternUI,
    syncPatternSelectionFromInput,
    trackEvent,
    trackProgressionEvent,
    validateCustomPattern
  }
});

bindProgressionControls({
  dom,
  constants: {
    PATTERN_MODE_BOTH,
    PATTERN_MODE_MAJOR,
    PATTERN_MODE_MINOR
  },
  state: {
    get suppressPatternSelectChange() { return suppressPatternSelectChange; },
    set suppressPatternSelectChange(value) { suppressPatternSelectChange = value; },
    get lastPatternSelectValue() { return lastPatternSelectValue; },
    set lastPatternSelectValue(value) { lastPatternSelectValue = value; },
    get keyPool() { return keyPool; },
    set keyPool(value) { keyPool = value; }
  },
  helpers: {
    applyPatternModeAvailability,
    cancelProgressionEdit,
    clearAllProgressions,
    clearOneChordCycleState,
    clearProgressionEditingState,
    closeProgressionManager,
    ensureSessionStarted,
    getProgressionAnalyticsProps,
    getSelectedProgressionMode,
    getSelectedProgressionName,
    getSelectedProgressionPattern,
    isCustomPatternSelected,
    isEditingProgression: isEditingPreset,
    isOneChordModeActive,
    markDefaultProgressionsPromptHandled,
    mergeUpdatedDefaultProgressions,
    normalizePatternString,
    normalizePresetName,
    normalizePresetNameForInput,
    refreshDisplayedHarmony,
    registerSessionAction,
    rememberStandaloneCustomDraft,
    replaceProgressionsWithDefaultList,
    restoreDefaultProgressions,
    saveCurrentProgression,
    setEditorPatternMode,
    normalizeChordsPerBarForCurrentPattern,
    setProgressionFeedback,
    stopPlaybackIfRunning,
    startNewProgression,
    syncCustomPatternUI,
    syncPatternPreview,
    syncPatternSelectionFromInput,
    syncProgressionManagerState,
    toggleProgressionManager,
    toAnalyticsToken,
    trackEvent,
    trackProgressionEvent,
    updateKeyPickerLabels,
    validateCustomPattern
  }
});

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
  start,
  stop,
  togglePause
} = createDrillPlaybackRuntimeAppHostAssembly({
  dom,
  ...createDrillPlaybackRuntimeHostAppBindings(createDrillPlaybackRuntimeAppBindings({
    state: {
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
    audio: {
    getAudioContext: () => audioCtx,
    setAudioContext: (value) => { audioCtx = value; },
    getActiveNoteGain: () => activeNoteGain,
    setActiveNoteGain: (value) => { activeNoteGain = value; }
  },
    preload: {
    getPendingDisplayTimeouts: getDrillPendingDisplayTimeouts,
    getNearTermSamplePreloadPromise: getDrillNearTermSamplePreloadPromise,
    setNearTermSamplePreloadPromise: setDrillNearTermSamplePreloadPromise,
    getStartupSamplePreloadInProgress: getDrillStartupSamplePreloadInProgress,
    setStartupSamplePreloadInProgress: setDrillStartupSamplePreloadInProgress
  },
    constants: {
    scheduleAhead: SCHEDULE_AHEAD,
    noteFadeout: NOTE_FADEOUT,
    scheduleInterval: SCHEDULE_INTERVAL
  },
    helpers: {
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
  }))
});

// ---- UI Wiring ----

// ---- Key Picker ----

function buildKeyCheckboxes() {
  buildDrillKeyCheckboxes({
    keyCheckboxes: dom.keyCheckboxes,
    enabledKeys,
    updateKeyCheckboxVisualState,
    syncSelectedKeysSummary,
    onKeyChange: ({ index, checked, label, checkbox }) => {
      enabledKeys[index] = checked;
      updateKeyCheckboxVisualState(label, checkbox, index);
      keyPool = [];
      syncSelectedKeysSummary();
      saveSettings();
      trackEvent('key_selection_changed', {
        enabled_keys: getEnabledKeyCount(),
        key_index: index,
        key_state: checked ? 'enabled' : 'disabled'
      });
    }
  });
}

function setAllKeysEnabled(isEnabled) {
  setAllDrillKeysEnabled({
    enabledKeys,
    applyEnabledKeys,
    saveSettings,
    isEnabled
  });
}

function invertKeysEnabled() {
  invertDrillKeysEnabled({
    enabledKeys,
    applyEnabledKeys,
    saveSettings
  });
}

function keyLabelForPicker(majorIndex) {
  return KEY_NAMES_MAJOR[transposeDisplayPitchClass(majorIndex)];
}

function updateKeyPickerLabels() {
  updateDrillKeyPickerLabels({
    keyCheckboxes: dom.keyCheckboxes,
    updateKeyCheckboxVisualState,
    syncSelectedKeysSummary
  });
}

function refreshDisplayedHarmony() {
  refreshDrillDisplayedHarmony({
    isPlaying,
    isIntro,
    currentKey,
    nextKeyValue,
    currentChordIdx,
    paddedChords,
    nextRawChords,
    getRemainingBeatsUntilNextProgression,
    shouldShowNextPreview,
    keyNameHtml,
    chordSymbolHtml,
    showNextCol,
    hideNextCol,
    keyDisplay: dom.keyDisplay,
    chordDisplay: dom.chordDisplay,
    nextKeyDisplay: dom.nextKeyDisplay,
    nextChordDisplay: dom.nextChordDisplay,
    applyDisplaySideLayout,
    applyCurrentHarmonyVisibility,
    fitHarmonyDisplay
  });
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
const DISPLAY_MODE_SHOW_BOTH = 'show-both';
const DISPLAY_MODE_CHORDS_ONLY = 'chords-only';
const DISPLAY_MODE_KEY_ONLY = 'key-only';
const HARMONY_DISPLAY_MODE_DEFAULT = 'default';
const HARMONY_DISPLAY_MODE_RICH = 'rich';

function normalizeDisplayMode(mode) {
  return [
    DISPLAY_MODE_SHOW_BOTH,
    DISPLAY_MODE_CHORDS_ONLY,
    DISPLAY_MODE_KEY_ONLY
  ].includes(mode)
    ? mode
    : DISPLAY_MODE_SHOW_BOTH;
}

function normalizeHarmonyDisplayMode(mode) {
  return [
    HARMONY_DISPLAY_MODE_DEFAULT,
    HARMONY_DISPLAY_MODE_RICH
  ].includes(mode)
    ? mode
    : HARMONY_DISPLAY_MODE_DEFAULT;
}

const {
  createDefaultAppSettings,
  buildSettingsSnapshot,
  applyLoadedSettings,
  finalizeLoadedSettings,
  resetPlaybackSettings
} = createDrillSettingsAppAssembly(createDrillSettingsAppBindings(createDrillSettingsRuntimeAppBindings({
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
  snapshot: {
    constants: {
      welcomeOnboardingSettingsKey: WELCOME_ONBOARDING_SETTINGS_KEY,
      welcomeShowNextTimeSettingsKey: WELCOME_SHOW_NEXT_TIME_SETTINGS_KEY,
      welcomeVersionSettingsKey: WELCOME_VERSION_SETTINGS_KEY,
      welcomeVersion: WELCOME_VERSION
    },
    dom,
    state: {
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
    helpers: {
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
    }
  },
  loadApplier: {
    constants: {
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
    dom,
    state: {
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
    helpers: {
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
    }
  },
  loadFinalizer: {
    constants: {
      customPatternOptionValue: CUSTOM_PATTERN_OPTION_VALUE
    },
    dom,
    state: {
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
    helpers: {
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
    }
  },
  resetter: {
    dom,
    state: {
      getProgressions: () => progressions,
      setLastPatternSelectValue: (value) => { lastPatternSelectValue = value; },
      setPianoFadeSettings: (value) => { pianoFadeSettings = value; },
      setPianoMidiSettings: (value) => { pianoMidiSettings = value; },
      setNextPreviewLeadValue: (value) => { nextPreviewLeadValue = value; }
    },
    helpers: {
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
  }
})));

function saveSettings() {
  saveDrillSettings({
    saveSharedPlaybackSettings,
    saveStoredProgressionSettings,
    buildSettingsSnapshot,
    getCompingStyle,
    getDrumsMode,
    isWalkingBassEnabled,
    dom,
    defaultMixerVolumes: {
      masterVolume: Number(DEFAULT_MASTER_VOLUME_PERCENT),
      bassVolume: 100,
      stringsVolume: 100,
      drumsVolume: 100
    }
  });
}

function loadSettings() {
  loadDrillSettings({
    loadStoredProgressionSettings,
    loadStoredKeySelectionPreset,
    applyLoadedSettings,
    finalizeLoadedSettings,
    setSavedKeySelectionPreset: (value) => {
      savedKeySelectionPreset = value;
    }
  });
}

const {
  setPianoMidiStatus,
  refreshPianoSettingsJson,
  syncPianoToolsUi,
  readPianoFadeSettingsFromControls,
  applyPianoFadeSettings,
  applyPianoMidiSettings,
  applyPianoPresetFromJsonText
} = createDrillPianoToolsAppFacade(createDrillPianoToolsAppBindings({
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
}));

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

function getAvailableMidiInputs() {
  if (!midiAccess?.inputs) return [];
  return [...midiAccess.inputs.values()];
}

function populateMidiInputs() {
  if (!dom.pianoMidiInput) return;
  const inputs = getAvailableMidiInputs();
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

function detachMidiInput() {
  if (!currentMidiInput) return;
  currentMidiInput.onmidimessage = null;
  currentMidiInput = null;
}

function attachMidiInput() {
  detachMidiInput();
  if (!pianoMidiSettings.enabled) {
    setPianoMidiStatus('MIDI inactif');
    return;
  }

  const input = getAvailableMidiInputs().find((candidate) => candidate.id === pianoMidiSettings.inputId) || null;
  if (!input) {
    setPianoMidiStatus('Aucune entrée MIDI active');
    return;
  }

  currentMidiInput = input;
  currentMidiInput.onmidimessage = handleMidiMessage;
  setPianoMidiStatus(`Entrée: ${input.name || 'MIDI'}`);
}

async function ensureMidiAccess() {
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
          populateMidiInputs();
          attachMidiInput();
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

async function refreshMidiInputs() {
  try {
    await ensureMidiAccess();
    populateMidiInputs();
    attachMidiInput();
    if (pianoMidiSettings.enabled && audioCtx) {
      ensureMidiPianoRangePreload();
    }
  } catch {}
}

async function loadPatternHelp() {
  await loadDrillPatternHelp({
    dom,
    url: PATTERN_HELP_URL,
    version: PATTERN_HELP_VERSION
  });
}

async function loadDefaultProgressions() {
  try {
    const versionedUrl = `${DEFAULT_PROGRESSIONS_URL}?v=${encodeURIComponent(APP_VERSION)}`;
    let response = await fetch(versionedUrl);
    if (!response.ok) {
      response = await fetch(DEFAULT_PROGRESSIONS_URL);
    }
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const parsed = parseDefaultProgressionsText(await response.text());
    defaultProgressionsVersion = parsed.version || '1';
    DEFAULT_PROGRESSIONS = parsed.progressions;
  } catch (err) {
    defaultProgressionsVersion = '1';
    DEFAULT_PROGRESSIONS = {};
  }
  progressions = normalizeProgressionsMap(DEFAULT_PROGRESSIONS);
}

async function initializeApp() {
  await initializeDrillScreen({
    initializeSocialShareLinks,
    loadDefaultProgressions,
    loadPatternHelp,
    loadWelcomeStandards,
    renderProgressionOptions,
    getInitialProgressionOption: () => Object.keys(progressions)[0] || '',
    loadSettings,
    applySilentDefaultPresetResetMigration,
    getSavedPatternSelection: () => savedPatternSelection,
    saveSettings,
    buildKeyCheckboxes,
    updateKeyPickerLabels,
    applyDisplayMode,
    hasCustomPatternValue: () => Boolean(dom.customPattern.value),
    setCustomPatternValue: (value) => {
      dom.customPattern.value = value || '';
    },
    getSelectedProgressionPattern,
    hasSelectedProgression,
    setPatternNameFromSelectedProgression: () => {
      dom.patternName.value = getSelectedProgressionName();
    },
    setPatternNameNormalized: () => {
      dom.patternName.value = normalizePresetName(dom.patternName.value);
    },
    setEditorPatternModeFromSelectedProgression: () => {
      setEditorPatternMode(getSelectedProgressionMode());
    },
    setEditorPatternModeNormalized: () => {
      setEditorPatternMode(normalizePatternMode(dom.patternMode.value));
    },
    customPatternOptionValue: CUSTOM_PATTERN_OPTION_VALUE,
    applySavedPatternSelection: (customPatternOptionValue) => {
      if (savedPatternSelection === customPatternOptionValue) {
        dom.patternSelect.value = customPatternOptionValue;
        return true;
      }
      if (savedPatternSelection && Object.prototype.hasOwnProperty.call(progressions, savedPatternSelection)) {
        dom.patternSelect.value = savedPatternSelection;
        return true;
      }
      return false;
    },
    syncPatternSelectionFromInput,
    syncProgressionManagerState,
    syncCustomPatternUI,
    normalizeChordsPerBarForCurrentPattern,
    applyPatternModeAvailability,
    setLastPatternSelectValue: () => {
      lastPatternSelectValue = dom.patternSelect.value;
    },
    shouldPromptForDefaultProgressionsUpdate: () => shouldPromptForDefaultProgressionsUpdate,
    promptForUpdatedDefaultProgressions,
    hasAppliedDefaultProgressionsFingerprint: () => Boolean(appliedDefaultProgressionsFingerprint),
    setAppliedDefaultProgressionsFingerprint: (value) => {
      appliedDefaultProgressionsFingerprint = value;
    },
    getDefaultProgressionsFingerprint,
    ensurePageSampleWarmup,
    consumePendingDrillSessionIntoUi: ({ afterApply }) => consumePendingDrillSessionIntoUi({
      applyEmbeddedPattern,
      applyEmbeddedPlaybackSettings,
      afterApply
    }),
    setWelcomeOverlayVisible,
    maybeShowWelcomeOverlay
  });
}

document.querySelector('[data-analytics-link="demo"]')?.addEventListener('click', () => {
  trackEvent('demo_link_clicked', {
    location: 'header'
  });
});

bindDrillWelcomeControls({
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
});

// Save on every change
dom.tempoSlider.addEventListener('change', saveSettings);
dom.repetitionsPerKey?.addEventListener('change', saveSettings);
dom.patternSelect.addEventListener('change', saveSettings);
dom.patternName.addEventListener('change', saveSettings);
dom.customPattern.addEventListener('change', saveSettings);
dom.patternMode.addEventListener('change', saveSettings);
dom.patternModeBoth?.addEventListener('change', saveSettings);
dom.chordsPerBar?.addEventListener('change', saveSettings);
dom.doubleTimeToggle?.addEventListener('change', () => {
  stopPlaybackIfRunning();
  if (dom.chordsPerBar) {
    dom.chordsPerBar.value = dom.doubleTimeToggle.checked ? '2' : '1';
  }
  saveSettings();
});
dom.majorMinor.addEventListener('change', saveSettings);
dom.compingStyle?.addEventListener('change', saveSettings);
dom.tempoSlider.addEventListener('change', () => {
  trackEvent('tempo_changed', {
    tempo: Number(dom.tempoSlider.value),
    tempo_bucket: getTempoBucket()
  });
});
dom.repetitionsPerKey?.addEventListener('change', () => {
  trackEvent('repetitions_changed', {
    repetitions_per_key: getRepetitionsPerKey()
  });
});
dom.chordsPerBar?.addEventListener('change', () => {
  const chordsPerBar = getSelectedChordsPerBar();
  trackEvent('harmonic_density_changed', {
    chords_per_bar: chordsPerBar,
    double_time: chordsPerBar > 1 ? 'on' : 'off'
  });
});
dom.compingStyle?.addEventListener('change', () => {
  if (isPlaying && audioCtx) {
    stopActiveChordVoices(audioCtx.currentTime, NOTE_FADEOUT);
    rebuildPreparedCompingPlans(currentKey);
  }
  preloadNearTermSamples().catch(() => {});
  trackEvent('comping_style_changed', {
    comping_style: getCompingStyle()
  });
});
dom.walkingBass?.addEventListener('change', async () => {
  if (isWalkingBassEnabled()) {
    try {
      await ensureWalkingBassGenerator();
    } catch {}
  }
  if (isPlaying) {
    buildPreparedBassPlan();
  }
  preloadNearTermSamples().catch(() => {});
  saveSettings();
});
dom.stringsVolume.addEventListener('input', () => {
  applyMixerSettings();
  if (!isChordsEnabled() && isPlaying && audioCtx) {
    stopActiveChordVoices(audioCtx.currentTime, NOTE_FADEOUT);
  }
});
dom.drumsSelect.addEventListener('change', saveSettings);
dom.drumsSelect.addEventListener('change', () => {
  trackEvent('drums_mode_changed', {
    drums_mode: dom.drumsSelect.value
  });
});
dom.debugToggle?.addEventListener('change', () => {
  setAnalyticsDebugEnabled(dom.debugToggle.checked);
});
dom.resetSettings?.addEventListener('click', resetPlaybackSettings);
initializeDrillPianoControls({
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
});
dom.pianoSettingsCopy?.addEventListener('click', async () => {
  refreshPianoSettingsJson();
  const presetText = dom.pianoSettingsJson?.value || '';
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(presetText);
      setPianoMidiStatus('Preset piano copié');
      return;
    }
  } catch {}
  if (dom.pianoSettingsJson) {
    dom.pianoSettingsJson.focus();
    dom.pianoSettingsJson.select();
  }
  setPianoMidiStatus('Preset prêt à copier');
});
dom.pianoSettingsApply?.addEventListener('click', async () => {
  try {
    applyPianoPresetFromJsonText(dom.pianoSettingsJson?.value || '{}');
    if (pianoMidiSettings.enabled) {
      await refreshMidiInputs();
    }
    setPianoMidiStatus('Preset piano appliqué');
  } catch (err) {
    window.alert(`Preset piano invalide: ${err.message}`);
  }
});
dom.pianoSettingsReset?.addEventListener('click', () => {
  pianoFadeSettings = normalizePianoFadeSettings(DEFAULT_PIANO_FADE_SETTINGS);
  pianoMidiSettings = normalizePianoMidiSettings(DEFAULT_PIANO_MIDI_SETTINGS);
  stopAllMidiPianoVoices(true);
  syncPianoToolsUi();
  attachMidiInput();
  saveSettings();
  setPianoMidiStatus('Réglages piano réinitialisés');
});
function applyDisplayMode() {
  applyDrillDisplayMode({
    displayElement: document.getElementById('display'),
    mode: normalizeDisplayMode(dom.displayMode?.value),
    applyDisplaySideLayout,
    applyCurrentHarmonyVisibility,
    fitHarmonyDisplay
  });
}

initializeDrillRuntimeControls({
  dom,
  onStartStopClick: () => {
    if (isPlaying) stop(); else start();
  },
  onPauseClick: togglePause,
  onTempoInput: () => {
    dom.tempoValue.textContent = dom.tempoSlider.value;
    syncNextPreviewControlDisplay();
    refreshDisplayedHarmony();
    if (isPlaying && audioCtx) {
      stopActiveChordVoices(audioCtx.currentTime, NOTE_FADEOUT);
      rebuildPreparedCompingPlans(currentKey);
      buildPreparedBassPlan();
    }
  },
  onNextPreviewValueChange: () => {
    commitNextPreviewValueFromInput();
    saveSettings();
    trackEvent('next_preview_changed', {
      next_preview_unit: getNextPreviewInputUnit(),
      next_preview_bars: formatPreviewNumber(getNextPreviewLeadBars()),
      next_preview_seconds: formatPreviewNumber(getNextPreviewLeadSeconds(), 1)
    });
  },
  onNextPreviewUnitToggleChange: () => {
    convertNextPreviewValueToUnit(
      dom.nextPreviewUnitToggle.checked ? NEXT_PREVIEW_UNIT_SECONDS : NEXT_PREVIEW_UNIT_BARS
    );
    setNextPreviewInputUnit(nextPreviewLeadUnit);
    syncNextPreviewControlDisplay();
    refreshDisplayedHarmony();
    saveSettings();
    trackEvent('next_preview_unit_changed', {
      next_preview_unit: getNextPreviewInputUnit()
    });
  },
  onSelectAllKeys: () => {
    setAllKeysEnabled(true);
    trackEvent('all_keys_selected', {
      enabled_keys: getEnabledKeyCount()
    });
  },
  onInvertKeys: () => {
    invertKeysEnabled();
    trackEvent('key_selection_inverted', {
      enabled_keys: getEnabledKeyCount()
    });
  },
  onClearKeys: () => {
    setAllKeysEnabled(false);
    trackEvent('all_keys_cleared', {
      enabled_keys: getEnabledKeyCount()
    });
  },
  onSaveKeyPreset: saveCurrentKeySelectionPreset,
  onLoadKeyPreset: loadKeySelectionPreset,
  onTranspositionChange: () => {
    updateKeyPickerLabels();
    refreshDisplayedHarmony();
    saveSettings();
    syncPatternPreview();
    trackEvent('display_transposition_changed', {
      transposition: dom.transpositionSelect.value
    });
  },
  onDisplayModeChange: () => {
    applyDisplayMode();
    saveSettings();
    trackEvent('display_mode_changed', {
      display_mode: normalizeDisplayMode(dom.displayMode.value)
    });
  },
  onHarmonyDisplayModeChange: () => {
    refreshDisplayedHarmony();
    saveSettings();
    trackEvent('harmony_display_mode_changed', {
      alternate_display: normalizeHarmonyDisplayMode(dom.harmonyDisplayMode.value)
    });
  },
  onSymbolToggleChange: () => {
    refreshDisplayedHarmony();
    saveSettings();
  },
  onShowBeatIndicatorChange: () => {
    applyBeatIndicatorVisibility();
    saveSettings();
  },
  onHideCurrentHarmonyChange: () => {
    applyCurrentHarmonyVisibility();
    refreshDisplayedHarmony();
    fitHarmonyDisplay();
    saveSettings();
  },
  onMasterVolumeInput: applyMixerSettings,
  onBassVolumeInput: applyMixerSettings,
  onDrumsVolumeInput: applyMixerSettings,
  onMasterVolumeChange: () => {
    saveSettings();
    trackEvent('master_volume_changed', {
      volume_percent: Number(dom.masterVolume.value)
    });
  },
  onBassVolumeChange: () => {
    saveSettings();
    trackEvent('bass_volume_changed', {
      volume_percent: Number(dom.bassVolume.value)
    });
  },
  onStringsVolumeChange: () => {
    saveSettings();
    trackEvent('strings_volume_changed', {
      volume_percent: Number(dom.stringsVolume.value)
    });
  },
  onDrumsVolumeChange: () => {
    saveSettings();
    trackEvent('drums_volume_changed', {
      volume_percent: Number(dom.drumsVolume.value)
    });
  }
});

initializeHarmonyDisplayObservers({
  fitHarmonyDisplay,
  chordDisplay: dom.chordDisplay,
  nextChordDisplay: dom.nextChordDisplay,
  displayColumns: document.getElementById('display-columns')
});

window.addEventListener('pagehide', trackSessionDuration);

const {
  playbackController: embeddedPlaybackController,
  applyEmbeddedPattern,
  applyEmbeddedPlaybackSettings,
  getEmbeddedPlaybackState
} = createDrillSharedPlaybackAppAssembly({
  ...createDrillSharedPlaybackAppBindings(createDrillSharedPlaybackRuntimeAppBindings({
    embedded: {
    dom,
    host: {
      customPatternOptionValue: CUSTOM_PATTERN_OPTION_VALUE,
      setSuppressPatternSelectChange: (value) => { suppressPatternSelectChange = value; },
      setPatternSelectValue,
      setEditorPatternMode,
      syncPatternSelectionFromInput,
      getLastPatternSelectValue: () => lastPatternSelectValue,
      setLastPatternSelectValue: (value) => { lastPatternSelectValue = value; },
      getIsPlaying: () => isPlaying,
      getIsPaused: () => isPaused,
      getIsIntro: () => isIntro,
      getCurrentBeat: () => currentBeat,
      getCurrentChordIdx: () => currentChordIdx,
      getPaddedChordCount: () => (Array.isArray(paddedChords) ? paddedChords.length : 0),
      getTempo: () => Number(dom.tempoSlider?.value || 0),
      getAudioContext: () => audioCtx,
      getCurrentKey: () => currentKey,
      startPlayback: () => start(),
      stopPlayback: () => stop(),
      togglePausePlayback: () => togglePause()
    },
    patternUi: {
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
    },
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
    playbackState: {
      isEmbeddedMode: IS_EMBEDDED_DRILL_MODE
    },
    playbackRuntime: {
      ensureWalkingBassGenerator,
      stopActiveChordVoices,
      noteFadeout: NOTE_FADEOUT,
      rebuildPreparedCompingPlans,
      buildPreparedBassPlan,
      preloadNearTermSamples
    },
    transportActions: {}
  },
    direct: {
    playbackRuntime: {
      ensureWalkingBassGenerator,
      getAudioContext: () => audioCtx,
      noteFadeout: NOTE_FADEOUT,
      stopActiveChordVoices,
      rebuildPreparedCompingPlans,
      buildPreparedBassPlan,
      getCurrentKey: () => currentKey,
      preloadNearTermSamples,
      validateCustomPattern: () => validateCustomPattern()
    },
    playbackState: {
      getIsPlaying: () => isPlaying
    },
    transportActions: {
      startPlayback: () => start(),
      stopPlayback: () => stop(),
      togglePausePlayback: () => togglePause()
    }
    }
  }))
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




