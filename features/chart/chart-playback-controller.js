// @ts-check

/** @typedef {import('../../core/types/contracts').PlaybackBridge} PlaybackBridge */
/** @typedef {import('../../core/types/contracts').PlaybackBridgeProvider} PlaybackBridgeProvider */
/** @typedef {import('../../core/types/contracts').PlaybackSettings} PlaybackSettings */
/** @typedef {import('../../core/types/contracts').PlaybackOperationResult} PlaybackOperationResult */
/** @typedef {import('../../core/types/contracts').PlaybackRuntimeState} PlaybackRuntimeState */
/** @typedef {import('../../core/types/contracts').PlaybackSessionController} PlaybackSessionController */
/** @typedef {import('../../core/types/contracts').PracticeSessionSpec} PracticeSessionSpec */
/** @typedef {import('../../core/types/contracts').ChartPlaybackController} ChartPlaybackController */
/** @typedef {import('../../core/types/contracts').ChartPlaybackControllerOptions} ChartPlaybackControllerOptions */
/** @typedef {import('../../core/types/contracts').TransportPlaybackStatus} TransportPlaybackStatus */

import { storePendingPracticeSession } from '../../core/storage/app-state-storage.js';
import { createChartPlaybackBridgeProvider as createFeatureChartPlaybackBridgeProvider } from './chart-playback-bridge.js';

/**
 * @param {ChartPlaybackControllerOptions} [options]
 * @returns {ChartPlaybackController}
 */
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
} = {}) {
  /** @type {PlaybackBridge} */
  const playbackBridge =
    /** @type {PlaybackBridge} */ (
      (/** @type {PlaybackBridgeProvider | null | undefined} */ (playbackBridgeProvider))
        ?.getBridge?.()
      || createFeatureChartPlaybackBridgeProvider({
        bridgeFrame,
        getTempo,
        getCurrentChartTitle
      }).getBridge()
    );

  /**
   * @param {PlaybackRuntimeState | null | undefined} playbackState
   * @returns {number}
   */
  function getPlaybackEntryIndexFromRuntimeState(playbackState) {
    const practiceBars = getSelectedPracticeSession?.()?.playback?.bars || [];
    if (practiceBars.length === 0) return -1;
    if (!playbackState?.isPlaying || playbackState.isIntro) return -1;

    const chordIndex = Number(playbackState.currentChordIdx);
    if (!Number.isFinite(chordIndex) || chordIndex < 0) return -1;

    return Math.floor(chordIndex / 4) % practiceBars.length;
  }

  /** @returns {PlaybackSessionController} */
  function ensurePlaybackController() {
    return playbackBridge.playbackController;
  }

  /** @returns {TransportPlaybackStatus} */
  function syncPlaybackState() {
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

  /**
   * @param {{ resetPosition?: boolean }} [options]
   * @returns {Promise<TransportPlaybackStatus>}
   */
  async function stopPlayback({ resetPosition = true } = {}) {
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

  /** @returns {Promise<{ ok: boolean } | TransportPlaybackStatus>} */
  async function startPlayback() {
    const practiceSession = getSelectedPracticeSession?.();
    if (!practiceSession?.playback?.enginePatternString) return { ok: false };

    onTransportStatus?.('Connecting playback...');

    const controller = ensurePlaybackController();
    const playbackSettings = getPlaybackSettings?.() || {};
    const applyResult = await controller.loadSession(practiceSession);
    await controller.updatePlaybackSettings({
      tempo: getTempo?.(),
      compingStyle: playbackSettings.compingStyle,
      drumsMode: playbackSettings.drumsMode,
      customMediumSwingBass: playbackSettings.customMediumSwingBass,
      repetitionsPerKey: 1,
      displayMode: 'show-both',
      showBeatIndicator: true,
      hideCurrentHarmony: false,
      masterVolume: playbackSettings.masterVolume,
      bassVolume: playbackSettings.bassVolume,
      stringsVolume: playbackSettings.stringsVolume,
      drumsVolume: playbackSettings.drumsVolume
    });

    if (!applyResult?.ok) {
      throw new Error(applyResult?.errorMessage || 'Playback rejected the interpreted chart.');
    }

    const startResult = await controller.start();
    if (!startResult?.ok) {
      throw new Error(startResult?.errorMessage || 'Playback failed to start.');
    }

    return syncPlaybackState();
  }

  /** @returns {Promise<PlaybackOperationResult>} */
  async function syncPlaybackSettings() {
    const controller = ensurePlaybackController();
    const playbackSettings = getPlaybackSettings?.() || {};
    onPersistPlaybackSettings?.();
    const result = await controller.updatePlaybackSettings({
      compingStyle: playbackSettings.compingStyle,
      drumsMode: playbackSettings.drumsMode,
      customMediumSwingBass: playbackSettings.customMediumSwingBass,
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

  /** @returns {Promise<TransportPlaybackStatus>} */
  async function pauseToggle() {
    await ensurePlaybackController().pauseToggle();
    return syncPlaybackState();
  }

  /** @returns {boolean} */
  function navigateToPracticeWithSelection() {
    const practiceSession = getSelectedPracticeSession?.();
    if (!practiceSession) return false;
    onPersistPlaybackSettings?.();
    storePendingPracticeSession(practiceSession);
    window.location.href = '../index.html?source=chart-session';
    return true;
  }

  /** @returns {number} */
  function getTotalBars() {
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
