
import { createDrillPlaybackEngineAppContext } from './drill-playback-engine-app-context.js';
import { createDrillPlaybackStateAppContext } from './drill-playback-state-app-context.js';
import { initializeDrillPlaybackRuntimeEngine } from './drill-playback-runtime-engine.js';

type CreateDrillPlaybackRuntimeAppAssemblyOptions = {
  dom?: Record<string, unknown>;
  schedulerBindings?: Record<string, unknown>;
  transportBindings?: Record<string, unknown>;
  scheduleAhead?: number;
  noteFadeout?: number;
  scheduleInterval?: number;
  schedulerHelperBindings?: Record<string, unknown>;
  transportHelperBindings?: Record<string, unknown>;
};

/**
 * Creates the full playback runtime wiring consumed by `app.js` from grouped
 * state bindings, helper bindings, and transport constants.
 *
 * @param {{
 *   dom?: Record<string, any>,
 *   schedulerBindings?: Record<string, any>,
 *   transportBindings?: Record<string, any>,
 *   scheduleAhead?: number,
 *   noteFadeout?: number,
 *   scheduleInterval?: number,
 *   schedulerHelperBindings?: Record<string, any>,
 *   transportHelperBindings?: Record<string, any>
 * }} [options]
 * @returns {{
 *   prepareNextProgressionPlayback: (...args: any[]) => any,
 *   scheduleBeatPlayback: (...args: any[]) => any,
 *   scheduleDisplayPlayback: (...args: any[]) => any,
 *   start: (...args: any[]) => any,
 *   stop: (...args: any[]) => any,
 *   togglePause: (...args: any[]) => any
 * }}
 */
export function createDrillPlaybackRuntimeAppAssembly({
  dom,
  schedulerBindings,
  transportBindings,
  scheduleAhead,
  noteFadeout,
  scheduleInterval,
  schedulerHelperBindings,
  transportHelperBindings
}: CreateDrillPlaybackRuntimeAppAssemblyOptions = {}) {
  const {
    schedulerState,
    transportState
  } = createDrillPlaybackStateAppContext({
    schedulerBindings,
    transportBindings
  });

  return initializeDrillPlaybackRuntimeEngine(createDrillPlaybackEngineAppContext({
    dom,
    schedulerState,
    transportState,
    scheduleAhead,
    noteFadeout,
    scheduleInterval,
    schedulerHelperBindings,
    transportHelperBindings
  }));
}


