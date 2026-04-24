
import {
  createDrillPlaybackSchedulerHelpers,
  createDrillPlaybackTransportHelpers
} from './drill-playback-runtime-helpers.js';

type CreateDrillPlaybackEngineAppContextOptions = {
  dom?: Record<string, unknown>;
  schedulerState?: Record<string, unknown>;
  transportState?: Record<string, unknown>;
  scheduleAhead?: number;
  noteFadeout?: number;
  scheduleInterval?: number;
  schedulerHelperBindings?: Record<string, unknown>;
  transportHelperBindings?: Record<string, unknown>;
};

/**
 * Creates the app-level options consumed by `initializeDrillPlaybackRuntimeEngine`.
 * This keeps the shared playback engine boundary explicit and reusable while
 * the historical runtime still lives in `app.js`.
 *
 * @param {{
 *   dom?: Record<string, unknown>,
 *   schedulerState?: Record<string, unknown>,
 *   transportState?: Record<string, unknown>,
 *   scheduleAhead?: number,
 *   noteFadeout?: number,
 *   scheduleInterval?: number,
 *   schedulerHelperBindings?: Record<string, unknown>,
 *   transportHelperBindings?: Record<string, unknown>
 * }} [options]
 * @returns {{
 *   dom: Record<string, unknown> | undefined,
 *   schedulerState: Record<string, unknown> | undefined,
 *   transportState: Record<string, unknown> | undefined,
 *   scheduleAhead: number | undefined,
 *   noteFadeout: number | undefined,
 *   scheduleInterval: number | undefined,
 *   schedulerHelpers: Record<string, unknown>,
 *   transportHelpers: Record<string, unknown>
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
}: CreateDrillPlaybackEngineAppContextOptions = {}) {
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


