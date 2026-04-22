// @ts-check

/**
 * Groups the app-level playback-resources concerns into the normalized runtime
 * shape consumed by `createDrillPlaybackResourcesAppAssembly`, so `app.js`
 * no longer carries that preparation/runtime contract inline.
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
export function createDrillPlaybackResourcesRuntimeAppContext({
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
