
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
  fetchArrayBufferFromUrl?: (baseUrl: string) => Promise<PlaybackSampleLoadResult>;
  drumHihatSampleUrl?: string;
  drumRideSampleUrls?: string[];
  drumModeHihats24?: string;
  drumModeFullSwing?: string;
  safePreloadMeasures?: number;
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
 * @param {(baseUrl: string) => Promise<PlaybackSampleLoadResult>} [options.fetchArrayBufferFromUrl]
 * @param {string} [options.drumHihatSampleUrl]
 * @param {string[]} [options.drumRideSampleUrls]
 * @param {string} [options.drumModeHihats24]
 * @param {string} [options.drumModeFullSwing]
 * @param {number} [options.safePreloadMeasures]
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
  fetchArrayBufferFromUrl = async () => null,
  drumHihatSampleUrl = '',
  drumRideSampleUrls = [],
  drumModeHihats24 = 'hihats_24',
  drumModeFullSwing = 'full_swing',
  safePreloadMeasures = 2
}: PlaybackSamplePreloadRuntimeOptions = {}) {
  let backgroundSamplePreloadPromise: Promise<PlaybackSampleLoadResult> | null = null;
  let pageSampleWarmupPromise: Promise<PlaybackSampleLoadResult> | null = null;
  let nearTermSamplePreloadPromise: Promise<PlaybackSampleLoadResult> | null = null;
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
      descriptors.push(`assets/MP3/Bass/${midi}.mp3`);
    });
    return descriptors;
  }

  async function preloadSamples() {
    const bassRange = getBassPreloadRange();
    const { celloNotes, violinNotes, pianoNotes } = buildAllRequiredSampleNoteSets();

    await loadSampleRange('bass', 'Bass', bassRange.low, bassRange.high);
    const drumPromises: Promise<PlaybackSampleLoadResult>[] = [];
    if (drumHihatSampleUrl) {
      drumPromises.push(loadFileSample('drums', 'hihat', drumHihatSampleUrl));
    }
    drumRideSampleUrls.forEach((url, index) => {
      drumPromises.push(loadFileSample('drums', `ride_${index}`, url));
    });
    await Promise.all(drumPromises);
    await loadSampleList('cello', 'Cellos', celloNotes);
    await loadSampleList('violin', 'Violins', violinNotes);
    await loadPianoSampleList(pianoNotes);
  }

  function buildAllRequiredSampleNoteSets() {
    const { celloNotes, violinNotes, pianoNotes } = collectRequiredSampleNotes({
      includeCurrent: true,
      includeNext: true
    });
    return { celloNotes, violinNotes, pianoNotes };
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
    const drumPromises: Promise<PlaybackSampleLoadResult>[] = [];
    if ((drumsMode === drumModeHihats24 || drumsMode === drumModeFullSwing) && drumHihatSampleUrl) {
      drumPromises.push(loadFileSample('drums', 'hihat', drumHihatSampleUrl));
    }
    if (drumsMode === drumModeFullSwing) {
      const startupRideCount = Math.min(3, drumRideSampleUrls.length);
      for (let index = 0; index < startupRideCount; index++) {
        drumPromises.push(loadFileSample('drums', `ride_${index}`, drumRideSampleUrls[index]));
      }
    }

    await Promise.all(drumPromises);
    await loadSampleList('cello', 'Cellos', celloNotes);
    await loadSampleList('violin', 'Violins', violinNotes);
    await loadPianoSampleList(pianoNotes);
  }

  function getSafetyLeadChordCount() {
    return safePreloadMeasures * getChordsPerBar();
  }

  async function preloadNearTermSamples() {
    const currentProgression = getCurrentProgression();
    const nextProgression = getNextProgression();
    const currentChords = Array.isArray(currentProgression?.chords) ? currentProgression.chords : [];
    const nextChords = Array.isArray(nextProgression?.chords) ? nextProgression.chords : [];
    const targetChordCount = getSafetyLeadChordCount();
    const currentChordLimit = Math.min(currentChords.length, targetChordCount);
    const remainingChordCount = Math.max(0, targetChordCount - currentChordLimit);
    const nextChordLimit = Math.min(nextChords.length, remainingChordCount);
    const { bassNotes, celloNotes, violinNotes, pianoNotes } = collectRequiredSampleNotes({
      includeCurrent: currentChordLimit > 0,
      includeNext: nextChordLimit > 0,
      currentChordLimit,
      nextChordLimit
    });

    await loadSampleList('cello', 'Cellos', celloNotes);
    await loadSampleList('violin', 'Violins', violinNotes);
    await loadPianoSampleList(pianoNotes);
    await loadSampleList('bass', 'Bass', bassNotes);
  }

  function ensureNearTermSamplePreload() {
    if (nearTermSamplePreloadPromise) return nearTermSamplePreloadPromise;

    nearTermSamplePreloadPromise = preloadNearTermSamples()
      .catch(() => null)
      .finally(() => {
        nearTermSamplePreloadPromise = null;
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
      } catch {}
    }
  }

  function ensurePageSampleWarmup() {
    if (pageSampleWarmupPromise) return pageSampleWarmupPromise;

    pageSampleWarmupPromise = warmPageSampleCache()
      .catch(() => null);

    return pageSampleWarmupPromise;
  }

  function ensureBackgroundSamplePreload() {
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


