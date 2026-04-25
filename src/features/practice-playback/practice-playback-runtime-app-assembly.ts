
import { createPracticePlaybackEngineAppContext } from './practice-playback-engine-app-context.js';
import { createPracticePlaybackStateAppContext } from './practice-playback-state-app-context.js';
import { initializePracticePlaybackRuntimeEngine } from './practice-playback-runtime-engine.js';

type CreatePracticePlaybackRuntimeAppAssemblyOptions = {
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
 *   dom?: Record<string, unknown>,
 *   schedulerBindings?: Record<string, unknown>,
 *   transportBindings?: Record<string, unknown>,
 *   scheduleAhead?: number,
 *   noteFadeout?: number,
 *   scheduleInterval?: number,
 *   schedulerHelperBindings?: Record<string, unknown>,
 *   transportHelperBindings?: Record<string, unknown>
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
export function createPracticePlaybackRuntimeAppAssembly({
  dom,
  schedulerBindings,
  transportBindings,
  scheduleAhead,
  noteFadeout,
  scheduleInterval,
  schedulerHelperBindings,
  transportHelperBindings
}: CreatePracticePlaybackRuntimeAppAssemblyOptions = {}) {
  const {
    schedulerState,
    transportState
  } = createPracticePlaybackStateAppContext({
    schedulerBindings,
    transportBindings
  });

  return initializePracticePlaybackRuntimeEngine(createPracticePlaybackEngineAppContext({
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


