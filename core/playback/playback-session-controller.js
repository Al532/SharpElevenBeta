// @ts-check

/** @typedef {import('../types/contracts').PlaybackRuntimeState} PlaybackRuntimeState */
/** @typedef {import('../types/contracts').PlaybackSettings} PlaybackSettings */
/** @typedef {import('../types/contracts').PlaybackOperationResult} PlaybackOperationResult */
/** @typedef {import('../types/contracts').PlaybackSessionSnapshot} PlaybackSessionSnapshot */
/** @typedef {import('../types/contracts').PlaybackSessionAdapter} PlaybackSessionAdapter */
/** @typedef {import('../types/contracts').PlaybackSessionController} PlaybackSessionController */
/** @typedef {import('../types/contracts').PracticeSessionSpec} PracticeSessionSpec */

function deepClone(value) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

/**
 * @param {Partial<PlaybackRuntimeState> | null | undefined} [state]
 * @returns {PlaybackRuntimeState}
 */
function normalizeRuntimeState(state = {}) {
  return {
    isPlaying: Boolean(state?.isPlaying),
    isPaused: Boolean(state?.isPaused),
    isIntro: Boolean(state?.isIntro),
    currentBeat: Number.isFinite(Number(state?.currentBeat)) ? Number(state.currentBeat) : 0,
    currentChordIdx: Number.isFinite(Number(state?.currentChordIdx)) ? Number(state.currentChordIdx) : -1,
    paddedChordCount: Number.isFinite(Number(state?.paddedChordCount)) ? Number(state.paddedChordCount) : 0,
    sessionId: state?.sessionId ? String(state.sessionId) : '',
    errorMessage: state?.errorMessage ? String(state.errorMessage) : null
  };
}

/**
 * @param {{ adapter?: PlaybackSessionAdapter, initialSettings?: PlaybackSettings }} [options]
 * @returns {PlaybackSessionController}
 */
export function createPlaybackSessionController({
  adapter,
  initialSettings = {}
} = {}) {
  if (!adapter || typeof adapter !== 'object') {
    throw new Error('A playback adapter is required.');
  }

  /** @type {Set<(snapshot: PlaybackSessionSnapshot) => void>} */
  const listeners = new Set();
  /** @type {PracticeSessionSpec | null} */
  let currentSession = null;
  /** @type {PlaybackSettings} */
  let playbackSettings = { ...(initialSettings || {}) };
  /** @type {PlaybackRuntimeState} */
  let runtimeState = normalizeRuntimeState(adapter.getRuntimeState?.());

  function notify() {
    const snapshot = controller.getState();
    listeners.forEach((listener) => {
      try {
        listener(snapshot);
      } catch {
        // Listener failures must not break transport updates.
      }
    });
  }

  /**
   * @param {Partial<PlaybackRuntimeState> | null | undefined} nextRuntimeState
   * @returns {PlaybackRuntimeState}
   */
  function setRuntimeState(nextRuntimeState) {
    runtimeState = normalizeRuntimeState(nextRuntimeState);
    notify();
    return runtimeState;
  }

  /** @type {PlaybackSessionController} */
  const controller = {
    /**
     * @param {PracticeSessionSpec} sessionSpec
     * @returns {Promise<PlaybackOperationResult>}
     */
    async loadSession(sessionSpec) {
      currentSession = deepClone(sessionSpec);
      const result = await adapter.loadSession?.(deepClone(currentSession), deepClone(playbackSettings));
      if (result?.state) {
        setRuntimeState({
          ...result.state,
          sessionId: currentSession?.id || ''
        });
      } else {
        notify();
      }
      return result || { ok: true, session: deepClone(currentSession) };
    },
    /**
     * @param {PlaybackSettings} [nextSettings]
     * @returns {Promise<PlaybackOperationResult>}
     */
    async updatePlaybackSettings(nextSettings = {}) {
      playbackSettings = {
        ...playbackSettings,
        ...(nextSettings || {})
      };
      const result = await adapter.updatePlaybackSettings?.(deepClone(playbackSettings), deepClone(currentSession));
      if (result?.state) {
        setRuntimeState({
          ...result.state,
          sessionId: currentSession?.id || ''
        });
      } else {
        notify();
      }
      return result || { ok: true, settings: deepClone(playbackSettings) };
    },
    /** @returns {Promise<PlaybackOperationResult>} */
    async start() {
      const result = await adapter.start?.(deepClone(currentSession), deepClone(playbackSettings));
      if (result?.state) {
        setRuntimeState({
          ...result.state,
          sessionId: currentSession?.id || ''
        });
      }
      return result || { ok: true, state: controller.getState().runtime };
    },
    /** @returns {Promise<PlaybackOperationResult>} */
    async stop() {
      const result = await adapter.stop?.(deepClone(currentSession), deepClone(playbackSettings));
      if (result?.state) {
        setRuntimeState({
          ...result.state,
          sessionId: currentSession?.id || ''
        });
      }
      return result || { ok: true, state: controller.getState().runtime };
    },
    /** @returns {Promise<PlaybackOperationResult>} */
    async pauseToggle() {
      const result = await adapter.pauseToggle?.(deepClone(currentSession), deepClone(playbackSettings));
      if (result?.state) {
        setRuntimeState({
          ...result.state,
          sessionId: currentSession?.id || ''
        });
      }
      return result || { ok: true, state: controller.getState().runtime };
    },
    /** @returns {PlaybackRuntimeState} */
    refreshRuntimeState() {
      return setRuntimeState({
        ...(adapter.getRuntimeState?.() || {}),
        sessionId: currentSession?.id || ''
      });
    },
    /** @returns {PlaybackSessionSnapshot} */
    getState() {
      return {
        session: deepClone(currentSession),
        settings: deepClone(playbackSettings),
        runtime: deepClone(runtimeState)
      };
    },
    /**
     * @param {(snapshot: PlaybackSessionSnapshot) => void} listener
     * @returns {() => void}
     */
    subscribe(listener) {
      if (typeof listener !== 'function') {
        return () => {};
      }
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    }
  };

  if (typeof adapter.subscribe === 'function') {
    adapter.subscribe((nextRuntimeState) => {
      setRuntimeState({
        ...nextRuntimeState,
        sessionId: currentSession?.id || ''
      });
    });
  }

  return controller;
}
