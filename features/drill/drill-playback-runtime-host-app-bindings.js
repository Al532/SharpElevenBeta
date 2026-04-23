// @ts-check

/**
 * Groups the app-level drill runtime bindings passed into the shared playback
 * runtime host assembly.
 *
 * @param {object} [options]
 * @param {Record<string, any>} [options.dom]
 * @param {Record<string, any>} [options.state]
 * @param {Record<string, any>} [options.audio]
 * @param {Record<string, any>} [options.preload]
 * @param {Record<string, any>} [options.constants]
 * @param {Record<string, any>} [options.helpers]
 * @returns {{
 *   dom: Record<string, any>,
 *   state: Record<string, any>,
 *   audio: Record<string, any>,
 *   preload: Record<string, any>,
 *   constants: Record<string, any>,
 *   helpers: Record<string, any>
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
