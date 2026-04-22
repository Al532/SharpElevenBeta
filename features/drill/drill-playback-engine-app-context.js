// @ts-check

import {
  createDrillPlaybackSchedulerHelpers,
  createDrillPlaybackTransportHelpers
} from './drill-playback-runtime-helpers.js';

/**
 * Creates the app-level options consumed by `initializeDrillPlaybackRuntimeEngine`.
 * This keeps the shared playback engine boundary explicit and reusable while
 * the historical runtime still lives in `app.js`.
 *
 * @param {{
 *   dom?: Record<string, any>,
 *   schedulerState?: Record<string, any>,
 *   transportState?: Record<string, any>,
 *   scheduleAhead?: number,
 *   noteFadeout?: number,
 *   scheduleInterval?: number,
 *   schedulerHelperBindings?: Record<string, any>,
 *   transportHelperBindings?: Record<string, any>
 * }} [options]
 * @returns {{
 *   dom: Record<string, any> | undefined,
 *   schedulerState: Record<string, any> | undefined,
 *   transportState: Record<string, any> | undefined,
 *   scheduleAhead: number | undefined,
 *   noteFadeout: number | undefined,
 *   scheduleInterval: number | undefined,
 *   schedulerHelpers: Record<string, any>,
 *   transportHelpers: Record<string, any>
 * }}
 */
export function createDrillPlaybackEngineAppContext({
  dom,
  schedulerState,
  transportState,
  scheduleAhead,
  noteFadeout,
  scheduleInterval,
  schedulerHelperBindings,
  transportHelperBindings
} = {}) {
  return {
    dom,
    schedulerState,
    transportState,
    scheduleAhead,
    noteFadeout,
    scheduleInterval,
    schedulerHelpers: createDrillPlaybackSchedulerHelpers(schedulerHelperBindings || {}),
    transportHelpers: createDrillPlaybackTransportHelpers(transportHelperBindings || {})
  };
}
