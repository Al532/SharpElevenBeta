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

const voicingConfig = window.JAZZ_TRAINER_CONFIG;
if (!voicingConfig) {
  throw new Error('Missing voicing-config.js: window.JAZZ_TRAINER_CONFIG is required.');
}
const APP_VERSION = window.JAZZ_TRAINER_VERSION || 'dev';

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
  DOMINANT_DEFAULT_SUBTYPE_MAJOR = {},
  DOMINANT_DEFAULT_SUBTYPE_MINOR = {},
  QUALITY_CATEGORY_ALIASES = {},
  DOMINANT_SUBTYPE_SUFFIXES = {}
} = voicingConfig;

const PATTERN_MODE_BOTH = 'both';
const PATTERN_MODE_MAJOR = 'major';
const PATTERN_MODE_MINOR = 'minor';
const DEFAULT_PRESETS_URL = './default-presets.json';

const BASS_LOW = 28;  // MIDI note for E1 (lowest bass sample)
const BASS_HIGH = 48; // MIDI note for C3 (highest bass sample)
const CELLO_LOW = 37;  // MIDI C#2
const CELLO_HIGH = 80; // MIDI G#5
const VIOLIN_LOW = 56; // MIDI G#3
const VIOLIN_HIGH = 96;// MIDI C7
const GUIDE_TONE_LOW = 49;  // MIDI C#3 — bottom of guide tone range
const GUIDE_TONE_HIGH = 60; // MIDI C4  — top of guide tone range
const SCHEDULE_AHEAD = 0.1;  // seconds
const SCHEDULE_INTERVAL = 25; // ms

// ---- Voicing Data ----

// ---- DOM refs ----

const dom = {
  appVersion:      document.getElementById('app-version'),
  keyDisplay:      document.getElementById('key-display'),
  chordDisplay:    document.getElementById('chord-display'),
  nextHeader:      document.getElementById('next-header'),
  nextKeyDisplay:  document.getElementById('next-key-display'),
  nextChordDisplay:document.getElementById('next-chord-display'),
  chordMode:       document.getElementById('chord-mode'),
  drumsSelect:     document.getElementById('drums-select'),
  patternHelp:     document.getElementById('pattern-help'),
  patternPicker:   document.getElementById('pattern-picker'),
  patternSelect:   document.getElementById('pattern-select'),
  patternPickerCustom: document.getElementById('pattern-picker-custom'),
  customPatternPanel: document.getElementById('custom-pattern-panel'),
  customPattern:   document.getElementById('custom-pattern'),
  patternMode:     document.getElementById('pattern-mode'),
  patternError:    document.getElementById('pattern-error'),
  savePreset:      document.getElementById('save-preset'),
  cancelPresetEdit: document.getElementById('cancel-preset-edit'),
  newPreset:       document.getElementById('new-preset'),
  editPreset:      document.getElementById('edit-preset'),
  deletePreset:    document.getElementById('delete-preset'),
  managePresets:   document.getElementById('manage-presets'),
  presetManagerPanel: document.getElementById('preset-manager-panel'),
  presetManagerList: document.getElementById('preset-manager-list'),
  closePresetManager: document.getElementById('close-preset-manager'),
  restoreDefaultPresets: document.getElementById('restore-default-presets'),
  clearAllPresets: document.getElementById('clear-all-presets'),
  presetFeedback:  document.getElementById('preset-feedback'),
  tempoSlider:     document.getElementById('tempo-slider'),
  tempoValue:      document.getElementById('tempo-value'),
  transpositionSelect: document.getElementById('transposition-select'),
  doubleTime:      document.getElementById('double-time'),
  majorMinor:      document.getElementById('major-minor'),
  displayMode:     document.getElementById('display-mode'),
  startStop:       document.getElementById('start-stop'),
  pause:           document.getElementById('pause'),
  beatDots:        document.querySelectorAll('.beat-dot'),
  keyCheckboxes:   document.getElementById('key-checkboxes'),
  bassVolume:      document.getElementById('bass-volume'),
  bassVolumeValue: document.getElementById('bass-volume-value'),
  stringsVolume:   document.getElementById('strings-volume'),
  stringsVolumeValue: document.getElementById('strings-volume-value'),
  drumsVolume:     document.getElementById('drums-volume'),
  drumsVolumeValue: document.getElementById('drums-volume-value')
};

if (dom.appVersion) {
  dom.appVersion.textContent = `Version ${APP_VERSION}`;
}

let DEFAULT_PRESETS = {};
let presets = {};
let editingPresetName = '';
let editingPresetSnapshot = null;
let lastStandaloneCustomPattern = '';
let lastStandaloneCustomMode = PATTERN_MODE_BOTH;
let isManagingPresets = false;
let draggedPresetName = '';
let savedPatternSelection = null;
let pendingPresetDeletion = null;

function normalizePatternMode(mode) {
  if (mode === 'major/minor') return PATTERN_MODE_BOTH;
  return [PATTERN_MODE_MAJOR, PATTERN_MODE_MINOR, PATTERN_MODE_BOTH].includes(mode)
    ? mode
    : PATTERN_MODE_BOTH;
}

function normalizePatternString(pattern) {
  return String(pattern || '')
    .replace(/-/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function createPresetEntry(pattern, mode = PATTERN_MODE_BOTH) {
  return {
    pattern: normalizePatternString(pattern),
    mode: normalizePatternMode(mode)
  };
}

function normalizePresetEntry(name, entry) {
  if (typeof entry === 'string') return createPresetEntry(entry, PATTERN_MODE_BOTH);
  if (entry && typeof entry === 'object') {
    return createPresetEntry(entry.pattern ?? name, entry.mode);
  }
  return createPresetEntry(name, PATTERN_MODE_BOTH);
}

function normalizeDefaultPresetsSource(source) {
  if (Array.isArray(source)) {
    return Object.fromEntries(
      source
        .map(entry => normalizePresetEntry(entry?.pattern ?? '', entry))
        .filter(entry => entry.pattern)
        .map(entry => [entry.pattern, entry])
    );
  }

  if (source && typeof source === 'object') {
    return Object.fromEntries(
      Object.entries(source)
        .map(([name, entry]) => normalizePresetEntry(name, entry))
        .filter(entry => entry.pattern)
        .map(entry => [entry.pattern, entry])
    );
  }

  return {};
}

function normalizePresetsMap(source) {
  if (!source || typeof source !== 'object' || Array.isArray(source)) {
    return Object.fromEntries(
      Object.entries(DEFAULT_PRESETS).map(([name, entry]) => [name, normalizePresetEntry(name, entry)])
    );
  }

  const normalizedEntries = Object.entries(source || {})
    .map(([name, entry]) => normalizePresetEntry(name, entry))
    .filter(entry => entry.pattern);

  return Object.fromEntries(normalizedEntries.map(entry => [entry.pattern, entry]));
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
    qualityMajor = customQuality;
    qualityMinor = customQuality;
  } else if (modifier) {
    qualityMajor = ALTERED_SEMITONE_QUALITY_MAJOR[semitones] || 'â–³7';
    qualityMinor = ALTERED_SEMITONE_QUALITY_MINOR[semitones] || 'm7';
  } else {
    qualityMajor = DEGREE_QUALITY_MAJOR[roman] || 'â–³7';
    qualityMinor = DEGREE_QUALITY_MINOR[roman] || 'm7';
  }

  qualityMajor = normalizeParsedQuality(qualityMajor, roman);
  qualityMinor = normalizeParsedQuality(qualityMinor, roman);

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
  return String(quality).toLowerCase() !== 'm9';
}

function normalizeParsedQuality(quality, roman) {
  const normalizedQuality = String(quality).toLowerCase();
  if (normalizedQuality === 'm9') return roman === 'III' ? 'm7' : 'm9';
  if (normalizedQuality === 'm7' && roman !== 'III') return 'm9';
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

  let qualityMajor, qualityMinor;
  if (customQuality) {
    // Custom quality overrides both modes
    qualityMajor = customQuality;
    qualityMinor = customQuality;
  } else if (modifier) {
    // Altered degree: look up by resulting semitone for enharmonic consistency
    qualityMajor = ALTERED_SEMITONE_QUALITY_MAJOR[semitones] || '△7';
    qualityMinor = ALTERED_SEMITONE_QUALITY_MINOR[semitones] || 'm7';
  } else {
    // Natural diatonic degree
    qualityMajor = DEGREE_QUALITY_MAJOR[roman] || '△7';
    qualityMinor = DEGREE_QUALITY_MINOR[roman] || 'm7';
  }
  return { label: modifier + roman, roman, modifier, semitones, qualityMajor, qualityMinor };
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
  const overrideMatch = normalized.match(/^key\s*=\s*([A-Ga-g])([b#]?)\s*:\s*(.*)$/);
  if (!overrideMatch) {
    if (/^key\s*=/.test(normalized) && !/:/.test(normalized)) {
      return {
        body: normalized,
        basePitchClass: 0,
        hasOverride: true,
        overrideToken: normalized,
        error: 'Missing ":" after key override'
      };
    }
    if (/^key\s*=/.test(normalized)) {
      const rawOverride = normalized.match(/^key\s*=\s*([^:\s]+)/);
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

function analyzePattern(str) {
  const base = extractPatternBase(str);
  if (base.error) {
    return { ...base, tokens: [], chords: [], invalidTokens: [], errorMessage: base.error };
  }

  const tokens = base.body ? base.body.split(/[\s-]+/).filter(Boolean) : [];
  const chords = [];
  const invalidTokens = [];

  for (const t of tokens) {
    if (t === '%') {
      if (chords.length > 0) chords.push({ ...chords[chords.length - 1] });
      continue;
    }

    const parsed = parseToken(t, base.basePitchClass);
    if (parsed) {
      chords.push(parsed);
    } else if (containsRejectedQuality(t)) {
      invalidTokens.push(`${t} (use m7; m9 is applied automatically except on III)`);
    } else {
      invalidTokens.push(t);
    }
  }

  return {
    ...base,
    tokens,
    chords,
    invalidTokens,
    errorMessage: invalidTokens.length > 0 ? `Unknown token(s): ${invalidTokens.join(', ')}` : null
  };
}

function parsePattern(str) {
  return analyzePattern(str).chords;
}

function containsRejectedQuality(token) {
  return /m9/i.test(token);
}

function padProgression(chords, doubleTime) {
  if (chords.length === 0) return [];
  const result = chords.slice();
  const chordsPerMeasure = doubleTime ? 2 : 1;

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

// ---- Audio Engine ----

let audioCtx = null;
let mixerNodes = null;
const sampleBuffers = { bass: {}, cello: {}, violin: {}, drums: {} };
const sampleLoadPromises = {
  bass: new Map(),
  cello: new Map(),
  violin: new Map(),
  drums: new Map()
};
let backgroundSamplePreloadPromise = null;
const DRUM_MODE_OFF = 'off';
const DRUM_MODE_METRONOME_24 = 'metronome_2_4';
const DRUM_MODE_HIHATS_24 = 'hihats_2_4';
const DRUM_MODE_FULL_SWING = 'full_swing';
const PORTAMENTO_ALWAYS_ON = true;
const METRONOME_GAIN_MULTIPLIER = 2.4;
const DRUMS_GAIN_MULTIPLIER = 1.18;
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
  const promises = [];
  const bassRange = getBassPreloadRange();
  const stringRanges = getStringPreloadRanges();

  // Bass samples
  for (let midi = bassRange.low; midi <= bassRange.high; midi++) {
    promises.push(loadSample('bass', 'Bass', midi));
  }
  // Cello samples limited to fundamentals and guide tones that can actually be voiced.
  for (let midi = stringRanges.cello.low; midi <= stringRanges.cello.high; midi++) {
    promises.push(loadSample('cello', 'Cellos', midi));
  }
  // Violin samples are fully preloaded so voicing optimization is never preload-bound.
  for (let midi = VIOLIN_LOW; midi <= VIOLIN_HIGH; midi++) {
    promises.push(loadSample('violin', 'Violins', midi));
  }
  promises.push(loadFileSample('drums', 'hihat', DRUM_HIHAT_SAMPLE_URL));
  DRUM_RIDE_SAMPLE_URLS.forEach((url, index) => {
    promises.push(loadFileSample('drums', `ride_${index}`, url));
  });
  await Promise.all(promises);
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

function loadBufferFromUrl(baseUrl) {
  const versionedUrl = `${baseUrl}?v=${encodeURIComponent(APP_VERSION)}`;
  return fetch(versionedUrl)
    .then(r => {
      if (r.ok) return r.arrayBuffer();
      return fetch(baseUrl).then(r2 => {
        if (!r2.ok) throw new Error(`HTTP ${r2.status} for ${baseUrl}`);
        return r2.arrayBuffer();
      });
    })
    .then(buf => audioCtx.decodeAudioData(buf));
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
let activeChordVoices = new Map(); // active string voices by "instrument:midi"
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
  const fadeEnd = stopTime + fadeDuration;

  for (const voice of activeChordVoices.values()) {
    try {
      voice.gain.gain.cancelScheduledValues(stopTime);
      voice.gain.gain.setValueAtTime(voice.gain.gain.value, stopTime);
      voice.gain.gain.linearRampToValueAtTime(0, fadeEnd);
    } catch (err) {
      // Ignore nodes that have already been disconnected or stopped.
    }

    if (voice.stop) {
      voice.stop(fadeEnd);
    }
    voice.audibleUntil = Math.min(voice.audibleUntil, fadeEnd);
  }

  activeChordVoices.clear();
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
  const bassGain = dom.chordMode.checked ? BASS_GAIN_WITH_CHORDS : BASS_GAIN;
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

function getChordVoiceEntries(voicing) {
  if (!voicing) return [];

  const entries = [
    {
      key: `cello:${voicing.fundamental}`,
      category: 'cello',
      midi: voicing.fundamental,
      role: 'fundamental',
      volume: 10.0 * CHORD_VOLUME_MULTIPLIER,
    },
  ];

  for (const midi of voicing.guideTones) {
    entries.push({
      key: `cello:${midi}`,
      category: 'cello',
      midi,
      role: 'guide',
      volume: 16.5 * CHORD_VOLUME_MULTIPLIER,
    });
  }

  for (const midi of voicing.colorTones) {
    entries.push({
      key: `violin:${midi}`,
      category: 'violin',
      midi,
      role: 'color',
      volume: 6.5 * CHORD_VOLUME_MULTIPLIER,
    });
  }

  return entries;
}

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
  };
}

function getVoiceSustainSlots(chords, key, chordIdx, voiceKey, isMinor, nextProgression = null) {
  let sustainSlots = 1;
  let reachesSequenceEnd = true;

  for (let i = chordIdx + 1; i < chords.length; i++) {
    const nextVoicing = getVoicingAtIndex(chords, key, i, isMinor);
    const nextVoiceKeys = new Set(getChordVoiceEntries(nextVoicing).map(voice => voice.key));
    if (!nextVoiceKeys.has(voiceKey)) {
      reachesSequenceEnd = false;
      break;
    }
    sustainSlots++;
  }

  if (!nextProgression || !reachesSequenceEnd) {
    return sustainSlots;
  }

  for (let i = 0; i < nextProgression.chords.length; i++) {
    const nextVoicing = getVoicingAtIndex(nextProgression.chords, nextProgression.key, i, isMinor);
    const nextVoiceKeys = new Set(getChordVoiceEntries(nextVoicing).map(voice => voice.key));
    if (!nextVoiceKeys.has(voiceKey)) break;
    sustainSlots++;
  }

  return sustainSlots;
}

function fadeOutChordVoice(voice, fadeStart, fadeEnd) {
  voice.gain.gain.cancelScheduledValues(fadeStart);
  voice.gain.gain.setValueAtTime(voice.volume, fadeStart);
  voice.gain.gain.linearRampToValueAtTime(0, fadeEnd);
  if (voice.stop) {
    voice.stop(fadeEnd);
  }
  voice.audibleUntil = Math.min(voice.audibleUntil, fadeEnd);
}

function pruneExpiredChordVoices(time) {
  for (const [voiceKey, voice] of activeChordVoices.entries()) {
    if (voice.audibleUntil <= time) {
      activeChordVoices.delete(voiceKey);
    }
  }
}

function scheduleEaseOutAutomation(param, startTime, endTime, startValue, endValue) {
  const duration = endTime - startTime;
  if (duration <= 0) {
    param.setValueAtTime(endValue, endTime);
    return;
  }

  const curve = new Float32Array(AUTOMATION_CURVE_STEPS);
  for (let i = 0; i < AUTOMATION_CURVE_STEPS; i++) {
    const t = i / (AUTOMATION_CURVE_STEPS - 1);
    const eased = 1 - Math.pow(1 - t, 2);
    curve[i] = startValue + (endValue - startValue) * eased;
  }

  param.setValueCurveAtTime(curve, startTime, duration);
}

function findLegatoTransitions(exitingVoices, targetVoices) {
  if (exitingVoices.length === 0 || targetVoices.length === 0) return new Map();

  const transitions = new Map();
  const remainingTargets = [...targetVoices];
  const sortedVoices = [...exitingVoices].sort((a, b) => b.midi - a.midi);

  for (const voice of sortedVoices) {
    let bestTargetIndex = -1;
    let bestDistance = Infinity;

    for (let i = 0; i < remainingTargets.length; i++) {
      const target = remainingTargets[i];
      const distance = Math.abs(target.midi - voice.midi);
      if (distance > STRING_LEGATO_MAX_DISTANCE) continue;
      if (distance < bestDistance || (distance === bestDistance && target.midi > remainingTargets[bestTargetIndex]?.midi)) {
        bestTargetIndex = i;
        bestDistance = distance;
      }
    }

    if (bestTargetIndex === -1) continue;
    transitions.set(voice, remainingTargets[bestTargetIndex]);
    remainingTargets.splice(bestTargetIndex, 1);
  }

  return transitions;
}

function applyLegatoFadeOut(voice, targetMidi, targetTime) {
  if (!voice?.detuneParams?.length) return false;

  const startTime = Math.max(targetTime - STRING_LEGATO_GLIDE_TIME, audioCtx.currentTime);
  const dipStart = Math.max(startTime - STRING_LEGATO_PRE_DIP_TIME, audioCtx.currentTime);
  const glideEnd = startTime + STRING_LEGATO_GLIDE_TIME;
  const holdEnd = glideEnd + STRING_LEGATO_HOLD_TIME;
  const fadeEnd = holdEnd + STRING_LEGATO_FADE_TIME;
  const detuneAmount = (targetMidi - voice.midi) * 100;
  const dippedVolume = voice.volume * STRING_LEGATO_PRE_DIP_RATIO;

  for (const detune of voice.detuneParams) {
    detune.cancelScheduledValues(dipStart);
    detune.setValueAtTime(0, startTime);
    scheduleEaseOutAutomation(detune, startTime, glideEnd, 0, detuneAmount);
  }

  voice.gain.gain.cancelScheduledValues(dipStart);
  voice.gain.gain.setValueAtTime(voice.volume, dipStart);
  scheduleEaseOutAutomation(voice.gain.gain, dipStart, startTime, voice.volume, dippedVolume);
  voice.gain.gain.setValueAtTime(dippedVolume, glideEnd);
  voice.gain.gain.setValueAtTime(dippedVolume, holdEnd);
  scheduleEaseOutAutomation(voice.gain.gain, holdEnd, fadeEnd, dippedVolume, 0);

  if (voice.stop) {
    voice.stop(fadeEnd);
  }
  voice.audibleUntil = Math.min(voice.audibleUntil, fadeEnd);
  return true;
}

function playChord(chords, key, chordIdx, isMinor, time, slotDuration) {
  const voicing = getVoicingAtIndex(chords, key, chordIdx, isMinor);
  if (!voicing) return;

  const earlyTime = Math.max(time - CHORD_ANTICIPATION, audioCtx.currentTime);
  pruneExpiredChordVoices(earlyTime);
  const targetVoiceKeys = new Set();
  const nextProgression = getPreparedNextProgression();
  const targetVoices = getChordVoiceEntries(voicing);

  for (const voice of targetVoices) {
    targetVoiceKeys.add(voice.key);
    if (activeChordVoices.has(voice.key)) continue;

    const sustainSlots = getVoiceSustainSlots(chords, key, chordIdx, voice.key, isMinor, nextProgression);
    const adjustedDuration = sustainSlots * slotDuration + CHORD_ANTICIPATION;
    const activeVoice = playSample(voice.category, voice.midi, earlyTime, adjustedDuration, voice.volume);
    if (activeVoice) {
      activeVoice.role = voice.role;
      activeVoice.endAnchor.onended = () => {
        const currentVoice = activeChordVoices.get(voice.key);
        if (currentVoice === activeVoice) {
          activeChordVoices.delete(voice.key);
        }
      };
      activeChordVoices.set(voice.key, activeVoice);
    }
  }

  const exitingVoices = [];
  for (const [voiceKey, voice] of activeChordVoices.entries()) {
    if (targetVoiceKeys.has(voiceKey)) continue;
    if (voice.role === 'guide') {
      exitingVoices.push(voice);
    }
  }

  const eligibleTargetVoices = targetVoices.filter(voice => voice.role === 'guide');
  const legatoTransitions = findLegatoTransitions(exitingVoices, eligibleTargetVoices);

  for (const [voiceKey, voice] of activeChordVoices.entries()) {
    if (targetVoiceKeys.has(voiceKey)) continue;
    const legatoTarget = PORTAMENTO_ALWAYS_ON ? legatoTransitions.get(voice) : null;
    const usedLegato = legatoTarget
      && applyLegatoFadeOut(voice, legatoTarget.midi, time);
    if (!usedLegato) {
      const fadeStart = Math.max(time, audioCtx.currentTime);
      fadeOutChordVoice(voice, fadeStart, fadeStart + CHORD_FADE_DUR);
    }
    activeChordVoices.delete(voiceKey);
  }
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
    if ((aliases || []).includes(quality)) return category;
  }
  if (quality.startsWith('7')) return 'dom';
  return null;
}

function getDominantSubtype(quality) {
  const suffix = quality.slice(1); // remove leading '7'
  for (const [subtype, aliases] of Object.entries(DOMINANT_SUBTYPE_SUFFIXES)) {
    if ((aliases || []).includes(suffix)) return subtype;
  }
  return 'auto';
}

function resolveDominantSubtype(chord, quality, isMinor) {
  const sub = getDominantSubtype(quality);
  if (sub !== 'auto') return sub;
  const defaults = isMinor ? DOMINANT_DEFAULT_SUBTYPE_MINOR : DOMINANT_DEFAULT_SUBTYPE_MAJOR;
  return defaults[chord.roman] || 'mixo';
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

function collectRequiredSampleNotes() {
  const bassNotes = new Set();
  const celloNotes = new Set();
  const violinNotes = new Set();

  const registerProgression = (chords, key, voicingPlan) => {
    if (!Array.isArray(chords) || key === null || key === undefined) return;

    for (const chord of chords) {
      bassNotes.add(getBassMidi(key, chord.semitones));
    }

    for (const voicing of voicingPlan || []) {
      if (!voicing) continue;
      celloNotes.add(voicing.fundamental);
      for (const midi of voicing.guideTones || []) celloNotes.add(midi);
      for (const midi of voicing.colorTones || []) violinNotes.add(midi);
    }
  };

  registerProgression(paddedChords, currentKey, currentVoicingPlan);
  registerProgression(nextPaddedChords, nextKeyValue, nextVoicingPlan);

  return { bassNotes, celloNotes, violinNotes };
}

async function preloadStartupSamples() {
  const { bassNotes, celloNotes, violinNotes } = collectRequiredSampleNotes();
  const promises = [];

  bassNotes.forEach((midi) => {
    promises.push(loadSample('bass', 'Bass', midi));
  });
  celloNotes.forEach((midi) => {
    promises.push(loadSample('cello', 'Cellos', midi));
  });
  violinNotes.forEach((midi) => {
    promises.push(loadSample('violin', 'Violins', midi));
  });

  const drumsMode = getDrumsMode();
  if (drumsMode === DRUM_MODE_HIHATS_24 || drumsMode === DRUM_MODE_FULL_SWING) {
    promises.push(loadFileSample('drums', 'hihat', DRUM_HIHAT_SAMPLE_URL));
  }
  if (drumsMode === DRUM_MODE_FULL_SWING) {
    promises.push(loadFileSample('drums', 'ride_0', DRUM_RIDE_SAMPLE_URLS[0]));
  }

  await Promise.all(promises);
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
      const key = colorTones.join(',');
      if (!candidateMap.has(key)) {
        candidateMap.set(key, { fundamental, guideTones, colorTones });
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

function getVoicingTopNote(voicing) {
  if (!voicing?.colorTones?.length) {
    return Math.max(voicing?.fundamental || -Infinity, ...(voicing?.guideTones || []));
  }
  return voicing.colorTones[voicing.colorTones.length - 1];
}

const VOICING_RANDOMIZATION_CHANCE = 0.3;
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
    const subtype = resolveDominantSubtype(chord, quality, isMinor);
    colorIntervals = resolveIntervalList(DOMINANT_COLOR_TONES[subtype] || DOMINANT_COLOR_TONES.mixo);
    guideIntervals = DOMINANT_GUIDE_TONES[subtype] || null;
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
          totalTopSum: prevScore.totalTopSum + (candidate ? getVoicingTopNote(candidate) : 0),
          totalInnerMovement: prevScore.totalInnerMovement + innerMovement,
          prevIndex,
          signature: `${prevScore.signature}|${candidate?.colorTones?.join(',') || ''}`,
        };
        candidateScores.push(candidateScore);
      }
      return pickVoicingScore(candidateScores);
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

function pickVoicingScore(scores) {
  const availableScores = scores.filter(Boolean);
  if (availableScores.length === 0) return null;

  let bestScore = availableScores[0];
  for (let i = 1; i < availableScores.length; i++) {
    if (compareVoicingPathScores(availableScores[i], bestScore) < 0) {
      bestScore = availableScores[i];
    }
  }

  const shortlist = availableScores.filter(score => isVoicingScoreNearBest(score, bestScore));
  if (shortlist.length <= 1 || Math.random() >= VOICING_RANDOMIZATION_CHANCE) {
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

function getStringPreloadRanges() {
  let celloLow = Infinity;
  let celloHigh = -Infinity;

  const registerVoicing = (voicing) => {
    if (!voicing) return;

    celloLow = Math.min(celloLow, voicing.fundamental, ...voicing.guideTones);
    celloHigh = Math.max(celloHigh, voicing.fundamental, ...voicing.guideTones);
  };

  for (let rootPitchClass = 0; rootPitchClass < 12; rootPitchClass++) {
    for (const [qualityCategory, colorToneIntervals] of Object.entries(COLOR_TONES)) {
      registerVoicing(
        computeChordVoicing(rootPitchClass, qualityCategory, resolveIntervalList(colorToneIntervals))
      );
    }

    for (const [subtype, colorToneIntervals] of Object.entries(DOMINANT_COLOR_TONES)) {
      registerVoicing(
        computeChordVoicing(
          rootPitchClass,
          'dom',
          resolveIntervalList(colorToneIntervals),
          DOMINANT_GUIDE_TONES[subtype] || null
        )
      );
    }
  }

  return {
    cello: { low: celloLow, high: celloHigh },
    violin: { low: VIOLIN_LOW, high: VIOLIN_HIGH }
  };
}

function getVoicing(key, chord, isMinor) {
  const quality = isMinor ? chord.qualityMinor : chord.qualityMajor;
  const cat = classifyQuality(quality);
  if (!cat) return null;

  const rootPitchClass = (key + chord.semitones) % 12;

  let colorIntervals;
  let guideIntervals = null;
  if (cat === 'dom') {
    const subtype = resolveDominantSubtype(chord, quality, isMinor);
    colorIntervals = resolveIntervalList(DOMINANT_COLOR_TONES[subtype] || DOMINANT_COLOR_TONES.mixo);
    guideIntervals = DOMINANT_GUIDE_TONES[subtype] || null;
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
  // Get enabled major key indices
  let pool = [];
  for (let i = 0; i < 12; i++) {
    if (enabledKeys[i]) pool.push(i);
  }
  if (pool.length === 0) pool = [0]; // fallback to C
  // If minor mode, transpose each key -3 semitones (relative minor)
  if (dom.majorMinor.checked) {
    pool = pool.map(k => (k - 3 + 12) % 12);
  }
  return pool;
}

function nextKey() {
  if (keyPool.length === 0) {
    keyPool = shuffleArray(getEffectiveKeyPool().slice());
  }
  return keyPool.pop();
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
  const name = dom.majorMinor.checked ? KEY_NAMES_MINOR[displayKey] : KEY_NAMES_MAJOR[displayKey];
  const suffix = dom.majorMinor.checked ? ' min' : ' maj';
  return name + suffix;
}

function getDisplayedQuality(chord, isMinor) {
  const quality = isMinor ? chord.qualityMinor : chord.qualityMajor;
  if (classifyQuality(quality) !== 'dom') return quality;

  const subtype = resolveDominantSubtype(chord, quality, isMinor);
  return `7${subtype}`;
}

function chordSymbol(key, chord) {
  const isMinor = dom.majorMinor.checked;
  const rootName = degreeRootName(transposeDisplayPitchClass(key), chord.roman, chord.semitones, isMinor);
  const quality = getDisplayedQuality(chord, isMinor);
  return rootName + quality;
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

  // Accidental needed to reach expected semitone from the natural letter
  let acc = (expectedSemi - NATURAL_SEMITONES[degLetterIdx] + 12) % 12;
  if (acc > 6) acc -= 12;

  if (acc === 0) return degLetter;
  if (acc === 1) return degLetter + '♯';
  if (acc === -1) return degLetter + '♭';
  if (acc === 2) return degLetter + '𝄪';
  if (acc === -2) return degLetter + '𝄫';
  return degLetter;
}

function showNextCol() {
  dom.nextHeader.classList.remove('hidden');
  dom.nextKeyDisplay.classList.remove('hidden');
  dom.nextChordDisplay.classList.remove('hidden');
  fitHarmonyDisplay();
}
function hideNextCol() {
  dom.nextHeader.classList.add('hidden');
  dom.nextKeyDisplay.classList.add('hidden');
  dom.nextChordDisplay.classList.add('hidden');
  fitHarmonyDisplay();
}

function fitChordDisplay(element, baseRem) {
  if (!element) return;

  element.style.fontSize = `${baseRem}rem`;
  if (!element.textContent?.trim()) return;

  const availableWidth = element.clientWidth;
  const contentWidth = element.scrollWidth;
  if (!availableWidth || !contentWidth || contentWidth <= availableWidth) return;

  const scale = availableWidth / contentWidth;
  const adjustedRem = Math.max(1.25, Number((baseRem * scale).toFixed(3)));
  element.style.fontSize = `${adjustedRem}rem`;
}

function getBaseChordDisplaySize() {
  const mode = normalizeDisplayMode(dom.displayMode?.value);
  const isMobile = window.matchMedia('(max-width: 720px)').matches;

  if (mode === DISPLAY_MODE_CHORDS_ONLY) {
    return isMobile ? 2.8 : 3.6;
  }
  return isMobile ? 2.5 : 3.2;
}

function fitHarmonyDisplay() {
  window.requestAnimationFrame(() => {
    const baseRem = getBaseChordDisplaySize();
    fitChordDisplay(dom.chordDisplay, baseRem);
    fitChordDisplay(dom.nextChordDisplay, baseRem);
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
let paddedChords = [];
let currentVoicingPlan = [];
let nextPaddedChords = [];
let nextVoicingPlan = [];
let lastPlayedChordIdx = -1; // track last chord to avoid re-triggering sustained chords
const CUSTOM_PATTERN_OPTION_VALUE = '__custom__';

function getSecondsPerBeat() {
  return 60 / Number(dom.tempoSlider.value);
}

function getPresetEntry(name = dom.patternSelect.value) {
  return Object.prototype.hasOwnProperty.call(presets, name) ? presets[name] : null;
}

function hasSelectedPreset() {
  return Boolean(getPresetEntry());
}

function isEditingPreset() {
  return Boolean(editingPresetName);
}

function clearPresetEditingState() {
  editingPresetName = '';
  editingPresetSnapshot = null;
}

function closePresetManager() {
  isManagingPresets = false;
}

function rememberStandaloneCustomDraft() {
  if (isEditingPreset()) return;
  lastStandaloneCustomPattern = normalizePatternString(dom.customPattern.value);
  lastStandaloneCustomMode = normalizePatternMode(dom.patternMode?.value);
}

function isCustomPatternSelected() {
  return dom.patternSelect.value === CUSTOM_PATTERN_OPTION_VALUE;
}

function getSelectedPresetPattern() {
  return getPresetEntry()?.pattern || '';
}

function getSelectedPresetMode() {
  return getPresetEntry()?.mode || PATTERN_MODE_BOTH;
}

function getCurrentPatternMode() {
  if (hasSelectedPreset()) return getSelectedPresetMode();
  return normalizePatternMode(dom.patternMode?.value);
}

function getPatternModeLabel(mode) {
  switch (normalizePatternMode(mode)) {
    case PATTERN_MODE_MAJOR:
      return 'major';
    case PATTERN_MODE_MINOR:
      return 'minor';
    default:
      return 'major/minor';
  }
}

function getCurrentPatternString() {
  if (hasSelectedPreset()) return getSelectedPresetPattern();
  return normalizePatternString(dom.customPattern.value);
}

function syncCustomPatternUI() {
  const customSelected = isCustomPatternSelected();
  dom.patternPicker?.classList.toggle('custom-active', customSelected);
  dom.patternPickerCustom?.classList.toggle('hidden', !customSelected);
  dom.customPatternPanel?.classList.toggle('hidden', !customSelected);
  if (!customSelected) {
    dom.patternError.classList.add('hidden');
  }
}

function getPresetNames() {
  return Object.keys(presets);
}

function rebuildPresetsFromNames(names) {
  presets = Object.fromEntries(
    names
      .filter(name => Object.prototype.hasOwnProperty.call(presets, name))
      .map(name => [name, presets[name]])
  );
}

function clearPresetManagerDropMarkers() {
  dom.presetManagerList?.querySelectorAll('.preset-manager-item').forEach(item => {
    item.classList.remove('drop-before', 'drop-after');
  });
}

function renderPresetManagerList() {
  if (!dom.presetManagerList) return;
  dom.presetManagerList.innerHTML = '';

  const presetNames = getPresetNames();
  if (presetNames.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'hint';
    empty.textContent = 'No presets saved.';
    dom.presetManagerList.appendChild(empty);
    return;
  }

  for (const name of presetNames) {
    const item = document.createElement('div');
    item.className = 'preset-manager-item';
    item.draggable = true;
    item.dataset.name = name;
    if (dom.patternSelect.value === name) {
      item.classList.add('is-selected');
    }

    item.addEventListener('dragstart', () => {
      draggedPresetName = name;
      item.classList.add('is-dragging');
    });
    item.addEventListener('dragend', () => {
      draggedPresetName = '';
      item.classList.remove('is-dragging');
      clearPresetManagerDropMarkers();
    });
    item.addEventListener('dragover', event => {
      event.preventDefault();
      if (!draggedPresetName || draggedPresetName === name) return;
      clearPresetManagerDropMarkers();
      const bounds = item.getBoundingClientRect();
      const insertAfter = event.clientY - bounds.top > bounds.height / 2;
      item.classList.add(insertAfter ? 'drop-after' : 'drop-before');
    });
    item.addEventListener('dragleave', () => {
      item.classList.remove('drop-before', 'drop-after');
    });
    item.addEventListener('drop', event => {
      event.preventDefault();
      if (!draggedPresetName || draggedPresetName === name) return;
      const names = getPresetNames().filter(entry => entry !== draggedPresetName);
      const targetIndex = names.indexOf(name);
      const bounds = item.getBoundingClientRect();
      const insertAfter = event.clientY - bounds.top > bounds.height / 2;
      names.splice(targetIndex + (insertAfter ? 1 : 0), 0, draggedPresetName);
      rebuildPresetsFromNames(names);
      renderPresetOptions(dom.patternSelect.value);
      renderPresetManagerList();
      saveSettings();
    });

    const handle = document.createElement('span');
    handle.className = 'preset-manager-handle';
    handle.textContent = '::';

    const label = document.createElement('div');
    label.className = 'preset-manager-item-name';
    label.appendChild(document.createTextNode(`${name} `));
    const mode = document.createElement('span');
    mode.className = 'preset-manager-item-mode';
    mode.textContent = `(${getPatternModeLabel(presets[name].mode)})`;
    label.appendChild(mode);

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'preset-manager-item-delete';
    deleteButton.textContent = 'Delete';
    deleteButton.addEventListener('click', () => {
      deletePresetByName(name, {
        offerUndo: true,
        successMessage: `Preset deleted: ${name}`
      });
    });

    item.appendChild(handle);
    item.appendChild(label);
    item.appendChild(deleteButton);
    dom.presetManagerList.appendChild(item);
  }
}

function syncPresetManagerPanel() {
  if (!dom.presetManagerPanel) return;
  const shouldShow = isManagingPresets;
  dom.presetManagerPanel.classList.toggle('hidden', !shouldShow);
  if (shouldShow) {
    renderPresetManagerList();
  }
}

function deletePresetByName(name, {
  requireConfirmation = false,
  confirmationMessage = `Delete preset "${name}"?`,
  successMessage = `Preset deleted: ${name}`,
  offerUndo = false
} = {}) {
  if (!Object.prototype.hasOwnProperty.call(presets, name)) {
    setPresetFeedback('Preset not found.', true);
    return false;
  }
  if (requireConfirmation && !window.confirm(confirmationMessage)) {
    return false;
  }

  if (editingPresetName === name) {
    clearPresetEditingState();
  }
  const presetNamesBeforeDeletion = getPresetNames();
  const deletedEntry = presets[name];
  const deletedIndex = presetNamesBeforeDeletion.indexOf(name);
  const wasSelected = dom.patternSelect.value === name;
  const fallbackSelection = wasSelected
    ? presetNamesBeforeDeletion[deletedIndex + 1] || presetNamesBeforeDeletion[deletedIndex - 1] || ''
    : dom.patternSelect.value;
  delete presets[name];
  renderPresetOptions(fallbackSelection);
  if (Object.prototype.hasOwnProperty.call(presets, fallbackSelection)) {
    dom.patternSelect.value = fallbackSelection;
    dom.customPattern.value = getSelectedPresetPattern();
    dom.patternMode.value = getSelectedPresetMode();
    syncCustomPatternUI();
  } else {
    syncPatternSelectionFromInput();
  }
  syncPresetManagerState();
  syncPresetManagerPanel();
  validateCustomPattern();
  applyPatternModeAvailability();
  if (offerUndo) {
    pendingPresetDeletion = {
      name,
      entry: deletedEntry,
      index: deletedIndex,
      wasSelected
    };
    setPresetFeedback(successMessage, false, {
      label: 'Undo',
      onClick: undoPresetDeletion
    });
  } else {
    pendingPresetDeletion = null;
    setPresetFeedback(successMessage);
  }
  saveSettings();
  return true;
}

function undoPresetDeletion() {
  if (!pendingPresetDeletion) return;

  const { name, entry, index, wasSelected } = pendingPresetDeletion;
  pendingPresetDeletion = null;
  presets[name] = normalizePresetEntry(name, entry);

  const names = getPresetNames().filter(presetName => presetName !== name);
  names.splice(Math.max(0, Math.min(index, names.length)), 0, name);
  rebuildPresetsFromNames(names);

  renderPresetOptions(wasSelected ? name : dom.patternSelect.value);
  if (wasSelected) {
    dom.patternSelect.value = name;
    dom.customPattern.value = getSelectedPresetPattern();
    dom.patternMode.value = getSelectedPresetMode();
    syncCustomPatternUI();
  } else {
    syncPatternSelectionFromInput();
  }
  syncPresetManagerState();
  syncPresetManagerPanel();
  validateCustomPattern();
  applyPatternModeAvailability();
  setPresetFeedback(`Restored preset: ${name}`);
  saveSettings();
}

function syncPatternSelectionFromInput() {
  const pattern = normalizePatternString(dom.customPattern.value);
  const mode = getCurrentPatternMode();
  if (isEditingPreset()) {
    dom.patternSelect.value = CUSTOM_PATTERN_OPTION_VALUE;
    syncCustomPatternUI();
    return;
  }
  const matchingPreset = Object.keys(presets).find(name => {
    const entry = presets[name];
    return entry.pattern === pattern && entry.mode === mode;
  }) || '';
  if (matchingPreset) {
    dom.patternSelect.value = matchingPreset;
  } else {
    dom.patternSelect.value = CUSTOM_PATTERN_OPTION_VALUE;
  }
  syncCustomPatternUI();
}

function applyPatternModeAvailability() {
  const patternMode = getCurrentPatternMode();
  const allowBothModes = patternMode === PATTERN_MODE_BOTH;
  const shouldBeMinor = patternMode === PATTERN_MODE_MINOR;
  const modeChanged = dom.majorMinor.checked !== shouldBeMinor;
  const disabledChanged = dom.majorMinor.disabled !== !allowBothModes;

  dom.majorMinor.disabled = !allowBothModes;
  if (!allowBothModes) {
    dom.majorMinor.checked = shouldBeMinor;
  }

  if (!allowBothModes && (modeChanged || disabledChanged)) {
    updateKeyPickerLabels();
    keyPool = [];
  } else if (allowBothModes && disabledChanged) {
    updateKeyPickerLabels();
  }

  refreshDisplayedHarmony();
}

function buildProgression() {
  const raw = parsePattern(getCurrentPatternString());
  if (raw.length === 0) return parsePattern('II-V-I'); // fallback
  return raw;
}

function prepareNextProgression() {
  const isMinor = dom.majorMinor.checked;
  currentKey = nextKeyValue !== null ? nextKeyValue : nextKey();
  const raw = buildProgression();
  paddedChords = padProgression(raw, dom.doubleTime.checked);

  nextKeyValue = nextKey();
  nextPaddedChords = padProgression(raw, dom.doubleTime.checked);
  if (isVoiceLeadingV2Enabled()) {
    const currentSlots = paddedChords.map(chord => createVoicingSlot(chord, currentKey, isMinor, 'current'));
    const nextSlots = nextPaddedChords.map(chord => createVoicingSlot(chord, nextKeyValue, isMinor, 'next'));
    const combinedPlan = buildVoicingPlanForSlots([...currentSlots, ...nextSlots]);
    currentVoicingPlan = combinedPlan.slice(0, currentSlots.length);
    nextVoicingPlan = combinedPlan.slice(currentSlots.length);
  } else {
    currentVoicingPlan = buildLegacyVoicingPlan(paddedChords, currentKey, isMinor);
    nextVoicingPlan = buildLegacyVoicingPlan(nextPaddedChords, nextKeyValue, isMinor);
  }

  currentChordIdx = 0;
  lastPlayedChordIdx = -1;
}

function scheduleBeat() {
  const spb = getSecondsPerBeat();
  const doubleTime = dom.doubleTime.checked;
  const chordsPerMeasure = doubleTime ? 2 : 1;
  const beatsPerChord = doubleTime ? 2 : 4;

  while (nextBeatTime < audioCtx.currentTime + SCHEDULE_AHEAD) {
    if (isIntro) {
      // Count-in: click on every beat
      playClick(nextBeatTime, currentBeat === 0);

      // Schedule display update — show current key + next column with upcoming info
      const introB = currentBeat;
      const introKey = currentKey;
      const introNextKey = nextKeyValue;
      const introFirstChord = paddedChords[0];
      scheduleDisplay(nextBeatTime, () => {
        dom.keyDisplay.textContent = '';
        dom.chordDisplay.textContent = '';
        // Show next column during intro with the upcoming first chord
        showNextCol();
        dom.nextKeyDisplay.textContent = keyName(introKey);
        dom.nextChordDisplay.textContent = introFirstChord ? chordSymbol(introKey, introFirstChord) : '';
        fitHarmonyDisplay();
        updateBeatDots(introB, true);
      });

      currentBeat++;
      if (currentBeat >= 4) {
        currentBeat = 0;
        isIntro = false;
      }
      nextBeatTime += spb;
      continue;
    }

    // --- Normal progression beats ---

    scheduleDrumsForBeat(nextBeatTime, currentBeat, spb);

    // Bass note + optional chord voicing
    const chord = paddedChords[currentChordIdx];
    const noteDuration = beatsPerChord * spb; // time until next chord change
    const isChordBeat = doubleTime
      ? (currentBeat === 0 || currentBeat === 2)
      : (currentBeat === 0);

    if (isChordBeat) {
      // Check if chord is same as previous (padding/sustain)
      const prevChord = lastPlayedChordIdx >= 0 ? paddedChords[lastPlayedChordIdx] : null;
      const sameChord = prevChord && prevChord.semitones === chord.semitones
        && prevChord.qualityMajor === chord.qualityMajor
        && prevChord.qualityMinor === chord.qualityMinor;

      if (!sameChord) {
        // Compute sustained duration: count consecutive identical chords from current index
        let sustainSlots = 1;
        for (let i = currentChordIdx + 1; i < paddedChords.length; i++) {
          const c = paddedChords[i];
          if (c.semitones === chord.semitones
              && c.qualityMajor === chord.qualityMajor
              && c.qualityMinor === chord.qualityMinor) {
            sustainSlots++;
          } else break;
        }
        const sustainDuration = sustainSlots * beatsPerChord * spb;

        const midi = getBassMidi(currentKey, chord.semitones);
        playNote(midi, nextBeatTime, sustainDuration);

        // Chord voicing (cello + violin)
        if (dom.chordMode.checked) {
          const isMinor = dom.majorMinor.checked;
          playChord(paddedChords, currentKey, currentChordIdx, isMinor, nextBeatTime, noteDuration);
        }
      }
      lastPlayedChordIdx = currentChordIdx;
    }

    // Determine if we're in the last measure
    const totalMeasures = paddedChords.length / chordsPerMeasure;
    const currentMeasure = Math.floor(currentChordIdx / chordsPerMeasure);
    const onLastMeasure = currentMeasure === totalMeasures - 1;

    // Schedule display
    const dispBeat = currentBeat;
    const dispChord = chord;
    const dispKey = currentKey;
    const dispNextKey = nextKeyValue;
    const dispLastMeas = onLastMeasure;
    const dispNextFirstChord = onLastMeasure ? buildProgression()[0] || null : null;
    scheduleDisplay(nextBeatTime, () => {
      dom.keyDisplay.textContent = keyName(dispKey);
      dom.chordDisplay.textContent = chordSymbol(dispKey, dispChord);
      if (dispLastMeas) {
        showNextCol();
        dom.nextKeyDisplay.textContent = keyName(dispNextKey);
        dom.nextChordDisplay.textContent = dispNextFirstChord ? chordSymbol(dispNextKey, dispNextFirstChord) : '';
      } else {
        hideNextCol();
      }
      fitHarmonyDisplay();
      updateBeatDots(dispBeat, false);
    });

    // Advance beat
    currentBeat++;
    if (currentBeat >= 4) {
      currentBeat = 0;
    }

    // Advance chord index
    if (doubleTime) {
      if (currentBeat === 0 || currentBeat === 2) {
        currentChordIdx++;
      }
    } else {
      if (currentBeat === 0) {
        currentChordIdx++;
      }
    }

    // End of progression → prepare next
    if (currentChordIdx >= paddedChords.length) {
      prepareNextProgression();
    }

    nextBeatTime += spb;
  }
}

// Rough display sync: use setTimeout offset from audioCtx time
function scheduleDisplay(audioTime, fn) {
  const delay = (audioTime - audioCtx.currentTime) * 1000;
  if (delay <= 0) {
    if (isPlaying && !isPaused) fn();
    return;
  }
  const timeoutId = setTimeout(() => {
    pendingDisplayTimeouts.delete(timeoutId);
    if (isPlaying && !isPaused) {
      fn();
    }
  }, delay);
  pendingDisplayTimeouts.add(timeoutId);
}

// ---- Start / Stop ----

async function start() {
  initAudio();
  if (audioCtx.state === 'suspended') await audioCtx.resume();

  isPlaying = true;
  isPaused = false;
  dom.startStop.textContent = 'Stop';
  dom.startStop.classList.add('running');
  dom.pause.classList.remove('hidden', 'paused');
  dom.pause.textContent = 'Pause';

  // Reset state
  isIntro = true;
  currentBeat = 0;
  currentChordIdx = 0;
  keyPool = [];
  nextKeyValue = null;
  prepareNextProgression();
  await preloadStartupSamples();
  ensureBackgroundSamplePreload();

  // 300ms delay, then start scheduling
  nextBeatTime = audioCtx.currentTime + 0.3;
  schedulerTimer = setInterval(scheduleBeat, SCHEDULE_INTERVAL);
}

function stop() {
  isPlaying = false;
  isPaused = false;
  dom.startStop.textContent = 'Start';
  dom.startStop.classList.remove('running');
  dom.pause.classList.add('hidden');
  dom.pause.classList.remove('paused');
  if (schedulerTimer) {
    clearInterval(schedulerTimer);
    schedulerTimer = null;
  }
  clearScheduledDisplays();
  stopScheduledAudio();
  // Fade out any active bass note
  if (activeNoteGain) {
    activeNoteGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + NOTE_FADEOUT);
    activeNoteGain = null;
  }
  stopActiveChordVoices(audioCtx.currentTime, NOTE_FADEOUT);
  dom.keyDisplay.textContent = '';
  dom.chordDisplay.textContent = '';
  hideNextCol();
  fitHarmonyDisplay();
  clearBeatDots();
}

// ---- UI Wiring ----

dom.startStop.addEventListener('click', () => {
  if (isPlaying) stop(); else start();
});

dom.pause.addEventListener('click', () => {
  if (!isPlaying) return;
  if (isPaused) {
    // Resume
    isPaused = false;
    dom.pause.textContent = 'Pause';
    dom.pause.classList.remove('paused');
    audioCtx.resume();
    // Re-anchor timing so scheduler picks up from now
    nextBeatTime = audioCtx.currentTime + 0.05;
    schedulerTimer = setInterval(scheduleBeat, SCHEDULE_INTERVAL);
  } else {
    // Pause
    isPaused = true;
    dom.pause.textContent = 'Resume';
    dom.pause.classList.add('paused');
    if (schedulerTimer) {
      clearInterval(schedulerTimer);
      schedulerTimer = null;
    }
    clearScheduledDisplays();
    stopScheduledAudio();
    activeNoteGain = null;
    activeChordVoices.clear();
    audioCtx.suspend();
  }
});

dom.tempoSlider.addEventListener('input', () => {
  dom.tempoValue.textContent = dom.tempoSlider.value;
});

dom.patternSelect.addEventListener('change', () => {
  if (!isCustomPatternSelected()) {
    clearPresetEditingState();
  }
  if (isCustomPatternSelected() && !isEditingPreset()) {
    rememberStandaloneCustomDraft();
  }
  syncCustomPatternUI();
  syncPresetManagerState();
  setPresetFeedback('');
  validateCustomPattern();
  applyPatternModeAvailability();
});

dom.customPattern.addEventListener('input', () => {
  rememberStandaloneCustomDraft();
  syncPatternSelectionFromInput();
  syncPresetManagerState();
  setPresetFeedback('');
  validateCustomPattern();
});

dom.customPattern.addEventListener('change', () => {
  dom.customPattern.value = normalizePatternString(dom.customPattern.value);
  rememberStandaloneCustomDraft();
  syncPatternSelectionFromInput();
  syncPresetManagerState();
  validateCustomPattern();
});

dom.patternMode.addEventListener('change', () => {
  dom.patternMode.value = normalizePatternMode(dom.patternMode.value);
  rememberStandaloneCustomDraft();
  syncPatternSelectionFromInput();
  syncPresetManagerState();
  setPresetFeedback('');
  applyPatternModeAvailability();
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
      keyPool = []; // reset pool
      saveSettings();
    });
    const span = document.createElement('span');
    span.textContent = keyLabelForPicker(i);
    label.appendChild(cb);
    label.appendChild(span);
    dom.keyCheckboxes.appendChild(label);
  }
}

function keyLabelForPicker(majorIndex) {
  if (dom.majorMinor.checked) {
    // Show relative minor name
    const minorIndex = (majorIndex - 3 + 12) % 12;
    return KEY_NAMES_MINOR[transposeDisplayPitchClass(minorIndex)] + 'm';
  }
  return KEY_NAMES_MAJOR[transposeDisplayPitchClass(majorIndex)];
}

function updateKeyPickerLabels() {
  const labels = dom.keyCheckboxes.querySelectorAll('.key-checkbox-label');
  labels.forEach((label, i) => {
    label.querySelector('span').textContent = keyLabelForPicker(i);
  });
}

function refreshDisplayedHarmony() {
  if (!isPlaying) return;

  if (isIntro) {
    dom.keyDisplay.textContent = '';
    dom.chordDisplay.textContent = '';
    const firstChord = paddedChords[0];
    showNextCol();
    dom.nextKeyDisplay.textContent = keyName(currentKey);
    dom.nextChordDisplay.textContent = firstChord ? chordSymbol(currentKey, firstChord) : '';
    fitHarmonyDisplay();
    return;
  }

  const chord = paddedChords[currentChordIdx] || paddedChords[paddedChords.length - 1];
  if (!chord) return;

  dom.keyDisplay.textContent = keyName(currentKey);
  dom.chordDisplay.textContent = chordSymbol(currentKey, chord);

  const doubleTime = dom.doubleTime.checked;
  const chordsPerMeasure = doubleTime ? 2 : 1;
  const totalMeasures = paddedChords.length / chordsPerMeasure;
  const currentMeasure = Math.floor(currentChordIdx / chordsPerMeasure);
  const onLastMeasure = currentMeasure === totalMeasures - 1;

  if (onLastMeasure) {
    showNextCol();
    const nextFirstChord = buildProgression()[0] || null;
    dom.nextKeyDisplay.textContent = keyName(nextKeyValue);
    dom.nextChordDisplay.textContent = nextFirstChord ? chordSymbol(nextKeyValue, nextFirstChord) : '';
  } else {
    hideNextCol();
  }
  fitHarmonyDisplay();
}

dom.majorMinor.addEventListener('change', () => {
  updateKeyPickerLabels();
  keyPool = [];
  refreshDisplayedHarmony();
});

dom.transpositionSelect.addEventListener('change', () => {
  updateKeyPickerLabels();
  refreshDisplayedHarmony();
  saveSettings();
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

function setPresetFeedback(message, isError = false, action = null) {
  if (!dom.presetFeedback) return;
  dom.presetFeedback.textContent = '';
  if (message) {
    const text = document.createElement('span');
    text.textContent = message;
    dom.presetFeedback.appendChild(text);
  }
  if (action?.label && typeof action.onClick === 'function') {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'preset-feedback-action';
    button.textContent = action.label;
    button.addEventListener('click', action.onClick, { once: true });
    dom.presetFeedback.appendChild(button);
  }
  dom.presetFeedback.classList.toggle('error-text', Boolean(isError && message));
}

function syncPresetManagerState() {
  const customSelected = isCustomPatternSelected();
  if (dom.savePreset) {
    dom.savePreset.classList.toggle('hidden', !customSelected);
    dom.savePreset.textContent = isEditingPreset() ? 'Overwrite preset' : 'Save preset';
  }
  if (dom.cancelPresetEdit) {
    dom.cancelPresetEdit.classList.toggle('hidden', !isEditingPreset());
  }
  if (dom.newPreset) {
    dom.newPreset.classList.toggle('hidden', customSelected);
  }
  if (dom.editPreset) {
    dom.editPreset.disabled = !hasSelectedPreset();
    dom.editPreset.classList.toggle('hidden', customSelected);
  }
  if (dom.deletePreset) {
    dom.deletePreset.disabled = !hasSelectedPreset();
    dom.deletePreset.classList.toggle('hidden', customSelected);
  }
  if (dom.managePresets) {
    dom.managePresets.classList.toggle('hidden', customSelected);
  }
  if (dom.restoreDefaultPresets) {
    dom.restoreDefaultPresets.classList.toggle('hidden', false);
  }
  if (dom.clearAllPresets) {
    dom.clearAllPresets.classList.toggle('hidden', false);
  }
  syncPresetManagerPanel();
}

function renderPresetOptions(selectedValue = dom.patternSelect.value) {
  if (!dom.patternSelect) return;

  dom.patternSelect.innerHTML = '';

  const customOption = document.createElement('option');
  customOption.value = CUSTOM_PATTERN_OPTION_VALUE;
  customOption.textContent = 'Custom...';
  dom.patternSelect.appendChild(customOption);

  for (const name of Object.keys(presets)) {
    const opt = document.createElement('option');
    opt.value = name;
    opt.textContent = `${name} (${getPatternModeLabel(presets[name].mode)})`;
    opt.dataset.patternMode = presets[name].mode;
    dom.patternSelect.appendChild(opt);
  }

  if (Object.prototype.hasOwnProperty.call(presets, selectedValue)) {
    dom.patternSelect.value = selectedValue;
  } else if (selectedValue === CUSTOM_PATTERN_OPTION_VALUE) {
    dom.patternSelect.value = CUSTOM_PATTERN_OPTION_VALUE;
  } else {
    dom.patternSelect.value = CUSTOM_PATTERN_OPTION_VALUE;
  }
  syncCustomPatternUI();
  syncPresetManagerState();
}

function saveCurrentPreset() {
  const pattern = normalizePatternString(dom.customPattern.value);
  const mode = getCurrentPatternMode();
  const presetNameToReplace = editingPresetName;

  if (!pattern) {
    setPresetFeedback('Enter a pattern before saving.', true);
    return;
  }
  if (!validateCustomPattern()) {
    setPresetFeedback('Fix the pattern syntax before saving.', true);
    return;
  }

  if (presetNameToReplace && presetNameToReplace !== pattern) {
    delete presets[presetNameToReplace];
  }
  presets[pattern] = createPresetEntry(pattern, mode);
  renderPresetOptions(pattern);
  dom.customPattern.value = pattern;
  dom.patternMode.value = mode;
  clearPresetEditingState();
  syncPatternSelectionFromInput();
  syncPresetManagerState();
  applyPatternModeAvailability();
  setPresetFeedback(presetNameToReplace ? `Preset updated: ${pattern}` : 'Preset saved.');
  saveSettings();
}

function editSelectedPreset() {
  if (!hasSelectedPreset()) {
    setPresetFeedback('Select a preset to edit it.', true);
    return;
  }

  const selectedName = dom.patternSelect.value;
  const selectedEntry = getPresetEntry();
  if (!selectedEntry) {
    setPresetFeedback('Select a preset to edit it.', true);
    return;
  }

  editingPresetName = selectedName;
  editingPresetSnapshot = {
    name: selectedName,
    pattern: selectedEntry.pattern,
    mode: selectedEntry.mode
  };
  dom.customPattern.value = selectedEntry.pattern;
  dom.patternMode.value = selectedEntry.mode;
  dom.patternSelect.value = CUSTOM_PATTERN_OPTION_VALUE;
  syncCustomPatternUI();
  syncPresetManagerState();
  validateCustomPattern();
  applyPatternModeAvailability();
  setPresetFeedback(`Editing preset: ${selectedName}`);
}

function cancelPresetEdit() {
  if (!isEditingPreset() || !editingPresetSnapshot) {
    clearPresetEditingState();
    syncPresetManagerState();
    return;
  }

  const { name, pattern, mode } = editingPresetSnapshot;
  clearPresetEditingState();
  dom.patternSelect.value = name;
  dom.customPattern.value = pattern;
  dom.patternMode.value = mode;
  syncCustomPatternUI();
  syncPresetManagerState();
  validateCustomPattern();
  applyPatternModeAvailability();
  setPresetFeedback('');
}

function startNewPreset() {
  clearPresetEditingState();
  dom.patternSelect.value = CUSTOM_PATTERN_OPTION_VALUE;
  dom.customPattern.value = lastStandaloneCustomPattern || '';
  dom.patternMode.value = normalizePatternMode(lastStandaloneCustomMode);
  syncCustomPatternUI();
  syncPresetManagerState();
  validateCustomPattern();
  applyPatternModeAvailability();
  setPresetFeedback(dom.customPattern.value ? 'New preset from your last custom pattern.' : 'New preset.');
  dom.customPattern.focus();
}

function deleteSelectedPreset() {
  if (!hasSelectedPreset()) {
    setPresetFeedback('Select a preset to delete it.', true);
    return;
  }
  deletePresetByName(dom.patternSelect.value, {
    offerUndo: true
  });
}

function restoreDefaultPresets() {
  if (!window.confirm('Restore the default presets? Existing presets will be kept.')) {
    return;
  }
  const wasManagingPresets = isManagingPresets;
  const currentSelection = dom.patternSelect.value;
  let restoredCount = 0;

  for (const [name, entry] of Object.entries(DEFAULT_PRESETS)) {
    if (Object.prototype.hasOwnProperty.call(presets, name)) continue;
    presets[name] = normalizePresetEntry(name, entry);
    restoredCount++;
  }

  const nextSelection = Object.prototype.hasOwnProperty.call(presets, currentSelection)
    ? currentSelection
    : Object.keys(DEFAULT_PRESETS).find(name => Object.prototype.hasOwnProperty.call(presets, name))
      || Object.keys(presets)[0]
      || '';

  renderPresetOptions(nextSelection);
  if (Object.prototype.hasOwnProperty.call(presets, nextSelection)) {
    dom.patternSelect.value = nextSelection;
    dom.customPattern.value = getSelectedPresetPattern();
    dom.patternMode.value = getSelectedPresetMode();
    syncCustomPatternUI();
  } else {
    syncPatternSelectionFromInput();
  }
  isManagingPresets = wasManagingPresets;
  syncPresetManagerState();
  syncPresetManagerPanel();
  validateCustomPattern();
  applyPatternModeAvailability();

  if (restoredCount === 0) {
    setPresetFeedback('Default presets are already present.');
  } else {
    setPresetFeedback(`Restored ${restoredCount} default preset${restoredCount > 1 ? 's' : ''}.`);
    saveSettings();
  }
}

function clearAllPresets() {
  if (!window.confirm('Clear all presets? This cannot be undone.')) {
    return;
  }
  const wasManagingPresets = isManagingPresets;
  presets = {};
  clearPresetEditingState();
  renderPresetOptions('');
  syncPatternSelectionFromInput();
  isManagingPresets = wasManagingPresets;
  syncPresetManagerState();
  validateCustomPattern();
  applyPatternModeAvailability();
  setPresetFeedback('All presets cleared.');
  saveSettings();
}

function togglePresetManager() {
  isManagingPresets = !isManagingPresets;
  syncPresetManagerState();
}

// ---- Persistence (localStorage) ----

const STORAGE_KEY = 'jazzTrainerSettings';
const APP_BASE_URL = (import.meta?.env?.BASE_URL) || './';
const PATTERN_HELP_URL = `${APP_BASE_URL}pattern-suffixes.txt`;
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

function saveSettings() {
  const settings = {
    presets,
    patternSelect: dom.patternSelect.value,
    customPattern: normalizePatternString(dom.customPattern.value),
    patternMode: getCurrentPatternMode(),
    tempo: dom.tempoSlider.value,
    transposition: dom.transpositionSelect.value,
    doubleTime: dom.doubleTime.checked,
    majorMinor: dom.majorMinor.checked,
    displayMode: normalizeDisplayMode(dom.displayMode?.value),
    chordMode: dom.chordMode.checked,
    drumsMode: getDrumsMode(),
    bassVolume: dom.bassVolume?.value,
    stringsVolume: dom.stringsVolume?.value,
    drumsVolume: dom.drumsVolume?.value,
    enabledKeys: enabledKeys
  };
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); } catch(e) {}
}

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const s = JSON.parse(raw);
      savedPatternSelection = typeof s.patternSelect === 'string' ? s.patternSelect : null;
      if (s.presets && typeof s.presets === 'object' && !Array.isArray(s.presets)) {
        presets = normalizePresetsMap(s.presets);
      }
      renderPresetOptions(s.patternSelect);
      if (s.patternSelect !== undefined) dom.patternSelect.value = s.patternSelect;
      if (s.customPattern !== undefined) dom.customPattern.value = normalizePatternString(s.customPattern);
      if (s.patternMode !== undefined && dom.patternMode) {
        dom.patternMode.value = normalizePatternMode(s.patternMode);
      }
      if (s.tempo !== undefined) {
        dom.tempoSlider.value = s.tempo;
        dom.tempoValue.textContent = s.tempo;
      }
      if (s.transposition !== undefined && dom.transpositionSelect) {
        dom.transpositionSelect.value = String(s.transposition);
      }
      if (s.doubleTime !== undefined) dom.doubleTime.checked = s.doubleTime;
      if (s.majorMinor !== undefined) {
        dom.majorMinor.checked = s.majorMinor;
      }
      if (s.displayMode !== undefined && dom.displayMode) {
        dom.displayMode.value = normalizeDisplayMode(s.displayMode);
      } else if (s.hideChords !== undefined && dom.displayMode) {
        dom.displayMode.value = s.hideChords ? DISPLAY_MODE_KEY_ONLY : DISPLAY_MODE_SHOW_BOTH;
      }
      if (s.chordMode !== undefined) dom.chordMode.checked = s.chordMode;
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
    }
  } catch(e) {}

  applyMixerSettings();
  lastStandaloneCustomPattern = normalizePatternString(dom.customPattern.value);
  lastStandaloneCustomMode = normalizePatternMode(dom.patternMode?.value);
  syncPresetManagerState();
  applyPatternModeAvailability();
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
      <summary class="pattern-help-title">Pattern syntax</summary>
      <div class="pattern-help-body">
        <p>Use degrees <code>I II III IV V VI VII</code> with an optional <code>b</code> or <code>#</code> prefix, or use note roots such as <code>C D Eb F#</code>. Separate chords with spaces or dashes.</p>
        <p>Note roots are interpreted relative to <code>C</code> by default. Override that reference with <code>key=Eb:</code>, for example <code>key=Eb: Fm7 Bb7 Ebmaj7</code>.</p>
        <p>Available suffixes:</p>
        <ul>${items}</ul>
        <p><code>%</code> repeats the previous chord, and note and degree tokens can be mixed in the same pattern.</p>
      </div>
    `;
  } catch (err) {
    console.warn('Pattern help load failed:', err);
  }
}

async function loadDefaultPresets() {
  try {
    const versionedUrl = `${DEFAULT_PRESETS_URL}?v=${encodeURIComponent(APP_VERSION)}`;
    let response = await fetch(versionedUrl);
    if (!response.ok) {
      response = await fetch(DEFAULT_PRESETS_URL);
    }
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const payload = await response.json();
    DEFAULT_PRESETS = normalizeDefaultPresetsSource(payload);
  } catch (err) {
    DEFAULT_PRESETS = {};
    console.warn('Default presets load failed:', err);
  }
  presets = normalizePresetsMap(DEFAULT_PRESETS);
}

async function initializeApp() {
  await Promise.all([
    loadDefaultPresets(),
    loadPatternHelp()
  ]);

  renderPresetOptions(Object.keys(presets)[0] || '');
  loadSettings();
  buildKeyCheckboxes();
  updateKeyPickerLabels();
  applyDisplayMode();
  if (!dom.customPattern.value) {
    dom.customPattern.value = getSelectedPresetPattern();
  }
  if (hasSelectedPreset()) {
    dom.patternMode.value = getSelectedPresetMode();
  } else {
    dom.patternMode.value = normalizePatternMode(dom.patternMode.value);
  }
  if (savedPatternSelection === CUSTOM_PATTERN_OPTION_VALUE) {
    dom.patternSelect.value = CUSTOM_PATTERN_OPTION_VALUE;
  } else if (savedPatternSelection && Object.prototype.hasOwnProperty.call(presets, savedPatternSelection)) {
    dom.patternSelect.value = savedPatternSelection;
  } else {
    syncPatternSelectionFromInput();
  }
  syncPresetManagerState();
  syncCustomPatternUI();
  applyPatternModeAvailability();
}

initializeApp();

// Save on every change
dom.tempoSlider.addEventListener('change', saveSettings);
dom.patternSelect.addEventListener('change', saveSettings);
dom.customPattern.addEventListener('change', saveSettings);
dom.patternMode.addEventListener('change', saveSettings);
dom.doubleTime.addEventListener('change', saveSettings);
dom.majorMinor.addEventListener('change', saveSettings);
dom.chordMode.addEventListener('change', () => {
  saveSettings();
  if (!dom.chordMode.checked && isPlaying && audioCtx) {
    stopActiveChordVoices(audioCtx.currentTime, NOTE_FADEOUT);
  }
});
dom.drumsSelect.addEventListener('change', saveSettings);
dom.displayMode.addEventListener('change', () => { applyDisplayMode(); saveSettings(); });
dom.bassVolume.addEventListener('input', applyMixerSettings);
dom.stringsVolume.addEventListener('input', applyMixerSettings);
dom.drumsVolume.addEventListener('input', applyMixerSettings);
dom.bassVolume.addEventListener('change', saveSettings);
dom.stringsVolume.addEventListener('change', saveSettings);
dom.drumsVolume.addEventListener('change', saveSettings);
dom.savePreset?.addEventListener('click', saveCurrentPreset);
dom.cancelPresetEdit?.addEventListener('click', cancelPresetEdit);
dom.newPreset?.addEventListener('click', startNewPreset);
dom.editPreset?.addEventListener('click', editSelectedPreset);
dom.deletePreset?.addEventListener('click', deleteSelectedPreset);
dom.managePresets?.addEventListener('click', togglePresetManager);
dom.closePresetManager?.addEventListener('click', () => {
  closePresetManager();
  syncPresetManagerState();
});
dom.restoreDefaultPresets?.addEventListener('click', restoreDefaultPresets);
dom.clearAllPresets?.addEventListener('click', clearAllPresets);

function applyDisplayMode() {
  const display = document.getElementById('display');
  const mode = normalizeDisplayMode(dom.displayMode?.value);
  display.classList.remove('display-show-both', 'display-chords-only', 'display-key-only');
  if (mode === DISPLAY_MODE_CHORDS_ONLY) {
    display.classList.add('display-chords-only');
    fitHarmonyDisplay();
    return;
  }
  if (mode === DISPLAY_MODE_KEY_ONLY) {
    display.classList.add('display-key-only');
    fitHarmonyDisplay();
    return;
  }
  display.classList.add('display-show-both');
  fitHarmonyDisplay();
}

window.addEventListener('resize', fitHarmonyDisplay);
import './voicing-config.js';
