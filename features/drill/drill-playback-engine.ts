import { createPlaybackScheduler } from './drill-playback-scheduler.js';
import { createPlaybackTransport } from './drill-playback-transport.js';

type InitializeDrillPlaybackEngineOptions = {
  dom?: Record<string, unknown>;
  schedulerState?: Record<string, unknown>;
  transportState?: Record<string, unknown>;
  schedulerConstants?: Record<string, unknown>;
  transportConstants?: Record<string, unknown>;
  schedulerHelpers?: Record<string, unknown>;
  transportHelpers?: Record<string, unknown>;
};

export function initializeDrillPlaybackEngine({
  dom,
  schedulerState,
  transportState,
  schedulerConstants,
  transportConstants,
  schedulerHelpers,
  transportHelpers
}: InitializeDrillPlaybackEngineOptions = {}) {
  const {
    prepareNextProgression: prepareNextProgressionPlayback,
    scheduleBeat: scheduleBeatPlayback,
    scheduleDisplay: scheduleDisplayPlayback
  } = createPlaybackScheduler({
    dom,
    state: schedulerState,
    constants: schedulerConstants,
    helpers: schedulerHelpers
  });

  const { start, stop, togglePause } = createPlaybackTransport({
    dom,
    state: transportState,
    constants: transportConstants,
    helpers: {
      ...transportHelpers,
      prepareNextProgression: prepareNextProgressionPlayback,
      scheduleBeat: scheduleBeatPlayback
    }
  });

  return {
    prepareNextProgressionPlayback,
    scheduleBeatPlayback,
    scheduleDisplayPlayback,
    start,
    stop,
    togglePause
  };
}

