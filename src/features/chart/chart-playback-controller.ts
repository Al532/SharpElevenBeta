import type {
  ChartPlaybackController,
  ChartPlaybackControllerOptions,
  PlaybackBridge,
  PlaybackBridgeProvider,
  PlaybackOperationResult,
  PlaybackRuntimeState,
  PlaybackSessionController,
  TransportPlaybackStatus
} from '../../core/types/contracts';

import { storePendingPracticeSession } from '../../core/storage/app-state-storage.js';
import { createChartPlaybackBridgeProvider as createFeatureChartPlaybackBridgeProvider } from './chart-playback-bridge.js';

export function createChartPlaybackController({
  bridgeFrame,
  playbackBridgeProvider,
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
}: ChartPlaybackControllerOptions = {}): ChartPlaybackController {
  const playbackBridge: PlaybackBridge =
    ((playbackBridgeProvider as PlaybackBridgeProvider | null | undefined)
      ?.getBridge?.()
      || createFeatureChartPlaybackBridgeProvider({
        bridgeFrame,
        getTempo,
        getCurrentChartTitle
      }).getBridge()) as PlaybackBridge;

  function getPlaybackEntryIndexFromRuntimeState(
    playbackState: PlaybackRuntimeState | null | undefined
  ): number {
    const practiceBars = getSelectedPracticeSession?.()?.playback?.bars || [];
    if (practiceBars.length === 0) return -1;
    if (!playbackState?.isPlaying || playbackState.isIntro) return -1;

    const chordIndex = Number(playbackState.currentChordIdx);
    if (!Number.isFinite(chordIndex) || chordIndex < 0) return -1;

    let cursor = 0;
    for (let index = 0; index < practiceBars.length; index += 1) {
      const barBeatCount = Math.max(1, practiceBars[index]?.beatSlots?.length || 4);
      if (chordIndex >= cursor && chordIndex < cursor + barBeatCount) {
        return index;
      }
      cursor += barBeatCount;
    }

    const totalBeatCount = Math.max(1, cursor);
    const loopedChordIndex = ((chordIndex % totalBeatCount) + totalBeatCount) % totalBeatCount;
    cursor = 0;
    for (let index = 0; index < practiceBars.length; index += 1) {
      const barBeatCount = Math.max(1, practiceBars[index]?.beatSlots?.length || 4);
      if (loopedChordIndex >= cursor && loopedChordIndex < cursor + barBeatCount) {
        return index;
      }
      cursor += barBeatCount;
    }

    return -1;
  }

  function ensurePlaybackController(): PlaybackSessionController {
    return playbackBridge.playbackController;
  }

  function syncPlaybackState(): TransportPlaybackStatus {
    const controller = ensurePlaybackController();
    const playbackState = controller.refreshRuntimeState();
    if (!playbackState) {
      resetActivePlaybackPosition?.();
      onTransportStatus?.('Playback bridge unavailable');
      return {
        isPlaying: false,
        isPaused: false
      };
    }

    const entryIndex = getPlaybackEntryIndexFromRuntimeState(playbackState);
    const practiceBar = entryIndex >= 0 ? getSelectedPracticeSession?.()?.playback?.bars?.[entryIndex] : null;
    setActivePlaybackPosition?.(practiceBar?.id || null, entryIndex);

    if (playbackState?.isPaused) {
      onTransportStatus?.('Paused');
    } else if (playbackState?.isIntro) {
      onTransportStatus?.('Intro count-in');
    } else if (playbackState?.isPlaying) {
      onTransportStatus?.('Playing');
    } else {
      onTransportStatus?.('Ready');
    }

    return {
      isPlaying: Boolean(playbackState?.isPlaying),
      isPaused: Boolean(playbackState?.isPaused)
    };
  }

  async function stopPlayback({
    resetPosition = true
  }: {
    resetPosition?: boolean;
  } = {}): Promise<TransportPlaybackStatus> {
    await ensurePlaybackController().stop();
    if (resetPosition) {
      resetActivePlaybackPosition?.();
    } else {
      renderTransport?.();
      updateActiveHighlights?.();
    }
    return {
      isPlaying: false,
      isPaused: false
    };
  }

  async function startPlayback(): Promise<{ ok: boolean } | TransportPlaybackStatus> {
    const practiceSession = getSelectedPracticeSession?.();
    if (!practiceSession?.playback?.enginePatternString) return { ok: false };

    onTransportStatus?.('Connecting playback...');

    const controller = ensurePlaybackController();
    const playbackSettings = getPlaybackSettings?.() || {};
    const nextPlaybackSettings = {
      tempo: getTempo?.(),
      transposition: playbackSettings.transposition,
      compingStyle: playbackSettings.compingStyle,
      drumsMode: playbackSettings.drumsMode,
      customMediumSwingBass: playbackSettings.customMediumSwingBass,
      repetitionsPerKey: 1,
      finitePlayback: playbackSettings.finitePlayback !== false,
      displayMode: 'show-both',
      showBeatIndicator: true,
      hideCurrentHarmony: false,
      masterVolume: playbackSettings.masterVolume,
      bassVolume: playbackSettings.bassVolume,
      stringsVolume: playbackSettings.stringsVolume,
      drumsVolume: playbackSettings.drumsVolume
    };
    const settingsResult = await controller.updatePlaybackSettings(nextPlaybackSettings);
    if (!settingsResult?.ok) {
      throw new Error(settingsResult?.errorMessage || 'Playback rejected the chart settings.');
    }

    const applyResult = await controller.loadSession(practiceSession);

    if (!applyResult?.ok) {
      throw new Error(applyResult?.errorMessage || 'Playback rejected the interpreted chart.');
    }

    const startResult = await controller.start();
    if (!startResult?.ok) {
      throw new Error(startResult?.errorMessage || 'Playback failed to start.');
    }

    return syncPlaybackState();
  }

  async function syncPlaybackSettings(): Promise<PlaybackOperationResult> {
    const controller = ensurePlaybackController();
    const playbackSettings = getPlaybackSettings?.() || {};
    onPersistPlaybackSettings?.();
    const result = await controller.updatePlaybackSettings({
      tempo: getTempo?.(),
      transposition: playbackSettings.transposition,
      compingStyle: playbackSettings.compingStyle,
      drumsMode: playbackSettings.drumsMode,
      customMediumSwingBass: playbackSettings.customMediumSwingBass,
      finitePlayback: playbackSettings.finitePlayback !== false,
      masterVolume: playbackSettings.masterVolume,
      bassVolume: playbackSettings.bassVolume,
      stringsVolume: playbackSettings.stringsVolume,
      drumsVolume: playbackSettings.drumsVolume
    });
    if (!result?.ok) {
      throw new Error(result?.errorMessage || 'Failed to sync playback settings.');
    }
    return result;
  }

  async function pauseToggle(): Promise<TransportPlaybackStatus> {
    await ensurePlaybackController().pauseToggle();
    return syncPlaybackState();
  }

  function navigateToPracticeWithSelection(): boolean {
    const practiceSession = getSelectedPracticeSession?.();
    if (!practiceSession) return false;
    onPersistPlaybackSettings?.();
    storePendingPracticeSession(practiceSession);
    window.location.href = '../drill.html?source=chart-session';
    return true;
  }

  function getTotalBars(): number {
    return getSelectedPracticeSession?.()?.playback?.bars?.length || getCurrentBarCount?.() || 0;
  }

  return {
    ensureReady: playbackBridge.playbackRuntime.ensureReady,
    ensurePlaybackController,
    syncPlaybackState,
    stopPlayback,
    startPlayback,
    syncPlaybackSettings,
    pauseToggle,
    navigateToPracticeWithSelection,
    getTotalBars
  };
}
