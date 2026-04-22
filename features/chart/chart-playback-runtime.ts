export function applyPlaybackTransportState({
  state,
  nextState
}: {
  state?: {
    playbackPollTimer?: number | null;
    isPlaying?: boolean;
    isPaused?: boolean;
  };
  nextState?: { isPlaying?: boolean; isPaused?: boolean } | null | undefined;
} = {}): void {
  if (!state) return;
  state.isPlaying = Boolean(nextState?.isPlaying);
  state.isPaused = Boolean(nextState?.isPaused);
}

export function stopPlaybackPolling({
  state,
  clearTimer = clearInterval
}: {
  state?: { playbackPollTimer?: number | null };
  clearTimer?: (timerId: number) => void;
} = {}): void {
  if (!state?.playbackPollTimer) return;
  clearTimer(state.playbackPollTimer);
  state.playbackPollTimer = null;
}

export function startPlaybackPolling({
  state,
  intervalMs = 120,
  onTick,
  setTimer = (callback, nextIntervalMs) => window.setInterval(callback, nextIntervalMs),
  clearTimer = clearInterval
}: {
  state?: { playbackPollTimer?: number | null };
  intervalMs?: number;
  onTick?: () => void;
  setTimer?: (callback: () => void, intervalMs: number) => number;
  clearTimer?: (timerId: number) => void;
} = {}): void {
  stopPlaybackPolling({
    state,
    clearTimer
  });
  if (!state || typeof onTick !== 'function') return;
  state.playbackPollTimer = setTimer(onTick, intervalMs);
}
