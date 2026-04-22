// @ts-check

/**
 * Groups the live app-owned playback resource concerns into the
 * `createDrillPlaybackResourcesAppAssembly` input shape, so `app.js` no longer
 * carries that shared playback-resource contract inline.
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
export function createDrillPlaybackResourcesAppContext({
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
