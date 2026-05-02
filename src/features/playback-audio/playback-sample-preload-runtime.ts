
import type { PlaybackSamplePolicy } from './playback-audio-types.js';

type PlaybackProgressionSnapshot = {
  chords?: PlaybackChordSnapshot[];
  key?: number | null;
  voicingPlan?: PracticeArrangementVoicingSnapshot[];
  bassPlan?: PlaybackBassEventSnapshot[];
};

type PlaybackChordSnapshot = {
  bassSemitones?: number;
  semitones?: number;
};

type PlaybackBassEventSnapshot = {
  timeBeats?: number;
  midi?: number;
};

type PracticeArrangementVoicingSnapshot = unknown;
type PlaybackSampleLoadResult = unknown;

type PlaybackSampleNoteSets = {
  bassNotes: Set<number>;
  celloNotes: Set<number>;
  violinNotes: Set<number>;
  pianoNotes: Set<number>;
};

type CollectRequiredPlaybackSampleNotesOptions = {
  includeCurrent?: boolean;
  includeNext?: boolean;
  currentChordLimit?: number | null;
  nextChordLimit?: number | null;
};

type PlaybackSamplePreloadRuntimeOptions = {
  getBassPreloadRange?: () => { low: number; high: number };
  getBassMidi?: (key: number, semitoneOffset: number) => number;
  getBeatsPerChord?: () => number;
  getChordsPerBar?: () => number;
  getCompingStyle?: () => string;
  getDrumsMode?: () => string;
  getCurrentProgression?: () => PlaybackProgressionSnapshot;
  getNextProgression?: () => PlaybackProgressionSnapshot;
  collectCompingSampleNotes?: (
    style: string,
    voicing: PracticeArrangementVoicingSnapshot,
    noteSets: Omit<PlaybackSampleNoteSets, 'bassNotes'>
  ) => void;
  loadSample?: (category: string, folder: string, midi: number) => Promise<PlaybackSampleLoadResult>;
  loadPianoSampleList?: (midiValues: Iterable<number>) => Promise<PlaybackSampleLoadResult>;
  loadFileSample?: (category: string, key: string, baseUrl: string) => Promise<PlaybackSampleLoadResult>;
  purgeSampleCategory?: (category: string) => void;
  fetchArrayBufferFromUrl?: (baseUrl: string) => Promise<PlaybackSampleLoadResult>;
  pianoSampleRange?: { low: number; high: number };
  celloSampleRange?: { low: number; high: number };
  violinSampleRange?: { low: number; high: number };
  compingStyleOff?: string;
  compingStyleStrings?: string;
  compingStylePiano?: string;
  drumHihatSampleUrl?: string;
  drumRideSampleUrls?: string[];
  drumModeHihats24?: string;
  drumModeFullSwing?: string;
  safePreloadMeasures?: number;
  samplePolicy?: PlaybackSamplePolicy;
};

/**
 * @param {Iterable<number>} midiValues
 * @returns {number[]}
 */
function sortMidiValues(midiValues: Iterable<number>) {
  return [...midiValues].sort((left, right) => left - right);
}

/**
 * @param {number | null | undefined} value
 * @returns {number | null}
 */
function normalizeOptionalLimit(value: number | null | undefined) {
  return Number.isInteger(value) && value >= 0 ? value : null;
}

/**
 * @param {number[]} values
 * @param {(value: number) => void} register
 */
function registerSortedMidiValues(values: number[], register: (value: number) => void) {
  for (const midi of values) {
    register(midi);
  }
}

/**
 * @param {object} [options]
 * @param {() => { low: number, high: number }} [options.getBassPreloadRange]
 * @param {(key: number, semitoneOffset: number) => number} [options.getBassMidi]
 * @param {() => number} [options.getBeatsPerChord]
 * @param {() => number} [options.getChordsPerBar]
 * @param {() => string} [options.getCompingStyle]
 * @param {() => string} [options.getDrumsMode]
 * @param {() => { chords?: PlaybackChordSnapshot[], key?: number | null, voicingPlan?: PracticeArrangementVoicingSnapshot[], bassPlan?: PlaybackBassEventSnapshot[] }} [options.getCurrentProgression]
 * @param {() => { chords?: PlaybackChordSnapshot[], key?: number | null, voicingPlan?: PracticeArrangementVoicingSnapshot[], bassPlan?: PlaybackBassEventSnapshot[] }} [options.getNextProgression]
 * @param {(style: string, voicing: PracticeArrangementVoicingSnapshot, noteSets: { celloNotes: Set<number>, violinNotes: Set<number>, pianoNotes: Set<number> }) => void} [options.collectCompingSampleNotes]
 * @param {(category: string, folder: string, midi: number) => Promise<PlaybackSampleLoadResult>} [options.loadSample]
 * @param {(midiValues: Iterable<number>) => Promise<PlaybackSampleLoadResult>} [options.loadPianoSampleList]
 * @param {(category: string, key: string, baseUrl: string) => Promise<PlaybackSampleLoadResult>} [options.loadFileSample]
 * @param {(category: string) => void} [options.purgeSampleCategory]
 * @param {(baseUrl: string) => Promise<PlaybackSampleLoadResult>} [options.fetchArrayBufferFromUrl]
 * @param {{ low: number, high: number }} [options.pianoSampleRange]
 * @param {{ low: number, high: number }} [options.celloSampleRange]
 * @param {{ low: number, high: number }} [options.violinSampleRange]
 * @param {string} [options.compingStyleOff]
 * @param {string} [options.compingStyleStrings]
 * @param {string} [options.compingStylePiano]
 * @param {string} [options.drumHihatSampleUrl]
 * @param {string[]} [options.drumRideSampleUrls]
 * @param {string} [options.drumModeHihats24]
 * @param {string} [options.drumModeFullSwing]
 * @param {number} [options.safePreloadMeasures]
 * @param {PlaybackSamplePolicy} [options.samplePolicy]
 */
export function createPlaybackSamplePreloadRuntime({
  getBassPreloadRange = () => ({ low: 0, high: -1 }),
  getBassMidi = () => 0,
  getBeatsPerChord = () => 1,
  getChordsPerBar = () => 1,
  getCompingStyle = () => 'piano',
  getDrumsMode = () => 'off',
  getCurrentProgression = () => ({}),
  getNextProgression = () => ({}),
  collectCompingSampleNotes = () => {},
  loadSample = async () => null,
  loadPianoSampleList = async () => {},
  loadFileSample = async () => null,
  purgeSampleCategory = () => {},
  fetchArrayBufferFromUrl = async () => null,
  pianoSampleRange = { low: 0, high: -1 },
  celloSampleRange = { low: 0, high: -1 },
  violinSampleRange = { low: 0, high: -1 },
  compingStyleOff = 'off',
  compingStyleStrings = 'strings',
  compingStylePiano = 'piano',
  drumHihatSampleUrl = '',
  drumRideSampleUrls = [],
  drumModeHihats24 = 'hihats_24',
  drumModeFullSwing = 'full_swing',
  safePreloadMeasures = 2,
  samplePolicy
}: PlaybackSamplePreloadRuntimeOptions = {}) {
  const effectiveSafePreloadMeasures = samplePolicy?.nearTermMeasures ?? safePreloadMeasures;
  const backgroundPreloadEnabled = samplePolicy?.backgroundPreload !== 'off';
  const compressedWarmupEnabled = samplePolicy?.compressedCache !== 'none';
  let backgroundSamplePreloadPromise: Promise<PlaybackSampleLoadResult> | null = null;
  let pageSampleWarmupPromise: Promise<PlaybackSampleLoadResult> | null = null;
  let nearTermSamplePreloadPromise: Promise<PlaybackSampleLoadResult> | null = null;
  let fullSampleSetPreloadPromise: Promise<PlaybackSampleLoadResult> | null = null;
  let startupSamplePreloadInProgress = false;

  async function loadSampleRange(category: string, folder: string, low: number, high: number) {
    for (let midi = low; midi <= high; midi++) {
      await loadSample(category, folder, midi);
    }
  }

  async function loadSampleList(category: string, folder: string, midiValues: Iterable<number>) {
    for (const midi of sortMidiValues(midiValues)) {
      await loadSample(category, folder, midi);
    }
  }

  function buildMidiRange(low: number, high: number) {
    const values: number[] = [];
    for (let midi = low; midi <= high; midi++) {
      values.push(midi);
    }
    return values;
  }

  async function preloadRhythmSectionSamples() {
    const bassRange = getBassPreloadRange();
    await loadSampleRange('bass', 'Bass', bassRange.low, bassRange.high);
    const drumPromises: Promise<PlaybackSampleLoadResult>[] = [];
    if (drumHihatSampleUrl) {
      drumPromises.push(loadFileSample('drums', 'hihat', drumHihatSampleUrl));
    }
    drumRideSampleUrls.forEach((url, index) => {
      drumPromises.push(loadFileSample('drums', `ride_${index}`, url));
    });
    await Promise.all(drumPromises);
  }

  async function preloadCompingInstrumentSamples(style = getCompingStyle()) {
    if (style === compingStyleOff) return;
    if (style === compingStylePiano) {
      await loadPianoSampleList(buildMidiRange(pianoSampleRange.low, pianoSampleRange.high));
      return;
    }
    if (style === compingStyleStrings) {
      await loadSampleRange('cello', 'Cellos', celloSampleRange.low, celloSampleRange.high);
      await loadSampleRange('violin', 'Violins', violinSampleRange.low, violinSampleRange.high);
    }
  }

  async function preloadActiveSampleSet() {
    await preloadRhythmSectionSamples();
    await preloadCompingInstrumentSamples(getCompingStyle());
  }

  function purgeInactiveCompingSamples(style = getCompingStyle()) {
    if (style === compingStylePiano || style === compingStyleOff) {
      purgeSampleCategory('cello');
      purgeSampleCategory('violin');
    }
    if (style === compingStyleStrings || style === compingStyleOff) {
      purgeSampleCategory('piano');
    }
  }

  async function prepareCompingStyleSamples() {
    purgeInactiveCompingSamples(getCompingStyle());
    await preloadCompingInstrumentSamples(getCompingStyle());
  }

  function collectRequiredSampleNotes({
    includeCurrent = true,
    includeNext = true,
    currentChordLimit = null,
    nextChordLimit = null
  }: CollectRequiredPlaybackSampleNotesOptions = {}): PlaybackSampleNoteSets {
    const bassNotes = new Set<number>();
    const celloNotes = new Set<number>();
    const violinNotes = new Set<number>();
    const pianoNotes = new Set<number>();
    const compingStyle = getCompingStyle();
    const beatsPerChord = getBeatsPerChord();

    const registerProgression = (
      progression: PlaybackProgressionSnapshot,
      chordLimit: number | null = null
    ) => {
      const chords = Array.isArray(progression?.chords) ? progression.chords : [];
      const key = progression?.key;
      const voicingPlan = Array.isArray(progression?.voicingPlan) ? progression.voicingPlan : [];
      const bassPlan = Array.isArray(progression?.bassPlan) ? progression.bassPlan : [];
      if (!chords.length || key === null || key === undefined) return;

      const normalizedLimit = normalizeOptionalLimit(chordLimit);
      const limitedChords = normalizedLimit === null ? chords : chords.slice(0, normalizedLimit);
      const beatLimit = normalizedLimit === null ? Infinity : normalizedLimit * beatsPerChord;

      for (const chord of limitedChords) {
        bassNotes.add(getBassMidi(key, chord?.bassSemitones ?? chord?.semitones ?? 0));
      }
      for (const bassEvent of bassPlan) {
        if (bassEvent?.timeBeats < beatLimit && Number.isFinite(bassEvent.midi)) {
          bassNotes.add(bassEvent.midi);
        }
      }

      for (const voicing of voicingPlan.slice(0, limitedChords.length)) {
        if (!voicing) continue;
        collectCompingSampleNotes(compingStyle, voicing, { celloNotes, violinNotes, pianoNotes });
      }
    };

    if (includeCurrent) {
      registerProgression(getCurrentProgression(), currentChordLimit);
    }
    if (includeNext) {
      registerProgression(getNextProgression(), nextChordLimit);
    }

    return { bassNotes, celloNotes, violinNotes, pianoNotes };
  }

  function buildAllSampleFetchDescriptors() {
    const descriptors: string[] = [];
    const startupChordLimit = getChordsPerBar();
    const { bassNotes, celloNotes, violinNotes, pianoNotes } = collectRequiredSampleNotes({
      includeCurrent: true,
      includeNext: false,
      currentChordLimit: startupChordLimit
    });

    if (drumHihatSampleUrl) {
      descriptors.push(drumHihatSampleUrl);
    }
    for (const url of drumRideSampleUrls) {
      descriptors.push(url);
    }
    registerSortedMidiValues(sortMidiValues(celloNotes), (midi) => {
      descriptors.push(`assets/MP3/Cellos/${midi}.mp3`);
    });
    registerSortedMidiValues(sortMidiValues(violinNotes), (midi) => {
      descriptors.push(`assets/MP3/Violins/${midi}.mp3`);
    });
    registerSortedMidiValues(sortMidiValues(pianoNotes), (midi) => {
      descriptors.push(`assets/Piano/p/${midi}.mp3`);
      descriptors.push(`assets/Piano/mf/${midi}.mp3`);
      descriptors.push(`assets/Piano/f/${midi}.mp3`);
    });
    registerSortedMidiValues(sortMidiValues(bassNotes), (midi) => {
      descriptors.push(`assets/OGG/Bass/${midi}.ogg`);
    });
    return descriptors;
  }

  async function preloadSamples() {
    await preloadActiveSampleSet();
  }

  function buildAllRequiredSampleNoteSets() {
    const { celloNotes, violinNotes, pianoNotes } = collectRequiredSampleNotes({
      includeCurrent: true,
      includeNext: true
    });
    return { celloNotes, violinNotes, pianoNotes };
  }

  async function preloadStartupSamples() {
    await preloadActiveSampleSet();
  }

  function getSafetyLeadChordCount() {
    return effectiveSafePreloadMeasures * getChordsPerBar();
  }

  async function preloadNearTermSamples() {
    await preloadActiveSampleSet();
  }

  function ensureNearTermSamplePreload() {
    if (fullSampleSetPreloadPromise) return fullSampleSetPreloadPromise;

    fullSampleSetPreloadPromise = preloadNearTermSamples()
      .catch(() => null)
      .finally(() => {
        fullSampleSetPreloadPromise = null;
        nearTermSamplePreloadPromise = null;
      });

    nearTermSamplePreloadPromise = fullSampleSetPreloadPromise;
    return fullSampleSetPreloadPromise;
  }

  async function warmPageSampleCache() {
    if (!compressedWarmupEnabled) return;

    const descriptors = buildAllSampleFetchDescriptors();
    for (const baseUrl of descriptors) {
      if (startupSamplePreloadInProgress) {
        break;
      }
      try {
        await fetchArrayBufferFromUrl(baseUrl);
      } catch {}
    }
  }

  function ensurePageSampleWarmup() {
    if (!compressedWarmupEnabled) return null;
    if (pageSampleWarmupPromise) return pageSampleWarmupPromise;

    pageSampleWarmupPromise = warmPageSampleCache()
      .catch(() => null);

    return pageSampleWarmupPromise;
  }

  function ensureBackgroundSamplePreload() {
    if (!backgroundPreloadEnabled) return null;
    if (backgroundSamplePreloadPromise) return backgroundSamplePreloadPromise;

    backgroundSamplePreloadPromise = preloadSamples()
      .catch(() => null);

    return backgroundSamplePreloadPromise;
  }

  return {
    loadSampleRange,
    loadSampleList,
    buildAllSampleFetchDescriptors,
    collectRequiredSampleNotes,
    preloadSamples,
    preloadStartupSamples,
    preloadNearTermSamples,
    ensureNearTermSamplePreload,
    preloadRhythmSectionSamples,
    preloadCompingInstrumentSamples,
    preloadActiveSampleSet,
    purgeInactiveCompingSamples,
    prepareCompingStyleSamples,
    warmPageSampleCache,
    ensurePageSampleWarmup,
    ensureBackgroundSamplePreload,
    getBackgroundSamplePreloadPromise: () => backgroundSamplePreloadPromise,
    getPageSampleWarmupPromise: () => pageSampleWarmupPromise,
    getNearTermSamplePreloadPromise: () => nearTermSamplePreloadPromise,
    setNearTermSamplePreloadPromise: (value: Promise<PlaybackSampleLoadResult> | null) => { nearTermSamplePreloadPromise = value; },
    getStartupSamplePreloadInProgress: () => startupSamplePreloadInProgress,
    setStartupSamplePreloadInProgress: (value: unknown) => { startupSamplePreloadInProgress = Boolean(value); }
  };
}


