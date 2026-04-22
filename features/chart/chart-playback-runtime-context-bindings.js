// @ts-check

/** @typedef {import('../../core/types/contracts').ChartPlaybackController} ChartPlaybackController */
/** @typedef {import('../../core/types/contracts').ChartPlaybackBridgeMode} ChartPlaybackBridgeMode */
/** @typedef {import('../../core/types/contracts').ChartDirectPlaybackRuntimeHost} ChartDirectPlaybackRuntimeHost */
/** @typedef {import('../../core/types/contracts').ChartScreenState} ChartScreenState */
/** @typedef {import('../../core/types/contracts').DirectPlaybackControllerOptions} DirectPlaybackControllerOptions */
/** @typedef {import('../../core/types/contracts').PlaybackBridgeProvider} PlaybackBridgeProvider */
/** @typedef {import('../../core/types/contracts').PlaybackSettings} PlaybackSettings */
/** @typedef {import('../../core/types/contracts').PracticeSessionSpec} PracticeSessionSpec */

/**
 * Groups the app-level bindings consumed by the chart playback runtime
 * context.
 *
 * @param {{
 *   state: ChartScreenState & {
 *     chartPlaybackBridgeProvider?: PlaybackBridgeProvider | null,
 *     chartPlaybackController?: ChartPlaybackController | null
 *   },
 *   mode?: ChartPlaybackBridgeMode,
 *   directPlaybackRuntimeHost?: ChartDirectPlaybackRuntimeHost | null,
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
 *   state: ChartScreenState & {
 *     chartPlaybackBridgeProvider?: PlaybackBridgeProvider | null,
 *     chartPlaybackController?: ChartPlaybackController | null
 *   },
 *   mode?: ChartPlaybackBridgeMode,
 *   directPlaybackRuntimeHost?: ChartDirectPlaybackRuntimeHost | null,
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
 * }}
 */
export function createChartPlaybackRuntimeContextBindings(options) {
  return { ...options };
}
