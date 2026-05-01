import type {
  PlaybackOperationResult,
  PlaybackRuntimeState,
  PlaybackSessionAdapter,
  PlaybackSessionController,
  PlaybackSessionSnapshot,
  PlaybackSettings,
  PracticeSessionSpec
} from '../types/contracts';

function deepClone<T>(value: T): T {
  return value === undefined ? value : JSON.parse(JSON.stringify(value)) as T;
}

function normalizeRuntimeState(
  state: Partial<PlaybackRuntimeState> | null | undefined = {}
): PlaybackRuntimeState {
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

export function createPlaybackSessionController({
  adapter,
  initialSettings = {}
}: {
  adapter?: PlaybackSessionAdapter;
  initialSettings?: PlaybackSettings;
} = {}): PlaybackSessionController {
  if (!adapter || typeof adapter !== 'object') {
    throw new Error('A playback adapter is required.');
  }

  const listeners = new Set<(snapshot: PlaybackSessionSnapshot) => void>();
  let currentSession: PracticeSessionSpec | null = null;
  let playbackSettings: PlaybackSettings = { ...(initialSettings || {}) };
  let runtimeState: PlaybackRuntimeState = normalizeRuntimeState(adapter.getRuntimeState?.());

  function notify(): void {
    const snapshot = controller.getState();
    listeners.forEach((listener) => {
      try {
        listener(snapshot);
      } catch {
        // Listener failures must not break transport updates.
      }
    });
  }

  function setRuntimeState(
    nextRuntimeState: Partial<PlaybackRuntimeState> | null | undefined
  ): PlaybackRuntimeState {
    runtimeState = normalizeRuntimeState(nextRuntimeState);
    notify();
    return runtimeState;
  }

  const controller: PlaybackSessionController = {
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
    async queuePerformanceCue(cue) {
      const result = await adapter.queuePerformanceCue?.(
        deepClone(cue),
        deepClone(currentSession),
        deepClone(playbackSettings)
      );
      if (result?.state) {
        setRuntimeState({
          ...result.state,
          sessionId: currentSession?.id || ''
        });
      } else {
        notify();
      }
      return result || { ok: true, state: controller.getState().runtime };
    },
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
    refreshRuntimeState() {
      return setRuntimeState({
        ...(adapter.getRuntimeState?.() || {}),
        sessionId: currentSession?.id || ''
      });
    },
    getState() {
      return {
        session: deepClone(currentSession),
        settings: deepClone(playbackSettings),
        runtime: deepClone(runtimeState)
      };
    },
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
