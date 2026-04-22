import type {
  ChartDirectPlaybackRuntimeHost,
  ChartPlaybackBridgeMode,
  ChartPlaybackController,
  ChartScreenState,
  DirectPlaybackControllerOptions,
  PlaybackBridgeProvider,
  PlaybackSettings,
  PracticeSessionSpec
} from '../../core/types/contracts';

export function createChartPlaybackRuntimeContextBindings(options: {
  state: ChartScreenState & {
    chartPlaybackBridgeProvider?: PlaybackBridgeProvider | null;
    chartPlaybackController?: ChartPlaybackController | null;
  };
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
  return { ...options };
}
