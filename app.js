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

const DEFAULT_PRESETS = {
  'II V I': { pattern: 'II V I', mode: 'both' },
  'I VI7 II V I': { pattern: 'I VI7 II V I', mode: 'major' },
  'I VI II V I': { pattern: 'I VI II V I', mode: 'minor' },
  'I bIIIdim7 II V I': { pattern: 'I bIIIdim7 II V I', mode: 'major' },
  'V7sus % Ilyd': { pattern: 'V7sus % Ilyd', mode: 'major' }
};
const PATTERN_MODE_BOTH = 'both';
const PATTERN_MODE_MAJOR = 'major';
const PATTERN_MODE_MINOR = 'minor';

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
  keyDisplay:      document.getElementById('key-display'),
  chordDisplay:    document.getElementById('chord-display'),
  nextHeader:      document.getElementById('next-header'),
  nextKeyDisplay:  document.getElementById('next-key-display'),
  nextChordDisplay:document.getElementById('next-chord-display'),
  chordMode:       document.getElementById('chord-mode'),
  drumsSelect:     document.getElementById('drums-select'),
  patternHelp:     document.getElementById('pattern-help'),
  patternSelect:   document.getElementById('pattern-select'),
  customPatternPanel: document.getElementById('custom-pattern-panel'),
  customPattern:   document.getElementById('custom-pattern'),
  patternMode:     document.getElementById('pattern-mode'),
  patternError:    document.getElementById('pattern-error'),
  savePreset:      document.getElementById('save-preset'),
  deletePreset:    document.getElementById('delete-preset'),
  restoreDefaultPresets: document.getElementById('restore-default-presets'),
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

let presets = { ...DEFAULT_PRESETS };

function normalizePatternMode(mode) {
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

function normalizePresetsMap(source) {
  const normalizedEntries = Object.entries(source || {})
    .map(([name, entry]) => normalizePresetEntry(name, entry))
    .filter(entry => entry.pattern);

  if (normalizedEntries.length === 0) {
    return Object.fromEntries(
      Object.entries(DEFAULT_PRESETS).map(([name, entry]) => [name, normalizePresetEntry(name, entry)])
    );
  }

  return Object.fromEntries(normalizedEntries.map(entry => [entry.pattern, entry]));
}

presets = normalizePresetsMap(presets);

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

function loadSample(category, folder, midi) {
  const baseUrl = `assets/MP3/${folder}/${midi}.mp3`;
  return loadBufferFromUrl(baseUrl)
    .then(decoded => { sampleBuffers[category][midi] = decoded; })
    .catch(err => { console.warn('Sample load failed:', err); });
}

function loadFileSample(category, key, baseUrl) {
  return loadBufferFromUrl(baseUrl)
    .then(decoded => { sampleBuffers[category][key] = decoded; })
    .catch(err => { console.warn('Sample load failed:', err); });
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
      volume: 9.0 * CHORD_VOLUME_MULTIPLIER,
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

function compareVoicingPathScores(left, right) {
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

function buildVoicingPlan(chords, key, isMinor) {
  if (!Array.isArray(chords) || chords.length === 0) return [];

  const candidatesByIndex = chords.map((chord, chordIdx) => {
    if (!chord) return [null];
    const quality = isMinor ? chord.qualityMinor : chord.qualityMajor;
    const cat = classifyQuality(quality);
    if (!cat) return [null];

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

    const candidates = enumerateChordVoicingCandidates(rootPitchClass, cat, colorIntervals, guideIntervals);
    return candidates.length > 0 ? candidates : [null];
  });

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
        if (!bestScore || compareVoicingPathScores(candidateScore, bestScore) < 0) {
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
    if (compareVoicingPathScores(previousScores[i], previousScores[bestFinalIndex]) < 0) {
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
}
function hideNextCol() {
  dom.nextHeader.classList.add('hidden');
  dom.nextKeyDisplay.classList.add('hidden');
  dom.nextChordDisplay.classList.add('hidden');
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

function getSecondsPerBeat() {
  return 60 / Number(dom.tempoSlider.value);
}

function getPresetEntry(name = dom.patternSelect.value) {
  return Object.prototype.hasOwnProperty.call(presets, name) ? presets[name] : null;
}

function hasSelectedPreset() {
  return Boolean(getPresetEntry());
}

function getSelectedPresetPattern() {
  return getPresetEntry()?.pattern || '';
}

function getSelectedPresetMode() {
  return getPresetEntry()?.mode || PATTERN_MODE_BOTH;
}

function getCurrentPatternMode() {
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
  return normalizePatternString(dom.customPattern.value) || getSelectedPresetPattern();
}

function syncPatternSelectionFromInput() {
  const pattern = normalizePatternString(dom.customPattern.value);
  const mode = getCurrentPatternMode();
  const matchingPreset = Object.keys(presets).find(name => {
    const entry = presets[name];
    return entry.pattern === pattern && entry.mode === mode;
  }) || '';
  if (matchingPreset) {
    dom.patternSelect.value = matchingPreset;
  } else {
    dom.patternSelect.selectedIndex = -1;
  }
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
  currentVoicingPlan = buildVoicingPlan(paddedChords, currentKey, isMinor);

  nextKeyValue = nextKey();
  nextPaddedChords = padProgression(raw, dom.doubleTime.checked);
  nextVoicingPlan = buildVoicingPlan(nextPaddedChords, nextKeyValue, isMinor);

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
  if (delay <= 0) { fn(); return; }
  setTimeout(fn, delay);
}

// ---- Start / Stop ----

async function start() {
  initAudio();
  if (audioCtx.state === 'suspended') await audioCtx.resume();
  if (Object.keys(sampleBuffers.bass).length === 0) await preloadSamples();

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
  // Fade out any active bass note
  if (activeNoteGain) {
    activeNoteGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + NOTE_FADEOUT);
    activeNoteGain = null;
  }
  // Fade out any active chord voices
  for (const voice of activeChordVoices.values()) {
    voice.gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + NOTE_FADEOUT);
  }
  activeChordVoices.clear();
  dom.keyDisplay.textContent = '';
  dom.chordDisplay.textContent = '';
  hideNextCol();
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
    audioCtx.suspend();
  }
});

dom.tempoSlider.addEventListener('input', () => {
  dom.tempoValue.textContent = dom.tempoSlider.value;
});

dom.patternSelect.addEventListener('change', () => {
  dom.customPattern.value = getSelectedPresetPattern();
  dom.patternMode.value = getSelectedPresetMode();
  syncPresetManagerState();
  setPresetFeedback('');
  validateCustomPattern();
  applyPatternModeAvailability();
});

dom.customPattern.addEventListener('input', () => {
  syncPatternSelectionFromInput();
  syncPresetManagerState();
  setPresetFeedback('');
  validateCustomPattern();
});

dom.customPattern.addEventListener('change', () => {
  dom.customPattern.value = normalizePatternString(dom.customPattern.value);
  syncPatternSelectionFromInput();
  syncPresetManagerState();
  validateCustomPattern();
});

dom.patternMode.addEventListener('change', () => {
  dom.patternMode.value = normalizePatternMode(dom.patternMode.value);
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

function setPresetFeedback(message, isError = false) {
  if (!dom.presetFeedback) return;
  dom.presetFeedback.textContent = message || '';
  dom.presetFeedback.classList.toggle('error-text', Boolean(isError && message));
}

function syncPresetManagerState() {
  if (dom.deletePreset) {
    dom.deletePreset.disabled = !hasSelectedPreset();
  }
}

function renderPresetOptions(selectedValue = dom.patternSelect.value) {
  if (!dom.patternSelect) return;

  dom.patternSelect.innerHTML = '';

  for (const name of Object.keys(presets)) {
    const opt = document.createElement('option');
    opt.value = name;
    opt.textContent = `${name} (${getPatternModeLabel(presets[name].mode)})`;
    opt.dataset.patternMode = presets[name].mode;
    dom.patternSelect.appendChild(opt);
  }

  if (Object.prototype.hasOwnProperty.call(presets, selectedValue)) {
    dom.patternSelect.value = selectedValue;
  } else {
    dom.patternSelect.selectedIndex = -1;
  }
  syncPresetManagerState();
}

function saveCurrentPreset() {
  const pattern = normalizePatternString(dom.customPattern.value);
  const mode = getCurrentPatternMode();

  if (!pattern) {
    setPresetFeedback('Enter a pattern before saving.', true);
    return;
  }
  if (!validateCustomPattern()) {
    setPresetFeedback('Fix the pattern syntax before saving.', true);
    return;
  }

  presets[pattern] = createPresetEntry(pattern, mode);
  renderPresetOptions(pattern);
  dom.customPattern.value = pattern;
  dom.patternMode.value = mode;
  syncPatternSelectionFromInput();
  syncPresetManagerState();
  applyPatternModeAvailability();
  setPresetFeedback('Preset saved.');
  saveSettings();
}

function deleteSelectedPreset() {
  if (!hasSelectedPreset()) {
    setPresetFeedback('Select a preset to delete it.', true);
    return;
  }

  const selectedName = dom.patternSelect.value;
  delete presets[selectedName];
  renderPresetOptions('');
  syncPatternSelectionFromInput();
  syncPresetManagerState();
  validateCustomPattern();
  applyPatternModeAvailability();
  setPresetFeedback(`Preset deleted: ${selectedName}`);
  saveSettings();
}

function restoreDefaultPresets() {
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
  syncPatternSelectionFromInput();
  syncPresetManagerState();
  validateCustomPattern();
  applyPatternModeAvailability();

  if (restoredCount === 0) {
    setPresetFeedback('Default presets are already present.');
  } else {
    setPresetFeedback(`Restored ${restoredCount} default preset${restoredCount > 1 ? 's' : ''}.`);
    saveSettings();
  }
}

// ---- Persistence (localStorage) ----

const STORAGE_KEY = 'jazzTrainerSettings';
const PATTERN_HELP_URL = 'pattern-suffixes.txt';
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
      <div class="pattern-help-title">Pattern syntax</div>
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

// Load saved settings, then fill custom pattern if still default
loadPatternHelp();
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
syncPatternSelectionFromInput();
syncPresetManagerState();
applyPatternModeAvailability();

// Save on every change
dom.tempoSlider.addEventListener('change', saveSettings);
dom.patternSelect.addEventListener('change', saveSettings);
dom.customPattern.addEventListener('change', saveSettings);
dom.patternMode.addEventListener('change', saveSettings);
dom.doubleTime.addEventListener('change', saveSettings);
dom.majorMinor.addEventListener('change', saveSettings);
dom.chordMode.addEventListener('change', saveSettings);
dom.drumsSelect.addEventListener('change', saveSettings);
dom.displayMode.addEventListener('change', () => { applyDisplayMode(); saveSettings(); });
dom.bassVolume.addEventListener('input', applyMixerSettings);
dom.stringsVolume.addEventListener('input', applyMixerSettings);
dom.drumsVolume.addEventListener('input', applyMixerSettings);
dom.bassVolume.addEventListener('change', saveSettings);
dom.stringsVolume.addEventListener('change', saveSettings);
dom.drumsVolume.addEventListener('change', saveSettings);
dom.savePreset?.addEventListener('click', saveCurrentPreset);
dom.deletePreset?.addEventListener('click', deleteSelectedPreset);
dom.restoreDefaultPresets?.addEventListener('click', restoreDefaultPresets);

function applyDisplayMode() {
  const display = document.getElementById('display');
  const mode = normalizeDisplayMode(dom.displayMode?.value);
  display.classList.remove('display-show-both', 'display-chords-only', 'display-key-only');
  if (mode === DISPLAY_MODE_CHORDS_ONLY) {
    display.classList.add('display-chords-only');
    return;
  }
  if (mode === DISPLAY_MODE_KEY_ONLY) {
    display.classList.add('display-key-only');
    return;
  }
  display.classList.add('display-show-both');
}
import './voicing-config.js';
