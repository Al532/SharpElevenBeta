// @ts-check

/** @typedef {import('../../core/types/contracts').EmbeddedPatternPayload} EmbeddedPatternPayload */
/** @typedef {import('../../core/types/contracts').ChartPlaybackBridgeOptions} ChartPlaybackBridgeOptions */
/** @typedef {import('../../core/types/contracts').ChartPlaybackControllerOptions} ChartPlaybackControllerOptions */
/** @typedef {import('../../core/types/contracts').DirectPlaybackBridgeProvider} DirectPlaybackBridgeProvider */
/** @typedef {import('../../core/types/contracts').DirectPlaybackControllerOptions} DirectPlaybackControllerOptions */
/** @typedef {import('../../core/types/contracts').EmbeddedPlaybackBridgeProvider} EmbeddedPlaybackBridgeProvider */
/** @typedef {import('../../core/types/contracts').PlaybackSettings} PlaybackSettings */
/** @typedef {import('../../core/types/contracts').PracticeSessionSpec} PracticeSessionSpec */

import { createDirectPlaybackBridgeProvider } from '../../core/playback/direct-playback-bridge-provider.js';
import { createEmbeddedPlaybackBridgeProvider } from '../../core/playback/embedded-playback-bridge-provider.js';

/**
 * Builds the chart-to-playback payload used by the current bridge boundary.
 * Keeping this in one place makes it easier to swap the underlying playback
 * backend later without duplicating the chart-specific payload mapping.
 *
 * @param {{
 *   getTempo?: () => number,
 *   getCurrentChartTitle?: () => string
 * }} [options]
 * @returns {(sessionSpec: PracticeSessionSpec | null, playbackSettings: PlaybackSettings) => EmbeddedPatternPayload}
 */
export function createChartPlaybackPayloadBuilder({
  getTempo,
  getCurrentChartTitle
} = {}) {
  return function buildChartPlaybackPayload(sessionSpec, playbackSettings) {
    return {
      patternName: sessionSpec?.title || getCurrentChartTitle?.() || 'Chart Dev',
      patternString: sessionSpec?.playback?.enginePatternString || sessionSpec?.playback?.patternString || '',
      patternMode: 'both',
      tempo: sessionSpec?.tempo || getTempo?.() || 120,
      transposition: playbackSettings?.transposition ?? null,
      compingStyle: playbackSettings?.compingStyle,
      drumsMode: playbackSettings?.drumsMode,
      customMediumSwingBass: playbackSettings?.customMediumSwingBass,
      repetitionsPerKey: 1,
      displayMode: playbackSettings?.displayMode || 'show-both',
      harmonyDisplayMode: playbackSettings?.harmonyDisplayMode ?? null,
      showBeatIndicator: playbackSettings?.showBeatIndicator !== false,
      hideCurrentHarmony: playbackSettings?.hideCurrentHarmony === true,
      masterVolume: playbackSettings?.masterVolume,
      bassVolume: playbackSettings?.bassVolume,
      stringsVolume: playbackSettings?.stringsVolume,
      drumsVolume: playbackSettings?.drumsVolume
    };
  };
}

/**
 * Creates the current chart playback bridge provider backed by the embedded
 * playback bridge. This is a chart-specific wrapper around the shared embedded
 * provider, so the chart layer depends on a dedicated boundary rather than on
 * the low-level bridge factory directly.
 *
 * @param {{
 *   bridgeFrame?: HTMLIFrameElement | null,
 *   getTempo?: () => number,
 *   getCurrentChartTitle?: () => string
 * }} [options]
 * @returns {EmbeddedPlaybackBridgeProvider}
 */
export function createChartPlaybackBridgeProvider({
  bridgeFrame,
  getTempo,
  getCurrentChartTitle
} = {}) {
  return createEmbeddedPlaybackBridgeProvider({
    getTargetWindow: () => bridgeFrame?.contentWindow || null,
    getHostFrame: () => bridgeFrame || null,
    buildPatternPayload: createChartPlaybackPayloadBuilder({
      getTempo,
      getCurrentChartTitle
    })
  });
}

/**
 * Creates the future direct chart playback bridge provider backed by the
 * in-page playback runtime rather than the hidden iframe bridge.
 * This provider is not the default yet, but making it explicit here prepares
 * the chart layer for a backend swap without changing controller code.
 *
 * @param {DirectPlaybackControllerOptions} [options]
 * @returns {DirectPlaybackBridgeProvider}
 */
export function createChartDirectPlaybackBridgeProvider(options = {}) {
  return createDirectPlaybackBridgeProvider(options);
}

/**
 * Creates the chart playback bridge provider for the requested backend mode.
 * The current app still defaults to `embedded`, but the direct runtime-backed
 * path is now selected through the same boundary.
 *
 * @param {ChartPlaybackBridgeOptions} [options]
 * @returns {EmbeddedPlaybackBridgeProvider | DirectPlaybackBridgeProvider}
 */
export function createChartPlaybackBridgeProviderForMode({
  mode = 'embedded',
  bridgeFrame,
  getTempo,
  getCurrentChartTitle,
  directPlaybackOptions
} = {}) {
  if (mode === 'direct') {
    return createChartDirectPlaybackBridgeProvider(directPlaybackOptions || {});
  }

  return createChartPlaybackBridgeProvider({
    bridgeFrame,
    getTempo,
    getCurrentChartTitle
  });
}

/**
 * Creates the chart playback-controller options from the chart screen context.
 * This keeps the controller wiring out of `chart-dev/main.js` and localizes the
 * playback boundary setup in chart feature code.
 *
 * @param {ChartPlaybackControllerOptions} [options]
 * @returns {ChartPlaybackControllerOptions}
 */
export function createChartPlaybackControllerOptions(options = {}) {
  return {
    bridgeFrame: options.bridgeFrame,
    playbackBridgeProvider: options.playbackBridgeProvider,
    getSelectedPracticeSession: options.getSelectedPracticeSession,
    getPlaybackSettings: options.getPlaybackSettings,
    getTempo: options.getTempo,
    getCurrentChartTitle: options.getCurrentChartTitle,
    getCurrentBarCount: options.getCurrentBarCount,
    setActivePlaybackPosition: options.setActivePlaybackPosition,
    resetActivePlaybackPosition: options.resetActivePlaybackPosition,
    renderTransport: options.renderTransport,
    updateActiveHighlights: options.updateActiveHighlights,
    onTransportStatus: options.onTransportStatus,
    onPersistPlaybackSettings: options.onPersistPlaybackSettings
  };
}
