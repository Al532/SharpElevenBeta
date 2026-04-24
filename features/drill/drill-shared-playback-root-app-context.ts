
import {
  createDrillSharedPlaybackDirectRuntimeAppContext,
  createDrillSharedPlaybackDirectStateAppContext,
  createDrillSharedPlaybackDirectTransportAppContext,
  createDrillSharedPlaybackEmbeddedRuntimeAppContext,
  createDrillSharedPlaybackEmbeddedStateAppContext,
  createDrillSharedPlaybackHostAppContext,
  createDrillSharedPlaybackNormalizationAppContext,
  createDrillSharedPlaybackPatternUiAppContext,
  createDrillSharedPlaybackSettingsAppContext
} from './drill-shared-playback-app-context.js';
import type {
  DrillSharedPlaybackHostBindings,
  DrillSharedPlaybackNormalizationBindings,
  DrillSharedPlaybackPatternUiBindings,
  DrillSharedPlaybackRuntimeBindings,
  DrillSharedPlaybackSettingsBindings,
  DrillSharedPlaybackStateBindings,
  DrillSharedPlaybackTransportBindings
} from './drill-shared-playback-types.js';

type CreateDrillSharedPlaybackRootAppContextOptions = {
  host?: DrillSharedPlaybackHostBindings;
  patternUi?: DrillSharedPlaybackPatternUiBindings;
  normalization?: DrillSharedPlaybackNormalizationBindings;
  playbackSettings?: DrillSharedPlaybackSettingsBindings;
  embeddedPlaybackState?: DrillSharedPlaybackStateBindings;
  embeddedPlaybackRuntime?: DrillSharedPlaybackRuntimeBindings;
  embeddedTransportActions?: DrillSharedPlaybackTransportBindings;
  directPlaybackRuntime?: DrillSharedPlaybackRuntimeBindings;
  directPlaybackState?: DrillSharedPlaybackStateBindings;
  directTransportActions?: DrillSharedPlaybackTransportBindings;
};

type DrillSharedPlaybackTempoDom = {
  tempoSlider?: { value?: string | number | null };
};

type DrillSharedPlaybackLegacyHostBindings = {
  dom?: DrillSharedPlaybackTempoDom;
  state?: DrillSharedPlaybackHostBindings;
  constants?: {
    customPatternOptionValue?: string;
  };
  helpers?: {
    setSuppressPatternSelectChange?: (value: boolean) => void;
    setPatternSelectValue?: (value: string) => void;
    setEditorPatternMode?: (value: string) => void;
    syncPatternSelectionFromInput?: () => void;
    startPlayback?: () => Promise<void> | void;
    stopPlayback?: () => void;
    togglePausePlayback?: () => void;
  };
};

type DrillSharedPlaybackLegacyPatternUiBindings = {
  helpers?: DrillSharedPlaybackPatternUiBindings;
};

type DrillSharedPlaybackLegacyDirectRuntimeBindings = {
  state?: Pick<DrillSharedPlaybackRuntimeBindings, 'getAudioContext' | 'getCurrentKey'>;
  constants?: Pick<DrillSharedPlaybackRuntimeBindings, 'noteFadeout'>;
  helpers?: Omit<DrillSharedPlaybackRuntimeBindings, 'getAudioContext' | 'getCurrentKey' | 'noteFadeout'>;
};

function hasTempoHostBindings(host: DrillSharedPlaybackHostBindings | DrillSharedPlaybackLegacyHostBindings): host is DrillSharedPlaybackHostBindings {
  return typeof (host as DrillSharedPlaybackHostBindings).getTempo === 'function';
}

function hasResolvedPatternUiBindings(patternUi: DrillSharedPlaybackPatternUiBindings | DrillSharedPlaybackLegacyPatternUiBindings): patternUi is DrillSharedPlaybackPatternUiBindings {
  return typeof (patternUi as DrillSharedPlaybackPatternUiBindings).getCurrentPatternMode === 'function'
    || typeof (patternUi as DrillSharedPlaybackPatternUiBindings).validateCustomPattern === 'function';
}

function hasResolvedDirectRuntimeBindings(directPlaybackRuntime: DrillSharedPlaybackRuntimeBindings | DrillSharedPlaybackLegacyDirectRuntimeBindings): directPlaybackRuntime is DrillSharedPlaybackRuntimeBindings {
  return Object.prototype.hasOwnProperty.call(directPlaybackRuntime, 'noteFadeout');
}

/**
 * Creates the shared playback root app context from live root-app bindings.
 * This keeps the host/pattern/runtime sub-context construction out of `app.js`
 * while preserving the same embedded/direct playback wiring contracts.
 *
 * @param {object} [options]
 * @param {Record<string, any>} [options.host]
 * @param {Record<string, any>} [options.patternUi]
 * @param {Record<string, any>} [options.normalization]
 * @param {Record<string, any>} [options.playbackSettings]
 * @param {Record<string, any>} [options.embeddedPlaybackState]
 * @param {Record<string, any>} [options.embeddedPlaybackRuntime]
 * @param {Record<string, any>} [options.embeddedTransportActions]
 * @param {Record<string, any>} [options.directPlaybackRuntime]
 * @param {Record<string, any>} [options.directPlaybackState]
 * @param {Record<string, any>} [options.directTransportActions]
 */
export function createDrillSharedPlaybackRootAppContext({
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
}: CreateDrillSharedPlaybackRootAppContextOptions = {}) {
  const resolvedHost = (() => {
    if (hasTempoHostBindings(host)) return host;

    const {
      dom = {},
      state = {},
      constants = {},
      helpers = {}
    } = host as DrillSharedPlaybackLegacyHostBindings;
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

    const { helpers = {} } = patternUi as DrillSharedPlaybackLegacyPatternUiBindings;
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
      validateCustomPattern = () => true,
      getCurrentPatternString = () => '',
      getCurrentPatternMode = () => ''
    } = helpers;

    return {
      clearProgressionEditingState,
      closeProgressionManager,
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
    } = directPlaybackRuntime as DrillSharedPlaybackLegacyDirectRuntimeBindings;
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
    host: createDrillSharedPlaybackHostAppContext(resolvedHost),
    patternUi: createDrillSharedPlaybackPatternUiAppContext(resolvedPatternUi),
    normalization: createDrillSharedPlaybackNormalizationAppContext(normalization),
    playbackSettings: createDrillSharedPlaybackSettingsAppContext(playbackSettings),
    embeddedPlaybackState: createDrillSharedPlaybackEmbeddedStateAppContext(embeddedPlaybackState),
    embeddedPlaybackRuntime: createDrillSharedPlaybackEmbeddedRuntimeAppContext(embeddedPlaybackRuntime),
    embeddedTransportActions,
    directPlaybackRuntime: createDrillSharedPlaybackDirectRuntimeAppContext(resolvedDirectRuntime),
    directPlaybackState: createDrillSharedPlaybackDirectStateAppContext(directPlaybackState),
    directTransportActions: createDrillSharedPlaybackDirectTransportAppContext(directTransportActions)
  };
}


