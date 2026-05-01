
import {
  createMetricGroups,
  getMetricBeatStrengths
} from '../../core/music/meter.js';
import pianoRhythmConfig from '../../core/music/piano-rhythm-config.js';
import { getSwingOffbeatPositionBeats } from '../../core/music/swing-utils.js';
import { PIANO_COMPING_CONFIG } from '../../config/trainer-config.js';

type DrillMixerNodes = Record<string, GainNode>;

type PlaybackAudioPlaybackRuntimeOptions = {
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
  getDrumSwingRatio?: () => number;
  getSwingRatio?: () => number;
  initialRideSampleCursor?: number;
};

type DrumSamplePlaybackOptions = {
  endingStyle?: string;
  slotDuration?: number;
  secondsPerBeat?: number;
  tailFadeTimeConstant?: number;
  tailFadeStart?: number;
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
 * @param {() => number} [options.getDrumSwingRatio]
 * @param {() => number} [options.getSwingRatio]
 * @param {number} [options.initialRideSampleCursor]
 */
export function createPlaybackAudioPlaybackRuntime({
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
  getDrumSwingRatio,
  getSwingRatio = () => 0,
  initialRideSampleCursor = Math.floor(Math.random() * Math.max(1, drumRideSampleUrls.length))
}: PlaybackAudioPlaybackRuntimeOptions = {}) {
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

  function getTempoAdaptiveShortDurationMultiplier(secondsPerBeat?: number) {
    if (!Number.isFinite(secondsPerBeat) || Number(secondsPerBeat) <= 0) return 1;
    const tempoBpm = 60 / Number(secondsPerBeat);
    if (tempoBpm < 120) {
      const lowTempoProgress = Math.min(1, (120 - tempoBpm) / 80);
      return 1 + (lowTempoProgress * 0.32);
    }
    if (tempoBpm === 120) return 1;

    const highTempoProgress = Math.min(1, (tempoBpm - 120) / 100);
    return 1 - (highTempoProgress * 0.28);
  }

  function getShortEndingDurationSeconds(options: DrumSamplePlaybackOptions = {}) {
    const safeSlotDuration = Number.isFinite(options.slotDuration) && Number(options.slotDuration) > 0
      ? Number(options.slotDuration)
      : (Number.isFinite(options.secondsPerBeat) && Number(options.secondsPerBeat) > 0 ? Number(options.secondsPerBeat) : 0.25);
    const baseShortDuration = Math.max(
      PIANO_COMPING_CONFIG.minDurationSeconds,
      Math.min(
        PIANO_COMPING_CONFIG.maxDurationSeconds,
        safeSlotDuration * PIANO_COMPING_CONFIG.durationRatio
      )
    );
    const offbeatMultiplier = Number.isFinite(pianoRhythmConfig.offBeatShortNoteDurationMultiplier)
      ? Math.max(0.5, Math.min(1, Number(pianoRhythmConfig.offBeatShortNoteDurationMultiplier)))
      : 1;
    return Math.max(
      PIANO_COMPING_CONFIG.minDurationSeconds,
      baseShortDuration * getTempoAdaptiveShortDurationMultiplier(options.secondsPerBeat) * offbeatMultiplier
    );
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

  function playDrumSample(
    name: string,
    time: number,
    gainValue = 1,
    playbackRate = 1,
    options: DrumSamplePlaybackOptions = {}
  ) {
    const audioCtx = getAudioContext();
    const destination = getMixerDestination('drums');
    const buffer = sampleBuffers?.drums?.[name];
    if (!audioCtx || !destination || !buffer) return;

    const src = audioCtx.createBufferSource();
    src.buffer = buffer;
    src.playbackRate.value = playbackRate;

    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(gainValue, time);
    if (Number.isFinite(options.tailFadeTimeConstant) && options.tailFadeTimeConstant > 0) {
      const resolvedTailFadeStart = options.endingStyle === 'short'
        ? time + getShortEndingDurationSeconds(options)
        : Number(options.tailFadeStart || time);
      const fadeStart = Math.max(time, resolvedTailFadeStart);
      gain.gain.setValueAtTime(gainValue, fadeStart);
      gain.gain.setTargetAtTime(0.0001, fadeStart, options.tailFadeTimeConstant);
    }

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

  function playRide(time: number, gainValue = 0.3, playbackRate = 1, options: DrumSamplePlaybackOptions = {}) {
    playDrumSample(getNextRideSampleName(), time, gainValue * drumsGainMultiplier, playbackRate, options);
  }

  function getMetricLocalBeat(beatIndex: number, beatCount = 4) {
    const groups = createMetricGroups(beatCount);
    const group = groups.find((entry) => beatIndex >= entry.startBeat && beatIndex < entry.endBeat) || groups[0];
    return Math.max(0, beatIndex - (group?.startBeat || 0));
  }

  function scheduleDrumsForBeat(
    time: number,
    beatIndex: number,
    spb: number,
    measureInfo: { beatCount?: number } | null = null
  ) {
    const mode = getDrumsMode();
    if (mode === drumModeOff) return;

    const beatCount = Math.max(1, Number(measureInfo?.beatCount || 4));
    const beatStrengths = getMetricBeatStrengths(beatCount);
    const isWeakBeat = beatStrengths[beatIndex] === 'weak';
    if (mode === drumModeMetronome24) {
      if (isWeakBeat) playClick(time, false);
      return;
    }

    if (mode === drumModeHihats24) {
      if (isWeakBeat) playHiHat(time, true);
      return;
    }

    if (mode === drumModeFullSwing) {
      const localBeat = getMetricLocalBeat(beatIndex, beatCount);
      const rideMainGain = [0.18, 0.34, 0.15, 0.31][localBeat] || 0.28;
      const rideSkipGain = [0, 0.2, 0, 0.23][localBeat] || 0;
      const drumSwingRatio = typeof getDrumSwingRatio === 'function' ? getDrumSwingRatio() : getSwingRatio();
      const swingOffsetSeconds = spb * getSwingOffbeatPositionBeats(drumSwingRatio);

      playRide(time, rideMainGain, beatIndex === 0 ? 1.01 : 1);
      if (isWeakBeat) {
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


