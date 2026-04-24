import {
  startPlaybackPolling,
  stopPlaybackPolling
} from './chart-playback-runtime.js';

type LifecycleTarget = EventTarget | {
  addEventListener?: (eventName: string, listener: () => void) => void
};

type VisibilityTarget = LifecycleTarget & {
  hidden?: boolean
};

type ChartLifecycleState = {
  playbackPollTimer?: number | null,
  isPlaying?: boolean
};

/**
 * Binds lightweight chart lifecycle listeners so playback polling is paused
 * while the page is backgrounded and resynchronized on return.
 *
 * @param {object} [options]
 * @param {EventTarget | { addEventListener?: Function }} [options.lifecycleTarget]
 * @param {EventTarget | { addEventListener?: Function, hidden?: boolean }} [options.visibilityTarget]
 * @param {{ playbackPollTimer?: number | null, isPlaying?: boolean }} [options.state]
 * @param {number} [options.intervalMs]
 * @param {() => void} [options.onTick]
 */
export function bindChartLifecycleEvents({
  lifecycleTarget = globalThis.window,
  visibilityTarget = globalThis.document,
  state,
  intervalMs = 120,
  onTick = () => {}
}: {
  lifecycleTarget?: LifecycleTarget,
  visibilityTarget?: VisibilityTarget,
  state?: ChartLifecycleState,
  intervalMs?: number,
  onTick?: () => void
} = {}) {
  function suspendPolling() {
    stopPlaybackPolling({
      state
    });
  }

  function resumePolling() {
    if (!state?.isPlaying) {
      onTick?.();
      return;
    }

    startPlaybackPolling({
      state,
      intervalMs,
      onTick
    });
    onTick?.();
  }

  lifecycleTarget?.addEventListener?.('pagehide', suspendPolling);
  lifecycleTarget?.addEventListener?.('pageshow', resumePolling);
  visibilityTarget?.addEventListener?.('visibilitychange', () => {
    if (visibilityTarget?.hidden) {
      suspendPolling();
      return;
    }
    resumePolling();
  });
}


