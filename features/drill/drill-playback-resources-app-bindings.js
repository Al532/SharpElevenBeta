// @ts-check

/**
 * Groups the app-owned harmony/progression/runtime bindings passed into the
 * drill playback resources assembly.
 *
 * @param {object} [options]
 * @param {Record<string, any>} [options.harmony]
 * @param {Record<string, any>} [options.progressionState]
 * @param {Record<string, any>} [options.playbackSettings]
 * @param {Record<string, any>} [options.runtime]
 * @param {Record<string, any>} [options.audioFacade]
 * @returns {{
 *   harmony: Record<string, any>,
 *   progressionState: Record<string, any>,
 *   playbackSettings: Record<string, any>,
 *   runtime: Record<string, any>,
 *   audioFacade: Record<string, any>
 * }}
 */
export function createDrillPlaybackResourcesAppBindings({
  harmony = {},
  progressionState = {},
  playbackSettings = {},
  runtime = {},
  audioFacade = {}
} = {}) {
  return {
    harmony,
    progressionState,
    playbackSettings,
    runtime,
    audioFacade
  };
}
