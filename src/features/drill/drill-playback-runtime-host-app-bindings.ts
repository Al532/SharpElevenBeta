// @ts-check

/**
 * Groups the app-level drill runtime bindings passed into the shared playback
 * runtime host assembly.
 *
 * @param {object} [options]
 * @param {Record<string, unknown>} [options.dom]
 * @param {Record<string, unknown>} [options.state]
 * @param {Record<string, unknown>} [options.audio]
 * @param {Record<string, unknown>} [options.preload]
 * @param {Record<string, unknown>} [options.constants]
 * @param {Record<string, unknown>} [options.helpers]
 * @returns {{
 *   dom: Record<string, unknown>,
 *   state: Record<string, unknown>,
 *   audio: Record<string, unknown>,
 *   preload: Record<string, unknown>,
 *   constants: Record<string, unknown>,
 *   helpers: Record<string, unknown>
 * }}
 */
export function createDrillPlaybackRuntimeHostAppBindings({
  dom = {},
  state = {},
  audio = {},
  preload = {},
  constants = {},
  helpers = {}
} = {}) {
  return {
    dom,
    state,
    audio,
    preload,
    constants,
    helpers
  };
}
