// @ts-check

/**
 * @param {{
 *   state?: {
 *     playbackPollTimer?: number | null,
 *     isPlaying?: boolean,
 *     isPaused?: boolean
 *   },
 *   nextState?: { isPlaying?: boolean, isPaused?: boolean } | null | undefined
 * }} [options]
 * @returns {void}
 */
export function applyPlaybackTransportState({
  state,
  nextState
} = {}) {
  if (!state) return;
  state.isPlaying = Boolean(nextState?.isPlaying);
  state.isPaused = Boolean(nextState?.isPaused);
}

/**
 * @param {{
 *   state?: { playbackPollTimer?: number | null },
 *   clearTimer?: (timerId: number) => void
 * }} [options]
 * @returns {void}
 */
export function stopPlaybackPolling({
  state,
  clearTimer = clearInterval
} = {}) {
  if (!state?.playbackPollTimer) return;
  clearTimer(state.playbackPollTimer);
  state.playbackPollTimer = null;
}

/**
 * @param {{
 *   state?: { playbackPollTimer?: number | null },
 *   intervalMs?: number,
 *   onTick?: () => void,
 *   setTimer?: (callback: () => void, intervalMs: number) => number,
 *   clearTimer?: (timerId: number) => void
 * }} [options]
 * @returns {void}
 */
export function startPlaybackPolling({
  state,
  intervalMs = 120,
  onTick,
  setTimer = (callback, nextIntervalMs) => window.setInterval(callback, nextIntervalMs),
  clearTimer = clearInterval
} = {}) {
  stopPlaybackPolling({
    state,
    clearTimer
  });
  if (!state || typeof onTick !== 'function') return;
  state.playbackPollTimer = setTimer(onTick, intervalMs);
}
