// @ts-check

/**
 * Groups the live drill runtime bindings still owned by `app.js` before they
 * are passed into the shared playback runtime host assembly.
 *
 * @param {object} [options]
 * @param {Record<string, any>} [options.state]
 * @param {Record<string, any>} [options.audio]
 * @param {Record<string, any>} [options.preload]
 * @param {Record<string, any>} [options.constants]
 * @param {Record<string, any>} [options.helpers]
 * @returns {{
 *   state: Record<string, any>,
 *   audio: Record<string, any>,
 *   preload: Record<string, any>,
 *   constants: Record<string, any>,
 *   helpers: Record<string, any>
 * }}
 */
export function createDrillPlaybackRuntimeHostAppBindings({
  state = {},
  audio = {},
  preload = {},
  constants = {},
  helpers = {}
} = {}) {
  return {
    state,
    audio,
    preload,
    constants,
    helpers
  };
}
