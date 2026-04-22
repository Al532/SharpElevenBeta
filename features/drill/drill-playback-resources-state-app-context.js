// @ts-check

/**
 * Groups the live playback-resource state and helpers before they are mapped
 * into the playback-resources app/runtime contexts, so `app.js` no longer
 * carries that preparation contract inline.
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
export function createDrillPlaybackResourcesStateAppContext({
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
