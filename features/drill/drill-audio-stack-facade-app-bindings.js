// @ts-check

/**
 * Groups the app-level bindings passed into the drill audio stack facade.
 *
 * @param {object} [options]
 * @param {Record<string, any>} [options.audioStack]
 * @param {() => number} [options.getCurrentTime]
 * @param {number} [options.defaultFadeDuration]
 * @returns {{
 *   audioStack: Record<string, any>,
 *   getCurrentTime: (() => number) | undefined,
 *   defaultFadeDuration: number | undefined
 * }}
 */
export function createDrillAudioStackFacadeAppBindings({
  audioStack = {},
  getCurrentTime,
  defaultFadeDuration
} = {}) {
  return {
    audioStack,
    getCurrentTime,
    defaultFadeDuration
  };
}
