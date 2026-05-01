
import {
  createPracticePlaybackDirectRuntimeAppContext,
  createPracticePlaybackDirectStateAppContext,
  createPracticePlaybackDirectTransportAppContext,
  createPracticePlaybackEmbeddedRuntimeAppContext,
  createPracticePlaybackEmbeddedStateAppContext,
  createPracticePlaybackHostAppContext,
  createPracticePlaybackNormalizationAppContext,
  createPracticePlaybackPatternUiAppContext,
  createPracticePlaybackSettingsAppContext
} from './practice-playback-app-context.js';
import type {
  PracticePlaybackHostBindings,
  PracticePlaybackNormalizationBindings,
  PracticePlaybackPatternUiBindings,
  PracticePlaybackRuntimeBindings,
  PracticePlaybackSettingsBindings,
  PracticePlaybackStateBindings,
  PracticePlaybackTransportBindings
} from './practice-playback-types.js';

type CreatePracticePlaybackRootAppContextOptions = {
  host?: PracticePlaybackHostBindings;
  patternUi?: PracticePlaybackPatternUiBindings;
  normalization?: PracticePlaybackNormalizationBindings;
  playbackSettings?: PracticePlaybackSettingsBindings;
  embeddedPlaybackState?: PracticePlaybackStateBindings;
  embeddedPlaybackRuntime?: PracticePlaybackRuntimeBindings;
  embeddedTransportActions?: PracticePlaybackTransportBindings;
  directPlaybackRuntime?: PracticePlaybackRuntimeBindings;
  directPlaybackState?: PracticePlaybackStateBindings;
  directTransportActions?: PracticePlaybackTransportBindings;
};

type PracticePlaybackTempoDom = {
  tempoSlider?: { value?: string | number | null };
};

type PracticePlaybackLegacyHostBindings = {
  dom?: PracticePlaybackTempoDom;
  state?: PracticePlaybackHostBindings;
  constants?: {
    customPatternOptionValue?: string;
  };
  helpers?: {
    setSuppressPatternSelectChange?: (value: boolean) => void;
    setPatternSelectValue?: (value: string) => void;
    setEditorPatternMode?: (value: string) => void;
    syncPatternSelectionFromInput?: () => void;
    setPlaybackEndingCue?: PracticePlaybackHostBindings['setPlaybackEndingCue'];
    startPlayback?: () => Promise<void> | void;
    stopPlayback?: () => void;
    togglePausePlayback?: () => void;
  };
};

type PracticePlaybackLegacyPatternUiBindings = {
  helpers?: PracticePlaybackPatternUiBindings;
};

type PracticePlaybackLegacyDirectRuntimeBindings = {
  state?: Pick<PracticePlaybackRuntimeBindings, 'getAudioContext' | 'getCurrentKey'>;
  constants?: Pick<PracticePlaybackRuntimeBindings, 'noteFadeout'>;
  helpers?: Omit<PracticePlaybackRuntimeBindings, 'getAudioContext' | 'getCurrentKey' | 'noteFadeout'>;
};

function hasTempoHostBindings(host: PracticePlaybackHostBindings | PracticePlaybackLegacyHostBindings): host is PracticePlaybackHostBindings {
  return typeof (host as PracticePlaybackHostBindings).getTempo === 'function';
}

function hasResolvedPatternUiBindings(patternUi: PracticePlaybackPatternUiBindings | PracticePlaybackLegacyPatternUiBindings): patternUi is PracticePlaybackPatternUiBindings {
  return typeof (patternUi as PracticePlaybackPatternUiBindings).getCurrentPatternMode === 'function'
    || typeof (patternUi as PracticePlaybackPatternUiBindings).validateCustomPattern === 'function';
}

function hasResolvedDirectRuntimeBindings(directPlaybackRuntime: PracticePlaybackRuntimeBindings | PracticePlaybackLegacyDirectRuntimeBindings): directPlaybackRuntime is PracticePlaybackRuntimeBindings {
  return Object.prototype.hasOwnProperty.call(directPlaybackRuntime, 'noteFadeout');
}

/**
 * Creates the shared playback root app context from live root-app bindings.
 * This keeps the host/pattern/runtime sub-context construction out of `app.js`
 * while preserving the same embedded/direct playback wiring contracts.
 *
 * @param {object} [options]
 * @param {Record<string, unknown>} [options.host]
 * @param {Record<string, unknown>} [options.patternUi]
 * @param {Record<string, unknown>} [options.normalization]
 * @param {Record<string, unknown>} [options.playbackSettings]
 * @param {Record<string, unknown>} [options.embeddedPlaybackState]
 * @param {Record<string, unknown>} [options.embeddedPlaybackRuntime]
 * @param {Record<string, unknown>} [options.embeddedTransportActions]
 * @param {Record<string, unknown>} [options.directPlaybackRuntime]
 * @param {Record<string, unknown>} [options.directPlaybackState]
 * @param {Record<string, unknown>} [options.directTransportActions]
 */
export function createPracticePlaybackRootAppContext({
  host = {},
  patternUi = {},
  normalization = {},
  playbackSettings = {},
  embeddedPlaybackState = {},
  embeddedPlaybackRuntime = {},
  embeddedTransportActions = {},
  directPlaybackRuntime = {},
  directPlaybackState = {},
  directTransportActions = {}
}: CreatePracticePlaybackRootAppContextOptions = {}) {
  const resolvedHost = (() => {
    if (hasTempoHostBindings(host)) return host;

    const {
      dom = {},
      state = {},
      constants = {},
      helpers = {}
    } = host as PracticePlaybackLegacyHostBindings;
    const {
      getLastPatternSelectValue = () => '',
      setLastPatternSelectValue = () => {},
      getIsPlaying = () => false,
      getIsPaused = () => false,
      getIsIntro = () => false,
      getCurrentBeat = () => 0,
      getCurrentChordIdx = () => 0,
      getPaddedChordCount = () => 0,
      getCurrentKey = () => 0,
      getAudioContext = () => null
    } = state;
    const {
      customPatternOptionValue = ''
    } = constants;
    const {
      setSuppressPatternSelectChange = () => {},
      setPatternSelectValue = () => {},
      setEditorPatternMode = () => {},
      syncPatternSelectionFromInput = () => {},
      setPlaybackEndingCue = () => {},
      startPlayback = () => {},
      stopPlayback = () => {},
      togglePausePlayback = () => {}
    } = helpers;

    return {
      customPatternOptionValue,
      setSuppressPatternSelectChange,
      setPatternSelectValue,
      setEditorPatternMode,
      syncPatternSelectionFromInput,
      setPlaybackEndingCue,
      getLastPatternSelectValue,
      setLastPatternSelectValue,
      getIsPlaying,
      getIsPaused,
      getIsIntro,
      getCurrentBeat,
      getCurrentChordIdx,
      getPaddedChordCount,
      getTempo: () => Number(dom.tempoSlider?.value || 0),
      getAudioContext,
      getCurrentKey,
      startPlayback,
      stopPlayback,
      togglePausePlayback
    };
  })();

  const resolvedPatternUi = (() => {
    if (hasResolvedPatternUiBindings(patternUi)) {
      return patternUi;
    }

    const { helpers = {} } = patternUi as PracticePlaybackLegacyPatternUiBindings;
    const {
      clearProgressionEditingState = () => {},
      closeProgressionManager = () => {},
      syncCustomPatternUI = () => {},
      normalizeChordsPerBarForCurrentPattern = () => {},
      applyPatternModeAvailability = () => {},
      syncPatternPreview = () => {},
      applyDisplayMode = () => {},
      applyBeatIndicatorVisibility = () => {},
      applyCurrentHarmonyVisibility = () => {},
      updateKeyPickerLabels = () => {},
      refreshDisplayedHarmony = () => {},
      fitHarmonyDisplay = () => {},
      setPlaybackEndingCue = () => {},
      validateCustomPattern = () => true,
      getCurrentPatternString = () => '',
      getCurrentPatternMode = () => ''
    } = helpers;

    return {
      clearProgressionEditingState,
      closeProgressionManager,
      setPlaybackEndingCue,
      syncCustomPatternUI,
      normalizeChordsPerBarForCurrentPattern,
      applyPatternModeAvailability,
      syncPatternPreview,
      applyDisplayMode,
      applyBeatIndicatorVisibility,
      applyCurrentHarmonyVisibility,
      updateKeyPickerLabels,
      refreshDisplayedHarmony,
      fitHarmonyDisplay,
      validateCustomPattern,
      getCurrentPatternString,
      getCurrentPatternMode
    };
  })();

  const resolvedDirectRuntime = (() => {
    if (hasResolvedDirectRuntimeBindings(directPlaybackRuntime)) {
      return directPlaybackRuntime;
    }

    const {
      state = {},
      constants = {},
      helpers = {}
    } = directPlaybackRuntime as PracticePlaybackLegacyDirectRuntimeBindings;
    const {
      getAudioContext = () => null,
      getCurrentKey = () => 0
    } = state;
    const {
      noteFadeout = 0
    } = constants;
    const {
      ensureWalkingBassGenerator = async () => {},
      stopActiveChordVoices = () => {},
      rebuildPreparedCompingPlans = () => {},
      buildPreparedBassPlan = () => {},
      preloadNearTermSamples = () => Promise.resolve(),
      validateCustomPattern = () => true
    } = helpers;

    return {
      ensureWalkingBassGenerator,
      getAudioContext,
      noteFadeout,
      stopActiveChordVoices,
      rebuildPreparedCompingPlans,
      buildPreparedBassPlan,
      getCurrentKey,
      preloadNearTermSamples,
      validateCustomPattern
    };
  })();

  return {
    host: createPracticePlaybackHostAppContext(resolvedHost),
    patternUi: createPracticePlaybackPatternUiAppContext(resolvedPatternUi),
    normalization: createPracticePlaybackNormalizationAppContext(normalization),
    playbackSettings: createPracticePlaybackSettingsAppContext(playbackSettings),
    embeddedPlaybackState: createPracticePlaybackEmbeddedStateAppContext(embeddedPlaybackState),
    embeddedPlaybackRuntime: createPracticePlaybackEmbeddedRuntimeAppContext(embeddedPlaybackRuntime),
    embeddedTransportActions,
    directPlaybackRuntime: createPracticePlaybackDirectRuntimeAppContext(resolvedDirectRuntime),
    directPlaybackState: createPracticePlaybackDirectStateAppContext(directPlaybackState),
    directTransportActions: createPracticePlaybackDirectTransportAppContext(directTransportActions)
  };
}


