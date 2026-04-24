import type {
  ChartDirectPlaybackRuntimeHost,
  ChartPlaybackBridgeMode,
  ChartPlaybackController,
  ChartPlaybackControllerOptions,
  ChartScreenState,
  DirectPlaybackControllerOptions,
  PlaybackBridgeProvider,
  PlaybackSettings,
  PracticeSessionSpec
} from '../../core/types/contracts';

import {
  createChartPlaybackBridgeProviderForMode,
  createChartPlaybackControllerOptions
} from './chart-playback-bridge.js';
import { createChartPlaybackController } from './chart-playback-controller.js';

type ChartPlaybackRuntimeState = ChartScreenState & {
  chartPlaybackBridgeProvider?: PlaybackBridgeProvider | null;
  chartPlaybackController?: ChartPlaybackController | null;
};

export function createChartPlaybackRuntimeContext({
  state,
  mode = 'embedded',
  directPlaybackRuntimeHost = null,
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
}: {
  state: ChartPlaybackRuntimeState;
  mode?: ChartPlaybackBridgeMode;
  directPlaybackRuntimeHost?: ChartDirectPlaybackRuntimeHost | null;
  directPlaybackOptions?: DirectPlaybackControllerOptions;
  playbackBridgeFrame?: HTMLIFrameElement | null;
  getPlaybackBridgeFrame?: () => HTMLIFrameElement | null;
  getTempo?: () => number;
  getCurrentChartTitle?: () => string;
  getSelectedPracticeSession?: () => PracticeSessionSpec | null;
  getPlaybackSettings?: () => PlaybackSettings;
  getCurrentBarCount?: () => number;
  setActivePlaybackPosition?: (barId: string | null, entryIndex: number) => void;
  resetActivePlaybackPosition?: () => void;
  renderTransport?: () => void;
  updateActiveHighlights?: () => void;
  onTransportStatus?: (message: string) => void;
  onPersistPlaybackSettings?: () => void;
}) {
  const resolveDirectPlaybackRuntimeHost = () => directPlaybackRuntimeHost || null;
  const resolveEmbeddedPlaybackBridgeFrame = () =>
    getPlaybackBridgeFrame?.()
    || playbackBridgeFrame
    || null;
  const resolveDirectPlaybackOptions = () =>
    resolveDirectPlaybackRuntimeHost()?.getDirectPlaybackOptions?.()
    || directPlaybackOptions
    || undefined;

  function getPlaybackBridgeProvider(): PlaybackBridgeProvider {
    if (state.chartPlaybackBridgeProvider) {
      return state.chartPlaybackBridgeProvider;
    }

    state.chartPlaybackBridgeProvider = createChartPlaybackBridgeProviderForMode({
      mode,
      directPlaybackOptions: resolveDirectPlaybackOptions(),
      bridgeFrame: mode === 'embedded' ? resolveEmbeddedPlaybackBridgeFrame() : null,
      getTempo,
      getCurrentChartTitle
    });

    return state.chartPlaybackBridgeProvider;
  }

  function getPlaybackController(): ChartPlaybackController {
    if (state.chartPlaybackController) {
      return state.chartPlaybackController;
    }

    state.chartPlaybackController = createChartPlaybackController(
      createChartPlaybackControllerOptions({
        bridgeFrame: mode === 'embedded' ? resolveEmbeddedPlaybackBridgeFrame() : null,
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
      } as ChartPlaybackControllerOptions)
    ) as ChartPlaybackController;

    return state.chartPlaybackController;
  }

  return {
    getPlaybackBridgeProvider,
    getPlaybackController
  };
}
