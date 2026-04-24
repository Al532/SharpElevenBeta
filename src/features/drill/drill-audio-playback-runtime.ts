
type DrillMixerNodes = Record<string, GainNode>;

type DrillAudioPlaybackRuntimeOptions = {
  getAudioContext?: () => AudioContext | null;
  setAudioContext?: (value: AudioContext | null) => void;
  getMixerNodes?: () => DrillMixerNodes | null;
  setMixerNodes?: (value: DrillMixerNodes | null) => void;
  createAudioContext?: () => AudioContext;
  applyMixerSettings?: () => void;
  sampleBuffers?: Record<string, Record<string, AudioBuffer | undefined>>;
  trackScheduledSource?: (source: AudioScheduledSourceNode, gainNodes?: GainNode[]) => unknown;
  metronomeGainMultiplier?: number;
  drumsGainMultiplier?: number;
  drumModeOff?: string;
  drumModeMetronome24?: string;
  drumModeHihats24?: string;
  drumModeFullSwing?: string;
  drumRideSampleUrls?: string[];
  getDrumsMode?: () => string;
  getSwingRatio?: () => number;
  initialRideSampleCursor?: number;
};

/**
 * @param {object} [options]
 * @param {() => BaseAudioContext | null} [options.getAudioContext]
 * @param {(value: BaseAudioContext | null) => void} [options.setAudioContext]
 * @param {() => Record<string, GainNode> | null} [options.getMixerNodes]
 * @param {(value: Record<string, GainNode> | null) => void} [options.setMixerNodes]
 * @param {() => BaseAudioContext} [options.createAudioContext]
 * @param {() => void} [options.applyMixerSettings]
 * @param {Record<string, Record<string, AudioBuffer | undefined>>} [options.sampleBuffers]
 * @param {(source: AudioScheduledSourceNode, gainNodes?: GainNode[]) => unknown} [options.trackScheduledSource]
 * @param {number} [options.metronomeGainMultiplier]
 * @param {number} [options.drumsGainMultiplier]
 * @param {string} [options.drumModeOff]
 * @param {string} [options.drumModeMetronome24]
 * @param {string} [options.drumModeHihats24]
 * @param {string} [options.drumModeFullSwing]
 * @param {string[]} [options.drumRideSampleUrls]
 * @param {() => string} [options.getDrumsMode]
 * @param {() => number} [options.getSwingRatio]
 * @param {number} [options.initialRideSampleCursor]
 */
export function createDrillAudioPlaybackRuntime({
  getAudioContext = () => null,
  setAudioContext = () => {},
  getMixerNodes = () => null,
  setMixerNodes = () => {},
  createAudioContext = () => new (window.AudioContext || window.webkitAudioContext)(),
  applyMixerSettings = () => {},
  sampleBuffers = /** @type {any} */ ({}),
  trackScheduledSource = () => null,
  metronomeGainMultiplier = 1,
  drumsGainMultiplier = 1,
  drumModeOff = 'off',
  drumModeMetronome24 = 'metronome_2_4',
  drumModeHihats24 = 'hihats_2_4',
  drumModeFullSwing = 'full_swing',
  drumRideSampleUrls = [],
  getDrumsMode = () => drumModeOff,
  getSwingRatio = () => 0,
  initialRideSampleCursor = Math.floor(Math.random() * Math.max(1, drumRideSampleUrls.length))
}: DrillAudioPlaybackRuntimeOptions = {}) {
  let rideSampleCursor = initialRideSampleCursor;

  function initAudio() {
    if (getAudioContext()) return;
    setAudioContext(createAudioContext());
    initMixerNodes();
  }

  async function resumeAudioContext() {
    initAudio();
    const audioCtx = getAudioContext();
    if (!audioCtx || typeof audioCtx.resume !== 'function' || audioCtx.state === 'closed') {
      return audioCtx;
    }
    if (audioCtx.state !== 'running') {
      try {
        await audioCtx.resume();
      } catch {}
    }
    return audioCtx;
  }

  async function suspendAudioContext() {
    const audioCtx = getAudioContext();
    if (!audioCtx || typeof audioCtx.suspend !== 'function' || audioCtx.state === 'closed') {
      return audioCtx;
    }
    if (audioCtx.state !== 'suspended') {
      try {
        await audioCtx.suspend();
      } catch {}
    }
    return audioCtx;
  }

  function getAudioContextState() {
    return getAudioContext()?.state || 'missing';
  }

  function initMixerNodes() {
    const audioCtx = getAudioContext();
    if (!audioCtx || getMixerNodes()) return;

    const master = audioCtx.createGain();
    const bass = audioCtx.createGain();
    const strings = audioCtx.createGain();
    const drums = audioCtx.createGain();

    bass.connect(master);
    strings.connect(master);
    drums.connect(master);
    master.connect(audioCtx.destination);

    setMixerNodes({ master, bass, strings, drums });
    applyMixerSettings();
  }

  function getMixerDestination(channel: string) {
    return getMixerNodes()?.[channel] || getAudioContext()?.destination || null;
  }

  function playClick(time: number, accent: boolean) {
    const audioCtx = getAudioContext();
    const destination = getMixerDestination('drums');
    if (!audioCtx || !destination) return;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = accent ? 1200 : 1000;
    gain.gain.setValueAtTime((accent ? 0.18 : 0.11) * metronomeGainMultiplier, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);
    osc.connect(gain).connect(destination);
    osc.start(time);
    osc.stop(time + 0.05);
    trackScheduledSource(osc, [gain]);
  }

  function playDrumSample(name: string, time: number, gainValue = 1, playbackRate = 1) {
    const audioCtx = getAudioContext();
    const destination = getMixerDestination('drums');
    const buffer = sampleBuffers?.drums?.[name];
    if (!audioCtx || !destination || !buffer) return;

    const src = audioCtx.createBufferSource();
    src.buffer = buffer;
    src.playbackRate.value = playbackRate;

    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(gainValue, time);

    src.connect(gain).connect(destination);
    src.start(time);
    trackScheduledSource(src, [gain]);
  }

  function playHiHat(time: number, accent = false) {
    playDrumSample('hihat', time, (accent ? 0.45 : 0.33) * drumsGainMultiplier, accent ? 1.01 : 0.98);
  }

  function getNextRideSampleName() {
    const rideSampleCount = drumRideSampleUrls.length;
    if (!rideSampleCount) return 'ride_0';

    const startIndex = rideSampleCursor;
    do {
      const sampleName = `ride_${rideSampleCursor}`;
      rideSampleCursor = (rideSampleCursor + 1 + Math.floor(Math.random() * 3)) % rideSampleCount;
      if (sampleBuffers?.drums?.[sampleName]) return sampleName;
    } while (rideSampleCursor !== startIndex);

    return 'ride_0';
  }

  function playRide(time: number, gainValue = 0.3, playbackRate = 1) {
    playDrumSample(getNextRideSampleName(), time, gainValue * drumsGainMultiplier, playbackRate);
  }

  function scheduleDrumsForBeat(time: number, beatIndex: number, spb: number) {
    const mode = getDrumsMode();
    if (mode === drumModeOff) return;

    const isTwoOrFour = beatIndex === 1 || beatIndex === 3;
    if (mode === drumModeMetronome24) {
      if (isTwoOrFour) playClick(time, false);
      return;
    }

    if (mode === drumModeHihats24) {
      if (isTwoOrFour) playHiHat(time, true);
      return;
    }

    if (mode === drumModeFullSwing) {
      const rideMainGain = [0.23, 0.34, 0.2, 0.31][beatIndex] || 0.28;
      const rideSkipGain = [0, 0.15, 0, 0.18][beatIndex] || 0;
      const swingOffsetSeconds = spb * getSwingRatio();

      playRide(time, rideMainGain, beatIndex === 0 ? 1.01 : 1);
      if (isTwoOrFour) {
        playRide(time + swingOffsetSeconds, rideSkipGain, 0.99);
        playHiHat(time, true);
      }
    }
  }

  return {
    initAudio,
    resumeAudioContext,
    suspendAudioContext,
    getAudioContextState,
    initMixerNodes,
    getMixerDestination,
    playClick,
    playDrumSample,
    playHiHat,
    getNextRideSampleName,
    playRide,
    scheduleDrumsForBeat
  };
}


