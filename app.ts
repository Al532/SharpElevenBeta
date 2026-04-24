// @ts-nocheck
import { getAnalyticsDebugEnabled, setAnalyticsDebugEnabled, trackEvent } from './features/app/app-analytics.js';
import {
  createProgressionEntry as createProgressionEntryBase,
  isProgressionModeToken,
  normalizeProgressionEntry as normalizeProgressionEntryBase,
  normalizeProgressionsMap as normalizeProgressionsMapBase,
  parseDefaultProgressionsText as parseDefaultProgressionsTextBase
} from './features/progression/progression-library.js';
import {
  loadStoredKeySelectionPreset,
  loadStoredProgressionSettings,
  saveStoredKeySelectionPreset,
  saveStoredProgressionSettings
} from './features/progression/progression-storage.js';
import { DEFAULT_DISPLAY_PLACEHOLDER_MESSAGE } from './features/drill/drill-display-placeholder-messages.js';
import { renderAccidentalTextHtml, renderChordSymbolHtml } from './core/music/chord-symbol-display.js';
import pianoRhythmConfig from './core/music/piano-rhythm-config.js';
import voicingConfig from './core/music/voicing-config.js';
import {
  TRAINER_APP_CONFIG,
  TRAINER_AUDIO_CONFIG,
  TRAINER_MODE_CONFIG,
  TRAINER_PRESET_CONFIG
} from './config/trainer-config.js';
import {
  applyContextualQualityRules,
  applyPriorityDominantResolutionRules
} from './core/music/harmony-context.js';
import {
  DEFAULT_SWING_RATIO,
} from './core/music/swing-utils.js';
import { saveSharedPlaybackSettings } from './core/storage/app-state-storage.js';
import { createDrillAudioRuntimeRootAppAssembly } from './features/drill/drill-audio-runtime-root-app-assembly.js';
import { createDrillCompingEngineRootAppAssembly } from './features/drill/drill-comping-engine-root-app-assembly.js';
import { createDrillDefaultProgressionsRootAppAssembly } from './features/drill/drill-default-progressions-root-app-assembly.js';
import { loadDrillPatternHelp } from './features/drill/drill-pattern-help.js';
import { validateDrillCustomPattern } from './features/drill/drill-pattern-validation.js';
import { createDrillPlaybackResourcesRootAppAssembly } from './features/drill/drill-playback-resources-root-app-assembly.js';
import { createDrillVoicingRuntimeRootAppAssembly } from './features/drill/drill-voicing-runtime-root-app-assembly.js';
import { createDrillWalkingBassRootAppAssembly } from './features/drill/drill-walking-bass-root-app-assembly.js';
import { createDrillPatternRuntimeRootAppAssembly } from './features/drill/drill-pattern-runtime-root-app-assembly.js';
import { createDrillNormalizationRootAppContext } from './features/drill/drill-normalization-root-app-context.js';
import { createDrillDisplayRuntimeRootAppAssembly } from './features/drill/drill-display-runtime-root-app-assembly.js';
import { createDrillDisplaySupportRootAppAssembly } from './features/drill/drill-display-support-root-app-assembly.js';
import { createDrillTempoRuntimeRootAppAssembly } from './features/drill/drill-tempo-runtime-root-app-assembly.js';
import {
  createDrillAppRuntimeSupportRootAppAssembly,
  createStateRef
} from './features/drill/drill-app-runtime-support-root-app-assembly.js';
import { createDrillPianoMidiLiveRuntimeRootAppAssembly } from './features/drill/drill-piano-midi-live-runtime-root-app-assembly.js';
import { createDrillPianoSettingsRuntimeRootAppAssembly } from './features/drill/drill-piano-settings-runtime-root-app-assembly.js';
import { createDrillSettingsMigrationsRootAppAssembly } from './features/drill/drill-settings-migrations-root-app-assembly.js';
import {
  createDrillDisplayDrillRootAppFacade,
  createDrillKeysDrillRootAppAssembly,
  createDrillNextPreviewDrillRootAppFacade,
  createDrillPianoMidiRuntimeDrillRootAppAssembly,
  createDrillPianoToolsDrillRootAppFacade,
  createDrillPlaybackRuntimeHostDrillRootAppAssembly,
  createDrillProgressionDrillRootAppAssembly,
  createDrillRuntimeStateDrillRootAppAssembly,
  createDrillSettingsDrillRootAppAssembly,
  createDrillSettingsPersistenceDrillRootAppAssembly,
  createDrillSharedPlaybackDrillRootAppAssembly,
  createDrillStartupDataDrillRootAppAssembly,
  createDrillUiBootstrapDrillRootAppAssembly,
  createDrillUiEventBindingsDrillRootAppAssembly,
  createDrillWelcomeDrillRootAppFacade
} from './features/drill/drill-root-app-adapters.js';
import { initializeAppShell } from './features/app/app-shell.js';
import { createMobileBackNavigationController } from './features/app/app-mobile-back-navigation.js';
import { isIRealDeepLink, storePendingIRealLink } from './features/app/app-pending-mobile-import.js';
import { consumePendingPracticeSessionIntoUi } from './features/drill/drill-session-import.js';
import { initializeSocialShareLinks } from './features/drill/drill-ui-runtime.js';
import { createDrillRuntimePrimitivesRootAppAssembly } from './features/drill/drill-runtime-primitives-root-app-assembly.js';
import { shuffleArray } from './features/drill/drill-key-pool-runtime.js';

/* ============================================================
   Sharp Eleven App app.js
   ============================================================ */

// ---- Constants ----

const KEY_NAMES_MAJOR = ['C', 'D\u266D', 'D', 'E\u266D', 'E', 'F', 'G\u266D', 'G', 'A\u266D', 'A', 'B\u266D', 'B'];
const KEY_NAMES_MINOR = ['C', 'C\u266F', 'D', 'E\u266D', 'E', 'F', 'F\u266F', 'G', 'A\u266D', 'A', 'B\u266D', 'B'];

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

const {
  defaults: TRAINER_DEFAULTS,
  resourcePaths: TRAINER_RESOURCE_PATHS,
  welcome: WELCOME_CONFIG,
  reviewStandardConversionsUrl: REVIEW_STANDARD_CONVERSIONS_URL
} = TRAINER_APP_CONFIG;

const {
  oneTimeMigrations: ONE_TIME_MIGRATIONS,
  pianoSampleRange: PIANO_SAMPLE_RANGE,
  pianoSettings: PIANO_SETTINGS_CONFIG,
  instrumentRanges: INSTRUMENT_RANGES,
  audioScheduling: AUDIO_SCHEDULING,
  audioTiming: AUDIO_TIMING,
  audioLevels: AUDIO_LEVELS,
  audioMixer: AUDIO_MIXER_CONFIG,
  sampleLibrary: SAMPLE_LIBRARY_CONFIG,
  pianoComping: PIANO_COMPING_CONFIG,
  voicingRandomization: VOICING_RANDOMIZATION_CONFIG
} = TRAINER_AUDIO_CONFIG;

const {
  patternModes: PATTERN_MODES,
  nextPreviewUnits: NEXT_PREVIEW_UNITS,
  displayModes: DISPLAY_MODES,
  harmonyDisplayModes: HARMONY_DISPLAY_MODES,
  compingStyles: COMPING_STYLES,
  drumModes: DRUM_MODES
} = TRAINER_MODE_CONFIG;

const {
  welcomeProgressions: WELCOME_PROGRESSIONS,
  welcomeOneChords: WELCOME_ONE_CHORDS,
  welcomeStandardsFallback: WELCOME_STANDARDS_FALLBACK
} = TRAINER_PRESET_CONFIG;

const APP_VERSION = typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : 'dev';
const APP_URL_PARAMS = new URLSearchParams(window.location.search);
const IS_EMBEDDED_DRILL_MODE = APP_URL_PARAMS.get('embedded') === '1';
const CUSTOM_PATTERN_OPTION_VALUE = '__custom__';
const PIANO_SAMPLE_LOW = PIANO_SAMPLE_RANGE.low;
const PIANO_SAMPLE_HIGH = PIANO_SAMPLE_RANGE.high;
const DEFAULT_PIANO_FADE_SETTINGS = PIANO_SETTINGS_CONFIG.defaultFadeSettings;
const DEFAULT_PIANO_MIDI_SETTINGS = PIANO_SETTINGS_CONFIG.defaultMidiSettings;
const PIANO_SETTINGS_PRESET_VERSION = PIANO_SETTINGS_CONFIG.presetVersion;

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

const PATTERN_MODE_BOTH = PATTERN_MODES.both;
const PATTERN_MODE_MAJOR = PATTERN_MODES.major;
const PATTERN_MODE_MINOR = PATTERN_MODES.minor;
const NEXT_PREVIEW_UNIT_BARS = NEXT_PREVIEW_UNITS.bars;
const NEXT_PREVIEW_UNIT_SECONDS = NEXT_PREVIEW_UNITS.seconds;
const DISPLAY_MODE_SHOW_BOTH = DISPLAY_MODES.showBoth;
const DISPLAY_MODE_CHORDS_ONLY = DISPLAY_MODES.chordsOnly;
const DISPLAY_MODE_KEY_ONLY = DISPLAY_MODES.keyOnly;
const HARMONY_DISPLAY_MODE_DEFAULT = HARMONY_DISPLAY_MODES.default;
const HARMONY_DISPLAY_MODE_RICH = HARMONY_DISPLAY_MODES.rich;
const DEFAULT_PROGRESSIONS_URL = TRAINER_DEFAULTS.progressionsUrl;
const DEFAULT_REPETITIONS_PER_KEY = TRAINER_DEFAULTS.repetitionsPerKey;
const COMPING_STYLE_OFF = COMPING_STYLES.off;
const DEFAULT_NEXT_PREVIEW_LEAD_BARS = TRAINER_DEFAULTS.nextPreviewLeadBars;
const COMPING_STYLE_STRINGS = COMPING_STYLES.strings;
const COMPING_STYLE_PIANO = COMPING_STYLES.piano;
const DEFAULT_CHORDS_PER_BAR = TRAINER_DEFAULTS.chordsPerBar;
const SUPPORTED_CHORDS_PER_BAR = TRAINER_DEFAULTS.supportedChordsPerBar;
const WELCOME_GOAL_PROGRESSION = WELCOME_CONFIG.goals.progression;
const WELCOME_GOAL_ONE_CHORD = WELCOME_CONFIG.goals.oneChord;
const WELCOME_GOAL_STANDARD = WELCOME_CONFIG.goals.standard;
const WELCOME_ONBOARDING_SETTINGS_KEY = WELCOME_CONFIG.storageKeys.onboardingCompleted;
const WELCOME_SHOW_NEXT_TIME_SETTINGS_KEY = WELCOME_CONFIG.storageKeys.showNextTime;
const WELCOME_VERSION_SETTINGS_KEY = WELCOME_CONFIG.storageKeys.version;
const WELCOME_VERSION = WELCOME_CONFIG.version;

const BASS_LOW = INSTRUMENT_RANGES.bass.low;  // MIDI note for E1 (lowest bass sample)
const BASS_HIGH = INSTRUMENT_RANGES.bass.high; // MIDI note for C3 (highest bass sample)
const CELLO_LOW = INSTRUMENT_RANGES.cello.low;  // MIDI C#2
const CELLO_HIGH = INSTRUMENT_RANGES.cello.high; // MIDI G#5
const VIOLIN_LOW = INSTRUMENT_RANGES.violin.low; // MIDI G#3
const VIOLIN_HIGH = INSTRUMENT_RANGES.violin.high; // MIDI C6
const GUIDE_TONE_LOW = INSTRUMENT_RANGES.guideTone.low;  // MIDI C#3 - bottom of guide tone range
const GUIDE_TONE_HIGH = INSTRUMENT_RANGES.guideTone.high; // MIDI C4 - top of guide tone range
const SCHEDULE_AHEAD = AUDIO_SCHEDULING.scheduleAheadSeconds;  // seconds
const SCHEDULE_INTERVAL = AUDIO_SCHEDULING.scheduleIntervalMs; // ms

// ---- Voicing Data ----

// ---- DOM refs ----

const dom = {
  appVersion:      document.getElementById('app-version'),
  display:         document.getElementById('display'),
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
let getCurrentPatternModeImpl = () => '';
let getCurrentPatternNameImpl = () => '';
let getCurrentPatternStringImpl = () => '';
let hasSelectedProgressionImpl = () => false;
let isCustomPatternSelectedImpl = () => false;
let syncPatternSelectionFromInputImpl = () => {};
let syncCustomPatternUIImpl = () => {};
let syncProgressionManagerStateImpl = () => {};
let applyPatternModeAvailabilityImpl = () => {};
let syncPatternPreviewImpl = () => {};
let showNextColImpl = () => {};
let hideNextColImpl = () => {};
let applyCurrentHarmonyVisibilityImpl = () => {};
let getSecondsPerBeatImpl = () => 60 / 120;
let getSwingRatioImpl = () => DEFAULT_SWING_RATIO;
let buildProgressionImpl = () => [];
let validateCustomPatternImpl = () => true;
let setKeyPickerOpenImpl = () => {};
let escapeHtmlImpl = (value) => String(value || '');
let getPianoVoicingModeImpl = () => 'piano';
let getRepetitionsPerKeyImpl = () => DEFAULT_REPETITIONS_PER_KEY;
let clearOneChordCycleStateImpl = () => {};
let toAnalyticsTokenImpl = (value, fallback = 'unknown') => {
  const normalized = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return normalized || fallback;
};
let stopPlaybackIfRunningImpl = () => {};
let keyLabelForPickerImpl = () => '';
let updateKeyPickerLabelsImpl = () => {};
let refreshDisplayedHarmonyImpl = () => {};
let resolvePlaybackSessionControllerImpl = (fallbackController) => fallbackController;
let ensureMidiPianoRangePreloadImpl = () => Promise.resolve(null);
let stopMidiPianoVoiceImpl = () => {};
let stopAllMidiPianoVoicesImpl = () => {};
let handleMidiMessageImpl = () => {};
let startImpl = () => {};
let saveSettingsImpl = () => {};

function clearProgressionEditingState(...args) {
  return clearProgressionEditingStateImpl(...args);
}

function closeProgressionManager(...args) {
  const result = closeProgressionManagerImpl(...args);
  drillBackNavigation.sync();
  return result;
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

function getCurrentPatternMode(...args) {
  return getCurrentPatternModeImpl(...args);
}

function getCurrentPatternName(...args) {
  return getCurrentPatternNameImpl(...args);
}

function getCurrentPatternString(...args) {
  return getCurrentPatternStringImpl(...args);
}

function hasSelectedProgression(...args) {
  return hasSelectedProgressionImpl(...args);
}

function isCustomPatternSelected(...args) {
  return isCustomPatternSelectedImpl(...args);
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

function getSecondsPerBeat(...args) {
  return getSecondsPerBeatImpl(...args);
}

function getSwingRatio(...args) {
  return getSwingRatioImpl(...args);
}

function buildProgression(...args) {
  return buildProgressionImpl(...args);
}

function validateCustomPattern(...args) {
  return validateCustomPatternImpl(...args);
}

function setKeyPickerOpen(...args) {
  const result = setKeyPickerOpenImpl(...args);
  drillBackNavigation.sync();
  return result;
}

function isElementVisible(element) {
  return Boolean(element && !element.classList.contains('hidden'));
}

function isKeyPickerOpen() {
  return Boolean(dom.keyPicker?.open);
}

function handleDrillDismissibleBack() {
  if (isElementVisible(dom.progressionUpdateModal)) {
    setProgressionUpdateModalVisibility(false);
    drillBackNavigation.sync();
    return true;
  }
  if (isKeyPickerOpen()) {
    setKeyPickerOpen(false);
    drillBackNavigation.sync();
    return true;
  }
  if (isElementVisible(dom.progressionManagerPanel)) {
    closeProgressionManager();
    drillBackNavigation.sync();
    return true;
  }
  if (isElementVisible(dom.welcomeOverlay)) {
    setWelcomeOverlayVisible(false);
    drillBackNavigation.sync();
    return true;
  }
  return false;
}

const drillBackNavigation = createMobileBackNavigationController({
  canHandleBack: () => (
    isElementVisible(dom.progressionUpdateModal)
    || isKeyPickerOpen()
    || isElementVisible(dom.progressionManagerPanel)
    || isElementVisible(dom.welcomeOverlay)
  ),
  handleBack: handleDrillDismissibleBack
});

if (typeof MutationObserver !== 'undefined') {
  const drillBackObserver = new MutationObserver(() => {
    drillBackNavigation.sync();
  });
  if (dom.progressionUpdateModal) {
    drillBackObserver.observe(dom.progressionUpdateModal, {
      attributes: true,
      attributeFilter: ['class', 'aria-hidden']
    });
  }
  if (dom.progressionManagerPanel) {
    drillBackObserver.observe(dom.progressionManagerPanel, {
      attributes: true,
      attributeFilter: ['class']
    });
  }
  if (dom.welcomeOverlay) {
    drillBackObserver.observe(dom.welcomeOverlay, {
      attributes: true,
      attributeFilter: ['class', 'aria-hidden', 'inert']
    });
  }
  if (dom.keyPicker) {
    drillBackObserver.observe(dom.keyPicker, {
      attributes: true,
      attributeFilter: ['open']
    });
  }
}

async function bindIncomingMobileImports() {
  if (!window.Capacitor?.isNativePlatform?.()) return;
  let appPlugin = null;
  try {
    const capacitorAppModule = await import('@capacitor/app');
    appPlugin = capacitorAppModule?.App || null;
  } catch (_error) {
    appPlugin = window.Capacitor?.Plugins?.App || null;
  }
  if (!appPlugin?.addListener) return;

  const redirectToChartImport = (url) => {
    if (!isIRealDeepLink(url)) return false;
    const stored = storePendingIRealLink(url);
    if (!stored) return false;
    const targetUrl = new URL('./chart-dev/index.html', window.location.href);
    window.location.assign(targetUrl.href);
    return true;
  };

  try {
    const launchUrl = await appPlugin.getLaunchUrl?.();
    redirectToChartImport(launchUrl?.url || '');
  } catch (_error) {
    // Ignore launch URL failures and keep the listener active.
  }

  appPlugin.addListener('appUrlOpen', ({ url }) => {
    redirectToChartImport(url);
  });
}

function escapeHtml(...args) {
  return escapeHtmlImpl(...args);
}

function getPianoVoicingMode(...args) {
  return getPianoVoicingModeImpl(...args);
}

function getRepetitionsPerKey(...args) {
  return getRepetitionsPerKeyImpl(...args);
}

function clearOneChordCycleState(...args) {
  return clearOneChordCycleStateImpl(...args);
}

function toAnalyticsToken(...args) {
  return toAnalyticsTokenImpl(...args);
}

function stopPlaybackIfRunning(...args) {
  return stopPlaybackIfRunningImpl(...args);
}

function keyLabelForPicker(...args) {
  return keyLabelForPickerImpl(...args);
}

function updateKeyPickerLabels(...args) {
  return updateKeyPickerLabelsImpl(...args);
}

function refreshDisplayedHarmony(...args) {
  return refreshDisplayedHarmonyImpl(...args);
}

function resolvePlaybackSessionController(...args) {
  return resolvePlaybackSessionControllerImpl(...args);
}

function ensureMidiPianoRangePreload(...args) {
  return ensureMidiPianoRangePreloadImpl(...args);
}

function stopMidiPianoVoice(...args) {
  return stopMidiPianoVoiceImpl(...args);
}

function stopAllMidiPianoVoices(...args) {
  return stopAllMidiPianoVoicesImpl(...args);
}

function handleMidiMessage(...args) {
  return handleMidiMessageImpl(...args);
}

function showNextCol(...args) {
  return showNextColImpl(...args);
}

function hideNextCol(...args) {
  return hideNextColImpl(...args);
}

function applyCurrentHarmonyVisibility(...args) {
  return applyCurrentHarmonyVisibilityImpl(...args);
}

function start(...args) {
  return startImpl(...args);
}

function saveSettings(...args) {
  return saveSettingsImpl(...args);
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
let shouldShowWelcomeNextTime = false;
let playbackSessionController = null;

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
} = createDrillNormalizationRootAppContext({
  constants: {
    patternModeBoth: PATTERN_MODE_BOTH,
    patternModeMajor: PATTERN_MODE_MAJOR,
    patternModeMinor: PATTERN_MODE_MINOR
  }
});

const {
  parseWelcomeStandardsText,
  renderWelcomeStandardOptions,
  loadWelcomeStandards
} = createDrillStartupDataDrillRootAppAssembly({
  stateRefs: {
    welcomeStandards: createStateRef(() => welcomeStandards, (value) => { welcomeStandards = value; })
  },
  welcomeStandards: {
    fetchImpl: (...args) => fetch(...args),
    url: REVIEW_STANDARD_CONVERSIONS_URL,
    version: APP_VERSION,
    welcomeStandardsFallback: WELCOME_STANDARDS_FALLBACK,
    select: dom.welcomeStandardSelect,
    getWelcomeStandards: () => welcomeStandards,
    noteLetterToSemitone: NOTE_LETTER_TO_SEMITONE,
    patternModeMinor: PATTERN_MODE_MINOR,
    compingStylePiano: COMPING_STYLE_PIANO,
    normalizePatternMode
  }
});

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
} = createDrillNormalizationRootAppContext({
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

const {
  normalizeAppliedOneTimeMigrations,
  markOneTimeMigrationApplied,
  hasAppliedOneTimeMigration,
  applySilentDefaultPresetResetMigration,
  shouldApplyMasterVolumeDefault50Migration
} = createDrillSettingsMigrationsRootAppAssembly({
  constants: {
    appVersion: APP_VERSION,
    oneTimeMigrations: ONE_TIME_MIGRATIONS,
    customPatternOptionValue: CUSTOM_PATTERN_OPTION_VALUE
  },
  state: {
    getAppliedOneTimeMigrations: () => appliedOneTimeMigrations,
    setAppliedOneTimeMigrations: (value) => { appliedOneTimeMigrations = value; },
    getDefaultProgressions: () => DEFAULT_PROGRESSIONS,
    getProgressions: () => progressions,
    setProgressions: (value) => { progressions = value; },
    getDefaultProgressionsVersion: () => defaultProgressionsVersion,
    getAppliedDefaultProgressionsFingerprint: () => appliedDefaultProgressionsFingerprint,
    setAppliedDefaultProgressionsFingerprint: (value) => { appliedDefaultProgressionsFingerprint = value; },
    setAcknowledgedDefaultProgressionsVersion: (value) => { acknowledgedDefaultProgressionsVersion = value; },
    setShouldPromptForDefaultProgressionsUpdate: (value) => { shouldPromptForDefaultProgressionsUpdate = value; },
    setSavedPatternSelection: (value) => { savedPatternSelection = value; }
  },
  helpers: {
    normalizeProgressionsMap,
    getDefaultProgressionsFingerprint
  }
});

const {
  isOneChordModeActive,
  getOneChordQualitySignature,
  matchesOneChordQualitySet,
  takeNextOneChordQuality,
  syncDoubleTimeToggle,
  normalizeChordsPerBarForCurrentPattern,
  getSelectedChordsPerBar,
  getPatternKeyOverridePitchClass,
  getChordsPerBar,
  getBeatsPerChord,
  padProgression,
  canLoopTrimProgression,
  buildLoopRepVoicings
} = createDrillPatternRuntimeRootAppAssembly({
  dom,
  runtimeState: {
    getOneChordQualityPool: () => oneChordQualityPool,
    setOneChordQualityPool: (value) => { oneChordQualityPool = value; },
    getOneChordQualityPoolSignature: () => oneChordQualityPoolSignature,
    setOneChordQualityPoolSignature: (value) => { oneChordQualityPoolSignature = value; }
  },
  runtimeConstants: {
    oneChordDefaultQualities: ONE_CHORD_DEFAULT_QUALITIES
  },
  runtimeHelpers: {
    shuffleArray,
    getCurrentPatternString,
    isOneChordModeActiveBase,
    analyzePatternCached,
    normalizeChordsPerBar,
    getPatternKeyOverridePitchClassBase,
    getBeatsPerChordBase,
    padProgressionBase,
    getSelectedChordsPerBarValue: () => DEFAULT_CHORDS_PER_BAR,
    getPlayedChordQuality,
    getCurrentDoubleTimeChecked: () => Boolean(dom.doubleTimeToggle?.checked)
  }
});


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
const DRUM_MODE_OFF = DRUM_MODES.off;
const DRUM_MODE_METRONOME_24 = DRUM_MODES.metronome24;
const DRUM_MODE_HIHATS_24 = DRUM_MODES.hihats24;
const DRUM_MODE_FULL_SWING = DRUM_MODES.fullSwing;
const PORTAMENTO_ALWAYS_ON = AUDIO_MIXER_CONFIG.portamentoAlwaysOn;
const METRONOME_GAIN_MULTIPLIER = AUDIO_MIXER_CONFIG.metronomeGainMultiplier;
const DRUMS_GAIN_MULTIPLIER = AUDIO_MIXER_CONFIG.drumsGainMultiplier;
const DEFAULT_MASTER_VOLUME_PERCENT = AUDIO_MIXER_CONFIG.defaultMasterVolumePercent;
const MIXER_CHANNEL_CALIBRATION = AUDIO_MIXER_CONFIG.mixerChannelCalibration;
const SAFE_PRELOAD_MEASURES = AUDIO_MIXER_CONFIG.safePreloadMeasures;
const DRUM_HIHAT_SAMPLE_URL = SAMPLE_LIBRARY_CONFIG.drumHiHatSampleUrl;
const DRUM_RIDE_SAMPLE_URLS = SAMPLE_LIBRARY_CONFIG.drumRideSampleUrls;
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




const NOTE_FADEOUT = AUDIO_TIMING.noteFadeOutSeconds;  // seconds - bass fadeout before next note
const BASS_NOTE_ATTACK = AUDIO_TIMING.bassNoteAttackSeconds; // seconds - tiny fade-in to avoid clicks on re-attacks
const BASS_NOTE_OVERLAP = AUDIO_TIMING.bassNoteOverlapSeconds; // seconds - let bass notes overlap slightly
const BASS_NOTE_RELEASE = AUDIO_TIMING.bassNoteReleaseSeconds; // seconds - fixed tail fade for walking bass notes
const BASS_GAIN_RELEASE_TIMECONSTANT = AUDIO_TIMING.bassGainReleaseTimeConstant; // seconds - smooth release to avoid clicks
const CHORD_FADE_BEFORE = AUDIO_TIMING.chordFadeBeforeSeconds; // seconds - chord fade starts this long before end
const CHORD_FADE_DUR = AUDIO_TIMING.chordFadeDurationSeconds;    // seconds - chord fade duration
const CHORD_VOLUME_MULTIPLIER = AUDIO_LEVELS.chordVolumeMultiplier;
// Bass samples are now loudness-normalized around LUFS-S -16, so we only keep a light trim here
// instead of the stronger attenuation that made sense with the older peak-normalized files.
const BASS_GAIN = AUDIO_LEVELS.bassGain;
const STRING_LOOP_START = AUDIO_TIMING.stringLoopStartSeconds;
const STRING_LOOP_END = AUDIO_TIMING.stringLoopEndSeconds;
const STRING_LOOP_CROSSFADE = AUDIO_TIMING.stringLoopCrossfadeSeconds;
const STRING_LEGATO_MAX_DISTANCE = AUDIO_TIMING.stringLegatoMaxDistanceSemitones; // semitones

const {
  clamp01,
  clampRange,
  createDefaultPianoFadeSettings,
  normalizePianoFadeSettings,
  normalizePianoMidiSettings,
  getPianoFadeProfile
} = createDrillPianoSettingsRuntimeRootAppAssembly({
  runtimeState: {
    getPianoFadeSettings: () => pianoFadeSettings
  },
  constants: {
    defaultPianoFadeSettings: DEFAULT_PIANO_FADE_SETTINGS,
    defaultPianoMidiSettings: DEFAULT_PIANO_MIDI_SETTINGS
  }
});
const STRING_LEGATO_GLIDE_TIME = AUDIO_TIMING.stringLegatoGlideTimeSeconds; // seconds
const STRING_LEGATO_PRE_DIP_TIME = AUDIO_TIMING.stringLegatoPreDipTimeSeconds; // seconds
const STRING_LEGATO_PRE_DIP_RATIO = AUDIO_TIMING.stringLegatoPreDipRatio;
const STRING_LEGATO_HOLD_TIME = AUDIO_TIMING.stringLegatoHoldTimeSeconds; // seconds
const STRING_LEGATO_FADE_TIME = AUDIO_TIMING.stringLegatoFadeTimeSeconds; // seconds
const AUTOMATION_CURVE_STEPS = AUDIO_TIMING.automationCurveSteps;
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
  resumeDrillAudioContext,
  suspendDrillAudioContext,
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

const CHORD_ANTICIPATION = PIANO_COMPING_CONFIG.chordAnticipationSeconds; // seconds - strings start before the beat
const playSample = playDrillSample;
const playNote = playDrillNote;
const PIANO_COMP_DURATION_RATIO = PIANO_COMPING_CONFIG.durationRatio;
const PIANO_COMP_MIN_DURATION = PIANO_COMPING_CONFIG.minDurationSeconds;
const PIANO_COMP_MAX_DURATION = PIANO_COMPING_CONFIG.maxDurationSeconds;
const PIANO_VOLUME_MULTIPLIER = PIANO_COMPING_CONFIG.volumeMultiplier;

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

const VOICING_RANDOMIZATION_CHANCE = VOICING_RANDOMIZATION_CONFIG.randomizationChance;
const VOICING_BOUNDARY_RANDOMIZATION_CHANCE = VOICING_RANDOMIZATION_CONFIG.boundaryRandomizationChance;
const VOICING_RANDOM_TOP_SLACK = VOICING_RANDOMIZATION_CONFIG.topSlack;
const VOICING_RANDOM_BOUNDARY_SLACK = VOICING_RANDOMIZATION_CONFIG.boundarySlack;
const VOICING_RANDOM_CENTER_SLACK = VOICING_RANDOMIZATION_CONFIG.centerSlack;
const VOICING_RANDOM_SUM_SLACK = VOICING_RANDOMIZATION_CONFIG.sumSlack;
const VOICING_RANDOM_INNER_SLACK = VOICING_RANDOMIZATION_CONFIG.innerSlack;

function isVoiceLeadingV2Enabled() {
  return true;
}

function createVoicingSlot(chord, key, isMinor, segment = 'current', nextChord = null) {
  return createSharedVoicingSlot(chord, key, isMinor, segment, nextChord);
}

function buildVoicingPlanForSlots(slots) {
  return buildSharedVoicingPlanForSlots(slots);
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

let keyPool = [];
let enabledKeys = [true,true,true,true,true,true,true,true,true,true,true,true];

const {
  getEffectiveKeyPool,
  nextKey
} = createDrillRuntimeStateDrillRootAppAssembly({
  keyPoolStateRefs: {
    enabledKeys: createStateRef(() => enabledKeys),
    keyPool: createStateRef(() => keyPool, (value) => { keyPool = value; })
  }
}).keyPoolRuntime;

// ---- Display helpers ----

const {
  getDisplayTranspositionSemitones,
  transposeDisplayPitchClass,
  getDisplayedQuality,
  normalizeDisplayedRootName,
  isCurrentHarmonyHidden,
  getBaseChordDisplaySize
} = createDrillDisplaySupportRootAppAssembly({
  dom,
  constants: {
    displayModeChordsOnly: DISPLAY_MODE_CHORDS_ONLY
  },
  runtimeHelpers: {
    getPlayedChordQuality,
    getDisplayAliasQuality,
    normalizeHarmonyDisplayMode,
    normalizeDisplayMode,
    matchMedia: (...args) => window.matchMedia(...args)
  }
});

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

// Seam marker kept for wrapper tests: const drillDisplay = createDrillDisplayRootAppFacade({
const drillDisplay = createDrillDisplayDrillRootAppFacade({
  dom,
  stateRefs: {
    isPlaying: createStateRef(() => isPlaying),
    isIntro: createStateRef(() => isIntro),
    currentKey: createStateRef(() => currentKey),
    nextKeyValue: createStateRef(() => nextKeyValue),
    currentChordIdx: createStateRef(() => currentChordIdx),
    paddedChords: createStateRef(() => paddedChords),
    nextRawChords: createStateRef(() => nextRawChords)
  },
  state: {
    getShowBeatIndicatorEnabled: () => dom.showBeatIndicator?.checked !== false,
    getCurrentHarmonyHidden: () => dom.hideCurrentHarmony?.checked === true,
    getDisplayMode: () => normalizeDisplayMode(dom.displayMode?.value)
  },
  constants: {
    keyNamesMajor: KEY_NAMES_MAJOR,
    defaultDisplayPlaceholderMessage: DEFAULT_DISPLAY_PLACEHOLDER_MESSAGE
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

const {
  applyBeatIndicatorVisibility,
  applyCurrentHarmonyVisibility: displayApplyCurrentHarmonyVisibility,
  applyDisplayMode,
  showNextCol: displayShowNextCol,
  hideNextCol: displayHideNextCol,
  setDisplayPlaceholderVisible,
  setDisplayPlaceholderMessage,
  updateBeatDots,
  clearBeatDots
} = drillDisplay;

showNextColImpl = displayShowNextCol;
hideNextColImpl = displayHideNextCol;
applyCurrentHarmonyVisibilityImpl = displayApplyCurrentHarmonyVisibility;

setDisplayPlaceholderMessage();

// ---- Scheduler / Playback State ----

let isPlaying = false;
let isPaused = false;
let schedulerTimer = null;
let nextBeatTime = 0;   // audioCtx time of next beat
let currentBeat = 0;    // 0-3 within current measure
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

const {
  getSecondsPerBeat: tempoGetSecondsPerBeat,
  getSwingRatio: tempoGetSwingRatio
} = createDrillTempoRuntimeRootAppAssembly({
  dom,
  constants: {
    defaultSwingRatio: DEFAULT_SWING_RATIO
  }
});

getSecondsPerBeatImpl = tempoGetSecondsPerBeat;
getSwingRatioImpl = tempoGetSwingRatio;

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
} = createDrillNextPreviewDrillRootAppFacade({
  dom,
  stateRefs: {
    nextPreviewLeadUnit: createStateRef(() => nextPreviewLeadUnit, (value) => { nextPreviewLeadUnit = value; }),
    nextPreviewLeadValue: createStateRef(() => nextPreviewLeadValue, (value) => { nextPreviewLeadValue = value; })
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

const {
  getEnabledKeyCount,
  persistKeySelectionPreset,
  syncSelectedKeysSummary,
  isBlackDisplayPitchClass,
  updateKeyCheckboxVisualState,
  syncKeyCheckboxStates,
  applyEnabledKeys,
  saveCurrentKeySelectionPreset,
  loadKeySelectionPreset,
  initialize: initializeKeyPicker,
  buildKeyCheckboxes,
  setAllKeysEnabled,
  invertKeysEnabled
  // Seam marker kept for wrapper tests: } = createDrillKeysRootAppAssembly({
} = createDrillKeysDrillRootAppAssembly({
  dom,
  stateRefs: {
    enabledKeys: createStateRef(() => enabledKeys, (value) => { enabledKeys = value; }),
    keyPool: createStateRef(() => keyPool, (value) => { keyPool = value; }),
    savedKeySelectionPreset: createStateRef(() => savedKeySelectionPreset, (value) => { savedKeySelectionPreset = value; })
  },
  constants: {
    PIANO_BLACK_KEY_COLUMNS,
    PIANO_WHITE_KEY_COLUMNS
  },
  helpers: {
    setKeyPickerOpen,
    stopPlaybackIfRunning,
    getDisplayTranspositionSemitones,
    keyLabelForPicker,
    renderAccidentalTextHtml: renderPickerKeyHtml,
    saveStoredKeySelectionPreset,
    saveSettings,
    trackEvent,
    alert: (message) => window.alert(message)
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
  // Seam marker kept for wrapper tests: } = createDrillWelcomeRootAppFacade({
} = createDrillWelcomeDrillRootAppFacade({
  dom,
  stateRefs: {
    hasCompletedWelcomeOnboarding: createStateRef(() => hasCompletedWelcomeOnboarding, (value) => { hasCompletedWelcomeOnboarding = value; }),
    shouldShowWelcomeNextTime: createStateRef(() => shouldShowWelcomeNextTime, (value) => { shouldShowWelcomeNextTime = value; }),
    welcomeStandards: createStateRef(() => welcomeStandards),
    progressions: createStateRef(() => progressions),
    suppressPatternSelectChange: createStateRef(() => suppressPatternSelectChange, (value) => { suppressPatternSelectChange = value; }),
    progressionSelectionBeforeEditing: createStateRef(() => progressionSelectionBeforeEditing, (value) => { progressionSelectionBeforeEditing = value; }),
    isCreatingProgression: createStateRef(() => isCreatingProgression, (value) => { isCreatingProgression = value; }),
    lastPatternSelectValue: createStateRef(() => lastPatternSelectValue, (value) => { lastPatternSelectValue = value; }),
    nextPreviewLeadValue: createStateRef(() => nextPreviewLeadValue, (value) => { nextPreviewLeadValue = value; })
  },
  state: {
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
} = createDrillRuntimeStateDrillRootAppAssembly({
  sessionAnalyticsDom: dom,
  sessionAnalyticsStateRefs: {
      sessionStartedAt: createStateRef(() => sessionStartedAt),
      sessionStartTracked: createStateRef(() => sessionStartTracked, (value) => { sessionStartTracked = value; }),
      sessionEngagedTracked: createStateRef(() => sessionEngagedTracked, (value) => { sessionEngagedTracked = value; }),
      sessionDurationTracked: createStateRef(() => sessionDurationTracked, (value) => { sessionDurationTracked = value; }),
      sessionActionCount: createStateRef(() => sessionActionCount, (value) => { sessionActionCount = value; })
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
  getCurrentPatternMode: progressionGetCurrentPatternMode,
  getCurrentPatternName: progressionGetCurrentPatternName,
  getCurrentPatternString: progressionGetCurrentPatternString,
  getPatternModeLabel,
  getProgressionEntry,
  getProgressionLabel,
  getProgressionNames,
  getSelectedProgressionMode: progressionGetSelectedProgressionMode,
  getSelectedProgressionName: progressionGetSelectedProgressionName,
  getSelectedProgressionPattern: progressionGetSelectedProgressionPattern,
  hasSelectedProgression: progressionHasSelectedProgression,
  hasStandaloneCustomDraft,
  isCustomPatternSelected: progressionIsCustomPatternSelected,
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
} = createDrillProgressionDrillRootAppAssembly({
  dom,
  editorStateRefs: {
    progressions: createStateRef(() => progressions, (value) => { progressions = value; }),
    editingProgressionName: createStateRef(() => editingProgressionName, (value) => { editingProgressionName = value; }),
    editingProgressionSnapshot: createStateRef(() => editingProgressionSnapshot, (value) => { editingProgressionSnapshot = value; }),
    progressionSelectionBeforeEditing: createStateRef(() => progressionSelectionBeforeEditing, (value) => { progressionSelectionBeforeEditing = value; }),
    isCreatingProgression: createStateRef(() => isCreatingProgression, (value) => { isCreatingProgression = value; }),
    isManagingProgressions: createStateRef(() => isManagingPresets, (value) => { isManagingPresets = value; }),
    lastStandaloneCustomName: createStateRef(() => lastStandaloneCustomName, (value) => { lastStandaloneCustomName = value; }),
    lastStandaloneCustomPattern: createStateRef(() => lastStandaloneCustomPattern, (value) => { lastStandaloneCustomPattern = value; }),
    lastStandaloneCustomMode: createStateRef(() => lastStandaloneCustomMode, (value) => { lastStandaloneCustomMode = value; }),
    suppressPatternSelectChange: createStateRef(() => suppressPatternSelectChange, (value) => { suppressPatternSelectChange = value; }),
    keyPool: createStateRef(() => keyPool, (value) => { keyPool = value; })
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
  managerStateRefs: {
    progressions: createStateRef(() => progressions, (value) => { progressions = value; }),
    isManagingProgressions: createStateRef(() => isManagingPresets, (value) => { isManagingPresets = value; }),
    suppressListRender: createStateRef(() => suppressListRender, (value) => { suppressListRender = value; }),
    draggedProgressionName: createStateRef(() => draggedPresetName, (value) => { draggedPresetName = value; }),
    pendingProgressionDeletion: createStateRef(() => pendingPresetDeletion, (value) => { pendingPresetDeletion = value; }),
    editingProgressionName: createStateRef(() => editingProgressionName, (value) => { editingProgressionName = value; }),
    editingProgressionSnapshot: createStateRef(() => editingProgressionSnapshot, (value) => { editingProgressionSnapshot = value; }),
    progressionSelectionBeforeEditing: createStateRef(() => progressionSelectionBeforeEditing, (value) => { progressionSelectionBeforeEditing = value; }),
    isCreatingProgression: createStateRef(() => isCreatingProgression, (value) => { isCreatingProgression = value; }),
    appliedDefaultProgressionsFingerprint: createStateRef(() => appliedDefaultProgressionsFingerprint, (value) => { appliedDefaultProgressionsFingerprint = value; }),
    acknowledgedDefaultProgressionsVersion: createStateRef(() => acknowledgedDefaultProgressionsVersion, (value) => { acknowledgedDefaultProgressionsVersion = value; }),
    shouldPromptForDefaultProgressionsUpdate: createStateRef(() => shouldPromptForDefaultProgressionsUpdate, (value) => { shouldPromptForDefaultProgressionsUpdate = value; }),
    defaultProgressionsVersion: createStateRef(() => defaultProgressionsVersion, (value) => { defaultProgressionsVersion = value; }),
    defaultProgressions: createStateRef(() => DEFAULT_PROGRESSIONS, (value) => { DEFAULT_PROGRESSIONS = value; }),
    lastStandaloneCustomName: createStateRef(() => lastStandaloneCustomName, (value) => { lastStandaloneCustomName = value; }),
    lastStandaloneCustomPattern: createStateRef(() => lastStandaloneCustomPattern, (value) => { lastStandaloneCustomPattern = value; }),
    lastStandaloneCustomMode: createStateRef(() => lastStandaloneCustomMode, (value) => { lastStandaloneCustomMode = value; }),
    lastPatternSelectValue: createStateRef(() => lastPatternSelectValue, (value) => { lastPatternSelectValue = value; })
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
  controlsStateRefs: {
    suppressPatternSelectChange: createStateRef(() => suppressPatternSelectChange, (value) => { suppressPatternSelectChange = value; }),
    lastPatternSelectValue: createStateRef(() => lastPatternSelectValue, (value) => { lastPatternSelectValue = value; }),
    keyPool: createStateRef(() => keyPool, (value) => { keyPool = value; })
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
getCurrentPatternModeImpl = progressionGetCurrentPatternMode;
getCurrentPatternNameImpl = progressionGetCurrentPatternName;
getCurrentPatternStringImpl = progressionGetCurrentPatternString;
getSelectedProgressionModeImpl = progressionGetSelectedProgressionMode;
getSelectedProgressionNameImpl = progressionGetSelectedProgressionName;
getSelectedProgressionPatternImpl = progressionGetSelectedProgressionPattern;
hasSelectedProgressionImpl = progressionHasSelectedProgression;
isCustomPatternSelectedImpl = progressionIsCustomPatternSelected;
setEditorPatternModeImpl = progressionSetEditorPatternMode;
setPatternSelectValueImpl = progressionSetPatternSelectValue;
syncCustomPatternUIImpl = progressionSyncCustomPatternUI;
syncPatternPreviewImpl = progressionSyncPatternPreview;
syncPatternSelectionFromInputImpl = progressionSyncPatternSelectionFromInput;
syncProgressionManagerStateImpl = progressionSyncProgressionManagerState;

const {
  buildProgression: runtimeSupportBuildProgression,
  validateCustomPattern: runtimeSupportValidateCustomPattern,
  setKeyPickerOpen: runtimeSupportSetKeyPickerOpen,
  escapeHtml: runtimeSupportEscapeHtml,
  getPianoVoicingMode: runtimeSupportGetPianoVoicingMode,
  getRepetitionsPerKey: runtimeSupportGetRepetitionsPerKey,
  clearOneChordCycleState: runtimeSupportClearOneChordCycleState,
  toAnalyticsToken: runtimeSupportToAnalyticsToken,
  stopPlaybackIfRunning: runtimeSupportStopPlaybackIfRunning,
  keyLabelForPicker: runtimeSupportKeyLabelForPicker,
  updateKeyPickerLabels: runtimeSupportUpdateKeyPickerLabels,
  refreshDisplayedHarmony: runtimeSupportRefreshDisplayedHarmony,
  resolvePlaybackSessionController: runtimeSupportResolvePlaybackSessionController
} = createDrillAppRuntimeSupportRootAppAssembly({
  dom,
  runtimeState: {
    getCurrentRawChords: () => currentRawChords,
    setCurrentRawChords: (value) => { currentRawChords = value; },
    setNextRawChords: (value) => { nextRawChords = value; },
    setOneChordQualityPool: (value) => { oneChordQualityPool = value; },
    setOneChordQualityPoolSignature: (value) => { oneChordQualityPoolSignature = value; },
    setCurrentOneChordQualityValue: (value) => { currentOneChordQualityValue = value; },
    setNextOneChordQualityValue: (value) => { nextOneChordQualityValue = value; },
    getCurrentPatternString,
    getIsPlaying: () => isPlaying,
    getPlaybackSessionController: () => playbackSessionController,
    setPlaybackSessionController: (value) => { playbackSessionController = value; }
  },
  runtimeConstants: {
    oneChordDefaultQualities: ONE_CHORD_DEFAULT_QUALITIES
  },
  runtimeHelpers: {
    isCustomPatternSelected,
    normalizePatternString,
    analyzePattern,
    parseOneChordSpec,
    createOneChordToken,
    parsePattern,
    normalizeCompingStyle,
    normalizeRepetitionsPerKey,
    stopPlayback: () => stop(),
    getDisplayFacade: () => drillDisplay
  }
});

buildProgressionImpl = runtimeSupportBuildProgression;
validateCustomPatternImpl = runtimeSupportValidateCustomPattern;
setKeyPickerOpenImpl = runtimeSupportSetKeyPickerOpen;
escapeHtmlImpl = runtimeSupportEscapeHtml;
getPianoVoicingModeImpl = runtimeSupportGetPianoVoicingMode;
getRepetitionsPerKeyImpl = runtimeSupportGetRepetitionsPerKey;
clearOneChordCycleStateImpl = runtimeSupportClearOneChordCycleState;
toAnalyticsTokenImpl = runtimeSupportToAnalyticsToken;
stopPlaybackIfRunningImpl = runtimeSupportStopPlaybackIfRunning;
keyLabelForPickerImpl = runtimeSupportKeyLabelForPicker;
updateKeyPickerLabelsImpl = runtimeSupportUpdateKeyPickerLabels;
refreshDisplayedHarmonyImpl = runtimeSupportRefreshDisplayedHarmony;
resolvePlaybackSessionControllerImpl = runtimeSupportResolvePlaybackSessionController;

const {
  prepareNextProgressionPlayback,
  scheduleBeatPlayback,
  scheduleDisplayPlayback,
  start: playbackStart,
  stop,
  togglePause
} = createDrillPlaybackRuntimeHostDrillRootAppAssembly({
  dom,
  runtimeStateRefs: {
    audioContext: createStateRef(() => audioCtx),
    currentBassPlan: createStateRef(() => currentBassPlan, (value) => { currentBassPlan = value; }),
    currentBeat: createStateRef(() => currentBeat, (value) => { currentBeat = value; }),
    currentChordIdx: createStateRef(() => currentChordIdx, (value) => { currentChordIdx = value; }),
    currentCompingPlan: createStateRef(() => currentCompingPlan, (value) => { currentCompingPlan = value; }),
    currentKey: createStateRef(() => currentKey, (value) => { currentKey = value; }),
    currentKeyRepetition: createStateRef(() => currentKeyRepetition, (value) => { currentKeyRepetition = value; }),
    currentOneChordQualityValue: createStateRef(() => currentOneChordQualityValue, (value) => { currentOneChordQualityValue = value; }),
    currentRawChords: createStateRef(() => currentRawChords, (value) => { currentRawChords = value; }),
    currentVoicingPlan: createStateRef(() => currentVoicingPlan, (value) => { currentVoicingPlan = value; }),
    isIntro: createStateRef(() => isIntro, (value) => { isIntro = value; }),
    isPaused: createStateRef(() => isPaused, (value) => { isPaused = value; }),
    isPlaying: createStateRef(() => isPlaying, (value) => { isPlaying = value; }),
    lastPlayedChordIdx: createStateRef(() => lastPlayedChordIdx, (value) => { lastPlayedChordIdx = value; }),
    loopVoicingTemplate: createStateRef(() => loopVoicingTemplate, (value) => { loopVoicingTemplate = value; }),
    nextBeatTime: createStateRef(() => nextBeatTime, (value) => { nextBeatTime = value; }),
    nextCompingPlan: createStateRef(() => nextCompingPlan, (value) => { nextCompingPlan = value; }),
    nextKeyValue: createStateRef(() => nextKeyValue, (value) => { nextKeyValue = value; }),
    nextOneChordQualityValue: createStateRef(() => nextOneChordQualityValue, (value) => { nextOneChordQualityValue = value; }),
    nextPaddedChords: createStateRef(() => nextPaddedChords, (value) => { nextPaddedChords = value; }),
    nextRawChords: createStateRef(() => nextRawChords, (value) => { nextRawChords = value; }),
    nextVoicingPlan: createStateRef(() => nextVoicingPlan, (value) => { nextVoicingPlan = value; }),
    paddedChords: createStateRef(() => paddedChords, (value) => { paddedChords = value; }),
    activeNoteGain: createStateRef(() => activeNoteGain, (value) => { activeNoteGain = value; }),
    firstPlayStartTracked: createStateRef(() => firstPlayStartTracked, (value) => { firstPlayStartTracked = value; }),
    playStopSuggestionCount: createStateRef(() => playStopSuggestionCount, (value) => { playStopSuggestionCount = value; }),
    keyPool: createStateRef(() => keyPool, (value) => { keyPool = value; }),
    schedulerTimer: createStateRef(() => schedulerTimer, (value) => { schedulerTimer = value; })
  },
  audioStateRefs: {
    audioContext: createStateRef(() => audioCtx, (value) => { audioCtx = value; }),
    activeNoteGain: createStateRef(() => activeNoteGain, (value) => { activeNoteGain = value; })
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
    resumeAudioContext: resumeDrillAudioContext,
    suspendAudioContext: suspendDrillAudioContext,
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












// ---- Persistence (localStorage) ----

const APP_BASE_URL = (import.meta?.env?.BASE_URL) || './';
const PATTERN_HELP_URL = `${APP_BASE_URL}${TRAINER_RESOURCE_PATHS.patternHelp}`;
const PATTERN_HELP_VERSION = APP_VERSION;

const {
  createDefaultAppSettings: settingsCreateDefaultAppSettings,
  buildSettingsSnapshot,
  applyLoadedSettings,
  finalizeLoadedSettings,
  resetPlaybackSettings
} = createDrillSettingsDrillRootAppAssembly({
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
  snapshotStateRefs: {
      hasCompletedWelcomeOnboarding: createStateRef(() => hasCompletedWelcomeOnboarding),
      shouldShowWelcomeNextTime: createStateRef(() => shouldShowWelcomeNextTime),
      progressions: createStateRef(() => progressions),
      appliedDefaultProgressionsFingerprint: createStateRef(() => appliedDefaultProgressionsFingerprint),
      acknowledgedDefaultProgressionsVersion: createStateRef(() => acknowledgedDefaultProgressionsVersion),
      appliedOneTimeMigrations: createStateRef(() => appliedOneTimeMigrations),
      editingProgressionName: createStateRef(() => editingProgressionName),
      progressionSelectionBeforeEditing: createStateRef(() => progressionSelectionBeforeEditing),
      editingProgressionSnapshot: createStateRef(() => editingProgressionSnapshot),
      isCreatingProgression: createStateRef(() => isCreatingProgression),
      nextPreviewLeadValue: createStateRef(() => nextPreviewLeadValue),
      enabledKeys: createStateRef(() => enabledKeys),
      pianoFadeSettings: createStateRef(() => pianoFadeSettings),
      pianoMidiSettings: createStateRef(() => pianoMidiSettings)
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
  loadApplierStateRefs: {
      hasCompletedWelcomeOnboarding: createStateRef(() => hasCompletedWelcomeOnboarding, (value) => { hasCompletedWelcomeOnboarding = value; }),
      shouldShowWelcomeNextTime: createStateRef(() => shouldShowWelcomeNextTime, (value) => { shouldShowWelcomeNextTime = value; }),
      hadStoredProgressions: createStateRef(() => hadStoredProgressions, (value) => { hadStoredProgressions = value; }),
      appliedOneTimeMigrations: createStateRef(() => appliedOneTimeMigrations, (value) => { appliedOneTimeMigrations = value; }),
      appliedDefaultProgressionsFingerprint: createStateRef(() => appliedDefaultProgressionsFingerprint, (value) => { appliedDefaultProgressionsFingerprint = value; }),
      acknowledgedDefaultProgressionsVersion: createStateRef(() => acknowledgedDefaultProgressionsVersion, (value) => { acknowledgedDefaultProgressionsVersion = value; }),
      savedPatternSelection: createStateRef(() => savedPatternSelection, (value) => { savedPatternSelection = value; }),
      progressions: createStateRef(() => progressions, (value) => { progressions = value; }),
      shouldPersistRecoveredDefaultProgressions: createStateRef(() => shouldPersistRecoveredDefaultProgressions, (value) => { shouldPersistRecoveredDefaultProgressions = value; }),
      nextPreviewLeadValue: createStateRef(() => nextPreviewLeadValue, (value) => { nextPreviewLeadValue = value; }),
      enabledKeys: createStateRef(() => enabledKeys, (value) => { enabledKeys = value; }),
      pianoFadeSettings: createStateRef(() => pianoFadeSettings, (value) => { pianoFadeSettings = value; }),
      pianoMidiSettings: createStateRef(() => pianoMidiSettings, (value) => { pianoMidiSettings = value; }),
      editingProgressionName: createStateRef(() => editingProgressionName, (value) => { editingProgressionName = value; }),
      progressionSelectionBeforeEditing: createStateRef(() => progressionSelectionBeforeEditing, (value) => { progressionSelectionBeforeEditing = value; }),
      editingProgressionSnapshot: createStateRef(() => editingProgressionSnapshot, (value) => { editingProgressionSnapshot = value; }),
      isCreatingProgression: createStateRef(() => isCreatingProgression, (value) => { isCreatingProgression = value; }),
      shouldPromptForDefaultProgressionsUpdate: createStateRef(() => shouldPromptForDefaultProgressionsUpdate, (value) => { shouldPromptForDefaultProgressionsUpdate = value; })
  },
  loadApplierState: {
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
  loadFinalizerStateRefs: {
      appliedDefaultProgressionsFingerprint: createStateRef(() => appliedDefaultProgressionsFingerprint, (value) => { appliedDefaultProgressionsFingerprint = value; }),
      hadStoredProgressions: createStateRef(() => hadStoredProgressions),
      savedPatternSelection: createStateRef(() => savedPatternSelection),
      isCreatingProgression: createStateRef(() => isCreatingProgression),
      shouldPersistRecoveredDefaultProgressions: createStateRef(() => shouldPersistRecoveredDefaultProgressions, (value) => { shouldPersistRecoveredDefaultProgressions = value; })
  },
  loadFinalizerState: {
      setLastStandaloneCustomName: (value) => { lastStandaloneCustomName = value; },
      setLastStandaloneCustomPattern: (value) => { lastStandaloneCustomPattern = value; },
      setLastStandaloneCustomMode: (value) => { lastStandaloneCustomMode = value; }
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
  resetterStateRefs: {
      progressions: createStateRef(() => progressions),
      lastPatternSelectValue: createStateRef(() => lastPatternSelectValue, (value) => { lastPatternSelectValue = value; }),
      pianoFadeSettings: createStateRef(() => pianoFadeSettings, (value) => { pianoFadeSettings = value; }),
      pianoMidiSettings: createStateRef(() => pianoMidiSettings, (value) => { pianoMidiSettings = value; }),
      nextPreviewLeadValue: createStateRef(() => nextPreviewLeadValue, (value) => { nextPreviewLeadValue = value; })
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
const drillSettingsPersistence = createDrillSettingsPersistenceDrillRootAppAssembly({
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
  stateRefs: {
    savedKeySelectionPreset: createStateRef(() => savedKeySelectionPreset, (value) => {
      savedKeySelectionPreset = value;
    })
  }
});

saveSettingsImpl = (...args) => drillSettingsPersistence.saveSettings(...args);

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
  // Seam marker kept for wrapper tests: } = createDrillPianoToolsRootAppFacade({
} = createDrillPianoToolsDrillRootAppFacade({
  dom,
  version: PIANO_SETTINGS_PRESET_VERSION,
  stateRefs: {
    pianoFadeSettings: createStateRef(() => pianoFadeSettings, (value) => { pianoFadeSettings = value; }),
    pianoMidiSettings: createStateRef(() => pianoMidiSettings, (value) => { pianoMidiSettings = value; })
  },
  normalizePianoFadeSettings,
  normalizePianoMidiSettings,
  attachMidiInput: (...args) => attachMidiInput(...args),
  saveSettings: (...args) => saveSettings(...args)
});

const {
  ensureMidiPianoRangePreload: pianoMidiEnsureRangePreload,
  stopMidiPianoVoice: pianoMidiStopVoice,
  stopAllMidiPianoVoices: pianoMidiStopAllVoices,
  handleMidiMessage: pianoMidiHandleMessage
} = createDrillPianoMidiLiveRuntimeRootAppAssembly({
  runtimeState: {
    getAudioContext: () => audioCtx,
    getPianoMidiSettings: () => pianoMidiSettings,
    getPianoFadeSettings: () => pianoFadeSettings,
    getMidiPianoRangePreloadPromise: () => midiPianoRangePreloadPromise,
    setMidiPianoRangePreloadPromise: (value) => { midiPianoRangePreloadPromise = value; },
    getMidiSustainPedalDown: () => midiSustainPedalDown,
    setMidiSustainPedalDown: (value) => { midiSustainPedalDown = value; }
  },
  collections: {
    pendingMidiNoteTokens,
    activeMidiPianoVoices,
    sustainedMidiNotes
  },
  runtimeHelpers: {
    clamp01,
    clampRange,
    getPianoFadeProfile,
    bassMidiToNoteName,
    initAudio,
    resumeAudioContext: resumeDrillAudioContext,
    loadPianoSample,
    loadPianoSampleList,
    getSampleBuffer: (sampleKey) => sampleBuffers.piano[sampleKey] || null,
    getMixerDestination,
    trackScheduledSource,
    setPianoMidiStatus
  },
  constants: {
    pianoRhythmConfig,
    pianoSampleLow: PIANO_SAMPLE_LOW,
    pianoSampleHigh: PIANO_SAMPLE_HIGH,
    pianoVolumeMultiplier: PIANO_VOLUME_MULTIPLIER
  }
});

ensureMidiPianoRangePreloadImpl = pianoMidiEnsureRangePreload;
stopMidiPianoVoiceImpl = pianoMidiStopVoice;
stopAllMidiPianoVoicesImpl = pianoMidiStopAllVoices;
handleMidiMessageImpl = pianoMidiHandleMessage;

const {
  attachMidiInput: pianoMidiAttachInput,
  refreshMidiInputs
} = createDrillPianoMidiRuntimeDrillRootAppAssembly({
  dom,
  runtimeStateRefs: {
    midiAccess: createStateRef(() => midiAccess, (value) => { midiAccess = value; }),
    midiAccessPromise: createStateRef(() => midiAccessPromise, (value) => { midiAccessPromise = value; }),
    currentMidiInput: createStateRef(() => currentMidiInput, (value) => { currentMidiInput = value; }),
    pianoMidiSettings: createStateRef(() => pianoMidiSettings)
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

const {
  loadPatternHelp,
  loadDefaultProgressions
} = createDrillStartupDataDrillRootAppAssembly({
  stateRefs: {
    defaultProgressionsVersion: createStateRef(() => defaultProgressionsVersion, (value) => { defaultProgressionsVersion = value; }),
    defaultProgressions: createStateRef(() => DEFAULT_PROGRESSIONS, (value) => { DEFAULT_PROGRESSIONS = value; }),
    progressions: createStateRef(() => progressions, (value) => { progressions = value; })
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

void bindIncomingMobileImports();

const drillUiBootstrap = createDrillUiBootstrapDrillRootAppAssembly({
  screenDom: dom,
  screenStateRefs: {
    progressions: createStateRef(() => progressions),
    savedPatternSelection: createStateRef(() => savedPatternSelection),
    shouldPromptForDefaultProgressionsUpdate: createStateRef(() => shouldPromptForDefaultProgressionsUpdate),
    appliedDefaultProgressionsFingerprint: createStateRef(() => appliedDefaultProgressionsFingerprint, (value) => { appliedDefaultProgressionsFingerprint = value; }),
    lastPatternSelectValue: createStateRef(() => lastPatternSelectValue, (value) => { lastPatternSelectValue = value; })
  },
  screenConstants: {
    customPatternOptionValue: CUSTOM_PATTERN_OPTION_VALUE
  },
  screenHelpers: {
    initializeSocialShareLinks,
    loadDefaultProgressions,
    loadPatternHelp,
    loadWelcomeStandards,
    renderProgressionOptions,
    loadSettings: (...args) => drillSettingsPersistence.loadSettings(...args),
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
    consumePendingPracticeSessionIntoUi: ({ afterApply }) => consumePendingPracticeSessionIntoUi({
      applyEmbeddedPattern,
      applyEmbeddedPlaybackSettings,
      afterApply
    }),
    setWelcomeOverlayVisible,
    maybeShowWelcomeOverlay
  },
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
  runtimeControlsDom: dom,
  runtimeControlsStateRefs: {
    isPlaying: createStateRef(() => isPlaying),
    audioContext: createStateRef(() => audioCtx),
    currentKey: createStateRef(() => currentKey),
    nextPreviewLeadUnit: createStateRef(() => nextPreviewLeadUnit)
  },
  runtimeControlsState: {
    getNextPreviewInputUnit: () => getNextPreviewInputUnit()
  },
  runtimeControlsConstants: {
    noteFadeout: NOTE_FADEOUT,
    nextPreviewUnitBars: NEXT_PREVIEW_UNIT_BARS,
    nextPreviewUnitSeconds: NEXT_PREVIEW_UNIT_SECONDS
  },
  runtimeControlsHelpers: {
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
  },
  harmonyDisplayObservers: {
    fitHarmonyDisplay,
    chordDisplay: dom.chordDisplay,
    nextChordDisplay: dom.nextChordDisplay,
    displayColumns: document.getElementById('display-columns')
  }
});

const drillUiEventBindings = createDrillUiEventBindingsDrillRootAppAssembly({
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
    noteFadeout: NOTE_FADEOUT,
    stopActiveChordVoices,
    rebuildPreparedCompingPlans,
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
  settingsStateRefs: {
    isPlaying: createStateRef(() => isPlaying),
    audioContext: createStateRef(() => audioCtx),
    currentKey: createStateRef(() => currentKey)
  },
  pianoPresetControls: {
    dom,
    refreshPianoSettingsJson,
    setPianoMidiStatus,
    applyPianoPresetFromJsonText,
    refreshMidiInputs,
    normalizePianoFadeSettings,
    normalizePianoMidiSettings,
    defaultPianoFadeSettings: DEFAULT_PIANO_FADE_SETTINGS,
    defaultPianoMidiSettings: DEFAULT_PIANO_MIDI_SETTINGS,
    stopAllMidiPianoVoices,
    syncPianoToolsUi,
    attachMidiInput,
    saveSettings,
    clipboard: navigator.clipboard,
    alert: (message) => window.alert(message)
  },
  pianoPresetStateRefs: {
    pianoFadeSettings: createStateRef(() => pianoFadeSettings, (value) => { pianoFadeSettings = value; }),
    pianoMidiSettings: createStateRef(() => pianoMidiSettings, (value) => { pianoMidiSettings = value; })
  },
  lifecycleControls: {
    visibilityTarget: document,
    userGestureTarget: window,
    resumeAudioContext: resumeDrillAudioContext,
    togglePausePlayback: () => togglePause()
  },
  lifecycleStateRefs: {
    isPlaying: createStateRef(() => isPlaying),
    isPaused: createStateRef(() => isPaused),
    audioContext: createStateRef(() => audioCtx)
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

const {
  playbackController: embeddedPlaybackController,
  applyEmbeddedPattern,
  applyEmbeddedPlaybackSettings,
  getEmbeddedPlaybackState
} = createDrillSharedPlaybackDrillRootAppAssembly({
  dom,
  host: {
    dom,
    state: {
      getPaddedChordCount: () => (Array.isArray(paddedChords) ? paddedChords.length : 0)
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
  },
  hostStateRefs: {
    lastPatternSelectValue: createStateRef(() => lastPatternSelectValue, (value) => { lastPatternSelectValue = value; }),
    isPlaying: createStateRef(() => isPlaying),
    isPaused: createStateRef(() => isPaused),
    isIntro: createStateRef(() => isIntro),
    currentBeat: createStateRef(() => currentBeat),
    currentChordIdx: createStateRef(() => currentChordIdx),
    currentKey: createStateRef(() => currentKey),
    audioContext: createStateRef(() => audioCtx)
  },
  patternUi: {
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
  directPlaybackRuntime: {
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
  },
  directPlaybackRuntimeStateRefs: {
    audioContext: createStateRef(() => audioCtx),
    currentKey: createStateRef(() => currentKey)
  },
  directPlaybackStateRefs: {
    isPlaying: createStateRef(() => isPlaying)
  },
  directTransportActions: {
    startPlayback: () => start(),
    stopPlayback: () => stop(),
    togglePausePlayback: () => togglePause()
  }
});

function getPlaybackSessionController() {
  return resolvePlaybackSessionController(embeddedPlaybackController);
}

initializeApp();
setDisplayPlaceholderVisible(true);

