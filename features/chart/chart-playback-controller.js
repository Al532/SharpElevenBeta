// @ts-check

/** @typedef {import('../../core/types/contracts').EmbeddedPlaybackApi} EmbeddedPlaybackApi */
/** @typedef {import('../../core/types/contracts').EmbeddedPlaybackBridge} EmbeddedPlaybackBridge */
/** @typedef {import('../../core/types/contracts').PlaybackBridgeProvider} PlaybackBridgeProvider */
/** @typedef {import('../../core/types/contracts').EmbeddedPatternPayload} EmbeddedPatternPayload */
/** @typedef {import('../../core/types/contracts').PlaybackSettings} PlaybackSettings */
/** @typedef {import('../../core/types/contracts').PlaybackOperationResult} PlaybackOperationResult */
/** @typedef {import('../../core/types/contracts').PlaybackRuntimeState} PlaybackRuntimeState */
/** @typedef {import('../../core/types/contracts').PlaybackSessionController} PlaybackSessionController */
/** @typedef {import('../../core/types/contracts').PracticeSessionSpec} PracticeSessionSpec */
/** @typedef {import('../../core/types/contracts').ChartPlaybackController} ChartPlaybackController */
/** @typedef {import('../../core/types/contracts').ChartPlaybackControllerOptions} ChartPlaybackControllerOptions */
/** @typedef {import('../../core/types/contracts').TransportPlaybackStatus} TransportPlaybackStatus */

import { createEmbeddedPlaybackBridgeProvider } from '../../core/playback/embedded-playback-bridge-provider.js';
import { storePendingDrillSession } from '../../core/storage/app-state-storage.js';

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
  /** @returns {Window | null} */
  function getDrillBridgeWindow() {
    return bridgeFrame?.contentWindow || null;
  }

  /**
   * @param {PracticeSessionSpec | null} sessionSpec
   * @param {PlaybackSettings} playbackSettings
   * @returns {EmbeddedPatternPayload}
   */
  function buildEmbeddedPatternPayload(sessionSpec, playbackSettings) {
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
  }

  /** @type {EmbeddedPlaybackBridge} */
  const embeddedPlaybackBridge =
    /** @type {EmbeddedPlaybackBridge} */ (
      (/** @type {PlaybackBridgeProvider | null | undefined} */ (playbackBridgeProvider))
        ?.getBridge?.()
      || createEmbeddedPlaybackBridgeProvider({
        getTargetWindow: getDrillBridgeWindow,
        getHostFrame: () => bridgeFrame || null,
        buildPatternPayload: buildEmbeddedPatternPayload
      }).getBridge()
    );

  /**
   * @param {PlaybackRuntimeState | null | undefined} drillState
   * @returns {number}
   */
  function getPlaybackEntryIndexFromDrillState(drillState) {
    const practiceBars = getSelectedPracticeSession?.()?.playback?.bars || [];
    if (practiceBars.length === 0) return -1;
    if (!drillState?.isPlaying || drillState.isIntro) return -1;

    const chordIndex = Number(drillState.currentChordIdx);
    if (!Number.isFinite(chordIndex) || chordIndex < 0) return -1;

    return Math.floor(chordIndex / 4) % practiceBars.length;
  }

  /** @returns {PlaybackSessionController} */
  function ensurePlaybackController() {
    return embeddedPlaybackBridge.playbackController;
  }

  /** @returns {TransportPlaybackStatus} */
  function syncPlaybackStateFromDrill() {
    const controller = ensurePlaybackController();
    const drillState = controller.refreshRuntimeState();
    if (!drillState) {
      resetActivePlaybackPosition?.();
      onTransportStatus?.('Drill bridge unavailable');
      return {
        isPlaying: false,
        isPaused: false
      };
    }

    const entryIndex = getPlaybackEntryIndexFromDrillState(drillState);
    const practiceBar = entryIndex >= 0 ? getSelectedPracticeSession?.()?.playback?.bars?.[entryIndex] : null;
    setActivePlaybackPosition?.(practiceBar?.id || null, entryIndex);

    if (drillState?.isPaused) {
      onTransportStatus?.('Paused in Drill');
    } else if (drillState?.isIntro) {
      onTransportStatus?.('Intro count-in');
    } else if (drillState?.isPlaying) {
      onTransportStatus?.('Playing via Drill');
    } else {
      onTransportStatus?.('Ready');
    }

    return {
      isPlaying: Boolean(drillState?.isPlaying),
      isPaused: Boolean(drillState?.isPaused)
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

    onTransportStatus?.('Connecting to Drill...');

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
      throw new Error(applyResult?.errorMessage || 'Drill rejected the interpreted chart.');
    }

    const startResult = await controller.start();
    if (!startResult?.ok) {
      throw new Error(startResult?.errorMessage || 'Drill failed to start playback.');
    }

    return syncPlaybackStateFromDrill();
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
      throw new Error(result?.errorMessage || 'Failed to sync Drill settings.');
    }
    return result;
  }

  /** @returns {Promise<TransportPlaybackStatus>} */
  async function pauseToggle() {
    await ensurePlaybackController().pauseToggle();
    return syncPlaybackStateFromDrill();
  }

  /** @returns {boolean} */
  function navigateToDrillWithSelection() {
    const practiceSession = getSelectedPracticeSession?.();
    if (!practiceSession) return false;
    onPersistPlaybackSettings?.();
    storePendingDrillSession(practiceSession);
    window.location.href = '../index.html?source=chart-session';
    return true;
  }

  /** @returns {number} */
  function getTotalBars() {
    return getSelectedPracticeSession?.()?.playback?.bars?.length || getCurrentBarCount?.() || 0;
  }

  return {
    ensureReady: embeddedPlaybackBridge.playbackRuntime.ensureReady,
    ensurePlaybackController,
    syncPlaybackStateFromDrill,
    stopPlayback,
    startPlayback,
    syncPlaybackSettings,
    pauseToggle,
    navigateToDrillWithSelection,
    getTotalBars
  };
}
