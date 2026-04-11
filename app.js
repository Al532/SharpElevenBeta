import { getAnalyticsDebugEnabled, setAnalyticsDebugEnabled, trackEvent } from './analytics.js';
import {
  createProgressionEntry as createProgressionEntryBase,
  isProgressionModeToken,
  normalizeProgressionEntry as normalizeProgressionEntryBase,
  normalizeProgressionsMap as normalizeProgressionsMapBase,
  parseDefaultProgressionsText as parseDefaultProgressionsTextBase
} from './progression-library.js';
import { bindProgressionControls } from './progression-bindings.js';
import { createPlaybackScheduler } from './playback-scheduler.js';
import { createPlaybackTransport } from './playback-transport.js';
import { createProgressionEditor } from './progression-editor.js';
import { createProgressionManager } from './progression-manager.js';
import {
  loadStoredKeySelectionPreset,
  loadStoredProgressionSettings,
  saveStoredKeySelectionPreset,
  saveStoredProgressionSettings
} from './progression-storage.js';
import { createCompingEngine } from './comping-engine.js';
import { DEFAULT_DISPLAY_PLACEHOLDER_MESSAGE } from './display-placeholder-messages.js';
import { renderChordSymbolHtml } from './chord-symbol-display.js';
import voicingConfig from './voicing-config.js';

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
  '#5': 8, b13: 8, '6': 9, '13': 9, bb7: 9,
  b7: 10, '7': 11
};

const PIANO_WHITE_KEY_COLUMNS = { 0: 1, 2: 2, 4: 3, 5: 4, 7: 5, 9: 6, 11: 7 };
const PIANO_BLACK_KEY_COLUMNS = { 1: 1, 3: 2, 6: 4, 8: 5, 10: 6 };

const APP_VERSION = typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : 'dev';
const ONE_TIME_MIGRATIONS = Object.freeze({
  silentDefaultPresetReset: '2026-04-silent-default-preset-reset'
});

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
  QUALITY_CATEGORY_ALIASES = {}
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
  doubleTimeToggle: document.getElementById('double-time'),
  majorMinor:      document.getElementById('major-minor'),
  displayMode:     document.getElementById('display-mode'),
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
  bassVolume:      document.getElementById('bass-volume'),
  bassVolumeValue: document.getElementById('bass-volume-value'),
  stringsVolume:   document.getElementById('strings-volume'),
  stringsVolumeValue: document.getElementById('strings-volume-value'),
  drumsVolume:     document.getElementById('drums-volume'),
  drumsVolumeValue: document.getElementById('drums-volume-value'),
  showBeatIndicator: document.getElementById('show-beat-indicator'),
  hideCurrentHarmony: document.getElementById('hide-current-harmony'),
  welcomeOverlay: document.getElementById('welcome-overlay'),
  welcomeSkip: document.getElementById('welcome-skip'),
  welcomeApply: document.getElementById('welcome-apply'),
  welcomeSummary: document.getElementById('welcome-summary'),
  welcomeGoalPanels: document.querySelectorAll('[data-welcome-panel]'),
  reopenWelcome: document.getElementById('reopen-welcome'),
  welcomeStandardSelect: document.getElementById('welcome-standard-select'),
  resetSettings: document.getElementById('reset-settings')
};

if (dom.appVersion) {
  dom.appVersion.textContent = `Version ${APP_VERSION}`;
}

function setKeyPickerOpen(isOpen) {
  if (!dom.keyPicker) return;
  dom.keyPicker.open = Boolean(isOpen);
}

dom.closeKeyPicker?.addEventListener('click', () => {
  setKeyPickerOpen(false);
});

dom.keyPickerBackdrop?.addEventListener('click', () => {
  setKeyPickerOpen(false);
});

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape' || !dom.keyPicker?.open) return;
  setKeyPickerOpen(false);
  dom.selectedKeysSummary?.focus();
});

dom.keyPicker?.addEventListener('toggle', () => {
  const isOpen = Boolean(dom.keyPicker?.open);
  document.body.classList.toggle('key-picker-open', isOpen);
  if (isOpen) {
    window.requestAnimationFrame(() => {
      dom.closeKeyPicker?.focus();
    });
    return;
  }
  restoreAllKeysIfNoneSelectedOnClose();
});

function initializeSocialShareLinks() {
  const shareLinks = Array.from(document.querySelectorAll('.social-share-link[data-share-network]'));
  if (!shareLinks.length) return;

  shareLinks.forEach((link) => {
    const network = link.dataset.shareNetwork;
    link.addEventListener('click', () => {
      trackEvent('social_share_clicked', {
        share_network: network,
        location: 'header'
      });
    });
  });
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

const WELCOME_PROGRESSIONS = Object.freeze({
  'ii-v-i-major': {
    summary: 'Suggested: II V I major, tempo 130, 2 reps per key.',
    presetName: 'II V I',
    majorMinor: false,
    repetitionsPerKey: 2,
    tempo: 130,
    chordsPerBar: 1,
    compingStyle: COMPING_STYLE_STRINGS,
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
    compingStyle: COMPING_STYLE_STRINGS,
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
    compingStyle: COMPING_STYLE_STRINGS,
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
  'autumn-leaves': {
    summary: 'Suggested: Autumn Leaves, single key, comfortable playback.',
    patternName: 'Autumn Leaves',
    pattern: 'key: E | Am7 D7 | G | F#m7b5 B7 | Em | B7 | Em | Am7 D7 | G | F#m7b5 B7 | Em | F#m7b5 B7 | Em |',
    patternMode: PATTERN_MODE_MINOR,
    majorMinor: true,
    repetitionsPerKey: 1,
    tempo: 120,
    chordsPerBar: 4,
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
let cachedPatternAnalysisInput = null;
let cachedPatternAnalysisResult = null;
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
    console.warn('Welcome standards load failed:', error);
    welcomeStandards = { ...WELCOME_STANDARDS_FALLBACK };
  }

  renderWelcomeStandardOptions();
}

function normalizePresetNameForInput(name) {
  return String(name || '')
    .replace(/\s{2,}/g, ' ');
}

function normalizePatternString(pattern) {
  return String(pattern || '')
    .replace(/-/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function normalizeCompingStyle(style) {
  return [COMPING_STYLE_OFF, COMPING_STYLE_STRINGS, COMPING_STYLE_PIANO].includes(style)
    ? style
    : COMPING_STYLE_STRINGS;
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

const ONE_CHORD_TAG = 'one:';
const ONE_CHORD_DEFAULT_QUALITIES = [
  '6', 'maj7', 'lyd', 'm7', 'm9', 'm6', 'm7b5', 'dim7',
  '13', '7b9', '7alt', '7oct', '13#11', '7#5', '7sus', '7b9sus'
];
const ONE_CHORD_DOMINANT_QUALITIES = [
  '13', '7b9', '7alt', '7oct', '13#11', '7#5', '7sus', '7b9sus'
];
const ONE_CHORD_QUALITY_ALIASES = {
  '6': '6',
  maj7: 'maj7',
  '△7': 'maj7',
  '△9': 'maj7',
  lyd: 'lyd',
  m7: 'm7',
  m9: 'm9',
  m6: 'm6',
  'ø7': 'm7b5',
  m7b5: 'm7b5',
  dim7: 'dim7',
  '°7': 'dim7',
  '7mixo': '13',
  '13mixo': '13',
  '13b9': '7b9',
  '13alt': '7alt',
  '13oct': '7oct',
  '7lyd': '13#11',
  '7#11': '13#11',
  '13lyd': '13#11',
  '13#5': '7#5',
  '13sus': '7sus',
  '13b9sus': '7b9sus'
};

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

function normalizeOneChordQualityToken(token) {
  const normalized = String(token || '').trim().toLowerCase();
  if (Object.prototype.hasOwnProperty.call(DOMINANT_QUALITY_ALIASES, normalized)) return normalized;
  for (const [canonicalQuality, aliases] of Object.entries(DOMINANT_QUALITY_ALIASES)) {
    if ((aliases || []).includes(normalized)) return canonicalQuality;
  }
  if (Object.prototype.hasOwnProperty.call(QUALITY_CATEGORY_ALIASES, normalized)) return normalized;
  for (const [canonicalQuality, aliases] of Object.entries(QUALITY_CATEGORY_ALIASES)) {
    if ((aliases || []).includes(normalized)) return canonicalQuality;
  }
  return ONE_CHORD_QUALITY_ALIASES[normalized] || null;
}

function parseOneChordSpec(str) {
  const normalized = String(str || '').trim();
  if (!normalized.toLowerCase().startsWith(ONE_CHORD_TAG)) {
    return {
      active: false,
      qualities: [],
      invalidTokens: [],
      errorMessage: null
    };
  }

  const body = normalized.slice(ONE_CHORD_TAG.length).trim();
  if (!body) {
    return {
      active: true,
      qualities: [...ONE_CHORD_DEFAULT_QUALITIES],
      invalidTokens: [],
      errorMessage: null
    };
  }

  const rawTokens = body
    .split(',')
    .map(token => token.trim())
    .filter(Boolean);

  const qualities = [];
  const invalidTokens = [];
  for (const token of rawTokens) {
    const normalizedToken = token.toLowerCase();
    if (['all', 'all chords'].includes(normalizedToken)) {
      qualities.push(...ONE_CHORD_DEFAULT_QUALITIES);
      continue;
    }
    if (['dominant', 'dominants', 'all dominant', 'all dominants'].includes(normalizedToken)) {
      qualities.push(...ONE_CHORD_DOMINANT_QUALITIES);
      continue;
    }

    const canonicalQuality = normalizeOneChordQualityToken(token);
    if (canonicalQuality) {
      qualities.push(canonicalQuality);
    } else {
      invalidTokens.push(token);
    }
  }

  const uniqueQualities = [...new Set(qualities)];
  return {
    active: true,
    qualities: uniqueQualities.length > 0 ? uniqueQualities : [...ONE_CHORD_DEFAULT_QUALITIES],
    invalidTokens,
    errorMessage: invalidTokens.length > 0
      ? `Unknown one-chord quality(ies): ${invalidTokens.join(', ')}`
      : null
  };
}

function isOneChordModeActive(pattern = getCurrentPatternString()) {
  return parseOneChordSpec(pattern).active;
}

function createOneChordToken(quality) {
  return {
    label: quality,
    roman: 'I',
    modifier: '',
    semitones: 0,
    qualityMajor: quality,
    qualityMinor: quality,
    inputType: 'one-chord'
  };
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

function noteNameToPitchClass(letter, accidental = '') {
  const base = NOTE_LETTER_TO_SEMITONE[String(letter || '').toUpperCase()];
  if (base === undefined) return null;
  if (accidental === 'b') return (base + 11) % 12;
  if (accidental === '#') return (base + 1) % 12;
  return base;
}

function semitoneToRomanToken(semitones) {
  return SEMITONE_TO_ROMAN_TOKEN[((semitones % 12) + 12) % 12] || null;
}

function buildParsedToken({ label, roman, modifier, semitones, customQuality = null, inputType = 'degree' }) {
  let qualityMajor;
  let qualityMinor;

  if (customQuality) {
    if (!isAcceptedCustomQuality(customQuality)) return null;
    qualityMajor = normalizeParsedQuality(customQuality, roman, true);
    qualityMinor = qualityMajor;
  } else if (modifier) {
    qualityMajor = ALTERED_SEMITONE_QUALITY_MAJOR[semitones] || 'â–³7';
    qualityMinor = ALTERED_SEMITONE_QUALITY_MINOR[semitones] || 'm7';
    qualityMajor = normalizeParsedQuality(qualityMajor, roman);
    qualityMinor = normalizeParsedQuality(qualityMinor, roman);
  } else {
    qualityMajor = DEGREE_QUALITY_MAJOR[roman] || 'â–³7';
    qualityMinor = DEGREE_QUALITY_MINOR[roman] || 'm7';
    qualityMajor = normalizeParsedQuality(qualityMajor, roman);
    qualityMinor = normalizeParsedQuality(qualityMinor, roman);
  }

  return {
    label,
    roman,
    modifier,
    semitones,
    qualityMajor,
    qualityMinor,
    inputType
  };
}

function isAcceptedCustomQuality(quality) {
  return true;
}

function normalizeParsedQuality(quality, roman, explicit = false) {
  const normalizedQuality = String(quality).toLowerCase();
  if (Object.prototype.hasOwnProperty.call(DOMINANT_QUALITY_ALIASES, normalizedQuality)) return normalizedQuality;
  for (const [canonicalQuality, aliases] of Object.entries(DOMINANT_QUALITY_ALIASES)) {
    if ((aliases || []).includes(normalizedQuality)) return canonicalQuality;
  }
  if (normalizedQuality === 'm') {
    if (roman === 'I') return 'm6';
    if (roman === 'III') return 'm7';
    return 'm9';
  }
  if (normalizedQuality === 'm9') return (!explicit && roman === 'III') ? 'm7' : 'm9';
  if (normalizedQuality === 'm7' && roman !== 'III') return 'm9';
  if (Object.prototype.hasOwnProperty.call(QUALITY_CATEGORY_ALIASES, normalizedQuality)) return normalizedQuality;
  for (const [canonicalQuality, aliases] of Object.entries(QUALITY_CATEGORY_ALIASES)) {
    if ((aliases || []).includes(normalizedQuality)) return canonicalQuality;
  }
  return quality;
}

function parseDegreeToken(token) {
  // Syntax: [b|#]<roman>[quality]  e.g. II, bVI, IIdim7, V9, VI7
  // Roman numerals listed longest-first to avoid partial matches (VII before VI before V, etc.)
  const match = token.match(/^([b#]?)(VII|VI|IV|V|III|II|I)(.+)?$/i);
  if (!match) return null;
  const modifier = match[1] || '';
  const roman = match[2].toUpperCase();
  const customQuality = match[3] || null; // user-specified quality override
  if (!(roman in ROMAN_TO_SEMITONES)) return null;
  let semitones = ROMAN_TO_SEMITONES[roman];
  if (modifier === 'b') semitones = (semitones - 1 + 12) % 12;
  else if (modifier === '#') semitones = (semitones + 1) % 12;

  return buildParsedToken({
    label: modifier + roman,
    roman,
    modifier,
    semitones,
    customQuality,
    inputType: 'degree'
  });
}

function parseNoteToken(token, basePitchClass = 0) {
  const match = token.match(/^([A-Ga-g])([b#]?)(.*)?$/);
  if (!match) return null;

  const letter = match[1].toUpperCase();
  const accidental = match[2] || '';
  const customQuality = match[3] || null;
  const absolutePitchClass = noteNameToPitchClass(letter, accidental);
  if (absolutePitchClass === null) return null;

  const semitones = (absolutePitchClass - basePitchClass + 12) % 12;
  const degreeToken = semitoneToRomanToken(semitones);
  if (!degreeToken) return null;

  return buildParsedToken({
    label: `${letter}${accidental}`,
    roman: degreeToken.roman,
    modifier: degreeToken.modifier,
    semitones,
    customQuality,
    inputType: 'note'
  });
}

function extractPatternBase(str) {
  const normalized = String(str || '').trim();
  const equalsOverrideMatch = normalized.match(/^key\s*=\s*([A-Ga-g])([b#]?)\s*:\s*(.*)$/);
  const colonOverrideMatch = normalized.match(/^key\s*:\s*([A-Ga-g])([b#]?)\s+(.*)$/);
  const overrideMatch = equalsOverrideMatch || colonOverrideMatch;
  if (!overrideMatch) {
    if ((/^key\s*=/.test(normalized) && !/:/.test(normalized)) || /^key\s*:\s*$/.test(normalized)) {
      return {
        body: normalized,
        basePitchClass: 0,
        hasOverride: true,
        overrideToken: normalized,
        error: 'Missing ":" after key override'
      };
    }
    if (/^key\s*=/.test(normalized) || /^key\s*:/.test(normalized)) {
      const rawOverride = normalized.match(/^key\s*(?:=\s*|:\s*)([^:\s]+)/);
      return {
        body: normalized,
        basePitchClass: 0,
        hasOverride: true,
        overrideToken: rawOverride ? rawOverride[1] : normalized,
        error: 'Invalid key override'
      };
    }
    return { body: normalized, basePitchClass: 0, hasOverride: false, overrideToken: null, error: null };
  }

  const letter = overrideMatch[1].toUpperCase();
  const accidental = overrideMatch[2] || '';
  const basePitchClass = noteNameToPitchClass(letter, accidental);

  return {
    body: overrideMatch[3].trim(),
    basePitchClass,
    hasOverride: true,
    overrideToken: `${letter}${accidental}`,
    error: basePitchClass === null ? `Invalid key override: ${letter}${accidental}` : null
  };
}

function parseToken(token, basePitchClass = 0) {
  return parseDegreeToken(token) || parseNoteToken(token, basePitchClass);
}

function expandRepeatedMeasureStrings(body) {
  const normalized = String(body || '')
    .replace(/\r?\n/g, ' ')
    .replace(/:\]/g, ' __REPEAT_END__ ')
    .replace(/:\|/g, ' __REPEAT_END__ ')
    .replace(/\]\s*\[\:/g, '] | [:')
    .replace(/\|\|/g, '| || |');

  const rawSegments = normalized
    .split('|')
    .map(segment => segment.trim())
    .filter(Boolean);

  const measures = [];
  let repeatFrame = null;
  let skippingUntilSecondEnding = false;

  const processSegment = (segment) => {
    if (segment === '||') return;

    const startsFirstEnding = /\[1\b/.test(segment);
    const startsSecondEnding = /\[2\b/.test(segment);
    const startRepeat = segment.includes('[:') || /^\[(?![12]\b)/.test(segment);
    const explicitRepeatEnd = segment.includes('__REPEAT_END__');
    const closesBracket = /\]$/.test(segment);
    const cleaned = segment
      .replace(/\[:/g, '')
      .replace(/__REPEAT_END__/g, '')
      .replace(/\[1\b/g, '')
      .replace(/\[2\b/g, '')
      .replace(/^\[(?![12]\b)/g, '')
      .replace(/\]$/g, '')
      .trim();

    if (startRepeat && !repeatFrame) {
      repeatFrame = {
        startIndex: measures.length,
        firstEndingStartIndex: null,
        duplicated: false
      };
      skippingUntilSecondEnding = false;
    }

    if (startsFirstEnding && repeatFrame && !repeatFrame.duplicated) {
      repeatFrame.firstEndingStartIndex = measures.length;
      skippingUntilSecondEnding = false;
    }

    if (startsSecondEnding) {
      skippingUntilSecondEnding = false;
    }

    if (cleaned && !skippingUntilSecondEnding) {
      measures.push(cleaned);
    }

    if (explicitRepeatEnd && repeatFrame && !repeatFrame.duplicated) {
      const repeatBodyEnd = repeatFrame.firstEndingStartIndex ?? measures.length;
      measures.push(...measures.slice(repeatFrame.startIndex, repeatBodyEnd));
      if (repeatFrame.firstEndingStartIndex === null) {
        repeatFrame = null;
        skippingUntilSecondEnding = false;
      } else {
        repeatFrame.duplicated = true;
        skippingUntilSecondEnding = true;
      }
    }

    if (closesBracket && repeatFrame) {
      if (!repeatFrame.duplicated) {
        const repeatBodyEnd = repeatFrame.firstEndingStartIndex ?? measures.length;
        measures.push(...measures.slice(repeatFrame.startIndex, repeatBodyEnd));
      }
      repeatFrame = null;
      skippingUntilSecondEnding = false;
    }
  };

  rawSegments.forEach((segment) => {
    if (segment.includes('__REPEAT_END__') && /\[2\b/.test(segment)) {
      const secondEndingIndex = segment.indexOf('[2');
      const firstPart = segment.slice(0, secondEndingIndex).trim();
      const secondPart = segment.slice(secondEndingIndex).trim();
      if (firstPart) processSegment(firstPart);
      if (secondPart) processSegment(secondPart);
      return;
    }
    processSegment(segment);
  });

  if (repeatFrame && !repeatFrame.duplicated) {
    const repeatBodyEnd = repeatFrame.firstEndingStartIndex ?? measures.length;
    measures.push(...measures.slice(repeatFrame.startIndex, repeatBodyEnd));
  }

  return measures;
}

function analyzePattern(str) {
  const oneChordSpec = parseOneChordSpec(str);
  if (oneChordSpec.active) {
    return {
      body: String(str || '').trim(),
      basePitchClass: 0,
      hasOverride: false,
      overrideToken: null,
      usesBarLines: false,
      resolvedChordsPerBar: null,
      expandedMeasures: null,
      tokens: oneChordSpec.qualities,
      chords: oneChordSpec.qualities.length > 0 ? [createOneChordToken(oneChordSpec.qualities[0])] : [],
      invalidTokens: oneChordSpec.invalidTokens,
      errorMessage: oneChordSpec.errorMessage
    };
  }

  const base = extractPatternBase(str);
  if (base.error) {
    return {
      ...base,
      usesBarLines: false,
      resolvedChordsPerBar: null,
      expandedMeasures: null,
      tokens: [],
      chords: [],
      invalidTokens: [],
      errorMessage: base.error
    };
  }

  const usesBarLines = base.body.includes('|');
  const tokens = base.body ? base.body.split(/(?:\|+|[\s-]+)/).filter(Boolean) : [];
  const chords = [];
  const invalidTokens = [];

  if (usesBarLines) {
    const measures = expandRepeatedMeasureStrings(base.body);
    const expandedMeasures = [];

    let previousChord = null;
    measures.forEach((measure, index) => {
      const measureTokens = measure.split(/[\s-]+/).filter(Boolean);
      const measureChords = [];

      for (const token of measureTokens) {
        if (token === '%' || token === '/') {
          if (measureChords.length > 0) {
            const repeated = { ...measureChords[measureChords.length - 1] };
            measureChords.push(repeated);
            previousChord = repeated;
          } else if (previousChord) {
            const repeated = { ...previousChord };
            measureChords.push(repeated);
            previousChord = repeated;
          } else {
            invalidTokens.push(`${token} (measure ${index + 1})`);
          }
          continue;
        }

        const parsed = parseToken(token, base.basePitchClass);
        if (parsed) {
          measureChords.push(parsed);
          previousChord = parsed;
        } else if (containsRejectedQuality(token)) {
          invalidTokens.push(`${token} (use m or m7; m9 is applied automatically except on III)`);
        } else {
          invalidTokens.push(`${token} (measure ${index + 1})`);
        }
      }

      if (measureChords.length === 0) return;
      expandedMeasures.push(measureChords.map(chord => ({ ...chord })));
      if (measureChords.length === 1) {
        chords.push(
          { ...measureChords[0] },
          { ...measureChords[0] },
          { ...measureChords[0] },
          { ...measureChords[0] }
        );
        return;
      }
      if (measureChords.length === 2) {
        chords.push(
          { ...measureChords[0] },
          { ...measureChords[0] },
          { ...measureChords[1] },
          { ...measureChords[1] }
        );
        return;
      }
      if (measureChords.length === 4) {
        measureChords.forEach(chord => chords.push({ ...chord }));
        return;
      }

      invalidTokens.push(`measure ${index + 1} has ${measureChords.length} chords (use 1, 2, or 4 per bar)`);
    });

    return {
      ...base,
      usesBarLines,
      resolvedChordsPerBar: 4,
      expandedMeasures,
      tokens,
      chords,
      invalidTokens,
      errorMessage: invalidTokens.length > 0 ? `Unknown token(s): ${invalidTokens.join(', ')}` : null
    };
  }

  for (const t of tokens) {
    if (t === '%') {
      if (chords.length > 0) chords.push({ ...chords[chords.length - 1] });
      continue;
    }

    const parsed = parseToken(t, base.basePitchClass);
    if (parsed) {
      chords.push(parsed);
    } else if (containsRejectedQuality(t)) {
      invalidTokens.push(`${t} (use m or m7; m9 is applied automatically except on III)`);
    } else {
      invalidTokens.push(t);
    }
  }

  return {
    ...base,
    usesBarLines,
    resolvedChordsPerBar: null,
    expandedMeasures: null,
    tokens,
    chords,
    invalidTokens,
    errorMessage: invalidTokens.length > 0 ? `Unknown token(s): ${invalidTokens.join(', ')}` : null
  };
}

function analyzePatternCached(str) {
  const normalized = String(str || '');
  if (cachedPatternAnalysisInput === normalized && cachedPatternAnalysisResult) {
    return cachedPatternAnalysisResult;
  }
  const analysis = analyzePattern(normalized);
  cachedPatternAnalysisInput = normalized;
  cachedPatternAnalysisResult = analysis;
  return analysis;
}

function parsePattern(str) {
  return analyzePattern(str).chords;
}

function containsRejectedQuality(token) {
  return false;
}

function normalizeChordsPerBar(value) {
  const parsed = Number.parseInt(String(value ?? DEFAULT_CHORDS_PER_BAR), 10);
  return SUPPORTED_CHORDS_PER_BAR.includes(parsed) ? parsed : DEFAULT_CHORDS_PER_BAR;
}

function syncDoubleTimeToggle() {
  if (dom.doubleTimeToggle) {
    dom.doubleTimeToggle.checked = getSelectedChordsPerBar() >= 2;
  }
}

function getSelectedChordsPerBar() {
  return normalizeChordsPerBar(dom.chordsPerBar?.value);
}

function getChordsPerBar(patternString = getCurrentPatternString()) {
  const analysis = analyzePatternCached(patternString);
  return normalizeChordsPerBar(analysis.resolvedChordsPerBar ?? getSelectedChordsPerBar());
}

function getBeatsPerChord(chordsPerBar = getChordsPerBar()) {
  return 4 / normalizeChordsPerBar(chordsPerBar);
}

function padProgression(chords, chordsPerBar = getChordsPerBar()) {
  if (chords.length === 0) return [];
  const result = chords.slice();
  const chordsPerMeasure = normalizeChordsPerBar(chordsPerBar);

  // Fill last measure if needed
  while (result.length % chordsPerMeasure !== 0) {
    result.push(result[result.length - 1]);
  }
  // Ensure even number of measures
  let measures = result.length / chordsPerMeasure;
  while (measures % 2 !== 0) {
    for (let i = 0; i < chordsPerMeasure; i++) {
      result.push(result[result.length - 1]);
    }
    measures = result.length / chordsPerMeasure;
  }
  return result;
}

// Check if a progression can be loop-trimmed: last chord == first chord
// and removing it leaves an even number of measures.
function canLoopTrimProgression(rawChords, chordsPerBar = getChordsPerBar()) {
  if (rawChords.length < 3) return false;
  const first = rawChords[0];
  const last = rawChords[rawChords.length - 1];
  if (first.semitones !== last.semitones
      || first.qualityMajor !== last.qualityMajor
      || first.qualityMinor !== last.qualityMinor) return false;
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
let backgroundSamplePreloadPromise = null;
let pageSampleWarmupPromise = null;
let nearTermSamplePreloadPromise = null;
let startupSamplePreloadInProgress = false;
const DRUM_MODE_OFF = 'off';
const DRUM_MODE_METRONOME_24 = 'metronome_2_4';
const DRUM_MODE_HIHATS_24 = 'hihats_2_4';
const DRUM_MODE_FULL_SWING = 'full_swing';
const PORTAMENTO_ALWAYS_ON = true;
const METRONOME_GAIN_MULTIPLIER = 2.4;
const DRUMS_GAIN_MULTIPLIER = 1.18;
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
let rideSampleCursor = Math.floor(Math.random() * DRUM_RIDE_SAMPLE_URLS.length);

function initAudio() {
  if (audioCtx) return;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  initMixerNodes();
}

function initMixerNodes() {
  if (!audioCtx || mixerNodes) return;

  const bass = audioCtx.createGain();
  const strings = audioCtx.createGain();
  const drums = audioCtx.createGain();

  bass.connect(audioCtx.destination);
  strings.connect(audioCtx.destination);
  drums.connect(audioCtx.destination);

  mixerNodes = { bass, strings, drums };
  applyMixerSettings();
}

function getMixerDestination(channel) {
  return mixerNodes?.[channel] || audioCtx?.destination || null;
}

function sliderValueToGain(slider) {
  const percent = Number(slider?.value ?? 100);
  return Math.max(0, Math.min(1, percent / 100));
}

function isChordsEnabled() {
  return getCompingStyle() !== COMPING_STYLE_OFF && sliderValueToGain(dom.stringsVolume) > 0;
}

function getCompingStyle() {
  return normalizeCompingStyle(dom.compingStyle?.value);
}

function updateMixerValueLabel(slider, output) {
  if (!slider || !output) return;
  output.value = `${slider.value}%`;
  output.textContent = `${slider.value}%`;
}

function applyMixerSettings() {
  updateMixerValueLabel(dom.bassVolume, dom.bassVolumeValue);
  updateMixerValueLabel(dom.stringsVolume, dom.stringsVolumeValue);
  updateMixerValueLabel(dom.drumsVolume, dom.drumsVolumeValue);

  if (!mixerNodes || !audioCtx) return;

  const now = audioCtx.currentTime;
  mixerNodes.bass.gain.setValueAtTime(sliderValueToGain(dom.bassVolume), now);
  mixerNodes.strings.gain.setValueAtTime(sliderValueToGain(dom.stringsVolume), now);
  mixerNodes.drums.gain.setValueAtTime(sliderValueToGain(dom.drumsVolume), now);
}

async function preloadSamples() {
  const bassRange = getBassPreloadRange();
  const { celloNotes, violinNotes, pianoNotes } = buildAllRequiredSampleNoteSets();

  await loadSampleRange('bass', 'Bass', bassRange.low, bassRange.high);
  const drumPromises = [loadFileSample('drums', 'hihat', DRUM_HIHAT_SAMPLE_URL)];
  DRUM_RIDE_SAMPLE_URLS.forEach((url, index) => {
    drumPromises.push(loadFileSample('drums', `ride_${index}`, url));
  });
  await Promise.all(drumPromises);
  await loadSampleList('cello', 'Cellos', celloNotes);
  await loadSampleList('violin', 'Violins', violinNotes);
  await loadSampleList('piano', 'Piano', pianoNotes);
}

function loadTrackedSample(category, key, loader) {
  if (sampleBuffers[category][key]) {
    return Promise.resolve(sampleBuffers[category][key]);
  }

  const pendingLoad = sampleLoadPromises[category].get(key);
  if (pendingLoad) return pendingLoad;

  const loadPromise = loader().finally(() => {
    sampleLoadPromises[category].delete(key);
  });
  sampleLoadPromises[category].set(key, loadPromise);
  return loadPromise;
}

function loadSample(category, folder, midi) {
  const baseUrl = `assets/MP3/${folder}/${midi}.mp3`;
  return loadTrackedSample(category, midi, () => loadBufferFromUrl(baseUrl)
    .then(decoded => {
      sampleBuffers[category][midi] = decoded;
      return decoded;
    })
    .catch(err => {
      console.warn('Sample load failed:', err);
      return null;
    }));
}

function loadFileSample(category, key, baseUrl) {
  return loadTrackedSample(category, key, () => loadBufferFromUrl(baseUrl)
    .then(decoded => {
      sampleBuffers[category][key] = decoded;
      return decoded;
    })
    .catch(err => {
      console.warn('Sample load failed:', err);
      return null;
    }));
}

function fetchArrayBufferFromUrl(baseUrl) {
  if (sampleFileBuffers.has(baseUrl)) {
    return Promise.resolve(sampleFileBuffers.get(baseUrl));
  }

  const pendingFetch = sampleFileFetchPromises.get(baseUrl);
  if (pendingFetch) return pendingFetch;

  const versionedUrl = `${baseUrl}?v=${encodeURIComponent(APP_VERSION)}`;
  const fetchPromise = fetch(versionedUrl)
    .then(r => {
      if (r.ok) return r.arrayBuffer();
      return fetch(baseUrl).then(r2 => {
        if (!r2.ok) throw new Error(`HTTP ${r2.status} for ${baseUrl}`);
        return r2.arrayBuffer();
      });
    })
    .then(buf => {
      sampleFileBuffers.set(baseUrl, buf);
      return buf;
    })
    .finally(() => {
      sampleFileFetchPromises.delete(baseUrl);
    });

  sampleFileFetchPromises.set(baseUrl, fetchPromise);
  return fetchPromise;
}

function loadBufferFromUrl(baseUrl) {
  return fetchArrayBufferFromUrl(baseUrl)
    .then(buf => audioCtx.decodeAudioData(buf.slice(0)));
}

const NOTE_FADEOUT = 0.3;  // seconds — bass fadeout before next note
const CHORD_FADE_BEFORE = 0.1; // seconds — chord fade starts this long before end
const CHORD_FADE_DUR = 0.2;    // seconds — chord fade duration
const CHORD_VOLUME_MULTIPLIER = 1.5;
const BASS_GAIN = 0.8;
const BASS_GAIN_WITH_CHORDS = BASS_GAIN * Math.pow(10, -8 / 20);
const STRING_LOOP_START = 2.0;
const STRING_LOOP_END = 9.0;
const STRING_LOOP_CROSSFADE = 0.12;
const STRING_LEGATO_MAX_DISTANCE = 2; // semitones
const STRING_LEGATO_GLIDE_TIME = 0.05; // seconds
const STRING_LEGATO_PRE_DIP_TIME = 0.05; // seconds
const STRING_LEGATO_PRE_DIP_RATIO = 0.7;
const STRING_LEGATO_HOLD_TIME = 0.1; // seconds
const STRING_LEGATO_FADE_TIME = 0.2; // seconds
const AUTOMATION_CURVE_STEPS = 32;
let activeNoteGain = null; // current bass note's GainNode for early cutoff
const scheduledAudioSources = new Set();
const pendingDisplayTimeouts = new Set();

function trackScheduledSource(source, gainNodes = []) {
  const entry = { source, gainNodes };
  scheduledAudioSources.add(entry);
  source.addEventListener('ended', () => {
    scheduledAudioSources.delete(entry);
  }, { once: true });
  return entry;
}

function clearScheduledDisplays() {
  for (const timeoutId of pendingDisplayTimeouts) {
    clearTimeout(timeoutId);
  }
  pendingDisplayTimeouts.clear();
}

function stopScheduledAudio(stopTime = audioCtx?.currentTime ?? 0) {
  for (const entry of scheduledAudioSources) {
    for (const gainNode of entry.gainNodes) {
      try {
        const currentValue = gainNode.gain.value;
        gainNode.gain.cancelScheduledValues(stopTime);
        gainNode.gain.setValueAtTime(currentValue, stopTime);
        gainNode.gain.linearRampToValueAtTime(0, stopTime + 0.02);
      } catch (err) {
        // Ignore nodes that have already been disconnected or stopped.
      }
    }

    try {
      entry.source.stop(stopTime + 0.02);
    } catch (err) {
      // Source may already be stopped; ignore duplicate stop scheduling.
    }
  }

  scheduledAudioSources.clear();
}

function stopActiveChordVoices(stopTime = audioCtx?.currentTime ?? 0, fadeDuration = NOTE_FADEOUT) {
  compingEngine.stopActiveComping(stopTime, fadeDuration);
}

function playNote(midi, time, maxDuration) {
  const buf = sampleBuffers.bass[midi];
  if (!buf) return;

  // Fade out previous note before this one starts
  if (activeNoteGain) {
    const fadeStart = Math.max(time - NOTE_FADEOUT, audioCtx.currentTime);
    activeNoteGain.gain.setValueAtTime(activeNoteGain.gain.value, fadeStart);
    activeNoteGain.gain.linearRampToValueAtTime(0, time);
  }

  const src = audioCtx.createBufferSource();
  src.buffer = buf;
  const gain = audioCtx.createGain();
  const bassGain = isChordsEnabled() ? BASS_GAIN_WITH_CHORDS : BASS_GAIN;
  gain.gain.setValueAtTime(bassGain, time);

  // If the sample is longer than allowed, schedule a fadeout at the end
  if (maxDuration && buf.duration > maxDuration - NOTE_FADEOUT) {
    const fadeStart = time + maxDuration - NOTE_FADEOUT;
    gain.gain.setValueAtTime(bassGain, fadeStart);
    gain.gain.linearRampToValueAtTime(0, time + maxDuration);
  }

  src.connect(gain).connect(getMixerDestination('bass'));
  src.start(time);
  trackScheduledSource(src, [gain]);
  activeNoteGain = gain;
}

function scheduleSampleSegment(buf, destination, startTime, offset, duration, fadeInDuration = 0, fadeOutDuration = 0) {
  const src = audioCtx.createBufferSource();
  src.buffer = buf;

  const segmentGain = audioCtx.createGain();
  const segmentEnd = startTime + duration;
  segmentGain.gain.setValueAtTime(fadeInDuration > 0 ? 0 : 1, startTime);

  if (fadeInDuration > 0) {
    segmentGain.gain.linearRampToValueAtTime(1, startTime + fadeInDuration);
  }

  if (fadeOutDuration > 0) {
    const fadeOutStart = Math.max(startTime, segmentEnd - fadeOutDuration);
    segmentGain.gain.setValueAtTime(1, fadeOutStart);
    segmentGain.gain.linearRampToValueAtTime(0, segmentEnd);
  }

  src.connect(segmentGain).connect(destination);
  src.start(startTime, offset, duration);
  src.stop(segmentEnd);
  trackScheduledSource(src, [segmentGain]);
  return src;
}

function playLoopedStringSample(buf, time, fadeEnd, volume) {
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(volume, time);
  const detuneParams = [];

  const loopEnd = Math.min(STRING_LOOP_END, buf.duration);
  const loopLength = loopEnd - STRING_LOOP_START;
  const crossfade = Math.min(STRING_LOOP_CROSSFADE, loopLength / 2);
  const loopStarts = [];

  for (let start = time + loopEnd - crossfade; start < fadeEnd; start += loopLength - crossfade) {
    loopStarts.push(start);
  }

  const sources = [];
  const hasLoopSegments = loopStarts.length > 0;
  const firstSource = scheduleSampleSegment(
      buf,
      gain,
      time,
      0,
      loopEnd,
      0,
      hasLoopSegments ? crossfade : 0
    );
  sources.push(firstSource);
  detuneParams.push(firstSource.detune);

  loopStarts.forEach((start, index) => {
    const hasNextSegment = index < loopStarts.length - 1;
    const loopSource = scheduleSampleSegment(
        buf,
        gain,
        start,
        STRING_LOOP_START,
        loopLength,
        crossfade,
        hasNextSegment ? crossfade : 0
      );
    sources.push(loopSource);
    detuneParams.push(loopSource.detune);
  });

  const stop = (stopTime) => {
    for (const source of sources) {
      try {
        source.stop(stopTime);
      } catch (err) {
        // Source may already be stopped; ignore duplicate stop scheduling.
      }
    }
  };

  stop(fadeEnd);
  gain.connect(getMixerDestination('strings'));
  return {
    detuneParams,
    gain,
    volume,
    audibleUntil: fadeEnd,
    endAnchor: sources[sources.length - 1],
    stop,
  };
}

function playSample(category, midi, time, maxDuration, volume) {
  const buf = sampleBuffers[category][midi];
  if (!buf) return null;

  const naturalEndTime = time + buf.duration;
  const isStringSample = category === 'cello' || category === 'violin';
  const loopEnd = Math.min(STRING_LOOP_END, buf.duration);
  const canLoop = isStringSample && loopEnd > STRING_LOOP_START;

  if (maxDuration) {
    const fadeStart = time + maxDuration - CHORD_FADE_BEFORE;
    const fadeEnd = fadeStart + CHORD_FADE_DUR;
    const needsLoop = canLoop && maxDuration > buf.duration;

    if (needsLoop) {
      const activeVoice = playLoopedStringSample(buf, time, fadeEnd, volume);
      activeVoice.midi = midi;
      activeVoice.category = category;
      activeVoice.key = `${category}:${midi}`;
      activeVoice.gain.gain.setValueAtTime(volume, fadeStart);
      activeVoice.gain.gain.linearRampToValueAtTime(0, fadeEnd);
      return activeVoice;
    }

    const src = audioCtx.createBufferSource();
    src.buffer = buf;
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(volume, time);
    gain.gain.setValueAtTime(volume, fadeStart);
    gain.gain.linearRampToValueAtTime(0, fadeEnd);
    src.connect(gain).connect(getMixerDestination(category === 'bass' ? 'bass' : 'strings'));
    src.start(time);
    trackScheduledSource(src, [gain]);
    return {
      detuneParams: [src.detune],
      gain,
      midi,
      category,
      key: `${category}:${midi}`,
      volume,
      audibleUntil: Math.min(naturalEndTime, fadeEnd),
      endAnchor: src,
      stop: (stopTime) => {
        try {
          src.stop(stopTime);
        } catch (err) {
          // Source may already be stopped; ignore duplicate stop scheduling.
        }
      },
    };
  }

  const src = audioCtx.createBufferSource();
  src.buffer = buf;
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(volume, time);
  src.connect(gain).connect(getMixerDestination(category === 'bass' ? 'bass' : 'strings'));
  src.start(time);
  trackScheduledSource(src, [gain]);
  return {
    detuneParams: [src.detune],
    gain,
    midi,
    category,
    key: `${category}:${midi}`,
    volume,
    audibleUntil: naturalEndTime,
    endAnchor: src,
    stop: (stopTime) => {
      try {
        src.stop(stopTime);
      } catch (err) {
        // Source may already be stopped; ignore duplicate stop scheduling.
      }
    },
  };
}

const CHORD_ANTICIPATION = 0.25; // seconds — strings start before the beat
const PIANO_COMP_DURATION_RATIO = 0.28;
const PIANO_COMP_MIN_DURATION = 0.09;
const PIANO_COMP_MAX_DURATION = 0.18;
const PIANO_VOLUME_MULTIPLIER = 0.21;

function getNextDifferentChord(chords, startIdx) {
  const chord = chords[startIdx];
  if (!chord) return null;

  for (let i = startIdx + 1; i < chords.length; i++) {
    const candidate = chords[i];
    if (candidate.semitones !== chord.semitones
        || candidate.qualityMajor !== chord.qualityMajor
        || candidate.qualityMinor !== chord.qualityMinor) {
      return candidate;
    }
  }

  return null;
}

function getVoicingAtIndex(chords, key, chordIdx, isMinor) {
  const chord = chords[chordIdx];
  if (!chord) return null;
  const plannedVoicing = getVoicingPlanForProgression(chords, key, isMinor)?.[chordIdx];
  if (plannedVoicing) return plannedVoicing;
  return getVoicing(key, chord, isMinor);
}

function getPreparedNextProgression() {
  if (nextKeyValue === null || !nextPaddedChords) return null;
  return {
    key: nextKeyValue,
    chords: nextPaddedChords,
    voicingPlan: nextVoicingPlan,
    compingPlan: nextCompingPlan,
    isMinor: dom.majorMinor.checked,
  };
}

const compingEngine = createCompingEngine({
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
    getVoicingAtIndex,
    playSample,
  },
});

function rebuildPreparedCompingPlans(
  previousKey = currentKey,
  currentHasIncomingAnticipation = false,
  currentPreviousTailBeats = null
) {
  const beatsPerChord = getBeatsPerChord();
  const isMinor = dom.majorMinor.checked;
  const { currentPlan, nextPlan } = compingEngine.buildPreparedPlans({
    style: getCompingStyle(),
    previousKey,
    currentHasIncomingAnticipation,
    currentPreviousTailBeats,
    current: {
      chords: paddedChords,
      key: currentKey,
      isMinor,
      voicingPlan: currentVoicingPlan,
      beatsPerChord,
    },
    next: {
      chords: nextPaddedChords,
      key: nextKeyValue,
      isMinor,
      voicingPlan: nextVoicingPlan,
      beatsPerChord,
    },
  });
  currentCompingPlan = currentPlan;
  nextCompingPlan = nextPlan;
}

function playClick(time, accent) {
  // Synthesize a short click/cross-stick sound
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'triangle';
  osc.frequency.value = accent ? 1200 : 1000;
  gain.gain.setValueAtTime((accent ? 0.18 : 0.11) * METRONOME_GAIN_MULTIPLIER, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);
  osc.connect(gain).connect(getMixerDestination('drums'));
  osc.start(time);
  osc.stop(time + 0.05);
  trackScheduledSource(osc, [gain]);
}

function playDrumSample(name, time, gainValue = 1, playbackRate = 1) {
  const buf = sampleBuffers.drums[name];
  if (!buf) return;

  const src = audioCtx.createBufferSource();
  src.buffer = buf;
  src.playbackRate.value = playbackRate;

  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(gainValue, time);

  src.connect(gain).connect(getMixerDestination('drums'));
  src.start(time);
  trackScheduledSource(src, [gain]);
}

function playHiHat(time, accent = false) {
  playDrumSample('hihat', time, (accent ? 0.45 : 0.33) * DRUMS_GAIN_MULTIPLIER, accent ? 1.01 : 0.98);
}

function getNextRideSampleName() {
  const startIndex = rideSampleCursor;
  do {
    const sampleName = `ride_${rideSampleCursor}`;
    rideSampleCursor = (rideSampleCursor + 1 + Math.floor(Math.random() * 3)) % DRUM_RIDE_SAMPLE_URLS.length;
    if (sampleBuffers.drums[sampleName]) return sampleName;
  } while (rideSampleCursor !== startIndex);

  return 'ride_0';
}

function playRide(time, gainValue = 0.3, playbackRate = 1) {
  playDrumSample(getNextRideSampleName(), time, gainValue * DRUMS_GAIN_MULTIPLIER, playbackRate);
}

function getDrumsMode() {
  return dom.drumsSelect?.value || DRUM_MODE_OFF;
}

function scheduleDrumsForBeat(time, beatIndex, spb) {
  const mode = getDrumsMode();
  if (mode === DRUM_MODE_OFF) return;

  const isTwoOrFour = beatIndex === 1 || beatIndex === 3;
  if (mode === DRUM_MODE_METRONOME_24) {
    if (isTwoOrFour) playClick(time, false);
    return;
  }

  if (mode === DRUM_MODE_HIHATS_24) {
    if (isTwoOrFour) playHiHat(time, true);
    return;
  }

  if (mode === DRUM_MODE_FULL_SWING) {
    const isTwoOrFour = beatIndex === 1 || beatIndex === 3;
    const rideMainGain = [0.34, 0.28, 0.31, 0.25][beatIndex] || 0.28;
    const rideSkipGain = [0, 0.22, 0, 0.2][beatIndex] || 0;

    playRide(time, rideMainGain, beatIndex === 0 ? 1.01 : 1);
    if (isTwoOrFour) {
      playRide(time + (spb * 2 / 3), rideSkipGain, 0.99);
    }
    if (isTwoOrFour) {
      playHiHat(time, true);
    }
  }
}

function getBassMidi(key, semitoneOffset) {
  // Find the lowest MIDI note with the right pitch class within BASS_LOW..BASS_HIGH
  let pitchClass = (key + semitoneOffset) % 12;
  let midi = pitchClass;
  while (midi < BASS_LOW) midi += 12;
  return midi;
}

// ---- Voicing Computation ----

function classifyQuality(quality) {
  for (const [category, aliases] of Object.entries(QUALITY_CATEGORY_ALIASES)) {
    if (quality === category) return category;
    if ((aliases || []).includes(quality)) return category;
  }
  if (quality.startsWith('13')) return 'dom';
  if (quality.startsWith('7')) return 'dom';
  return null;
}

function resolveDominantQuality(chord, quality, isMinor) {
  if (quality !== '7') return quality;
  const defaults = isMinor ? DOMINANT_DEFAULT_QUALITY_MINOR : DOMINANT_DEFAULT_QUALITY_MAJOR;
  if (chord.modifier) return '13';
  return defaults[chord.roman] || '13';
}

function resolveIntervalValue(interval) {
  if (typeof interval === 'number') return interval;
  if (typeof interval === 'string' && interval in INTERVAL_SEMITONES) {
    return INTERVAL_SEMITONES[interval];
  }
  throw new Error(`Unknown interval in voicing config: ${interval}`);
}

function resolveIntervalList(intervals) {
  return (intervals || []).map(resolveIntervalValue);
}

function getLowestMidiAtOrAbove(minMidi, pitchClass) {
  let midi = pitchClass;
  while (midi < minMidi) midi += 12;
  return midi;
}

function getBassPreloadRange() {
  let low = Infinity;
  let high = -Infinity;

  for (let pitchClass = 0; pitchClass < 12; pitchClass++) {
    const midi = getLowestMidiAtOrAbove(BASS_LOW, pitchClass);
    low = Math.min(low, midi);
    high = Math.max(high, midi);
  }

  return { low, high };
}

async function loadSampleRange(category, folder, low, high) {
  for (let midi = low; midi <= high; midi++) {
    await loadSample(category, folder, midi);
  }
}

async function loadSampleList(category, folder, midiValues) {
  const sortedMidiValues = [...midiValues].sort((a, b) => a - b);
  for (const midi of sortedMidiValues) {
    await loadSample(category, folder, midi);
  }
}

function buildAllSampleFetchDescriptors() {
  const descriptors = [];
  const bassRange = getBassPreloadRange();
  const { celloNotes, violinNotes, pianoNotes } = buildAllRequiredSampleNoteSets();

  descriptors.push(DRUM_HIHAT_SAMPLE_URL);
  DRUM_RIDE_SAMPLE_URLS.forEach(url => descriptors.push(url));
  for (const midi of [...celloNotes].sort((a, b) => a - b)) {
    descriptors.push(`assets/MP3/Cellos/${midi}.mp3`);
  }
  for (const midi of [...violinNotes].sort((a, b) => a - b)) {
    descriptors.push(`assets/MP3/Violins/${midi}.mp3`);
  }
  for (const midi of [...pianoNotes].sort((a, b) => a - b)) {
    descriptors.push(`assets/MP3/Piano/${midi}.mp3`);
  }
  for (let midi = bassRange.low; midi <= bassRange.high; midi++) {
    descriptors.push(`assets/MP3/Bass/${midi}.mp3`);
  }
  return descriptors;
}

function collectRequiredSampleNotes({ includeCurrent = true, includeNext = true, currentChordLimit = null, nextChordLimit = null } = {}) {
  const bassNotes = new Set();
  const celloNotes = new Set();
  const violinNotes = new Set();
  const pianoNotes = new Set();
  const compingStyle = getCompingStyle();

  const registerProgression = (chords, key, voicingPlan, chordLimit = null) => {
    if (!Array.isArray(chords) || key === null || key === undefined) return;
    const limitedChords = Number.isInteger(chordLimit) && chordLimit >= 0
      ? chords.slice(0, chordLimit)
      : chords;

    for (const chord of limitedChords) {
      bassNotes.add(getBassMidi(key, chord.semitones));
    }

    for (const voicing of (voicingPlan || []).slice(0, limitedChords.length)) {
      if (!voicing) continue;
      compingEngine.collectSampleNotes(compingStyle, voicing, { celloNotes, violinNotes, pianoNotes });
    }
  };

  if (includeCurrent) {
    registerProgression(paddedChords, currentKey, currentVoicingPlan, currentChordLimit);
  }
  if (includeNext) {
    registerProgression(nextPaddedChords, nextKeyValue, nextVoicingPlan, nextChordLimit);
  }

  return { bassNotes, celloNotes, violinNotes, pianoNotes };
}

async function preloadStartupSamples() {
  const startupChordLimit = getChordsPerBar();
  const { bassNotes, celloNotes, violinNotes, pianoNotes } = collectRequiredSampleNotes({
    includeCurrent: true,
    includeNext: false,
    currentChordLimit: startupChordLimit
  });
  await loadSampleList('bass', 'Bass', bassNotes);

  const drumsMode = getDrumsMode();
  const drumPromises = [];
  if (drumsMode === DRUM_MODE_HIHATS_24 || drumsMode === DRUM_MODE_FULL_SWING) {
    drumPromises.push(loadFileSample('drums', 'hihat', DRUM_HIHAT_SAMPLE_URL));
  }
  if (drumsMode === DRUM_MODE_FULL_SWING) {
    const startupRideCount = Math.min(3, DRUM_RIDE_SAMPLE_URLS.length);
    for (let i = 0; i < startupRideCount; i++) {
      drumPromises.push(loadFileSample('drums', `ride_${i}`, DRUM_RIDE_SAMPLE_URLS[i]));
    }
  }

  await Promise.all(drumPromises);
  await loadSampleList('cello', 'Cellos', celloNotes);
  await loadSampleList('violin', 'Violins', violinNotes);
  await loadSampleList('piano', 'Piano', pianoNotes);
}

function getSafetyLeadChordCount() {
  const chordsPerMeasure = getChordsPerBar();
  return SAFE_PRELOAD_MEASURES * chordsPerMeasure;
}

async function preloadNearTermSamples() {
  const targetChordCount = getSafetyLeadChordCount();
  const currentChordLimit = Math.min(paddedChords.length, targetChordCount);
  const remainingChordCount = Math.max(0, targetChordCount - currentChordLimit);
  const nextChordLimit = Math.min(nextPaddedChords.length, remainingChordCount);
  const { bassNotes, celloNotes, violinNotes, pianoNotes } = collectRequiredSampleNotes({
    includeCurrent: currentChordLimit > 0,
    includeNext: nextChordLimit > 0,
    currentChordLimit,
    nextChordLimit
  });

  await loadSampleList('cello', 'Cellos', celloNotes);
  await loadSampleList('violin', 'Violins', violinNotes);
  await loadSampleList('piano', 'Piano', pianoNotes);
  await loadSampleList('bass', 'Bass', bassNotes);
}

function ensureNearTermSamplePreload() {
  if (nearTermSamplePreloadPromise) return nearTermSamplePreloadPromise;

  nearTermSamplePreloadPromise = preloadNearTermSamples()
    .catch((err) => {
      console.warn('Near-term sample preload failed:', err);
      return null;
    })
    .finally(() => {
      ensureBackgroundSamplePreload();
    });

  return nearTermSamplePreloadPromise;
}

async function warmPageSampleCache() {
  const descriptors = buildAllSampleFetchDescriptors();
  for (const baseUrl of descriptors) {
    if (startupSamplePreloadInProgress) {
      break;
    }
    try {
      await fetchArrayBufferFromUrl(baseUrl);
    } catch (err) {
      console.warn('Sample warmup fetch failed:', err);
    }
  }
}

function ensurePageSampleWarmup() {
  if (pageSampleWarmupPromise) return pageSampleWarmupPromise;

  pageSampleWarmupPromise = warmPageSampleCache()
    .catch((err) => {
      console.warn('Page sample warmup failed:', err);
      return null;
    });

  return pageSampleWarmupPromise;
}

function ensureBackgroundSamplePreload() {
  if (backgroundSamplePreloadPromise) return backgroundSamplePreloadPromise;

  backgroundSamplePreloadPromise = preloadSamples()
    .catch((err) => {
      console.warn('Background sample preload failed:', err);
      return null;
    });

  return backgroundSamplePreloadPromise;
}

function buildChordVoicingBase(rootPitchClass, qualityCategory, colorToneIntervals, guideToneIntervals = null) {
  // Fundamental: lowest cello note matching root pitch class
  let fundamental = rootPitchClass;
  while (fundamental < CELLO_LOW) fundamental += 12;

  // Guide tones: unique MIDI in C#3–C4 (49–60) for each pitch class
  const guideIntervals = resolveIntervalList(guideToneIntervals || GUIDE_TONES[qualityCategory]);
  const guideTones = guideIntervals.map(interval => {
    const pc = (rootPitchClass + interval) % 12;
    return pc === 0 ? 60 : 48 + pc;
  });

  // Top guide tone = highest MIDI among guide tones
  const topGuide = Math.max(...guideTones);

  const colorPitchClasses = colorToneIntervals.map(interval => (rootPitchClass + interval) % 12);

  return {
    fundamental,
    guideTones,
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

function enumerateChordVoicingCandidates(rootPitchClass, qualityCategory, colorToneIntervals, guideToneIntervals = null) {
  const base = buildChordVoicingBase(rootPitchClass, qualityCategory, colorToneIntervals, guideToneIntervals);
  const { fundamental, guideTones, colorPitchClasses, topGuide } = base;
  if (colorPitchClasses.length === 0) {
    return [{ fundamental, guideTones, colorTones: [] }];
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
        candidateMap.set(key, { fundamental, guideTones, colorTones: filledColorTones });
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

function computeChordVoicing(rootPitchClass, qualityCategory, colorToneIntervals, guideToneIntervals = null) {
  return enumerateChordVoicingCandidates(
    rootPitchClass,
    qualityCategory,
    colorToneIntervals,
    guideToneIntervals
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
    return Math.max(voicing?.fundamental || -Infinity, ...(voicing?.guideTones || []));
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

function createVoicingSlot(chord, key, isMinor, segment = 'current') {
  if (!chord) {
    return { chord: null, key, segment, candidateSet: [null] };
  }

  const quality = isMinor ? chord.qualityMinor : chord.qualityMajor;
  const qualityCategory = classifyQuality(quality);
  if (!qualityCategory) {
    return { chord, key, segment, candidateSet: [null] };
  }

  const rootPitchClass = (key + chord.semitones) % 12;
  let colorIntervals;
  let guideIntervals = null;
  if (qualityCategory === 'dom') {
    const dominantQuality = resolveDominantQuality(chord, quality, isMinor);
    colorIntervals = resolveIntervalList(DOMINANT_COLOR_TONES[dominantQuality] || DOMINANT_COLOR_TONES['13']);
    guideIntervals = DOMINANT_GUIDE_TONES[dominantQuality] || null;
  } else {
    colorIntervals = resolveIntervalList(COLOR_TONES[qualityCategory] || []);
  }

  const candidateSet = enumerateChordVoicingCandidates(
    rootPitchClass,
    qualityCategory,
    colorIntervals,
    guideIntervals
  );

  return {
    chord,
    key,
    segment,
    candidateSet: candidateSet.length > 0 ? candidateSet : [null],
  };
}

function buildVoicingPlanForSlots(slots) {
  if (!Array.isArray(slots) || slots.length === 0) return [];

  const candidatesByIndex = slots.map(slot => slot?.candidateSet?.length ? slot.candidateSet : [null]);
  const topCenter = Math.round((VIOLIN_LOW + VIOLIN_HIGH) / 2);

  let previousScores = candidatesByIndex[0].map(candidate => ({
    candidate,
    totalTopMovement: 0,
    totalBoundaryTopMovement: 0,
    totalBoundaryCenterDistance: candidate ? Math.abs(getVoicingTopNote(candidate) - topCenter) : 0,
    totalUpperSpan: candidate ? getVoicingUpperSpan(candidate) : 0,
    totalTopSum: candidate ? getVoicingTopNote(candidate) : 0,
    totalInnerMovement: 0,
    prevIndex: -1,
    signature: candidate?.colorTones?.join(',') || '',
  }));

  const scoreRows = [previousScores];

  for (let rowIndex = 1; rowIndex < candidatesByIndex.length; rowIndex++) {
    const rowCandidates = candidatesByIndex[rowIndex];
    const crossesBoundary = slots[rowIndex - 1]?.segment !== slots[rowIndex]?.segment;
    const nextScores = rowCandidates.map(candidate => {
      const candidateScores = [];
      for (let prevIndex = 0; prevIndex < previousScores.length; prevIndex++) {
        const prevScore = previousScores[prevIndex];
        const prevCandidate = prevScore.candidate;
        const rawTopMovement = candidate && prevCandidate
          ? Math.abs(getVoicingTopNote(candidate) - getVoicingTopNote(prevCandidate))
          : 0;
        const inPatternTopMovement = crossesBoundary ? 0 : rawTopMovement;
        const boundaryTopMovement = crossesBoundary ? rawTopMovement : 0;
        const boundaryCenterDistance = crossesBoundary && candidate
          ? Math.abs(getVoicingTopNote(candidate) - topCenter)
          : 0;
        const innerMovement = candidate && prevCandidate
          ? getVoicingInnerMovement(prevCandidate, candidate)
          : 0;
        const candidateScore = {
          candidate,
          totalTopMovement: prevScore.totalTopMovement + inPatternTopMovement,
          totalBoundaryTopMovement: prevScore.totalBoundaryTopMovement + boundaryTopMovement,
          totalBoundaryCenterDistance: prevScore.totalBoundaryCenterDistance + boundaryCenterDistance,
          totalUpperSpan: prevScore.totalUpperSpan + (candidate ? getVoicingUpperSpan(candidate) : 0),
          totalTopSum: prevScore.totalTopSum + (candidate ? getVoicingTopNote(candidate) : 0),
          totalInnerMovement: prevScore.totalInnerMovement + innerMovement,
          prevIndex,
          signature: `${prevScore.signature}|${candidate?.colorTones?.join(',') || ''}`,
        };
        candidateScores.push(candidateScore);
      }
      const randomizationChance = crossesBoundary
        ? VOICING_BOUNDARY_RANDOMIZATION_CHANCE
        : VOICING_RANDOMIZATION_CHANCE;
      return pickVoicingScore(candidateScores, randomizationChance);
    });

    scoreRows.push(nextScores);
    previousScores = nextScores;
  }

  let bestFinalIndex = 0;
  const bestFinalScore = pickVoicingScore(previousScores);
  bestFinalIndex = previousScores.findIndex(score => score === bestFinalScore);

  const plan = new Array(slots.length);
  for (let rowIndex = scoreRows.length - 1, candidateIndex = bestFinalIndex; rowIndex >= 0; rowIndex--) {
    const score = scoreRows[rowIndex][candidateIndex];
    plan[rowIndex] = score.candidate;
    candidateIndex = score.prevIndex;
  }

  return plan;
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
  if (!Array.isArray(chords) || chords.length === 0) return [];

  const candidatesByIndex = chords.map(chord => createVoicingSlot(chord, key, isMinor, 'current').candidateSet);

  let previousScores = candidatesByIndex[0].map(candidate => ({
    candidate,
    totalTopMovement: 0,
    totalTopSum: candidate ? getVoicingTopNote(candidate) : 0,
    prevIndex: -1,
    signature: candidate?.colorTones?.join(',') || '',
  }));

  const scoreRows = [previousScores];

  for (let rowIndex = 1; rowIndex < candidatesByIndex.length; rowIndex++) {
    const rowCandidates = candidatesByIndex[rowIndex];
    const nextScores = rowCandidates.map(candidate => {
      let bestScore = null;
      for (let prevIndex = 0; prevIndex < previousScores.length; prevIndex++) {
        const prevScore = previousScores[prevIndex];
        const topMovement = candidate && prevScore.candidate
          ? Math.abs(getVoicingTopNote(candidate) - getVoicingTopNote(prevScore.candidate))
          : 0;
        const candidateScore = {
          candidate,
          totalTopMovement: prevScore.totalTopMovement + topMovement,
          totalTopSum: prevScore.totalTopSum + (candidate ? getVoicingTopNote(candidate) : 0),
          prevIndex,
          signature: `${prevScore.signature}|${candidate?.colorTones?.join(',') || ''}`,
        };
        if (!bestScore || compareLegacyVoicingPathScores(candidateScore, bestScore) < 0) {
          bestScore = candidateScore;
        }
      }
      return bestScore;
    });

    scoreRows.push(nextScores);
    previousScores = nextScores;
  }

  let bestFinalIndex = 0;
  for (let i = 1; i < previousScores.length; i++) {
    if (compareLegacyVoicingPathScores(previousScores[i], previousScores[bestFinalIndex]) < 0) {
      bestFinalIndex = i;
    }
  }

  const plan = new Array(chords.length);
  for (let rowIndex = scoreRows.length - 1, candidateIndex = bestFinalIndex; rowIndex >= 0; rowIndex--) {
    const score = scoreRows[rowIndex][candidateIndex];
    plan[rowIndex] = score.candidate;
    candidateIndex = score.prevIndex;
  }

  return plan;
}

function buildVoicingPlan(chords, key, isMinor) {
  if (!Array.isArray(chords) || chords.length === 0) return [];
  if (!isVoiceLeadingV2Enabled()) {
    return buildLegacyVoicingPlan(chords, key, isMinor);
  }
  const slots = chords.map(chord => createVoicingSlot(chord, key, isMinor, 'current'));
  return buildVoicingPlanForSlots(slots);
}

function buildAllRequiredSampleNoteSets() {
  const celloNotes = new Set();
  const violinNotes = new Set();
  const pianoNotes = new Set();

  const processCandidates = (candidates) => {
    for (const voicing of candidates) {
      if (!voicing) continue;
      compingEngine.collectSampleNotes('strings', voicing, { celloNotes, violinNotes, pianoNotes });
      compingEngine.collectSampleNotes('piano', voicing, { celloNotes, violinNotes, pianoNotes });
    }
  };

  for (let rootPitchClass = 0; rootPitchClass < 12; rootPitchClass++) {
    for (const [qualityCategory, colorToneIntervals] of Object.entries(COLOR_TONES)) {
      processCandidates(
        enumerateChordVoicingCandidates(rootPitchClass, qualityCategory, resolveIntervalList(colorToneIntervals))
      );
    }

    for (const [dominantQuality, colorToneIntervals] of Object.entries(DOMINANT_COLOR_TONES)) {
      processCandidates(
        enumerateChordVoicingCandidates(
          rootPitchClass,
          'dom',
          resolveIntervalList(colorToneIntervals),
          DOMINANT_GUIDE_TONES[dominantQuality] || null
        )
      );
    }
  }

  return { celloNotes, violinNotes, pianoNotes };
}

function getVoicing(key, chord, isMinor) {
  const quality = isMinor ? chord.qualityMinor : chord.qualityMajor;
  const cat = classifyQuality(quality);
  if (!cat) return null;

  const rootPitchClass = (key + chord.semitones) % 12;

  let colorIntervals;
  let guideIntervals = null;
  if (cat === 'dom') {
    const dominantQuality = resolveDominantQuality(chord, quality, isMinor);
    colorIntervals = resolveIntervalList(DOMINANT_COLOR_TONES[dominantQuality] || DOMINANT_COLOR_TONES['13']);
    guideIntervals = DOMINANT_GUIDE_TONES[dominantQuality] || null;
  } else {
    colorIntervals = resolveIntervalList(COLOR_TONES[cat] || []);
  }

  return computeChordVoicing(rootPitchClass, cat, colorIntervals, guideIntervals);
}

function getVoicingPlanForProgression(chords, key, isMinor) {
  if (chords === paddedChords && key === currentKey) {
    return currentVoicingPlan;
  }
  if (chords === nextPaddedChords && key === nextKeyValue) {
    return nextVoicingPlan;
  }
  return null;
}

// ---- Key Pool ----

let keyPool = [];
let enabledKeys = [true,true,true,true,true,true,true,true,true,true,true,true];

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function getEffectiveKeyPool() {
  let pool = [];
  for (let i = 0; i < 12; i++) {
    if (enabledKeys[i]) pool.push(i);
  }
  if (pool.length === 0) {
    pool = Array.from({ length: 12 }, (_, index) => index);
  }
  return pool;
}

function nextKey(excludedKey = null) {
  const effectivePool = getEffectiveKeyPool();
  if (effectivePool.length <= 1 || excludedKey === null) {
    if (keyPool.length === 0) {
      keyPool = shuffleArray(effectivePool.slice());
    }
    return keyPool.pop();
  }

  if (keyPool.length === 0) {
    keyPool = shuffleArray(effectivePool.slice());
  }

  let candidateIndex = keyPool.findIndex(key => key !== excludedKey);
  if (candidateIndex === -1) {
    keyPool = shuffleArray(effectivePool.slice());
    candidateIndex = keyPool.findIndex(key => key !== excludedKey);
  }

  if (candidateIndex === -1) {
    return keyPool.pop();
  }

  const [candidate] = keyPool.splice(candidateIndex, 1);
  return candidate;
}

// ---- Display helpers ----

function getDisplayTranspositionSemitones() {
  return Number(dom.transpositionSelect?.value || 0);
}

function transposeDisplayPitchClass(pitchClass) {
  return (pitchClass + getDisplayTranspositionSemitones() + 12) % 12;
}

function keyName(key) {
  const displayKey = transposeDisplayPitchClass(key);
  if (isOneChordModeActive()) {
    return KEY_NAMES_MAJOR[displayKey];
  }
  const name = dom.majorMinor.checked ? KEY_NAMES_MINOR[displayKey] : KEY_NAMES_MAJOR[displayKey];
  const suffix = dom.majorMinor.checked ? ' min' : ' maj';
  return name + suffix;
}

function getDisplayedQuality(chord, isMinor) {
  const quality = isMinor ? chord.qualityMinor : chord.qualityMajor;
  if (classifyQuality(quality) !== 'dom') return quality;
  return resolveDominantQuality(chord, quality, isMinor);
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

function chordSymbol(key, chord, isMinorOverride = null) {
  if (chord?.inputType === 'one-chord') {
    const rootName = normalizeDisplayedRootName(KEY_NAMES_MAJOR[transposeDisplayPitchClass(key)]);
    return rootName + (chord.qualityMajor || '');
  }
  const isMinor = typeof isMinorOverride === 'boolean' ? isMinorOverride : dom.majorMinor.checked;
  const rootName = normalizeDisplayedRootName(
    degreeRootName(transposeDisplayPitchClass(key), chord.roman, chord.semitones, isMinor)
  );
  const quality = getDisplayedQuality(chord, isMinor);
  return rootName + quality;
}

function chordSymbolHtml(key, chord, isMinorOverride = null) {
  if (chord?.inputType === 'one-chord') {
    const rootName = normalizeDisplayedRootName(KEY_NAMES_MAJOR[transposeDisplayPitchClass(key)]);
    return renderChordSymbolHtml(rootName, chord.qualityMajor || '');
  }
  const isMinor = typeof isMinorOverride === 'boolean' ? isMinorOverride : dom.majorMinor.checked;
  const rootName = normalizeDisplayedRootName(
    degreeRootName(transposeDisplayPitchClass(key), chord.roman, chord.semitones, isMinor)
  );
  const quality = getDisplayedQuality(chord, isMinor);
  return renderChordSymbolHtml(rootName, quality);
}

function refreshChordDisplayLayout(element, baseRem) {
  if (!element) return;
  fitChordDisplay(element, baseRem);
}

// Compute the displayed note name from the parsed pitch class so display matches playback.
function degreeRootName(keyIndex, roman, semitoneOffset, isMinor) {
  const names = isMinor ? KEY_NAMES_MINOR : KEY_NAMES_MAJOR;
  const keyLetter = names[keyIndex][0];
  const keyLetterIdx = LETTERS.indexOf(keyLetter);
  const degIdx = DEGREE_INDICES[roman];

  // The letter for this scale degree
  const degLetterIdx = (keyLetterIdx + degIdx) % 7;
  const degLetter = LETTERS[degLetterIdx];

  // Use the parsed semitone offset so the displayed chord root matches the sounding pitch.
  const expectedSemi = (keyIndex + semitoneOffset + 12) % 12;

  // Accidental needed to reach expected semitone from the natural letter.
  // When that would require a double accidental, prefer the simple enharmonic display name.
  let acc = (expectedSemi - NATURAL_SEMITONES[degLetterIdx] + 12) % 12;
  if (acc > 6) acc -= 12;

  if (acc === 0) return degLetter;
  if (acc === 1) return degLetter + '\u266F';
  if (acc === -1) return degLetter + '\u266D';
  return names[expectedSemi] || degLetter;
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
}

function setDisplayPlaceholderMessage(message = DEFAULT_DISPLAY_PLACEHOLDER_MESSAGE) {
  if (!dom.displayPlaceholderMessage) return;
  dom.displayPlaceholderMessage.textContent = message;
}

setDisplayPlaceholderMessage();

function getRemainingBeatsUntilNextProgression(chordIndex = currentChordIdx, beatInMeasure = currentBeat, chordCount = paddedChords.length) {
  if (!Number.isFinite(chordCount) || chordCount <= 0) return 0;
  const chordsPerMeasure = getChordsPerBar();
  const totalMeasures = chordCount / chordsPerMeasure;
  const currentMeasure = Math.floor(chordIndex / chordsPerMeasure);
  const elapsedBeats = currentMeasure * 4 + beatInMeasure;
  return Math.max(0, totalMeasures * 4 - elapsedBeats);
}

function shouldShowNextPreview(currentKeyValue, upcomingKeyValue, remainingBeats = getRemainingBeatsUntilNextProgression()) {
  if (upcomingKeyValue === null || upcomingKeyValue === currentKeyValue) return false;
  return remainingBeats * getSecondsPerBeat() <= getNextPreviewLeadSeconds();
}

function applyDisplaySideLayout() {
  const display = document.getElementById('display');
  if (!display) return;
  display.classList.remove('alternate-display-sides', 'display-current-right');
}

function fitChordDisplay(element, baseRem) {
  if (!element) return;
  const symbol = element.querySelector('.chord-symbol');

  // Always set the desired large font size
  element.style.fontSize = `${baseRem}rem`;
  if (symbol) {
    symbol.style.transform = '';
    symbol.style.transformOrigin = 'center center';
  } else {
    element.style.transform = '';
    element.style.transformOrigin = 'center center';
  }
  if (!element.textContent?.trim()) return;

  // Let the browser lay out at full size, then scale down if needed
  const parentWidth = element.parentElement
    ? (isCurrentHarmonyHidden()
        ? element.parentElement.clientWidth - 10
        : element.parentElement.clientWidth / 2 - 10)
    : element.clientWidth;
  const textWidth = element.scrollWidth;

  if (textWidth > parentWidth && parentWidth > 0) {
    const scale = parentWidth / textWidth;
    if (symbol) {
      symbol.style.transform = `scale(${scale.toFixed(4)})`;
    } else {
      element.style.transform = `scale(${scale.toFixed(4)})`;
    }
  }
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
  window.requestAnimationFrame(() => {
    const baseRem = getBaseChordDisplaySize();
    refreshChordDisplayLayout(dom.chordDisplay, baseRem);
    refreshChordDisplayLayout(dom.nextChordDisplay, baseRem);
  });
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
  dom.beatIndicator?.classList.toggle('hidden', dom.showBeatIndicator?.checked === false);
}

function isCurrentHarmonyHidden() {
  return dom.hideCurrentHarmony?.checked === true;
}

function applyCurrentHarmonyVisibility() {
  const display = document.getElementById('display');
  display?.classList.toggle('display-hide-current', isCurrentHarmonyHidden());
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

  dom.selectedKeysSummary.textContent = `Keys: ${selectedKeys.join(' \u00B7 ')}`;
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
    text.textContent = keyLabelForPicker(keyIndex);
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
  dom.welcomeOverlay.classList.toggle('hidden', !isVisible);
  dom.welcomeOverlay.setAttribute('aria-hidden', isVisible ? 'false' : 'true');
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

  const baseConfig = {
    goal,
    instrument,
    compingStyle: COMPING_STYLE_STRINGS,
    drumsMode: DRUM_MODE_FULL_SWING,
    displayMode: DISPLAY_MODE_SHOW_BOTH,
    showBeatIndicator: true,
    hideCurrentHarmony: false,
    nextPreviewLeadValue: 1,
    nextPreviewUnit: NEXT_PREVIEW_UNIT_BARS,
    chordsPerBar: DEFAULT_CHORDS_PER_BAR,
    bassVolume: '100',
    stringsVolume: '100',
    drumsVolume: '100'
  };

  if (goal === WELCOME_GOAL_ONE_CHORD) {
    const quality = getCheckedInputValue('welcome-one-chord', 'maj7');
    return {
      ...baseConfig,
      ...WELCOME_ONE_CHORDS[quality]
    };
  }

  if (goal === WELCOME_GOAL_STANDARD) {
    const standard = dom.welcomeStandardSelect?.value || Object.keys(welcomeStandards)[0] || 'autumn-leaves';
    return {
      ...baseConfig,
      ...(welcomeStandards[standard] || WELCOME_STANDARDS_FALLBACK[standard] || Object.values(welcomeStandards)[0] || Object.values(WELCOME_STANDARDS_FALLBACK)[0])
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
  markWelcomeOnboardingCompleted();
  saveSettings();
  setWelcomeOverlayVisible(false);
  trackEvent('welcome_skipped');
}

function maybeShowWelcomeOverlay() {
  if (hasCompletedWelcomeOnboarding || !dom.welcomeOverlay) return;
  updateWelcomePanelVisibility();
  updateWelcomeSummary();
  setWelcomeOverlayVisible(true);
}

function getTempoBucket() {
  const tempo = Number(dom.tempoSlider?.value || 0);
  if (tempo < 90) return 'slow';
  if (tempo <= 140) return 'medium';
  if (tempo <= 200) return 'fast';
  return 'very_fast';
}

function getSessionDurationBucket() {
  const elapsedSeconds = Math.max(0, Math.round((Date.now() - sessionStartedAt) / 1000));
  if (elapsedSeconds < 10) return 'lt_10s';
  if (elapsedSeconds < 30) return '10_30s';
  if (elapsedSeconds < 120) return '30_120s';
  return 'gt_120s';
}

function ensureSessionStarted(entrypoint = 'unknown') {
  if (sessionStartTracked) return;
  sessionStartTracked = true;
  trackEvent('session_start', { entrypoint });
}

function registerSessionAction(actionName, extraProps = {}) {
  ensureSessionStarted(actionName);
  sessionActionCount += 1;
  if (sessionEngagedTracked || sessionActionCount < 3) return;
  sessionEngagedTracked = true;
  trackEvent('session_engaged', {
    action_count: sessionActionCount,
    last_action: actionName,
    ...extraProps
  });
}

function trackSessionDuration() {
  if (sessionDurationTracked || !sessionStartTracked) return;
  sessionDurationTracked = true;
  trackEvent('session_duration_bucket', {
    duration_bucket: getSessionDurationBucket(),
    action_count: sessionActionCount
  });
}

function getProgressionAnalyticsProps() {
  const patternString = getCurrentPatternString();
  const oneChordSpec = parseOneChordSpec(patternString);
  const patternMode = getPatternModeLabel(getCurrentPatternMode());
  const source = hasSelectedProgression() ? 'preset' : 'custom';

  if (oneChordSpec.active) {
    let customId = 'custom_one_chord';
    if (matchesOneChordQualitySet(oneChordSpec.qualities, ONE_CHORD_DEFAULT_QUALITIES)) {
      customId = 'one_chord_all';
    } else if (matchesOneChordQualitySet(oneChordSpec.qualities, ONE_CHORD_DOMINANT_QUALITIES)) {
      customId = 'one_chord_dominant';
    }
    return {
      progression_source: source,
      progression_mode: patternMode,
      progression_kind: 'one_chord',
      progression_id: hasSelectedProgression() ? `preset_${toAnalyticsToken(dom.patternSelect.value)}` : customId,
      chord_count: 1,
      quality_count: oneChordSpec.qualities.length || 0
    };
  }

  const analysis = analyzePattern(patternString);
  const chordCount = analysis.chords.length || (analysis.tokens?.length ?? 0);
  const progressionShape = chordCount > 0 ? `${chordCount}_chords` : 'empty';

  return {
    progression_source: source,
    progression_mode: patternMode,
    progression_kind: 'sequence',
    progression_id: hasSelectedProgression()
      ? `preset_${toAnalyticsToken(dom.patternSelect.value)}`
      : `custom_${progressionShape}`,
    progression_shape: progressionShape,
    chord_count: chordCount,
    has_key_override: analysis.hasOverride ? 'yes' : 'no'
  };
}

function getPlaybackAnalyticsProps() {
  const chordsPerBar = getChordsPerBar();
  return {
    tempo: Number(dom.tempoSlider?.value || 120),
    tempo_bucket: getTempoBucket(),
    repetitions_per_key: getRepetitionsPerKey(),
    comping_style: getCompingStyle(),
    drums_mode: dom.drumsSelect?.value || 'off',
    display_mode: normalizeDisplayMode(dom.displayMode?.value),
    transposition: dom.transpositionSelect?.value || '0',
    enabled_keys: getEnabledKeyCount(),
    chords_per_bar: chordsPerBar,
    double_time: chordsPerBar > 1 ? 'on' : 'off'
  };
}

function trackProgressionEvent(name, extraProps = {}) {
  trackEvent(name, {
    ...getProgressionAnalyticsProps(),
    ...extraProps
  });
}

function trackProgressionOccurrence(extraProps = {}) {
  trackEvent('progression_occurrence_played', {
    ...getProgressionAnalyticsProps(),
    ...getPlaybackAnalyticsProps(),
    ...extraProps
  });
}


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
    setProgressionFeedback,
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

const playbackSchedulerState = {
  get audioCtx() { return audioCtx; },
  get currentBeat() { return currentBeat; },
  set currentBeat(value) { currentBeat = value; },
  get currentChordIdx() { return currentChordIdx; },
  set currentChordIdx(value) { currentChordIdx = value; },
  get currentCompingPlan() { return currentCompingPlan; },
  set currentCompingPlan(value) { currentCompingPlan = value; },
  get currentKey() { return currentKey; },
  set currentKey(value) { currentKey = value; },
  get currentKeyRepetition() { return currentKeyRepetition; },
  set currentKeyRepetition(value) { currentKeyRepetition = value; },
  get currentOneChordQualityValue() { return currentOneChordQualityValue; },
  set currentOneChordQualityValue(value) { currentOneChordQualityValue = value; },
  get currentRawChords() { return currentRawChords; },
  set currentRawChords(value) { currentRawChords = value; },
  get currentVoicingPlan() { return currentVoicingPlan; },
  set currentVoicingPlan(value) { currentVoicingPlan = value; },
  get isIntro() { return isIntro; },
  set isIntro(value) { isIntro = value; },
  get isPaused() { return isPaused; },
  get isPlaying() { return isPlaying; },
  get lastPlayedChordIdx() { return lastPlayedChordIdx; },
  set lastPlayedChordIdx(value) { lastPlayedChordIdx = value; },
  get loopVoicingTemplate() { return loopVoicingTemplate; },
  set loopVoicingTemplate(value) { loopVoicingTemplate = value; },
  get nextBeatTime() { return nextBeatTime; },
  set nextBeatTime(value) { nextBeatTime = value; },
  get nextCompingPlan() { return nextCompingPlan; },
  set nextCompingPlan(value) { nextCompingPlan = value; },
  get nextKeyValue() { return nextKeyValue; },
  set nextKeyValue(value) { nextKeyValue = value; },
  get nextOneChordQualityValue() { return nextOneChordQualityValue; },
  set nextOneChordQualityValue(value) { nextOneChordQualityValue = value; },
  get nextPaddedChords() { return nextPaddedChords; },
  set nextPaddedChords(value) { nextPaddedChords = value; },
  get nextRawChords() { return nextRawChords; },
  set nextRawChords(value) { nextRawChords = value; },
  get nextVoicingPlan() { return nextVoicingPlan; },
  set nextVoicingPlan(value) { nextVoicingPlan = value; },
  get paddedChords() { return paddedChords; },
  set paddedChords(value) { paddedChords = value; },
  get pendingDisplayTimeouts() { return pendingDisplayTimeouts; }
};

const {
  prepareNextProgression: prepareNextProgressionPlayback,
  scheduleBeat: scheduleBeatPlayback,
  scheduleDisplay: scheduleDisplayPlayback
} = createPlaybackScheduler({
  dom,
  state: playbackSchedulerState,
  constants: {
    SCHEDULE_AHEAD
  },
  helpers: {
    applyDisplaySideLayout,
    buildLegacyVoicingPlan,
    buildLoopRepVoicings,
    buildPreparedCompingPlans: rebuildPreparedCompingPlans,
    buildVoicingPlanForSlots,
    canLoopTrimProgression,
    chordSymbolHtml,
    chordSymbol,
    compingEngine,
    createOneChordToken,
    createVoicingSlot,
    fitHarmonyDisplay,
    getBassMidi,
    getBeatsPerChord,
    getChordsPerBar,
    getCompingStyle,
    getCurrentPatternString,
    getRemainingBeatsUntilNextProgression,
    getRepetitionsPerKey,
    getSecondsPerBeat,
    hideNextCol,
    isChordsEnabled,
    isVoiceLeadingV2Enabled,
    keyName,
    nextKey,
    padProgression,
    parseOneChordSpec,
    parsePattern,
    playClick,
    playNote,
    scheduleDrumsForBeat,
    shouldShowNextPreview,
    showNextCol,
    takeNextOneChordQuality,
    trackProgressionOccurrence,
    updateBeatDots
  }
});

const playbackTransportState = {
  get activeNoteGain() { return activeNoteGain; },
  set activeNoteGain(value) { activeNoteGain = value; },
  get audioCtx() { return audioCtx; },
  set audioCtx(value) { audioCtx = value; },
  get currentBeat() { return currentBeat; },
  set currentBeat(value) { currentBeat = value; },
  get currentChordIdx() { return currentChordIdx; },
  set currentChordIdx(value) { currentChordIdx = value; },
  get currentKeyRepetition() { return currentKeyRepetition; },
  set currentKeyRepetition(value) { currentKeyRepetition = value; },
  get firstPlayStartTracked() { return firstPlayStartTracked; },
  set firstPlayStartTracked(value) { firstPlayStartTracked = value; },
  get playStopSuggestionCount() { return playStopSuggestionCount; },
  set playStopSuggestionCount(value) { playStopSuggestionCount = value; },
  get isIntro() { return isIntro; },
  set isIntro(value) { isIntro = value; },
  get isPaused() { return isPaused; },
  set isPaused(value) { isPaused = value; },
  get isPlaying() { return isPlaying; },
  set isPlaying(value) { isPlaying = value; },
  get keyPool() { return keyPool; },
  set keyPool(value) { keyPool = value; },
  get loopVoicingTemplate() { return loopVoicingTemplate; },
  set loopVoicingTemplate(value) { loopVoicingTemplate = value; },
  get nearTermSamplePreloadPromise() { return nearTermSamplePreloadPromise; },
  set nearTermSamplePreloadPromise(value) { nearTermSamplePreloadPromise = value; },
  get nextBeatTime() { return nextBeatTime; },
  set nextBeatTime(value) { nextBeatTime = value; },
  get nextKeyValue() { return nextKeyValue; },
  set nextKeyValue(value) { nextKeyValue = value; },
  get schedulerTimer() { return schedulerTimer; },
  set schedulerTimer(value) { schedulerTimer = value; },
  get startupSamplePreloadInProgress() { return startupSamplePreloadInProgress; },
  set startupSamplePreloadInProgress(value) { startupSamplePreloadInProgress = value; }
};

const { start, stop, togglePause } = createPlaybackTransport({
  dom,
  state: playbackTransportState,
  constants: {
    NOTE_FADEOUT,
    SCHEDULE_INTERVAL
  },
  helpers: {
    applyDisplaySideLayout,
    clearBeatDots,
    clearScheduledDisplays,
    ensureNearTermSamplePreload,
    ensureSessionStarted,
    fitHarmonyDisplay,
    getPlaybackAnalyticsProps,
    getProgressionAnalyticsProps,
    hideNextCol,
    initAudio,
    preloadStartupSamples,
    prepareNextProgression: prepareNextProgressionPlayback,
    registerSessionAction,
    scheduleBeat: scheduleBeatPlayback,
    setDisplayPlaceholderMessage,
    setDisplayPlaceholderVisible,
    stopActiveComping: compingEngine.stopActiveComping,
    stopScheduledAudio,
    trackEvent,
    trackProgressionEvent
  }
});

// ---- UI Wiring ----

dom.startStop.addEventListener('click', () => {
  if (isPlaying) stop(); else start();
});

dom.pause.addEventListener('click', togglePause);

dom.tempoSlider.addEventListener('input', () => {
  dom.tempoValue.textContent = dom.tempoSlider.value;
  syncNextPreviewControlDisplay();
  refreshDisplayedHarmony();
});

dom.nextPreviewValue?.addEventListener('change', () => {
  commitNextPreviewValueFromInput();
  saveSettings();
  trackEvent('next_preview_changed', {
    next_preview_unit: getNextPreviewInputUnit(),
    next_preview_bars: formatPreviewNumber(getNextPreviewLeadBars()),
    next_preview_seconds: formatPreviewNumber(getNextPreviewLeadSeconds(), 1)
  });
});

dom.nextPreviewUnitToggle?.addEventListener('change', () => {
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
});

// ---- Key Picker ----

function buildKeyCheckboxes() {
  dom.keyCheckboxes.innerHTML = '';
  for (let i = 0; i < 12; i++) {
    const label = document.createElement('label');
    label.className = 'key-checkbox-label';
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = enabledKeys[i];
    cb.dataset.keyIndex = i;
    cb.addEventListener('change', () => {
      enabledKeys[i] = cb.checked;
      updateKeyCheckboxVisualState(label, cb, i);
      keyPool = []; // reset pool
      syncSelectedKeysSummary();
      saveSettings();
      trackEvent('key_selection_changed', {
        enabled_keys: getEnabledKeyCount(),
        key_index: i,
        key_state: cb.checked ? 'enabled' : 'disabled'
      });
    });
    const span = document.createElement('span');
    span.className = 'key-checkbox-text';
    label.appendChild(cb);
    label.appendChild(span);
    updateKeyCheckboxVisualState(label, cb, i);
    dom.keyCheckboxes.appendChild(label);
  }
  syncSelectedKeysSummary();
}

function setAllKeysEnabled(isEnabled) {
  applyEnabledKeys(enabledKeys.map(() => isEnabled));
  saveSettings();
}

function invertKeysEnabled() {
  applyEnabledKeys(enabledKeys.map(isEnabled => !isEnabled));
  saveSettings();
}

function keyLabelForPicker(majorIndex) {
  return KEY_NAMES_MAJOR[transposeDisplayPitchClass(majorIndex)];
}

function updateKeyPickerLabels() {
  const labels = dom.keyCheckboxes.querySelectorAll('.key-checkbox-label');
  labels.forEach((label, i) => {
    const checkbox = label.querySelector('input[type="checkbox"]');
    if (!checkbox) return;
    updateKeyCheckboxVisualState(label, checkbox, i);
  });
  syncSelectedKeysSummary();
}

function refreshDisplayedHarmony() {
  if (!isPlaying) return;
  applyDisplaySideLayout();
  applyCurrentHarmonyVisibility();

  if (isIntro) {
    dom.keyDisplay.textContent = '';
    dom.chordDisplay.innerHTML = '';
    const firstChord = paddedChords[0];
    showNextCol();
    dom.nextKeyDisplay.textContent = keyName(currentKey);
    dom.nextChordDisplay.innerHTML = firstChord ? chordSymbolHtml(currentKey, firstChord) : '';
    fitHarmonyDisplay();
    return;
  }

  const chord = paddedChords[currentChordIdx] || paddedChords[paddedChords.length - 1];
  if (!chord) return;

  dom.keyDisplay.textContent = keyName(currentKey);
  dom.chordDisplay.innerHTML = chordSymbolHtml(currentKey, chord);
  const remainingBeats = getRemainingBeatsUntilNextProgression();

  if (shouldShowNextPreview(currentKey, nextKeyValue, remainingBeats)) {
    showNextCol();
    const nextFirstChord = nextRawChords[0] || null;
    dom.nextKeyDisplay.textContent = keyName(nextKeyValue);
    dom.nextChordDisplay.innerHTML = nextFirstChord ? chordSymbolHtml(nextKeyValue, nextFirstChord) : '';
  } else {
    hideNextCol();
  }
  fitHarmonyDisplay();
}

dom.selectAllKeys?.addEventListener('click', () => {
  setAllKeysEnabled(true);
  trackEvent('all_keys_selected', {
    enabled_keys: getEnabledKeyCount()
  });
});

dom.invertKeys?.addEventListener('click', () => {
  invertKeysEnabled();
  trackEvent('key_selection_inverted', {
    enabled_keys: getEnabledKeyCount()
  });
});

dom.clearAllKeys?.addEventListener('click', () => {
  setAllKeysEnabled(false);
  trackEvent('all_keys_cleared', {
    enabled_keys: getEnabledKeyCount()
  });
});

dom.saveKeyPreset?.addEventListener('click', saveCurrentKeySelectionPreset);
dom.loadKeyPreset?.addEventListener('click', loadKeySelectionPreset);

dom.transpositionSelect.addEventListener('change', () => {
  updateKeyPickerLabels();
  refreshDisplayedHarmony();
  saveSettings();
  trackEvent('display_transposition_changed', {
    transposition: dom.transpositionSelect.value
  });
});

function validateCustomPattern() {
  if (!isCustomPatternSelected()) {
    dom.patternError.classList.add('hidden');
    return true;
  }

  const str = normalizePatternString(dom.customPattern.value);
  if (!str) {
    dom.patternError.classList.add('hidden');
    return true;
  }

  const analysis = analyzePattern(str);
  if (analysis.errorMessage) {
    dom.patternError.textContent = analysis.errorMessage;
    dom.patternError.classList.remove('hidden');
    return false;
  }

  dom.patternError.classList.add('hidden');
  return true;
}











// ---- Persistence (localStorage) ----

const APP_BASE_URL = (import.meta?.env?.BASE_URL) || './';
const PATTERN_HELP_URL = `${APP_BASE_URL}progression-suffixes.txt`;
const PATTERN_HELP_VERSION = APP_VERSION;
const DISPLAY_MODE_SHOW_BOTH = 'show-both';
const DISPLAY_MODE_CHORDS_ONLY = 'chords-only';
const DISPLAY_MODE_KEY_ONLY = 'key-only';

function normalizeDisplayMode(mode) {
  return [
    DISPLAY_MODE_SHOW_BOTH,
    DISPLAY_MODE_CHORDS_ONLY,
    DISPLAY_MODE_KEY_ONLY
  ].includes(mode)
    ? mode
    : DISPLAY_MODE_SHOW_BOTH;
}

function buildSettingsSnapshot() {
  const editingState = isEditingPreset()
    ? {
        type: 'edit',
        editingPresetName: editingProgressionName,
        presetSelectionBeforeEditing: progressionSelectionBeforeEditing,
        snapshot: editingProgressionSnapshot ? {
          ...editingProgressionSnapshot
        } : null
      }
    : (isCreatingProgression
        ? {
            type: 'create',
            presetSelectionBeforeEditing: progressionSelectionBeforeEditing
          }
        : null);
  return {
    [WELCOME_ONBOARDING_SETTINGS_KEY]: hasCompletedWelcomeOnboarding,
    [WELCOME_VERSION_SETTINGS_KEY]: WELCOME_VERSION,
    presets: progressions,
    presetsCleared: Object.keys(progressions).length === 0,
    defaultPresetsFingerprintApplied: appliedDefaultProgressionsFingerprint || getDefaultProgressionsFingerprint(),
    defaultPresetsVersionAcknowledged: acknowledgedDefaultProgressionsVersion || '',
    appliedOneTimeMigrations,
    editingState,
    patternSelect: dom.patternSelect.value,
    customPatternName: getCurrentPatternName(),
    customPattern: normalizePatternString(dom.customPattern.value),
    patternMode: getCurrentPatternMode(),
    tempo: dom.tempoSlider.value,
    repetitionsPerKey: getRepetitionsPerKey(),
    transposition: dom.transpositionSelect.value,
    nextPreviewLeadValue,
    nextPreviewUnit: getNextPreviewInputUnit(),
    chordsPerBar: getSelectedChordsPerBar(),
    doubleTime: getSelectedChordsPerBar() > 1,
    majorMinor: dom.majorMinor.checked,
    displayMode: normalizeDisplayMode(dom.displayMode?.value),
    showBeatIndicator: dom.showBeatIndicator?.checked !== false,
    hideCurrentHarmony: dom.hideCurrentHarmony?.checked === true,
    compingStyle: getCompingStyle(),
    chordMode: isChordsEnabled(),
    drumsMode: getDrumsMode(),
    bassVolume: dom.bassVolume?.value,
    stringsVolume: dom.stringsVolume?.value,
    drumsVolume: dom.drumsVolume?.value,
    enabledKeys: enabledKeys
  };
}

function saveSettings() {
  saveStoredProgressionSettings(buildSettingsSnapshot());
}

function applyLoadedSettings(s) {
  if (!s || typeof s !== 'object') return;
  hasCompletedWelcomeOnboarding = s[WELCOME_ONBOARDING_SETTINGS_KEY] !== undefined
    ? Boolean(s[WELCOME_ONBOARDING_SETTINGS_KEY])
    : true;
  // Force re-show if the welcome overlay was redesigned since the user last saw it
  if (s[WELCOME_VERSION_SETTINGS_KEY] !== WELCOME_VERSION) {
    hasCompletedWelcomeOnboarding = false;
  }

  const hasStoredPresets = Boolean(s.presets && typeof s.presets === 'object' && !Array.isArray(s.presets));
  const storedPresetCount = hasStoredPresets ? Object.keys(s.presets).length : 0;
  const storedEmptyListWasIntentional = s.presetsCleared === true;
  hadStoredProgressions = storedPresetCount > 0;
  const storedDefaultPresetsFingerprint = typeof s.defaultPresetsFingerprintApplied === 'string'
    ? s.defaultPresetsFingerprintApplied
    : '';
  const storedAcknowledgedVersion = typeof s.defaultPresetsVersionAcknowledged === 'string'
    ? s.defaultPresetsVersionAcknowledged
    : '';
  appliedOneTimeMigrations = normalizeAppliedOneTimeMigrations(s.appliedOneTimeMigrations);
  appliedDefaultProgressionsFingerprint = storedDefaultPresetsFingerprint;
  acknowledgedDefaultProgressionsVersion = storedAcknowledgedVersion;
  savedPatternSelection = typeof s.patternSelect === 'string' ? s.patternSelect : null;
  if (hasStoredPresets && (storedPresetCount > 0 || storedEmptyListWasIntentional)) {
    progressions = normalizeProgressionsMap(s.presets);
  } else if (hasStoredPresets && storedPresetCount === 0 && Object.keys(DEFAULT_PROGRESSIONS).length > 0) {
    progressions = normalizeProgressionsMap(DEFAULT_PROGRESSIONS);
    shouldPersistRecoveredDefaultProgressions = true;
  }
  renderProgressionOptions(s.patternSelect);
  if (s.patternSelect !== undefined) dom.patternSelect.value = s.patternSelect;
  if (s.customPatternName !== undefined && dom.patternName) {
    dom.patternName.value = normalizePresetName(s.customPatternName);
  }
  if (s.customPattern !== undefined) dom.customPattern.value = normalizePatternString(s.customPattern);
  if (s.patternMode !== undefined && dom.patternMode) {
    setEditorPatternMode(normalizePatternMode(s.patternMode));
  }
  if (s.tempo !== undefined) {
    dom.tempoSlider.value = s.tempo;
    dom.tempoValue.textContent = s.tempo;
  }
  if (s.repetitionsPerKey !== undefined && dom.repetitionsPerKey) {
    dom.repetitionsPerKey.value = String(normalizeRepetitionsPerKey(s.repetitionsPerKey));
  }
  if (s.transposition !== undefined && dom.transpositionSelect) {
    dom.transpositionSelect.value = String(s.transposition);
  }
  if (s.nextPreviewLeadValue !== undefined) {
    nextPreviewLeadValue = normalizeNextPreviewLeadValue(s.nextPreviewLeadValue);
  } else if (s.nextPreviewLeadBars !== undefined) {
    nextPreviewLeadValue = normalizeNextPreviewLeadValue(s.nextPreviewLeadBars);
  }
  if (s.nextPreviewUnit !== undefined) {
    setNextPreviewInputUnit(s.nextPreviewUnit);
  } else {
    setNextPreviewInputUnit(NEXT_PREVIEW_UNIT_BARS);
  }
  if (dom.chordsPerBar) {
    const storedChordsPerBar = s.chordsPerBar !== undefined
      ? s.chordsPerBar
      : (s.doubleTime ? 2 : DEFAULT_CHORDS_PER_BAR);
    dom.chordsPerBar.value = String(normalizeChordsPerBar(storedChordsPerBar));
    syncDoubleTimeToggle();
  }
  if (s.majorMinor !== undefined) {
    dom.majorMinor.checked = s.majorMinor;
  }
  if (s.displayMode !== undefined && dom.displayMode) {
    dom.displayMode.value = normalizeDisplayMode(s.displayMode);
  } else if (s.hideChords !== undefined && dom.displayMode) {
    dom.displayMode.value = s.hideChords ? DISPLAY_MODE_KEY_ONLY : DISPLAY_MODE_SHOW_BOTH;
  }
  if (s.showBeatIndicator !== undefined && dom.showBeatIndicator) {
    dom.showBeatIndicator.checked = Boolean(s.showBeatIndicator);
  }
  if (s.hideCurrentHarmony !== undefined && dom.hideCurrentHarmony) {
    dom.hideCurrentHarmony.checked = Boolean(s.hideCurrentHarmony);
  }
  if (s.compingStyle !== undefined && dom.compingStyle) {
    dom.compingStyle.value = normalizeCompingStyle(s.compingStyle);
  }
  if (s.chordMode !== undefined && s.chordMode === false && dom.stringsVolume) {
    dom.stringsVolume.value = 0;
  }
  if (s.drumsMode !== undefined && dom.drumsSelect) {
    dom.drumsSelect.value = s.drumsMode;
  } else if (s.metronome !== undefined && dom.drumsSelect) {
    dom.drumsSelect.value = s.metronome ? DRUM_MODE_METRONOME_24 : DRUM_MODE_OFF;
  }
  if (s.bassVolume !== undefined && dom.bassVolume) dom.bassVolume.value = s.bassVolume;
  if (s.stringsVolume !== undefined && dom.stringsVolume) dom.stringsVolume.value = s.stringsVolume;
  if (s.drumsVolume !== undefined && dom.drumsVolume) dom.drumsVolume.value = s.drumsVolume;
  if (s.enabledKeys !== undefined && Array.isArray(s.enabledKeys) && s.enabledKeys.length === 12) {
    enabledKeys = s.enabledKeys;
  }

  const storedEditingState = s.editingState && typeof s.editingState === 'object'
    ? s.editingState
    : null;
  if (storedEditingState?.type === 'edit') {
    const storedEditingName = typeof storedEditingState.editingPresetName === 'string'
      ? storedEditingState.editingPresetName
      : '';
    if (storedEditingName && Object.prototype.hasOwnProperty.call(progressions, storedEditingName)) {
      editingProgressionName = storedEditingName;
      progressionSelectionBeforeEditing = typeof storedEditingState.presetSelectionBeforeEditing === 'string'
        ? storedEditingState.presetSelectionBeforeEditing
        : storedEditingName;
      const snapshot = storedEditingState.snapshot && typeof storedEditingState.snapshot === 'object'
        ? storedEditingState.snapshot
        : null;
      editingProgressionSnapshot = snapshot ? {
        name: typeof snapshot.name === 'string' ? snapshot.name : storedEditingName,
        label: typeof snapshot.label === 'string' ? snapshot.label : (getProgressionEntry(storedEditingName)?.name || ''),
        pattern: typeof snapshot.pattern === 'string' ? snapshot.pattern : (getProgressionEntry(storedEditingName)?.pattern || ''),
        mode: normalizePatternMode(snapshot.mode)
      } : {
        name: storedEditingName,
        label: getProgressionEntry(storedEditingName)?.name || '',
        pattern: getProgressionEntry(storedEditingName)?.pattern || '',
        mode: normalizePatternMode(getProgressionEntry(storedEditingName)?.mode)
      };
      isCreatingProgression = false;
      savedPatternSelection = CUSTOM_PATTERN_OPTION_VALUE;
      if (dom.patternSelect) {
        dom.patternSelect.value = CUSTOM_PATTERN_OPTION_VALUE;
      }
    }
  } else if (storedEditingState?.type === 'create') {
    isCreatingProgression = true;
    progressionSelectionBeforeEditing = typeof storedEditingState.presetSelectionBeforeEditing === 'string'
      ? storedEditingState.presetSelectionBeforeEditing
      : '';
    savedPatternSelection = CUSTOM_PATTERN_OPTION_VALUE;
    if (dom.patternSelect) {
      dom.patternSelect.value = CUSTOM_PATTERN_OPTION_VALUE;
    }
  }

  shouldPromptForDefaultProgressionsUpdate = hadStoredProgressions
    && acknowledgedDefaultProgressionsVersion !== defaultProgressionsVersion;
}

function finalizeLoadedSettings() {

  if (!appliedDefaultProgressionsFingerprint && !hadStoredProgressions) {
    appliedDefaultProgressionsFingerprint = getDefaultProgressionsFingerprint();
  }

  applyMixerSettings();
  syncNextPreviewControlDisplay();
  applyBeatIndicatorVisibility();
  applyCurrentHarmonyVisibility();
  if (dom.repetitionsPerKey) {
    dom.repetitionsPerKey.value = String(getRepetitionsPerKey());
  }
  if (savedPatternSelection === CUSTOM_PATTERN_OPTION_VALUE || isCreatingProgression) {
    lastStandaloneCustomName = normalizePresetName(dom.patternName?.value);
    lastStandaloneCustomPattern = normalizePatternString(dom.customPattern.value);
    lastStandaloneCustomMode = normalizePatternMode(dom.patternMode?.value);
  } else {
    resetStandaloneCustomDraft();
  }
  if (dom.debugToggle) {
    dom.debugToggle.checked = getAnalyticsDebugEnabled();
  }
  syncProgressionManagerState();
  applyPatternModeAvailability();
  if (shouldPersistRecoveredDefaultProgressions) {
    shouldPersistRecoveredDefaultProgressions = false;
    saveSettings();
  }
}

function loadSettings() {
  const storedSettings = loadStoredProgressionSettings();
  if (storedSettings) {
    applyLoadedSettings(storedSettings);
  }
  savedKeySelectionPreset = loadStoredKeySelectionPreset();
  finalizeLoadedSettings();
}

function resetPlaybackSettings() {
  // Select the first available progression
  const firstProgressionKey = Object.keys(progressions)[0] || '';
  if (firstProgressionKey) {
    clearProgressionEditingState();
    closeProgressionManager();
    setPatternSelectValue(firstProgressionKey);
    dom.patternName.value = getSelectedProgressionName();
    dom.customPattern.value = getSelectedProgressionPattern();
    setEditorPatternMode(getSelectedProgressionMode());
    lastPatternSelectValue = dom.patternSelect.value;
  }
  dom.majorMinor.checked = false;
  dom.tempoSlider.value = '120';
  dom.tempoValue.textContent = '120';
  if (dom.repetitionsPerKey) dom.repetitionsPerKey.value = '2';
  if (dom.chordsPerBar) dom.chordsPerBar.value = '1';
  syncDoubleTimeToggle();
  if (dom.compingStyle) dom.compingStyle.value = COMPING_STYLE_STRINGS;
  if (dom.drumsSelect) dom.drumsSelect.value = DRUM_MODE_FULL_SWING;
  // Reset all keys to enabled
  applyEnabledKeys(new Array(12).fill(true));
  if (dom.displayMode) dom.displayMode.value = DISPLAY_MODE_SHOW_BOTH;
  if (dom.showBeatIndicator) dom.showBeatIndicator.checked = true;
  if (dom.hideCurrentHarmony) dom.hideCurrentHarmony.checked = false;
  if (dom.bassVolume) dom.bassVolume.value = '100';
  if (dom.stringsVolume) dom.stringsVolume.value = '100';
  if (dom.drumsVolume) dom.drumsVolume.value = '100';
  nextPreviewLeadValue = 1;
  setNextPreviewInputUnit(NEXT_PREVIEW_UNIT_BARS);
  applyMixerSettings();
  syncNextPreviewControlDisplay();
  applyDisplayMode();
  applyBeatIndicatorVisibility();
  applyCurrentHarmonyVisibility();
  syncCustomPatternUI();
  syncProgressionManagerState();
  applyPatternModeAvailability();
  syncPatternPreview();
  refreshDisplayedHarmony();
  saveSettings();
  trackEvent('settings_reset');
}

async function loadPatternHelp() {
  if (!dom.patternHelp) return;
  try {
    const response = await fetch(`${PATTERN_HELP_URL}?v=${PATTERN_HELP_VERSION}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const text = await response.text();
    const groups = text
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(Boolean);

    const formatPatternHelpLine = (line) => {
      const [syntaxPartRaw, ...commentParts] = line.split(/\s+\/\/\s*/);
      const syntaxPart = syntaxPartRaw.trim();
      const comment = commentParts.join(' // ').trim();
      const syntaxHtml = syntaxPart
        .split(/\s*,\s*/)
        .filter(Boolean)
        .map(item => `<code>${item}</code>`)
        .join(', ');

      if (!comment) return `<li>${syntaxHtml}</li>`;
      return `<li>${syntaxHtml} <span class="pattern-help-comment">// ${comment}</span></li>`;
    };

    const items = groups
      .map(formatPatternHelpLine)
      .join('');

    dom.patternHelp.innerHTML = `
      <summary class="pattern-help-title">Progression syntax</summary>
      <div class="pattern-help-body">
        <p>Use note roots such as <code>C Dm7 G7</code> or <code>F# B7 Emaj7</code>. Notes are interpreted relative to <code>C</code> by default. Separate chords with spaces.</p>
        <p>You can also use functions such as <code>IIm7 V I</code>, with optional <code>b</code> or <code>#</code> like <code>bVI</code> or <code>#IV</code>.</p>
        <p>If you omit the chord quality, a default one is chosen from the context. For example, <code>D</code> or <code>II</code> in minor will default to <code>m7b5</code>. Check with the <code>Progression preview</code> below.</p>
        <p>Available suffixes:</p>
        <ul>${items}</ul>
        <p><code>%</code> repeats the previous chord. You can also use bar lines like <code>| Dm7 G7 | C |</code>; when bars are present, they define the measure layout and the <code>Chords per bar</code> selector is ignored.</p>
        <p>Repeat bars are also supported with syntax like <code>[: Dm7 G7 | C :]</code> or <code>[ Dm7 | G7 || C | C ]</code>.</p>
        <p>First and second endings are supported with measure markers like <code>[: A | B | [1 C :| [2 D | E ]</code>.</p>
        <p>You can also use <code>one:</code> for one-chord mode, for example <code>one:</code>, <code>one: all dominants</code>, or <code>one: maj7, m9, 7alt, dim7</code>.</p>
      </div>
    `;
  } catch (err) {
    console.warn('Pattern help load failed:', err);
  }
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
    console.warn('Default progressions load failed:', err);
  }
  progressions = normalizeProgressionsMap(DEFAULT_PROGRESSIONS);
}

async function initializeApp() {
  initializeSocialShareLinks();

  await Promise.all([
    loadDefaultProgressions(),
    loadPatternHelp(),
    loadWelcomeStandards()
  ]);

  renderProgressionOptions(Object.keys(progressions)[0] || '');
  loadSettings();
  const appliedSilentPresetReset = applySilentDefaultPresetResetMigration();
  if (appliedSilentPresetReset) {
    renderProgressionOptions(savedPatternSelection);
    saveSettings();
  }
  buildKeyCheckboxes();
  updateKeyPickerLabels();
  applyDisplayMode();
  if (!dom.customPattern.value) {
    dom.customPattern.value = getSelectedProgressionPattern();
  }
  if (hasSelectedProgression()) {
    dom.patternName.value = getSelectedProgressionName();
    setEditorPatternMode(getSelectedProgressionMode());
  } else {
    dom.patternName.value = normalizePresetName(dom.patternName.value);
    setEditorPatternMode(normalizePatternMode(dom.patternMode.value));
  }
  if (savedPatternSelection === CUSTOM_PATTERN_OPTION_VALUE) {
    dom.patternSelect.value = CUSTOM_PATTERN_OPTION_VALUE;
  } else if (savedPatternSelection && Object.prototype.hasOwnProperty.call(progressions, savedPatternSelection)) {
    dom.patternSelect.value = savedPatternSelection;
  } else {
    syncPatternSelectionFromInput();
  }
  syncProgressionManagerState();
  syncCustomPatternUI();
  applyPatternModeAvailability();
  lastPatternSelectValue = dom.patternSelect.value;

  if (shouldPromptForDefaultProgressionsUpdate) {
    promptForUpdatedDefaultProgressions();
  } else if (!appliedDefaultProgressionsFingerprint) {
    appliedDefaultProgressionsFingerprint = getDefaultProgressionsFingerprint();
  }

  ensurePageSampleWarmup();
  syncDoubleTimeToggle();
  maybeShowWelcomeOverlay();
}

initializeApp();
setDisplayPlaceholderVisible(true);

document.querySelector('[data-analytics-link="demo"]')?.addEventListener('click', () => {
  trackEvent('demo_link_clicked', {
    location: 'header'
  });
});

document.querySelectorAll('input[name="welcome-goal"]').forEach((input) => {
  input.addEventListener('change', () => {
    updateWelcomePanelVisibility();
    updateWelcomeSummary();
    trackEvent('welcome_goal_changed', { welcome_goal: input.value });
  });
});

document.querySelectorAll('input[name="welcome-progression"]').forEach((input) => {
  input.addEventListener('change', () => {
    updateWelcomeSummary();
    trackEvent('welcome_progression_changed', { welcome_progression: input.value });
  });
});

document.querySelectorAll('input[name="welcome-one-chord"]').forEach((input) => {
  input.addEventListener('change', () => {
    updateWelcomeSummary();
    trackEvent('welcome_one_chord_changed', { welcome_one_chord: input.value });
  });
});

document.querySelectorAll('input[name="welcome-instrument"]').forEach((input) => {
  input.addEventListener('change', () => {
    updateWelcomeSummary();
    trackEvent('welcome_instrument_changed', { transposition: input.value });
  });
});

dom.welcomeStandardSelect?.addEventListener('change', () => {
  updateWelcomeSummary();
  trackEvent('welcome_standard_changed', { welcome_standard: dom.welcomeStandardSelect.value });
});

dom.welcomeApply?.addEventListener('click', applyWelcomeRecommendation);
dom.welcomeSkip?.addEventListener('click', skipWelcomeOverlay);
dom.reopenWelcome?.addEventListener('click', (event) => {
  event.preventDefault();
  updateWelcomePanelVisibility();
  updateWelcomeSummary();
  setWelcomeOverlayVisible(true);
  trackEvent('welcome_reopened', {
    location: 'header'
  });
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
  preloadNearTermSamples().catch((err) => {
    console.warn('Comping style preload failed:', err);
  });
  trackEvent('comping_style_changed', {
    comping_style: getCompingStyle()
  });
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
dom.displayMode.addEventListener('change', () => {
  applyDisplayMode();
  saveSettings();
  trackEvent('display_mode_changed', {
    display_mode: normalizeDisplayMode(dom.displayMode.value)
  });
});
dom.showBeatIndicator?.addEventListener('change', () => {
  applyBeatIndicatorVisibility();
  saveSettings();
});
dom.hideCurrentHarmony?.addEventListener('change', () => {
  applyCurrentHarmonyVisibility();
  refreshDisplayedHarmony();
  fitHarmonyDisplay();
  saveSettings();
});
dom.transpositionSelect?.addEventListener('change', syncPatternPreview);
dom.debugToggle?.addEventListener('change', () => {
  setAnalyticsDebugEnabled(dom.debugToggle.checked);
});
dom.resetSettings?.addEventListener('click', resetPlaybackSettings);
dom.bassVolume.addEventListener('input', applyMixerSettings);
dom.drumsVolume.addEventListener('input', applyMixerSettings);
dom.bassVolume.addEventListener('change', () => {
  saveSettings();
  trackEvent('bass_volume_changed', {
    volume_percent: Number(dom.bassVolume.value)
  });
});
dom.stringsVolume.addEventListener('change', () => {
  saveSettings();
  trackEvent('strings_volume_changed', {
    volume_percent: Number(dom.stringsVolume.value)
  });
});
dom.drumsVolume.addEventListener('change', () => {
  saveSettings();
  trackEvent('drums_volume_changed', {
    volume_percent: Number(dom.drumsVolume.value)
  });
});
function applyDisplayMode() {
  const display = document.getElementById('display');
  const mode = normalizeDisplayMode(dom.displayMode?.value);
  display.classList.remove('display-show-both', 'display-chords-only', 'display-key-only');
  if (mode === DISPLAY_MODE_CHORDS_ONLY) {
    display.classList.add('display-chords-only');
    applyDisplaySideLayout();
    applyCurrentHarmonyVisibility();
    fitHarmonyDisplay();
    return;
  }
  if (mode === DISPLAY_MODE_KEY_ONLY) {
    display.classList.add('display-key-only');
    applyDisplaySideLayout();
    applyCurrentHarmonyVisibility();
    fitHarmonyDisplay();
    return;
  }
  display.classList.add('display-show-both');
  applyDisplaySideLayout();
  applyCurrentHarmonyVisibility();
  fitHarmonyDisplay();
}

window.addEventListener('resize', fitHarmonyDisplay);
window.addEventListener('pagehide', trackSessionDuration);

if (typeof ResizeObserver !== 'undefined') {
  const harmonyDisplayResizeObserver = new ResizeObserver(() => {
    fitHarmonyDisplay();
  });

  [dom.chordDisplay, dom.nextChordDisplay, document.getElementById('display-columns')]
    .filter(Boolean)
    .forEach(element => harmonyDisplayResizeObserver.observe(element));
}

if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', fitHarmonyDisplay);
}
