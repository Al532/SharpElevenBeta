// @ts-check

/**
 * Groups the app-owned embedded/direct playback bindings passed into the
 * shared drill playback assembly.
 *
 * @param {object} [options]
 * @param {Record<string, any>} [options.embedded]
 * @param {Record<string, any>} [options.direct]
 * @param {boolean} [options.publishDirectGlobals]
 * @returns {{
 *   embedded: Record<string, any>,
 *   direct: Record<string, any>,
 *   publishDirectGlobals: boolean | undefined
 * }}
 */
export function createDrillSharedPlaybackAppBindings({
  embedded = {},
  direct = {},
  publishDirectGlobals
} = {}) {
  return {
    embedded,
    direct,
    publishDirectGlobals
  };
}
