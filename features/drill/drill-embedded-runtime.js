import { createDrillPlaybackController } from './drill-playback-controller.js';
import {
  createEmbeddedPatternAdapter,
  createEmbeddedPlaybackSettingsAdapter
} from './drill-embedded-session.js';
import { bootstrapEmbeddedDrillApi } from './drill-embedded-bootstrap.js';

export function normalizeEmbeddedVolume(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return String(Math.max(0, Math.min(100, Math.round(parsed))));
}

export function createEmbeddedPlaybackStateGetter({
  isEmbeddedMode,
  getIsPlaying,
  getIsPaused,
  getIsIntro,
  getCurrentBeat,
  getCurrentChordIdx,
  getPaddedChordCount,
  getCurrentPatternString,
  getCurrentPatternMode,
  getPatternErrorText,
  hasPatternError,
  getTempo,
  getSwingRatio
} = {}) {
  return function getEmbeddedPlaybackState() {
    return {
      isEmbeddedMode: Boolean(isEmbeddedMode),
      isPlaying: Boolean(getIsPlaying?.()),
      isPaused: Boolean(getIsPaused?.()),
      isIntro: Boolean(getIsIntro?.()),
      currentBeat: Number(getCurrentBeat?.() || 0),
      currentChordIdx: Number(getCurrentChordIdx?.() || 0),
      paddedChordCount: Number(getPaddedChordCount?.() || 0),
      currentPatternString: getCurrentPatternString?.() || '',
      currentPatternMode: getCurrentPatternMode?.() || 'both',
      patternError: hasPatternError?.()
        ? String(getPatternErrorText?.() || '')
        : null,
      tempo: Number(getTempo?.() || 0),
      swingRatio: Number(getSwingRatio?.() || 0)
    };
  };
}

export function initializeEmbeddedDrillRuntime({
  patternAdapterOptions,
  playbackSettingsAdapterOptions,
  playbackStateOptions,
  playbackControllerOptions
} = {}) {
  const applyEmbeddedPlaybackSettings = createEmbeddedPlaybackSettingsAdapter({
    ...playbackSettingsAdapterOptions,
    normalizeEmbeddedVolume
  });

  const applyEmbeddedPattern = createEmbeddedPatternAdapter({
    ...patternAdapterOptions,
    applyEmbeddedPlaybackSettings
  });

  const getEmbeddedPlaybackState = createEmbeddedPlaybackStateGetter(playbackStateOptions);

  const playbackController = createDrillPlaybackController({
    ...playbackControllerOptions,
    applyEmbeddedPattern,
    applyEmbeddedPlaybackSettings,
    getEmbeddedPlaybackState
  });

  bootstrapEmbeddedDrillApi({
    playbackController,
    applyEmbeddedPattern,
    getPlaybackState: getEmbeddedPlaybackState
  });

  return {
    playbackController,
    applyEmbeddedPattern,
    applyEmbeddedPlaybackSettings,
    getEmbeddedPlaybackState
  };
}
