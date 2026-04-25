
import {
  createPracticePlaybackSchedulerHelpers,
  createPracticePlaybackTransportHelpers
} from './practice-playback-runtime-helpers.js';

type CreatePracticePlaybackEngineAppContextOptions = {
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
 * Creates the app-level options consumed by `initializePracticePlaybackRuntimeEngine`.
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
export function createPracticePlaybackEngineAppContext({
  dom,
  schedulerState,
  transportState,
  scheduleAhead,
  noteFadeout,
  scheduleInterval,
  schedulerHelperBindings,
  transportHelperBindings
}: CreatePracticePlaybackEngineAppContextOptions = {}) {
  return {
    dom,
    schedulerState,
    transportState,
    scheduleAhead,
    noteFadeout,
    scheduleInterval,
    schedulerHelpers: createPracticePlaybackSchedulerHelpers(schedulerHelperBindings || {}),
    transportHelpers: createPracticePlaybackTransportHelpers(transportHelperBindings || {})
  };
}


