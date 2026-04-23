// @ts-check

import { createDrillSharedPlaybackDirectRuntimeAppContext } from './drill-shared-playback-direct-runtime-app-context.js';
import { createDrillSharedPlaybackDirectStateAppContext } from './drill-shared-playback-direct-state-app-context.js';
import { createDrillSharedPlaybackDirectTransportAppContext } from './drill-shared-playback-direct-transport-app-context.js';
import { createDrillSharedPlaybackEmbeddedRuntimeAppContext } from './drill-shared-playback-embedded-runtime-app-context.js';
import { createDrillSharedPlaybackEmbeddedStateAppContext } from './drill-shared-playback-embedded-state-app-context.js';
import { createDrillSharedPlaybackHostAppContext } from './drill-shared-playback-host-app-context.js';
import { createDrillSharedPlaybackNormalizationAppContext } from './drill-shared-playback-normalization-app-context.js';
import { createDrillSharedPlaybackPatternUiAppContext } from './drill-shared-playback-pattern-ui-app-context.js';
import { createDrillSharedPlaybackSettingsAppContext } from './drill-shared-playback-settings-app-context.js';

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
} = {}) {
  const resolvedHost = (() => {
    if (typeof host.getTempo === 'function') return host;

    const {
      dom = {},
      state = {},
      constants = {},
      helpers = {}
    } = host;
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
    if (typeof patternUi.getCurrentPatternMode === 'function' || typeof patternUi.validateCustomPattern === 'function') {
      return patternUi;
    }

    const { helpers = {} } = patternUi;
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
    if (Object.prototype.hasOwnProperty.call(directPlaybackRuntime, 'noteFadeout')) {
      return directPlaybackRuntime;
    }

    const {
      state = {},
      constants = {},
      helpers = {}
    } = directPlaybackRuntime;
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
