import { createPlaybackScheduler } from '../../playback-scheduler.js';
import { createPlaybackTransport } from '../../playback-transport.js';

export function initializeDrillPlaybackEngine({
  dom,
  schedulerState,
  transportState,
  schedulerConstants,
  transportConstants,
  schedulerHelpers,
  transportHelpers
} = {}) {
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
