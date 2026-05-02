
type PracticePatternRuntimeRootAppAssemblyOptions = {
  dom?: PracticePatternRuntimeDom;
  runtimeState?: PracticePatternRuntimeState;
  runtimeConstants?: PracticePatternRuntimeConstants;
  runtimeHelpers?: PracticePatternRuntimeHelpers;
};

type PracticePatternChord = {
  semitones: number;
  bassSemitones?: number;
};

type PracticePatternRuntimeToggle = {
  checked?: boolean;
};

type PracticePatternRuntimeSelect = {
  value?: string;
};

type PracticePatternRuntimeDom = {
  doubleTimeToggle?: PracticePatternRuntimeToggle | null;
  chordsPerBar?: PracticePatternRuntimeSelect | null;
};

type PracticePatternRuntimeState = {
  getOneChordQualityPool?: () => string[];
  setOneChordQualityPool?: (value: string[]) => void;
  getOneChordQualityPoolSignature?: () => string;
  setOneChordQualityPoolSignature?: (value: string) => void;
};

type PracticePatternRuntimeConstants = {
  oneChordDefaultQualities?: string[];
};

type PracticePatternAnalysis = {
  usesBarLines?: boolean;
  resolvedChordsPerBar?: number | null;
  playbackMeasures?: Array<{
    timeSignature?: string;
    beatsPerBar?: number;
    chords?: PracticePatternChord[];
  }> | null;
};

type PracticePatternRuntimeHelpers = {
  shuffleArray?: <T>(value: T[]) => T[];
  getCurrentPatternString?: () => string;
  isOneChordModeActiveBase?: (pattern: string) => boolean;
  analyzePatternCached?: (pattern: string) => PracticePatternAnalysis;
  normalizeChordsPerBar?: (value: unknown) => number;
  getPatternKeyOverridePitchClassBase?: (pattern: string) => number | null;
  getBeatsPerChordBase?: (value: number) => number;
  padProgressionBase?: (chords: PracticePatternChord[], chordsPerBar: number) => PracticePatternChord[];
  getSelectedChordsPerBarValue?: () => number;
  getPlayedChordQuality?: (chord: PracticePatternChord, preferMinor: boolean) => string;
  getCurrentDoubleTimeChecked?: () => boolean;
};

/**
 * Creates the app-level practice pattern runtime from live root-app bindings.
 * This keeps one-chord cycling, chords-per-bar orchestration, and loop
 * trimming helpers out of `app.js` while preserving the current behavior.
 *
 * @param {object} [options]
 * @param {object} [options.dom]
 * @param {object} [options.runtimeState]
 * @param {object} [options.runtimeConstants]
 * @param {object} [options.runtimeHelpers]
 */
export function createPracticePatternRuntimeRootAppAssembly({
  dom = {},
  runtimeState = {},
  runtimeConstants = {},
  runtimeHelpers = {}
}: PracticePatternRuntimeRootAppAssemblyOptions = {}) {
  const {
    getOneChordQualityPool = () => [],
    setOneChordQualityPool = () => {},
    getOneChordQualityPoolSignature = () => '',
    setOneChordQualityPoolSignature = () => {}
  } = runtimeState;

  const {
    oneChordDefaultQualities = []
  } = runtimeConstants;

  const {
    shuffleArray = (value) => value,
    getCurrentPatternString = () => '',
    isOneChordModeActiveBase = () => false,
    analyzePatternCached = () => ({ usesBarLines: false, resolvedChordsPerBar: null, playbackMeasures: null }),
    normalizeChordsPerBar = (value: unknown): number => Number(value ?? 1),
    getPatternKeyOverridePitchClassBase = () => null,
    getBeatsPerChordBase = (value) => value,
    padProgressionBase = (chords) => chords,
    getSelectedChordsPerBarValue = () => 1,
    getPlayedChordQuality = () => '',
    getCurrentDoubleTimeChecked = () => false
  } = runtimeHelpers;

  function isOneChordModeActive(pattern = getCurrentPatternString()) {
    return isOneChordModeActiveBase(pattern);
  }

  function getOneChordQualitySignature(qualities: string[]) {
    return (qualities || []).join('|');
  }

  function matchesOneChordQualitySet(qualities: string[], reference: string[]) {
    if (!Array.isArray(qualities) || !Array.isArray(reference)) return false;
    if (qualities.length !== reference.length) return false;
    return qualities.every((quality, index) => quality === reference[index]);
  }

  function takeNextOneChordQuality(qualities: string[], excludedQuality: string | null = null) {
    const availableQualities = Array.isArray(qualities) && qualities.length > 0
      ? qualities
      : oneChordDefaultQualities;
    const signature = getOneChordQualitySignature(availableQualities);
    if (getOneChordQualityPoolSignature() !== signature) {
      setOneChordQualityPoolSignature(signature);
      setOneChordQualityPool([]);
    }

    let pool = getOneChordQualityPool();

    if (availableQualities.length <= 1 || excludedQuality === null) {
      if (pool.length === 0) {
        pool = shuffleArray(availableQualities.slice());
        setOneChordQualityPool(pool);
      }
      return pool.pop();
    }

    if (pool.length === 0) {
      pool = shuffleArray(availableQualities.slice());
      setOneChordQualityPool(pool);
    }

    let candidateIndex = pool.findIndex((quality) => quality !== excludedQuality);
    if (candidateIndex === -1) {
      pool = shuffleArray(availableQualities.slice());
      setOneChordQualityPool(pool);
      candidateIndex = pool.findIndex((quality) => quality !== excludedQuality);
    }

    if (candidateIndex === -1) {
      return pool.pop();
    }

    const [candidate] = pool.splice(candidateIndex, 1);
    return candidate;
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
      dom.chordsPerBar.value = String(analysis.resolvedChordsPerBar || 4);
      syncDoubleTimeToggle();
      return;
    }

    if (getSelectedChordsPerBar() === 4) {
      dom.chordsPerBar.value = getCurrentDoubleTimeChecked() ? '2' : String(getSelectedChordsPerBarValue());
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
    const resolved = Number(analysis.resolvedChordsPerBar);
    if (analysis.usesBarLines && Number.isFinite(resolved) && resolved > 0) {
      return resolved;
    }
    const firstMeasureBeats = Number(analysis.playbackMeasures?.[0]?.beatsPerBar);
    if (analysis.usesBarLines && Number.isFinite(firstMeasureBeats) && firstMeasureBeats > 0) {
      return firstMeasureBeats;
    }
    return normalizeChordsPerBar(getSelectedChordsPerBar());
  }

  function getPlaybackMeasurePlan(patternString = getCurrentPatternString()) {
    const analysis = analyzePatternCached(patternString);
    if (!analysis.usesBarLines || !Array.isArray(analysis.playbackMeasures) || analysis.playbackMeasures.length === 0) {
      return null;
    }

    let startChordIdx = 0;
    let startBeat = 0;
    return analysis.playbackMeasures.map((measure, index) => {
      const beatCount = Math.max(1, Number(measure?.beatsPerBar || measure?.chords?.length || 4));
      const planMeasure = {
        index,
        timeSignature: measure?.timeSignature || `${beatCount}/4`,
        beatCount,
        startChordIdx,
        endChordIdx: startChordIdx + beatCount,
        startBeat,
        endBeat: startBeat + beatCount
      };
      startChordIdx += beatCount;
      startBeat += beatCount;
      return planMeasure;
    });
  }

  function getMeasureInfoForChordIndex(chordIndex = 0, patternString = getCurrentPatternString()) {
    const plan = getPlaybackMeasurePlan(patternString);
    if (!plan || plan.length === 0) return null;
    const totalSlots = plan[plan.length - 1].endChordIdx;
    const normalizedChordIndex = totalSlots > 0
      ? ((Math.floor(Number(chordIndex) || 0) % totalSlots) + totalSlots) % totalSlots
      : 0;
    const measure = plan.find((entry) =>
      normalizedChordIndex >= entry.startChordIdx && normalizedChordIndex < entry.endChordIdx
    ) || plan[0];
    return {
      ...measure,
      localBeat: normalizedChordIndex - measure.startChordIdx
    };
  }

  function getBeatsPerChord(chordsPerBar = getChordsPerBar()) {
    const analysis = analyzePatternCached(getCurrentPatternString());
    if (analysis.usesBarLines) return 1;
    return getBeatsPerChordBase(chordsPerBar);
  }

  function padProgression(chords: PracticePatternChord[], chordsPerBar = getChordsPerBar()) {
    const analysis = analyzePatternCached(getCurrentPatternString());
    if (analysis.usesBarLines) return Array.isArray(chords) ? chords : [];
    return padProgressionBase(chords, chordsPerBar);
  }

  function canLoopTrimProgression(rawChords: PracticePatternChord[], chordsPerBar = getChordsPerBar()) {
    if (rawChords.length < 3) return false;
    const first = rawChords[0];
    const last = rawChords[rawChords.length - 1];
    const firstPlayedMajor = getPlayedChordQuality(first, false);
    const lastPlayedMajor = getPlayedChordQuality(last, false);
    const firstPlayedMinor = getPlayedChordQuality(first, true);
    const lastPlayedMinor = getPlayedChordQuality(last, true);
    if (
      first.semitones !== last.semitones
      || (first.bassSemitones ?? first.semitones) !== (last.bassSemitones ?? last.semitones)
      || firstPlayedMajor !== lastPlayedMajor
      || firstPlayedMinor !== lastPlayedMinor
    ) {
      return false;
    }
    const trimmedLength = rawChords.length - 1;
    const chordsPerMeasure = normalizeChordsPerBar(chordsPerBar);
    if (trimmedLength % chordsPerMeasure !== 0) return false;
    const measures = trimmedLength / chordsPerMeasure;
    return measures % 2 === 0;
  }

  function buildLoopRepVoicings(template: unknown[], paddedLength: number, isFirstRep: boolean) {
    if (!Array.isArray(template) || template.length === 0) {
      return new Array(Math.max(0, paddedLength)).fill(null);
    }
    const plan = [];
    const templateLength = template.length;
    if (isFirstRep) {
      for (let index = 0; index < paddedLength; index++) {
        plan.push(template[Math.min(index, templateLength - 2)]);
      }
      return plan;
    }

    const resolve = template[templateLength - 1];
    plan.push(resolve);
    for (let index = 1; index < paddedLength; index++) {
      if (index < templateLength - 1) {
        plan.push(template[index]);
      } else {
        plan.push(resolve);
      }
    }
    return plan;
  }

  return {
    isOneChordModeActive,
    getOneChordQualitySignature,
    matchesOneChordQualitySet,
    takeNextOneChordQuality,
    syncDoubleTimeToggle,
    normalizeChordsPerBarForCurrentPattern,
    getSelectedChordsPerBar,
    getPatternKeyOverridePitchClass,
    getChordsPerBar,
    getPlaybackMeasurePlan,
    getMeasureInfoForChordIndex,
    getBeatsPerChord,
    padProgression,
    canLoopTrimProgression,
    buildLoopRepVoicings
  };
}


