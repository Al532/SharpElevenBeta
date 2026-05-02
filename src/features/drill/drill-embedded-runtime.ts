import type {
  PracticePlaybackAssemblyProvider,
  PracticePlaybackControllerOptions,
  EmbeddedPatternAdapterOptions,
  EmbeddedPlaybackSettingsAdapterOptions,
  EmbeddedPlaybackRuntimeState,
  EmbeddedPlaybackStateOptions,
  EmbeddedRuntimeBindings,
  PublishedEmbeddedPlaybackAssemblyProvider
} from '../../core/types/contracts';

import { createPracticePlaybackAssemblyProvider } from '../../core/playback/practice-playback-assembly-provider.js';
import { createPublishedEmbeddedPlaybackAssemblyProvider } from '../../core/playback/published-embedded-playback-assembly-provider.js';
import {
  createEmbeddedPatternAdapter,
  createEmbeddedPlaybackSettingsAdapter
} from './drill-embedded-session.js';
import { bootstrapEmbeddedPlaybackBridge } from './drill-embedded-bootstrap.js';

export function normalizeEmbeddedVolume(value: unknown): string | null {
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
}: {
  isEmbeddedMode?: boolean;
  getIsPlaying?: () => boolean;
  getIsPaused?: () => boolean;
  getIsIntro?: () => boolean;
  getCurrentBeat?: () => number;
  getCurrentChordIdx?: () => number;
  getPaddedChordCount?: () => number;
  getCurrentPatternString?: () => string;
  getCurrentPatternMode?: () => string;
  getPatternErrorText?: () => string;
  hasPatternError?: () => boolean;
  getTempo?: () => number;
  getSwingRatio?: () => number;
} = {}): () => EmbeddedPlaybackRuntimeState {
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

export function initializeEmbeddedPracticeRuntime({
  patternAdapterOptions,
  playbackSettingsAdapterOptions,
  playbackStateOptions,
  playbackControllerOptions,
  playbackAssemblyProvider,
  publishedPlaybackAssemblyProvider,
  createPlaybackAssemblyProvider,
  createPublishedPlaybackAssemblyProvider
}: {
  patternAdapterOptions?: EmbeddedPatternAdapterOptions;
  playbackSettingsAdapterOptions?: EmbeddedPlaybackSettingsAdapterOptions;
  playbackStateOptions?: EmbeddedPlaybackStateOptions;
  playbackControllerOptions?: PracticePlaybackControllerOptions;
  playbackAssemblyProvider?: PracticePlaybackAssemblyProvider | null;
  publishedPlaybackAssemblyProvider?: PublishedEmbeddedPlaybackAssemblyProvider | null;
  createPlaybackAssemblyProvider?: ((bindings: {
    applyEmbeddedPattern: ReturnType<typeof createEmbeddedPatternAdapter>;
    applyEmbeddedPlaybackSettings: ReturnType<typeof createEmbeddedPlaybackSettingsAdapter>;
    getEmbeddedPlaybackState: ReturnType<typeof createEmbeddedPlaybackStateGetter>;
  }) => PracticePlaybackAssemblyProvider) | null;
  createPublishedPlaybackAssemblyProvider?: ((bindings: {
    playbackAssemblyProvider: PracticePlaybackAssemblyProvider;
    applyEmbeddedPattern: ReturnType<typeof createEmbeddedPatternAdapter>;
    getEmbeddedPlaybackState: ReturnType<typeof createEmbeddedPlaybackStateGetter>;
  }) => PublishedEmbeddedPlaybackAssemblyProvider) | null;
} = {}): EmbeddedRuntimeBindings {
  const applyEmbeddedPlaybackSettings = createEmbeddedPlaybackSettingsAdapter({
    ...playbackSettingsAdapterOptions,
    normalizeEmbeddedVolume
  });

  const applyEmbeddedPattern = createEmbeddedPatternAdapter({
    ...patternAdapterOptions,
    applyEmbeddedPlaybackSettings
  });

  const getEmbeddedPlaybackState = createEmbeddedPlaybackStateGetter(playbackStateOptions);
  const queuePerformanceCue = (cue) => resolvedPlaybackAssemblyProvider.getAssembly().playbackController.queuePerformanceCue(cue);

  const resolvedPlaybackAssemblyProvider =
    playbackAssemblyProvider
    || createPlaybackAssemblyProvider?.({
      applyEmbeddedPattern,
      applyEmbeddedPlaybackSettings,
      getEmbeddedPlaybackState
    })
    || createPracticePlaybackAssemblyProvider({
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
          queuePerformanceCue,
          getPlaybackState: getEmbeddedPlaybackState
        };
      }
    });

  const {
    playbackRuntime,
    playbackController
  } = resolvedPlaybackAssemblyProvider.getAssembly();

  bootstrapEmbeddedPlaybackBridge({
    playbackRuntime,
    playbackController,
    applyEmbeddedPattern,
    queuePerformanceCue,
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
