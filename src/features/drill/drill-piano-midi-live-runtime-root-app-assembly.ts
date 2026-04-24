
type DrillMidiVoice = {
  midi: number;
  source: AudioBufferSourceNode;
  gain: GainNode;
  volume: number;
};

type DrillPianoMidiSettings = {
  enabled?: boolean;
  sustainPedalEnabled?: boolean;
};

type DrillPianoFadeSettings = {
  timeConstantLow?: number;
  timeConstantHigh?: number;
};

type DrillPianoRhythmConfig = {
  pianoSampleLayerThresholds?: {
    p?: number;
    mf?: number;
    f?: number;
  };
  pianoSampleLayerSmoothing?: {
    boundaryWindow?: number;
    pToMfLiftDb?: number;
    mfFromPLiftDb?: number;
    mfToFLiftDb?: number;
    fFromMfLiftDb?: number;
  };
  pianoSampleLayerGainDb?: Record<string, number>;
  pianoMidiVelocity?: {
    curvePower?: number;
    minVolume?: number;
    maxVolume?: number;
    attackMin?: number;
    attackMax?: number;
  };
};

type DrillPianoMidiLiveRuntimeState = {
  getAudioContext?: () => BaseAudioContext | null;
  getPianoMidiSettings?: () => DrillPianoMidiSettings;
  getPianoFadeSettings?: () => DrillPianoFadeSettings;
  getMidiPianoRangePreloadPromise?: () => Promise<unknown> | null;
  setMidiPianoRangePreloadPromise?: (value: Promise<unknown> | null) => void;
  getMidiSustainPedalDown?: () => boolean;
  setMidiSustainPedalDown?: (value: boolean) => void;
};

type DrillPianoMidiLiveRuntimeHelpers = {
  clamp01?: (value: number) => number;
  clampRange?: (value: unknown, min: number, max: number, fallback: number) => number;
  getPianoFadeProfile?: (
    midi: number,
    volume: number,
    maxDuration: number,
    settings?: DrillPianoFadeSettings
  ) => { timeConstant: number };
  bassMidiToNoteName?: (midi: number) => string;
  initAudio?: () => void;
  resumeAudioContext?: () => Promise<unknown>;
  loadPianoSample?: (layer: string, midi: number) => Promise<void>;
  loadPianoSampleList?: (midiValues: Set<number>) => Promise<unknown>;
  getSampleBuffer?: (sampleKey: string) => AudioBuffer | null;
  getMixerDestination?: (channel: string) => AudioNode | null;
  trackScheduledSource?: (source: AudioBufferSourceNode, nodes?: AudioNode[]) => void;
  setPianoMidiStatus?: (message: string) => void;
};

type DrillPianoMidiLiveRuntimeConstants = {
  pianoRhythmConfig?: DrillPianoRhythmConfig;
  pianoSampleLow?: number;
  pianoSampleHigh?: number;
  pianoVolumeMultiplier?: number;
};

type DrillPianoMidiLiveRuntimeRootAppAssemblyOptions = {
  runtimeState?: DrillPianoMidiLiveRuntimeState;
  collections?: {
    pendingMidiNoteTokens?: Map<number, number>;
    activeMidiPianoVoices?: Map<number, DrillMidiVoice>;
    sustainedMidiNotes?: Set<number>;
  };
  runtimeHelpers?: DrillPianoMidiLiveRuntimeHelpers;
  constants?: DrillPianoMidiLiveRuntimeConstants;
};

/**
 * Creates the live piano MIDI runtime from root-app bindings. This keeps the
 * note-voice scheduler, sustain handling, and sample-preload flow out of
 * `app.js` while preserving the existing runtime side effects.
 *
 * @param {object} [options]
 * @param {object} [options.runtimeState]
 * @param {object} [options.collections]
 * @param {object} [options.runtimeHelpers]
 * @param {object} [options.constants]
 */
export function createDrillPianoMidiLiveRuntimeRootAppAssembly({
  runtimeState = {},
  collections = {},
  runtimeHelpers = {},
  constants = {}
}: DrillPianoMidiLiveRuntimeRootAppAssemblyOptions = {}) {
  const {
    getAudioContext = () => null,
    getPianoMidiSettings = (): DrillPianoMidiSettings => ({}),
    getPianoFadeSettings = (): DrillPianoFadeSettings => ({}),
    getMidiPianoRangePreloadPromise = () => null,
    setMidiPianoRangePreloadPromise = () => {},
    getMidiSustainPedalDown = () => false,
    setMidiSustainPedalDown = () => {}
  } = runtimeState;

  const {
    pendingMidiNoteTokens = new Map<number, number>(),
    activeMidiPianoVoices = new Map<number, DrillMidiVoice>(),
    sustainedMidiNotes = new Set<number>()
  } = collections;

  const {
    clamp01 = (value) => Math.min(1, Math.max(0, value)),
    clampRange = (value, min, max, fallback) => {
      const parsed = Number(value);
      if (!Number.isFinite(parsed)) return fallback;
      return Math.min(max, Math.max(min, parsed));
    },
    getPianoFadeProfile = () => ({ timeConstant: 0.1 }),
    bassMidiToNoteName = (midi) => String(midi),
    initAudio = () => {},
    resumeAudioContext = async () => {},
    loadPianoSample = async () => {},
    loadPianoSampleList = async () => null,
    getSampleBuffer = () => null,
    getMixerDestination = () => null,
    trackScheduledSource = () => {},
    setPianoMidiStatus = () => {}
  } = runtimeHelpers;

  const {
    pianoRhythmConfig = {},
    pianoSampleLow = 21,
    pianoSampleHigh = 108,
    pianoVolumeMultiplier = 0.3
  } = constants;

  function dbToGain(db: number) {
    return Math.pow(10, Number(db || 0) / 20);
  }

  function getPianoSampleLayerForVolume(finalVolume: number) {
    const thresholds = pianoRhythmConfig.pianoSampleLayerThresholds || {};
    if (finalVolume >= (thresholds.f ?? Number.POSITIVE_INFINITY)) return 'f';
    if (finalVolume >= (thresholds.mf ?? Number.POSITIVE_INFINITY)) return 'mf';
    return 'p';
  }

  function smoothstep01(value: number) {
    const clamped = clamp01(value);
    return clamped * clamped * (3 - (2 * clamped));
  }

  function getPianoSampleLayerBoundaryLiftDb(finalVolume: number, layer: string) {
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

  function getPianoSampleLayerGainForVolume(finalVolume: number) {
    const layer = getPianoSampleLayerForVolume(finalVolume);
    const layerGainDb = pianoRhythmConfig.pianoSampleLayerGainDb || {};
    const boundaryLiftDb = getPianoSampleLayerBoundaryLiftDb(finalVolume, layer);
    return {
      layer,
      adjustedVolume: finalVolume * dbToGain((layerGainDb[layer] ?? 0) + boundaryLiftDb)
    };
  }

  function getMidiVelocityProfile(velocity: number) {
    const midiVelocityConfig = pianoRhythmConfig.pianoMidiVelocity || {};
    const thresholds = pianoRhythmConfig.pianoSampleLayerThresholds || {};
    const normalizedVelocity = clamp01((Number(velocity) || 0) / 127);
    const curvePower = clampRange(midiVelocityConfig.curvePower, 0.3, 4, 1.9);
    const shapedVelocity = Math.pow(normalizedVelocity, curvePower);
    const fallbackMinVolume = Math.max(
      0.12,
      Math.min((thresholds.mf ?? pianoVolumeMultiplier) * 0.9, pianoVolumeMultiplier * 0.82)
    );
    const fallbackMaxVolume = Math.max(
      (thresholds.f ?? pianoVolumeMultiplier) * 1.12,
      pianoVolumeMultiplier * 1.32
    );
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

  function getNearestPianoSourceMidi(targetMidi: number) {
    return Math.round(clampRange(targetMidi, pianoSampleLow, pianoSampleHigh, 60));
  }

  async function ensurePianoSampleAvailable(midi: number, layer: string) {
    const sourceMidi = getNearestPianoSourceMidi(midi);
    const sampleKey = `${layer}:${sourceMidi}`;
    const existingBuffer = getSampleBuffer(sampleKey);
    if (existingBuffer) {
      return {
        buffer: existingBuffer,
        sourceMidi
      };
    }
    await loadPianoSample(layer, sourceMidi);
    return {
      buffer: getSampleBuffer(sampleKey) || null,
      sourceMidi
    };
  }

  function ensureMidiPianoRangePreload() {
    if (!getAudioContext()) return Promise.resolve(null);

    const currentPromise = getMidiPianoRangePreloadPromise();
    if (currentPromise) return currentPromise;

    const midiValues: number[] = [];
    for (let midi = pianoSampleLow; midi <= pianoSampleHigh; midi++) {
      midiValues.push(midi);
    }

    const preloadPromise = loadPianoSampleList(new Set(midiValues))
      .catch(() => {
        setMidiPianoRangePreloadPromise(null);
        return null;
      });

    setMidiPianoRangePreloadPromise(preloadPromise);
    return preloadPromise;
  }

  function stopMidiPianoVoice(midi: number, releaseImmediately = false) {
    const voice = activeMidiPianoVoices.get(midi);
    const audioContext = getAudioContext();
    if (!voice || !audioContext) return;

    activeMidiPianoVoices.delete(midi);
    sustainedMidiNotes.delete(midi);

    const releaseStart = audioContext.currentTime;
    const profile = getPianoFadeProfile(voice.midi, voice.volume, 0, getPianoFadeSettings());
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
    } catch {}

    try {
      voice.source.stop(releaseStopTime);
    } catch {}
  }

  function stopAllMidiPianoVoices(releaseImmediately = false) {
    for (const midi of [...activeMidiPianoVoices.keys()]) {
      stopMidiPianoVoice(midi, releaseImmediately);
    }
    sustainedMidiNotes.clear();
    setMidiSustainPedalDown(false);
  }

  async function playMidiPianoNote(midi: number, velocity = 96) {
    if (!getPianoMidiSettings()?.enabled) return;

    const noteToken = (pendingMidiNoteTokens.get(midi) || 0) + 1;
    pendingMidiNoteTokens.set(midi, noteToken);

    initAudio();
    ensureMidiPianoRangePreload();
    await resumeAudioContext();

    const velocityProfile = getMidiVelocityProfile(velocity);
    const pianoLayer = getPianoSampleLayerGainForVolume(velocityProfile.targetVolume);
    const { buffer, sourceMidi } = await ensurePianoSampleAvailable(midi, pianoLayer.layer);
    const audioContext = getAudioContext();
    if (!buffer || !audioContext || pendingMidiNoteTokens.get(midi) !== noteToken) return;

    stopMidiPianoVoice(midi, true);

    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    if (sourceMidi !== midi) {
      source.playbackRate.value = Math.pow(2, (midi - sourceMidi) / 12);
    }

    const gain = audioContext.createGain();
    const now = audioContext.currentTime;
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

    setPianoMidiStatus(
      `MIDI: ${bassMidiToNoteName(midi)} vel ${velocity} layer ${pianoLayer.layer} vol ${pianoLayer.adjustedVolume.toFixed(3)}`
    );
  }

  function handleMidiNoteOff(midi: number) {
    if (!getPianoMidiSettings()?.enabled) return;
    pendingMidiNoteTokens.set(midi, (pendingMidiNoteTokens.get(midi) || 0) + 1);
    if (getPianoMidiSettings()?.sustainPedalEnabled && getMidiSustainPedalDown()) {
      sustainedMidiNotes.add(midi);
      return;
    }
    stopMidiPianoVoice(midi);
  }

  function handleMidiSustainChange(value: number) {
    if (!getPianoMidiSettings()?.sustainPedalEnabled) return;
    const isDown = Number(value) >= 64;
    setMidiSustainPedalDown(isDown);
    if (isDown) return;
    for (const midi of [...sustainedMidiNotes]) {
      stopMidiPianoVoice(midi);
    }
    sustainedMidiNotes.clear();
  }

  function handleMidiMessage(event: { data?: ArrayLike<number> | null }) {
    const [status = 0, data1 = 0, data2 = 0] = event.data ? Array.from(event.data) : [];
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

  return {
    ensureMidiPianoRangePreload,
    stopMidiPianoVoice,
    stopAllMidiPianoVoices,
    playMidiPianoNote,
    handleMidiNoteOff,
    handleMidiSustainChange,
    handleMidiMessage
  };
}


