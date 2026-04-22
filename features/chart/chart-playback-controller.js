import { createPlaybackSessionController } from '../../core/playback/playback-session-controller.js';
import { storePendingDrillSession } from '../../core/storage/app-state-storage.js';

export function createChartPlaybackController({
  bridgeFrame,
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
  let drillApi = null;
  let drillFrameReadyPromise = null;
  let playbackController = null;

  function getDrillBridgeWindow() {
    return bridgeFrame?.contentWindow || null;
  }

  function getDrillApi() {
    if (drillApi) return drillApi;
    const drillWindow = getDrillBridgeWindow();
    const embeddedApi = drillWindow?.__JPT_DRILL_API__ || null;
    if (embeddedApi) {
      drillApi = embeddedApi;
    }
    return drillApi;
  }

  function ensureDrillApi() {
    const existingApi = getDrillApi();
    if (existingApi) return Promise.resolve(existingApi);
    if (drillFrameReadyPromise) return drillFrameReadyPromise;

    drillFrameReadyPromise = new Promise((resolve, reject) => {
      const frame = bridgeFrame;
      if (!frame) {
        reject(new Error('Missing Drill bridge iframe.'));
        return;
      }

      const finish = () => {
        const embeddedApi = getDrillApi();
        if (embeddedApi) {
          resolve(embeddedApi);
          return true;
        }
        return false;
      };

      if (finish()) return;

      const onReady = () => {
        cleanup();
        if (finish()) return;
        reject(new Error('Drill bridge loaded without exposing an API.'));
      };

      const onLoad = () => {
        window.setTimeout(() => {
          if (finish()) {
            cleanup();
            resolve(getDrillApi());
          }
        }, 0);
      };

      const cleanup = () => {
        frame.removeEventListener('load', onLoad);
        getDrillBridgeWindow()?.removeEventListener?.('jpt-drill-api-ready', onReady);
      };

      frame.addEventListener('load', onLoad, { once: true });
      getDrillBridgeWindow()?.addEventListener?.('jpt-drill-api-ready', onReady, { once: true });

      window.setTimeout(() => {
        if (finish()) {
          cleanup();
          resolve(getDrillApi());
          return;
        }
        cleanup();
        reject(new Error('Timed out while waiting for the Drill bridge.'));
      }, 10000);
    }).catch((error) => {
      drillFrameReadyPromise = null;
      throw error;
    });

    return drillFrameReadyPromise;
  }

  function getPlaybackEntryIndexFromDrillState(drillState) {
    const practiceBars = getSelectedPracticeSession?.()?.playback?.bars || [];
    if (practiceBars.length === 0) return -1;
    if (!drillState?.isPlaying || drillState.isIntro) return -1;

    const chordIndex = Number(drillState.currentChordIdx);
    if (!Number.isFinite(chordIndex) || chordIndex < 0) return -1;

    return Math.floor(chordIndex / 4) % practiceBars.length;
  }

  function ensurePlaybackController() {
    if (playbackController) return playbackController;

    playbackController = createPlaybackSessionController({
      adapter: {
        async loadSession(sessionSpec, playbackSettings) {
          const embeddedApi = await ensureDrillApi();
          return embeddedApi.applyEmbeddedPattern({
            patternName: sessionSpec?.title || getCurrentChartTitle?.() || 'Chart Dev',
            patternString: sessionSpec?.playback?.enginePatternString || sessionSpec?.playback?.patternString || '',
            patternMode: 'both',
            tempo: sessionSpec?.tempo || getTempo?.() || 120,
            compingStyle: playbackSettings?.compingStyle,
            drumsMode: playbackSettings?.drumsMode,
            customMediumSwingBass: playbackSettings?.customMediumSwingBass,
            repetitionsPerKey: 1,
            displayMode: playbackSettings?.displayMode || 'show-both',
            showBeatIndicator: playbackSettings?.showBeatIndicator !== false,
            hideCurrentHarmony: playbackSettings?.hideCurrentHarmony === true,
            masterVolume: playbackSettings?.masterVolume,
            bassVolume: playbackSettings?.bassVolume,
            stringsVolume: playbackSettings?.stringsVolume,
            drumsVolume: playbackSettings?.drumsVolume
          });
        },
        async updatePlaybackSettings(playbackSettings) {
          const embeddedApi = await ensureDrillApi();
          return embeddedApi.applyEmbeddedPlaybackSettings(playbackSettings || {});
        },
        async start() {
          const embeddedApi = await ensureDrillApi();
          return embeddedApi.startPlayback();
        },
        async stop() {
          const embeddedApi = getDrillApi();
          return embeddedApi ? embeddedApi.stopPlayback() : { ok: true, state: {} };
        },
        async pauseToggle() {
          const embeddedApi = await ensureDrillApi();
          return embeddedApi.togglePausePlayback();
        },
        getRuntimeState() {
          const embeddedApi = getDrillApi();
          return embeddedApi ? embeddedApi.getPlaybackState() : null;
        }
      }
    });

    return playbackController;
  }

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

  async function pauseToggle() {
    await ensurePlaybackController().pauseToggle();
    return syncPlaybackStateFromDrill();
  }

  function navigateToDrillWithSelection() {
    const practiceSession = getSelectedPracticeSession?.();
    if (!practiceSession) return false;
    onPersistPlaybackSettings?.();
    storePendingDrillSession(practiceSession);
    window.location.href = '../index.html?source=chart-session';
    return true;
  }

  function getTotalBars() {
    return getSelectedPracticeSession?.()?.playback?.bars?.length || getCurrentBarCount?.() || 0;
  }

  return {
    ensureReady: ensureDrillApi,
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
