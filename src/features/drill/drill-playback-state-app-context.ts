
import {
  createDrillPlaybackSchedulerState,
  createDrillPlaybackTransportState
} from './drill-playback-runtime-engine.js';

type CreateDrillPlaybackStateAppContextOptions = {
  schedulerBindings?: Parameters<typeof createDrillPlaybackSchedulerState>[0];
  transportBindings?: Parameters<typeof createDrillPlaybackTransportState>[0];
};

/**
 * Creates the scheduler/transport state proxies consumed by the shared
 * playback engine from app-level getter/setter bindings.
 *
 * @param {{
 *   schedulerBindings?: Parameters<typeof createDrillPlaybackSchedulerState>[0],
 *   transportBindings?: Parameters<typeof createDrillPlaybackTransportState>[0]
 * }} [options]
 * @returns {{
 *   schedulerState: ReturnType<typeof createDrillPlaybackSchedulerState>,
 *   transportState: ReturnType<typeof createDrillPlaybackTransportState>
 * }}
 */
export function createDrillPlaybackStateAppContext({
  schedulerBindings,
  transportBindings
}: CreateDrillPlaybackStateAppContextOptions = {}) {
  return {
    schedulerState: createDrillPlaybackSchedulerState(schedulerBindings || {}),
    transportState: createDrillPlaybackTransportState(transportBindings || {})
  };
}


