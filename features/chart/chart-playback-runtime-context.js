// @ts-check

/** @typedef {import('../../core/types/contracts').ChartPlaybackController} ChartPlaybackController */
/** @typedef {import('../../core/types/contracts').ChartPlaybackBridgeMode} ChartPlaybackBridgeMode */
/** @typedef {import('../../core/types/contracts').ChartPlaybackControllerOptions} ChartPlaybackControllerOptions */
/** @typedef {import('../../core/types/contracts').ChartScreenState} ChartScreenState */
/** @typedef {import('../../core/types/contracts').DirectPlaybackControllerOptions} DirectPlaybackControllerOptions */
/** @typedef {import('../../core/types/contracts').PlaybackBridgeProvider} PlaybackBridgeProvider */
/** @typedef {import('../../core/types/contracts').PlaybackSettings} PlaybackSettings */
/** @typedef {import('../../core/types/contracts').PracticeSessionSpec} PracticeSessionSpec */

import {
  createChartPlaybackBridgeProviderForMode,
  createChartPlaybackControllerOptions
} from './chart-playback-bridge.js';
import { createChartPlaybackController } from './chart-playback-controller.js';

/**
 * Creates the chart playback runtime context used by the chart screen. This
 * keeps provider/controller memoization out of `chart-dev/main.js` while
 * preserving the current runtime behavior.
 *
 * @param {{
 *   state: ChartScreenState & {
 *     chartPlaybackBridgeProvider?: PlaybackBridgeProvider | null,
 *     chartPlaybackController?: ChartPlaybackController | null
 *   },
 *   mode?: ChartPlaybackBridgeMode,
 *   directPlaybackOptions?: DirectPlaybackControllerOptions,
 *   playbackBridgeFrame?: HTMLIFrameElement | null,
 *   getPlaybackBridgeFrame?: () => HTMLIFrameElement | null,
 *   getTempo?: () => number,
 *   getCurrentChartTitle?: () => string,
 *   getSelectedPracticeSession?: () => PracticeSessionSpec | null,
 *   getPlaybackSettings?: () => PlaybackSettings,
 *   getCurrentBarCount?: () => number,
 *   setActivePlaybackPosition?: (barId: string | null, entryIndex: number) => void,
 *   resetActivePlaybackPosition?: () => void,
 *   renderTransport?: () => void,
 *   updateActiveHighlights?: () => void,
 *   onTransportStatus?: (message: string) => void,
 *   onPersistPlaybackSettings?: () => void
 * }} options
 * @returns {{
 *   getPlaybackBridgeProvider: () => PlaybackBridgeProvider,
 *   getPlaybackController: () => ChartPlaybackController
 * }}
 */
export function createChartPlaybackRuntimeContext({
  state,
  mode = 'embedded',
  directPlaybackOptions,
  playbackBridgeFrame,
  getPlaybackBridgeFrame,
  getTempo,
  getCurrentChartTitle,
  getSelectedPracticeSession,
  getPlaybackSettings,
  getCurrentBarCount,
  setActivePlaybackPosition,
  resetActivePlaybackPosition,
  renderTransport,
  updateActiveHighlights,
  onTransportStatus,
  onPersistPlaybackSettings
}) {
  const resolvePlaybackBridgeFrame = () => getPlaybackBridgeFrame?.() || playbackBridgeFrame || null;

  /** @returns {PlaybackBridgeProvider} */
  function getPlaybackBridgeProvider() {
    if (state.chartPlaybackBridgeProvider) {
      return state.chartPlaybackBridgeProvider;
    }

    state.chartPlaybackBridgeProvider = createChartPlaybackBridgeProviderForMode({
      mode,
      directPlaybackOptions,
      bridgeFrame: resolvePlaybackBridgeFrame(),
      getTempo,
      getCurrentChartTitle
    });

    return state.chartPlaybackBridgeProvider;
  }

  /** @returns {ChartPlaybackController} */
  function getPlaybackController() {
    if (state.chartPlaybackController) {
      return state.chartPlaybackController;
    }

    state.chartPlaybackController = /** @type {ChartPlaybackController} */ (createChartPlaybackController(
      createChartPlaybackControllerOptions(/** @type {ChartPlaybackControllerOptions} */ ({
        bridgeFrame: resolvePlaybackBridgeFrame(),
        playbackBridgeProvider: getPlaybackBridgeProvider(),
        getSelectedPracticeSession,
        getPlaybackSettings,
        getTempo,
        getCurrentChartTitle,
        getCurrentBarCount,
        setActivePlaybackPosition,
        resetActivePlaybackPosition,
        renderTransport,
        updateActiveHighlights,
        onTransportStatus,
        onPersistPlaybackSettings
      }))
    ));

    return state.chartPlaybackController;
  }

  return {
    getPlaybackBridgeProvider,
    getPlaybackController
  };
}
