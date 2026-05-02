
import pianoRhythmConfig from '../../core/music/piano-rhythm-config.js';
import { PIANO_COMPING_CONFIG } from '../../config/trainer-config.js';
import { getShortEndingDynamicMultiplier } from '../../core/playback/playback-ending-dynamics.js';

type PlaybackLoadedSampleBuffers = Record<string, Record<string | number, AudioBuffer | undefined>>;

type PlaybackTrackedAudioSource = AudioBufferSourceNode & {
  detune?: AudioParam;
  playbackRate: AudioParam;
  loop?: boolean;
  loopStart?: number;
  loopEnd?: number;
};

type PlaybackPlayableVoice = {
  detuneParams: AudioParam[];
  gain: GainNode;
  volume: number;
  audibleUntil: number;
  endAnchor: AudioScheduledSourceNode;
  stop: (stopTime: number) => void;
  midi?: number;
  category?: string;
  key?: string;
};

type PlaybackSamplePlaybackRuntimeOptions = {
  getAudioContext?: () => AudioContext | null;
  sampleBuffers?: PlaybackLoadedSampleBuffers;
  getMixerDestination?: (channel: string) => AudioNode | null;
  trackScheduledSource?: (source: AudioScheduledSourceNode, gainNodes?: GainNode[]) => unknown;
  loadSample?: (category: string, folder: string, midi: number) => Promise<any>;
  loadPianoSample?: (layer: string, midi: number) => Promise<any>;
  touchSampleBuffer?: (category: string, key: string | number) => void;
  getActiveNoteGain?: () => GainNode | null;
  setActiveNoteGain?: (value: GainNode | null) => void;
  setActiveNoteFadeOut?: (value: number) => void;
  getPianoFadeProfile?: (
    midi: number,
    volume: number,
    maxDuration: number
  ) => { fadeBefore: number; timeConstant: number };
  noteFadeout?: number;
  bassNoteAttack?: number;
  bassNoteOverlap?: number;
  bassNoteRelease?: number;
  bassGainReleaseTimeConstant?: number;
  chordFadeBefore?: number;
  chordFadeDuration?: number;
  bassGain?: number;
  stringLoopStart?: number;
  stringLoopEnd?: number;
  stringLoopCrossfade?: number;
};

type PlaybackPlaySampleOptions = {
  layer?: string;
  legato?: boolean;
};

type PlaybackPlayNoteOptions = {
  endingCue?: Record<string, unknown> | null;
  endingStyle?: string;
  timeBeats?: number;
  beatsPerBar?: number;
  endingAccentMultiplier?: number;
  endingFinalAccentMultiplier?: number;
  endingCrescendoLeadMeasures?: number;
  slotDuration?: number;
  secondsPerBeat?: number;
  tailFadeTimeConstant?: number;
};

const missingPianoPlaybackWarnings = new Set<string>();

/**
 * @param {AudioScheduledSourceNode} source
 */
function stopAudioSourceSafely(source: AudioScheduledSourceNode, stopTime: number) {
  try {
    source.stop(stopTime);
  } catch {
    // Source may already be stopped; ignore duplicate stop scheduling.
  }
}

/**
 * @param {object} [options]
 * @param {() => BaseAudioContext | null} [options.getAudioContext]
 * @param {PlaybackLoadedSampleBuffers} [options.sampleBuffers]
 * @param {(channel: string) => AudioNode | null} [options.getMixerDestination]
 * @param {(source: AudioScheduledSourceNode, gainNodes?: GainNode[]) => unknown} [options.trackScheduledSource]
 * @param {(category: string, folder: string, midi: number) => Promise<any>} [options.loadSample]
 * @param {(layer: string, midi: number) => Promise<any>} [options.loadPianoSample]
 * @param {(category: string, key: string | number) => void} [options.touchSampleBuffer]
 * @param {() => GainNode | null} [options.getActiveNoteGain]
 * @param {(value: GainNode | null) => void} [options.setActiveNoteGain]
 * @param {(value: number) => void} [options.setActiveNoteFadeOut]
 * @param {(midi: number, volume: number, maxDuration: number) => { fadeBefore: number, timeConstant: number }} [options.getPianoFadeProfile]
 * @param {number} [options.noteFadeout]
 * @param {number} [options.bassNoteAttack]
 * @param {number} [options.bassNoteOverlap]
 * @param {number} [options.bassNoteRelease]
 * @param {number} [options.bassGainReleaseTimeConstant]
 * @param {number} [options.chordFadeBefore]
 * @param {number} [options.chordFadeDuration]
 * @param {number} [options.bassGain]
 * @param {number} [options.stringLoopStart]
 * @param {number} [options.stringLoopEnd]
 * @param {number} [options.stringLoopCrossfade]
 */
export function createPlaybackSamplePlaybackRuntime({
  getAudioContext = () => null,
  sampleBuffers = /** @type {any} */ ({}),
  getMixerDestination = () => null,
  trackScheduledSource = () => null,
  loadSample = async () => null,
  loadPianoSample = async () => null,
  touchSampleBuffer = () => {},
  getActiveNoteGain = () => null,
  setActiveNoteGain = () => {},
  setActiveNoteFadeOut = () => {},
  getPianoFadeProfile = () => ({ fadeBefore: 0.1, timeConstant: 0.05 }),
  noteFadeout = 0.25,
  bassNoteAttack = 0.005,
  bassNoteOverlap = 0.1,
  bassNoteRelease = 0.075,
  bassGainReleaseTimeConstant = 0.012,
  chordFadeBefore = 0.1,
  chordFadeDuration = 0.2,
  bassGain = 1,
  stringLoopStart = 2,
  stringLoopEnd = 9,
  stringLoopCrossfade = 0.12
}: PlaybackSamplePlaybackRuntimeOptions = {}) {
  function getNearestLoadedBassSampleMidi(targetMidi: number) {
    const loadedMidis = Object.keys(sampleBuffers.bass || {})
      .map((value) => Number(value))
      .filter((value) => Number.isFinite(value) && sampleBuffers.bass[value]);
    if (!loadedMidis.length) return null;
    loadedMidis.sort((left, right) => {
      const leftDistance = Math.abs(left - targetMidi);
      const rightDistance = Math.abs(right - targetMidi);
      if (leftDistance !== rightDistance) return leftDistance - rightDistance;
      return left - right;
    });
    return loadedMidis[0];
  }

  function getAdaptiveBassFadeDuration(maxDuration?: number) {
    void maxDuration;
    return bassNoteRelease;
  }

  function scheduleBassGainRelease(gainNode: GainNode | null, fadeStart: number, fadeEnd: number) {
    if (!gainNode) return;

    if (typeof gainNode.gain.cancelAndHoldAtTime === 'function') {
      gainNode.gain.cancelAndHoldAtTime(fadeStart);
    } else {
      const currentValue = gainNode.gain.value;
      gainNode.gain.cancelScheduledValues(fadeStart);
      gainNode.gain.setValueAtTime(currentValue, fadeStart);
    }

    gainNode.gain.setTargetAtTime(0.0001, fadeStart, bassGainReleaseTimeConstant);
    gainNode.gain.setValueAtTime(0, fadeEnd);
  }

  function scheduleBassTailFade(gainNode: GainNode | null, fadeStart: number, timeConstant: number) {
    if (!gainNode || !Number.isFinite(timeConstant) || timeConstant <= 0) return;

    if (typeof gainNode.gain.cancelAndHoldAtTime === 'function') {
      gainNode.gain.cancelAndHoldAtTime(fadeStart);
    } else {
      const currentValue = gainNode.gain.value;
      gainNode.gain.cancelScheduledValues(fadeStart);
      gainNode.gain.setValueAtTime(currentValue, fadeStart);
    }

    gainNode.gain.setTargetAtTime(0.0001, fadeStart, timeConstant);
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

  function resolveEndingBassDuration(maxDuration: number, options: PlaybackPlayNoteOptions = {}) {
    if (options.endingStyle !== 'short') return maxDuration;
    const safeSlotDuration = Number.isFinite(options.slotDuration) && Number(options.slotDuration) > 0
      ? Number(options.slotDuration)
      : (Number.isFinite(options.secondsPerBeat) && Number(options.secondsPerBeat) > 0 ? Number(options.secondsPerBeat) : maxDuration);
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

  function playNote(midi: number, time: number, maxDuration: number, velocity = 127, options: PlaybackPlayNoteOptions = {}) {
    const audioCtx = getAudioContext();
    const destination = getMixerDestination('bass');
    if (!audioCtx || !destination) return;

    let sourceMidi = midi;
    let buffer = sampleBuffers.bass?.[sourceMidi];
    if (!buffer) {
      loadSample('bass', 'Bass', midi).catch(() => null);
      const fallbackMidi = getNearestLoadedBassSampleMidi(midi);
      if (fallbackMidi !== null) {
        sourceMidi = fallbackMidi;
        buffer = sampleBuffers.bass?.[sourceMidi];
      }
    }
    if (!buffer) return;

    const noteDuration = resolveEndingBassDuration(maxDuration, options);
    const sustainedMaxDuration = noteDuration ? (noteDuration + bassNoteOverlap) : noteDuration;
    const currentNoteFadeOut = getAdaptiveBassFadeDuration(maxDuration);

    const activeNoteGain = getActiveNoteGain();
    if (activeNoteGain) {
      const fadeEnd = time + bassNoteOverlap;
      const fadeStart = Math.max(time, audioCtx.currentTime);
      scheduleBassGainRelease(activeNoteGain, fadeStart, fadeEnd);
    }

    const src = audioCtx.createBufferSource() as PlaybackTrackedAudioSource;
    src.buffer = buffer;
    if (sourceMidi !== midi) {
      src.playbackRate.value = Math.pow(2, (midi - sourceMidi) / 12);
    }
    const gain = audioCtx.createGain();
    const normalizedVelocity = Math.max(0, Math.min(127, Number(velocity) || 127)) / 127;
    const dynamicMultiplier = getShortEndingDynamicMultiplier({
      endingCue: options.endingCue,
      timeBeats: options.timeBeats,
      beatsPerBar: options.beatsPerBar,
      isFinalEnding: options.endingStyle === 'short',
      targetMultiplier: options.endingAccentMultiplier,
      finalAccentMultiplier: options.endingFinalAccentMultiplier,
      leadMeasures: options.endingCrescendoLeadMeasures
    });
    const noteGain = bassGain * normalizedVelocity * dynamicMultiplier;
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(noteGain, time + bassNoteAttack);

    if (Number.isFinite(options.tailFadeTimeConstant) && options.tailFadeTimeConstant > 0 && noteDuration) {
      gain.gain.setValueAtTime(noteGain, Math.max(time + bassNoteAttack, time + noteDuration));
      scheduleBassTailFade(gain, time + noteDuration, options.tailFadeTimeConstant);
    } else if (sustainedMaxDuration && buffer.duration > sustainedMaxDuration - currentNoteFadeOut) {
      const fadeStart = time + sustainedMaxDuration - currentNoteFadeOut;
      gain.gain.setValueAtTime(noteGain, Math.max(time + bassNoteAttack, fadeStart));
      scheduleBassGainRelease(gain, fadeStart, time + sustainedMaxDuration);
    }

    src.connect(gain).connect(destination);
    src.start(time);
    trackScheduledSource(src, [gain]);
    setActiveNoteGain(gain);
    setActiveNoteFadeOut(currentNoteFadeOut);
  }

  function scheduleSampleSegment(
    buffer: AudioBuffer,
    destination: AudioNode,
    startTime: number,
    offset: number,
    duration: number,
    fadeInDuration = 0,
    fadeOutDuration = 0
  ) {
    const audioCtx = getAudioContext();
    if (!audioCtx) return null;

    const src = audioCtx.createBufferSource() as PlaybackTrackedAudioSource;
    src.buffer = buffer;

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

  function playLoopedStringSample(
    buffer: AudioBuffer,
    time: number,
    fadeEnd: number,
    volume: number
  ): PlaybackPlayableVoice | null {
    const audioCtx = getAudioContext();
    const destination = getMixerDestination('strings');
    if (!audioCtx || !destination) return null;

    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(volume, time);
    const detuneParams: AudioParam[] = [];

    const loopEnd = Math.min(stringLoopEnd, buffer.duration);
    const loopLength = loopEnd - stringLoopStart;
    const crossfade = Math.min(stringLoopCrossfade, loopLength / 2);
    const loopStarts: number[] = [];

    for (let start = time + loopEnd - crossfade; start < fadeEnd; start += loopLength - crossfade) {
      loopStarts.push(start);
    }

    const sources: PlaybackTrackedAudioSource[] = [];
    const hasLoopSegments = loopStarts.length > 0;
    const firstSource = scheduleSampleSegment(
      buffer,
      gain,
      time,
      0,
      loopEnd,
      0,
      hasLoopSegments ? crossfade : 0
    );
    if (!firstSource) return null;
    sources.push(firstSource);
    detuneParams.push(firstSource.detune);

    loopStarts.forEach((start, index) => {
      const hasNextSegment = index < loopStarts.length - 1;
      const loopSource = scheduleSampleSegment(
        buffer,
        gain,
        start,
        stringLoopStart,
        loopLength,
        crossfade,
        hasNextSegment ? crossfade : 0
      );
      if (!loopSource) return;
      sources.push(loopSource);
      detuneParams.push(loopSource.detune);
    });

    const stop = (stopTime: number) => {
      for (const source of sources) {
        stopAudioSourceSafely(source, stopTime);
      }
    };

    stop(fadeEnd);
    gain.connect(destination);
    return {
      detuneParams,
      gain,
      volume,
      audibleUntil: fadeEnd,
      endAnchor: sources[sources.length - 1],
      stop
    };
  }

  function playSample(
    category: string,
    midi: number,
    time: number,
    maxDuration: number,
    volume: number,
    options: PlaybackPlaySampleOptions = {}
  ): PlaybackPlayableVoice | null {
    const audioCtx = getAudioContext();
    if (!audioCtx) return null;

    const sampleKey = category === 'piano' && options.layer ? `${options.layer}:${midi}` : midi;
    const buffer = sampleBuffers[category]?.[sampleKey] || sampleBuffers[category]?.[midi];
    if (!buffer) {
      if (category === 'piano') {
        const warningKey = `${sampleKey}`;
        if (!missingPianoPlaybackWarnings.has(warningKey)) {
          missingPianoPlaybackWarnings.add(warningKey);
          console.warn('[audio-sample] piano-playback-missing-buffer', {
            midi,
            layer: options.layer ?? null,
            sampleKey,
            hasMidiFallback: Boolean(sampleBuffers.piano?.[midi]),
            loadedPianoKeyCount: Object.keys(sampleBuffers.piano || {}).length,
            loadedPianoKeysPreview: Object.keys(sampleBuffers.piano || {}).slice(0, 24)
          });
        }
        if (options.layer) {
          loadPianoSample(options.layer, midi).catch((error) => {
            console.warn('[audio-sample] piano-missing-buffer-reload-failed', {
              midi,
              layer: options.layer,
              sampleKey,
              error: error instanceof Error ? error.message : String(error)
            });
          });
        }
      }
      return null;
    }
    touchSampleBuffer(category, sampleBuffers[category]?.[sampleKey] ? sampleKey : midi);

    const naturalEndTime = time + buffer.duration;
    const isStringSample = category === 'cello' || category === 'violin';
    const loopEnd = Math.min(stringLoopEnd, buffer.duration);
    const canLoop = isStringSample && loopEnd > stringLoopStart;
    const destination = getMixerDestination(category === 'bass' ? 'bass' : 'strings');
    if (!destination) return null;

    if (maxDuration) {
      if (category === 'piano') {
        const { fadeBefore, timeConstant } = getPianoFadeProfile(midi, volume, maxDuration);
        const isLegato = Boolean(options.legato);
        const fadeStart = isLegato ? (time + maxDuration) : Math.max(time, time + maxDuration - fadeBefore);
        const fadeEnd = isLegato ? (fadeStart + Math.max(0.03, timeConstant * 3.5)) : (time + maxDuration);

        const src = audioCtx.createBufferSource() as PlaybackTrackedAudioSource;
        src.buffer = buffer;
        const gain = audioCtx.createGain();
        gain.gain.setValueAtTime(volume, time);
        gain.gain.setValueAtTime(volume, fadeStart);
        gain.gain.setTargetAtTime(0.0001, fadeStart, timeConstant);
        src.connect(gain).connect(destination);
        src.start(time);
        trackScheduledSource(src, [gain]);
        return {
          detuneParams: [src.detune],
          gain,
          midi,
          category,
          key: `${category}:${sampleKey}`,
          volume,
          audibleUntil: Math.min(naturalEndTime, fadeEnd),
          endAnchor: src,
          stop: (stopTime: number) => stopAudioSourceSafely(src, stopTime)
        };
      }

      const fadeStart = time + maxDuration - chordFadeBefore;
      const fadeEnd = fadeStart + chordFadeDuration;
      const needsLoop = canLoop && maxDuration > buffer.duration;

      if (needsLoop) {
        const activeVoice = playLoopedStringSample(buffer, time, fadeEnd, volume);
        if (!activeVoice) return null;
        activeVoice.midi = midi;
        activeVoice.category = category;
        activeVoice.key = `${category}:${midi}`;
        activeVoice.gain.gain.setValueAtTime(volume, fadeStart);
        activeVoice.gain.gain.linearRampToValueAtTime(0, fadeEnd);
        return activeVoice;
      }

      const src = audioCtx.createBufferSource() as PlaybackTrackedAudioSource;
      src.buffer = buffer;
      const gain = audioCtx.createGain();
      gain.gain.setValueAtTime(volume, time);
      gain.gain.setValueAtTime(volume, fadeStart);
      gain.gain.linearRampToValueAtTime(0, fadeEnd);
      src.connect(gain).connect(destination);
      src.start(time);
      trackScheduledSource(src, [gain]);
      return {
        detuneParams: [src.detune],
        gain,
        midi,
        category,
        key: `${category}:${sampleKey}`,
        volume,
        audibleUntil: Math.min(naturalEndTime, fadeEnd),
        endAnchor: src,
        stop: (stopTime: number) => stopAudioSourceSafely(src, stopTime)
      };
    }

    const src = audioCtx.createBufferSource() as PlaybackTrackedAudioSource;
    src.buffer = buffer;
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(volume, time);
    src.connect(gain).connect(destination);
    src.start(time);
    trackScheduledSource(src, [gain]);
    return {
      detuneParams: [src.detune],
      gain,
      midi,
      category,
      key: `${category}:${sampleKey}`,
      volume,
      audibleUntil: naturalEndTime,
      endAnchor: src,
      stop: (stopTime: number) => stopAudioSourceSafely(src, stopTime)
    };
  }

  return {
    getNearestLoadedBassSampleMidi,
    getAdaptiveBassFadeDuration,
    scheduleBassGainRelease,
    playNote,
    scheduleSampleSegment,
    playLoopedStringSample,
    playSample
  };
}


