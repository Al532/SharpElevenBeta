import type {
  ChartPlaybackBridgeOptions,
  ChartPlaybackControllerOptions,
  DirectPlaybackBridgeProvider,
  DirectPlaybackControllerOptions,
  EmbeddedPatternPayload,
  EmbeddedPlaybackBridgeProvider,
  PlaybackSettings,
  PracticeSessionSpec
} from '../../core/types/contracts';

import { createDirectPlaybackBridgeProvider } from '../../core/playback/direct-playback-bridge-provider.js';
import { createEmbeddedPlaybackBridgeProvider } from '../../core/playback/embedded-playback-bridge-provider.js';

export function createChartPlaybackPayloadBuilder({
  getTempo,
  getCurrentChartTitle
}: {
  getTempo?: () => number;
  getCurrentChartTitle?: () => string;
} = {}): (
  sessionSpec: PracticeSessionSpec | null,
  playbackSettings: PlaybackSettings
) => EmbeddedPatternPayload {
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

export function createChartPlaybackBridgeProvider({
  bridgeFrame,
  getTempo,
  getCurrentChartTitle
}: {
  bridgeFrame?: HTMLIFrameElement | null;
  getTempo?: () => number;
  getCurrentChartTitle?: () => string;
} = {}): EmbeddedPlaybackBridgeProvider {
  return createEmbeddedPlaybackBridgeProvider({
    getTargetWindow: () => bridgeFrame?.contentWindow || null,
    getHostFrame: () => bridgeFrame || null,
    buildPatternPayload: createChartPlaybackPayloadBuilder({
      getTempo,
      getCurrentChartTitle
    })
  });
}

export function createChartDirectPlaybackBridgeProvider(
  options: DirectPlaybackControllerOptions = {}
): DirectPlaybackBridgeProvider {
  return createDirectPlaybackBridgeProvider(options);
}

export function createChartPlaybackBridgeProviderForMode({
  mode = 'embedded',
  bridgeFrame,
  getTempo,
  getCurrentChartTitle,
  directPlaybackOptions
}: ChartPlaybackBridgeOptions = {}): EmbeddedPlaybackBridgeProvider | DirectPlaybackBridgeProvider {
  if (mode === 'direct') {
    return createChartDirectPlaybackBridgeProvider(directPlaybackOptions || {});
  }

  return createChartPlaybackBridgeProvider({
    bridgeFrame,
    getTempo,
    getCurrentChartTitle
  });
}

export function createChartPlaybackControllerOptions(
  options: ChartPlaybackControllerOptions = {}
): ChartPlaybackControllerOptions {
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
