// @ts-check
import type { PracticePlaybackRuntimeHostAssemblyFactory } from './practice-playback-runtime-host.js';

type PracticePlaybackRuntimeHostAppBindingsOptions = {
  dom?: Record<string, unknown>;
  state?: Record<string, unknown>;
  audio?: Record<string, unknown>;
  preload?: Record<string, unknown>;
  constants?: Record<string, unknown>;
  helpers?: Record<string, unknown>;
  createRuntimeAppAssembly?: PracticePlaybackRuntimeHostAssemblyFactory;
};

/**
 * Groups the app-level practice playback runtime bindings passed into the shared playback
 * runtime host assembly.
 *
 * @param {object} [options]
 * @param {Record<string, unknown>} [options.dom]
 * @param {Record<string, unknown>} [options.state]
 * @param {Record<string, unknown>} [options.audio]
 * @param {Record<string, unknown>} [options.preload]
 * @param {Record<string, unknown>} [options.constants]
 * @param {Record<string, unknown>} [options.helpers]
 * @param {(options: Record<string, unknown>) => unknown} [options.createRuntimeAppAssembly]
 * @returns {{
 *   dom: Record<string, unknown>,
 *   state: Record<string, unknown>,
 *   audio: Record<string, unknown>,
 *   preload: Record<string, unknown>,
 *   constants: Record<string, unknown>,
 *   helpers: Record<string, unknown>,
 *   createRuntimeAppAssembly?: (options: Record<string, unknown>) => unknown
 * }}
 */
export function createPracticePlaybackRuntimeHostAppBindings({
  dom = {},
  state = {},
  audio = {},
  preload = {},
  constants = {},
  helpers = {},
  createRuntimeAppAssembly
}: PracticePlaybackRuntimeHostAppBindingsOptions = {}) {
  return {
    dom,
    state,
    audio,
    preload,
    constants,
    helpers,
    createRuntimeAppAssembly
  };
}
