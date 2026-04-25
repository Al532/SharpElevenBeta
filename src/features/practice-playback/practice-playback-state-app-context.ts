
import {
  createPracticePlaybackSchedulerState,
  createPracticePlaybackTransportState
} from './practice-playback-runtime-engine.js';

type CreatePracticePlaybackStateAppContextOptions = {
  schedulerBindings?: Parameters<typeof createPracticePlaybackSchedulerState>[0];
  transportBindings?: Parameters<typeof createPracticePlaybackTransportState>[0];
};

/**
 * Creates the scheduler/transport state proxies consumed by the shared
 * playback engine from app-level getter/setter bindings.
 *
 * @param {{
 *   schedulerBindings?: Parameters<typeof createPracticePlaybackSchedulerState>[0],
 *   transportBindings?: Parameters<typeof createPracticePlaybackTransportState>[0]
 * }} [options]
 * @returns {{
 *   schedulerState: ReturnType<typeof createPracticePlaybackSchedulerState>,
 *   transportState: ReturnType<typeof createPracticePlaybackTransportState>
 * }}
 */
export function createPracticePlaybackStateAppContext({
  schedulerBindings,
  transportBindings
}: CreatePracticePlaybackStateAppContextOptions = {}) {
  return {
    schedulerState: createPracticePlaybackSchedulerState(schedulerBindings || {}),
    transportState: createPracticePlaybackTransportState(transportBindings || {})
  };
}


