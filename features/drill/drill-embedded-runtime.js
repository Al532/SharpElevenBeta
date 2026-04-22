// @ts-check

/** @typedef {import('../../core/types/contracts').EmbeddedRuntimeBindings} EmbeddedRuntimeBindings */
/** @typedef {import('../../core/types/contracts').EmbeddedPlaybackRuntimeState} EmbeddedPlaybackRuntimeState */
/** @typedef {import('../../core/types/contracts').DrillPlaybackAssemblyProvider} DrillPlaybackAssemblyProvider */

import { createDrillPlaybackAssemblyProvider } from '../../core/playback/drill-playback-assembly-provider.js';
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

/**
 * @param {{
 *   isEmbeddedMode?: boolean,
 *   getIsPlaying?: () => boolean,
 *   getIsPaused?: () => boolean,
 *   getIsIntro?: () => boolean,
 *   getCurrentBeat?: () => number,
 *   getCurrentChordIdx?: () => number,
 *   getPaddedChordCount?: () => number,
 *   getCurrentPatternString?: () => string,
 *   getCurrentPatternMode?: () => string,
 *   getPatternErrorText?: () => string,
 *   hasPatternError?: () => boolean,
 *   getTempo?: () => number,
 *   getSwingRatio?: () => number
 * }} [options]
 * @returns {() => EmbeddedPlaybackRuntimeState}
 */
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
      sessionId: '',
      errorMessage: null,
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

/**
 * @param {{
 *   patternAdapterOptions?: Record<string, unknown>,
 *   playbackSettingsAdapterOptions?: Record<string, unknown>,
 *   playbackStateOptions?: Record<string, unknown>,
 *   playbackControllerOptions?: Record<string, unknown>,
 *   playbackAssemblyProvider?: DrillPlaybackAssemblyProvider | null,
 *   createPlaybackAssemblyProvider?: ((bindings: {
 *     applyEmbeddedPattern: ReturnType<typeof createEmbeddedPatternAdapter>,
 *     applyEmbeddedPlaybackSettings: ReturnType<typeof createEmbeddedPlaybackSettingsAdapter>,
 *     getEmbeddedPlaybackState: ReturnType<typeof createEmbeddedPlaybackStateGetter>
 *   }) => DrillPlaybackAssemblyProvider) | null
 * }} [options]
 * @returns {EmbeddedRuntimeBindings}
 */
export function initializeEmbeddedDrillRuntime({
  patternAdapterOptions,
  playbackSettingsAdapterOptions,
  playbackStateOptions,
  playbackControllerOptions,
  playbackAssemblyProvider,
  createPlaybackAssemblyProvider
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

  const resolvedPlaybackAssemblyProvider =
    playbackAssemblyProvider
    || createPlaybackAssemblyProvider?.({
      applyEmbeddedPattern,
      applyEmbeddedPlaybackSettings,
      getEmbeddedPlaybackState
    })
    || createDrillPlaybackAssemblyProvider({
      ...playbackControllerOptions,
      applyEmbeddedPattern,
      applyEmbeddedPlaybackSettings,
      getEmbeddedPlaybackState
    });

  const {
    playbackRuntime,
    playbackController
  } = resolvedPlaybackAssemblyProvider.getAssembly();

  bootstrapEmbeddedDrillApi({
    playbackRuntime,
    playbackController,
    applyEmbeddedPattern,
    getPlaybackState: getEmbeddedPlaybackState
  });

  return {
    playbackRuntime,
    playbackController,
    applyEmbeddedPattern,
    applyEmbeddedPlaybackSettings,
    getEmbeddedPlaybackState
  };
}
