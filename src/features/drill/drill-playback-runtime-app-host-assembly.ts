
import { createDrillPlaybackRuntimeAppAssembly } from './drill-playback-runtime-app-assembly.js';
import { createPracticePlaybackRuntimeHost } from '../practice-playback/practice-playback-runtime-host.js';

type CreateDrillPlaybackRuntimeAppHostAssemblyOptions = {
  dom?: Record<string, unknown>;
  state?: Record<string, unknown>;
  audio?: Record<string, unknown>;
  preload?: Record<string, unknown>;
  constants?: Record<string, unknown>;
  helpers?: Record<string, unknown>;
};

/**
 * Creates the app-level shared playback runtime host from grouped drill app
 * concerns. This keeps the historical state/audio/helper wiring aligned in one
 * place while the concrete state still lives in `app.js`.
 *
 * @param {{
 *   dom?: Record<string, unknown>,
 *   state?: Record<string, unknown>,
 *   audio?: Record<string, unknown>,
 *   preload?: Record<string, unknown>,
 *   constants?: Record<string, unknown>,
 *   helpers?: Record<string, unknown>
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
export function createDrillPlaybackRuntimeAppHostAssembly({
  dom,
  state = {},
  audio = {},
  preload = {},
  constants = {},
  helpers = {}
}: CreateDrillPlaybackRuntimeAppHostAssemblyOptions = {}) {
  return createPracticePlaybackRuntimeHost({
    dom,
    state,
    audio,
    preload,
    constants,
    helpers,
    createRuntimeAppAssembly: createDrillPlaybackRuntimeAppAssembly
  });
}


