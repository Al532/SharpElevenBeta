// @ts-check

/** @typedef {import('../../core/types/contracts').EmbeddedRuntimeBindings} EmbeddedRuntimeBindings */
/** @typedef {import('../../core/types/contracts').EmbeddedPlaybackRuntimeState} EmbeddedPlaybackRuntimeState */
/** @typedef {import('../../core/types/contracts').DrillPlaybackAssemblyProvider} DrillPlaybackAssemblyProvider */
/** @typedef {import('../../core/types/contracts').DrillPlaybackControllerOptions} DrillPlaybackControllerOptions */
/** @typedef {import('../../core/types/contracts').EmbeddedPatternAdapterOptions} EmbeddedPatternAdapterOptions */
/** @typedef {import('../../core/types/contracts').EmbeddedPlaybackSettingsAdapterOptions} EmbeddedPlaybackSettingsAdapterOptions */
/** @typedef {import('../../core/types/contracts').EmbeddedPlaybackStateOptions} EmbeddedPlaybackStateOptions */
/** @typedef {import('../../core/types/contracts').PublishedEmbeddedPlaybackAssemblyProvider} PublishedEmbeddedPlaybackAssemblyProvider */

import { createDrillPlaybackAssemblyProvider } from '../../core/playback/drill-playback-assembly-provider.js';
import { createPublishedEmbeddedPlaybackAssemblyProvider } from '../../core/playback/published-embedded-playback-assembly-provider.js';
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
 *   patternAdapterOptions?: EmbeddedPatternAdapterOptions,
 *   playbackSettingsAdapterOptions?: EmbeddedPlaybackSettingsAdapterOptions,
 *   playbackStateOptions?: EmbeddedPlaybackStateOptions,
 *   playbackControllerOptions?: DrillPlaybackControllerOptions,
 *   playbackAssemblyProvider?: DrillPlaybackAssemblyProvider | null,
 *   publishedPlaybackAssemblyProvider?: PublishedEmbeddedPlaybackAssemblyProvider | null,
 *   createPlaybackAssemblyProvider?: ((bindings: {
 *     applyEmbeddedPattern: ReturnType<typeof createEmbeddedPatternAdapter>,
 *     applyEmbeddedPlaybackSettings: ReturnType<typeof createEmbeddedPlaybackSettingsAdapter>,
 *     getEmbeddedPlaybackState: ReturnType<typeof createEmbeddedPlaybackStateGetter>
 *   }) => DrillPlaybackAssemblyProvider) | null,
 *   createPublishedPlaybackAssemblyProvider?: ((bindings: {
 *     playbackAssemblyProvider: DrillPlaybackAssemblyProvider,
 *     applyEmbeddedPattern: ReturnType<typeof createEmbeddedPatternAdapter>,
 *     getEmbeddedPlaybackState: ReturnType<typeof createEmbeddedPlaybackStateGetter>
 *   }) => PublishedEmbeddedPlaybackAssemblyProvider) | null
 * }} [options]
 * @returns {EmbeddedRuntimeBindings}
 */
export function initializeEmbeddedDrillRuntime({
  patternAdapterOptions,
  playbackSettingsAdapterOptions,
  playbackStateOptions,
  playbackControllerOptions,
  playbackAssemblyProvider,
  publishedPlaybackAssemblyProvider,
  createPlaybackAssemblyProvider,
  createPublishedPlaybackAssemblyProvider
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

  const resolvedPublishedPlaybackAssemblyProvider =
    publishedPlaybackAssemblyProvider
    || createPublishedPlaybackAssemblyProvider?.({
      playbackAssemblyProvider: resolvedPlaybackAssemblyProvider,
      applyEmbeddedPattern,
      getEmbeddedPlaybackState
    })
    || createPublishedEmbeddedPlaybackAssemblyProvider({
      createPlaybackAssembly() {
        const assembly = resolvedPlaybackAssemblyProvider.getAssembly();
        return {
          playbackRuntime: assembly.playbackRuntime,
          applyEmbeddedPattern,
          getPlaybackState: getEmbeddedPlaybackState
        };
      }
    });

  const {
    playbackRuntime,
    playbackController
  } = resolvedPlaybackAssemblyProvider.getAssembly();

  bootstrapEmbeddedDrillApi({
    playbackRuntime,
    playbackController,
    applyEmbeddedPattern,
    getPlaybackState: getEmbeddedPlaybackState,
    publishedPlaybackAssemblyProvider: resolvedPublishedPlaybackAssemblyProvider
  });

  return {
    playbackRuntime,
    playbackController,
    applyEmbeddedPattern,
    applyEmbeddedPlaybackSettings,
    getEmbeddedPlaybackState
  };
}
