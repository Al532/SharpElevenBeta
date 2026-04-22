// @ts-check

/**
 * Groups the app-level drill audio assembly concerns into the normalized
 * `createDrillAudioRuntimeAppAssembly` input shape, so `app.js` no longer
 * carries the full shared audio stack contract inline.
 *
 * @param {object} [options]
 * @param {Record<string, any>} [options.audioRuntime]
 * @param {Record<string, any>} [options.samplePreload]
 * @param {Record<string, any>} [options.scheduledAudio]
 * @param {Record<string, any>} [options.audioPlayback]
 * @param {Record<string, any>} [options.samplePlayback]
 * @param {Record<string, any>} [options.audioFacade]
 * @returns {{
 *   audioStack: {
 *     audioRuntime: Record<string, any>,
 *     samplePreload: Record<string, any>,
 *     scheduledAudio: Record<string, any>,
 *     audioPlayback: Record<string, any>,
 *     samplePlayback: Record<string, any>
 *   },
 *   audioFacade: Record<string, any>
 * }}
 */
export function createDrillAudioRuntimeAssemblyAppContext({
  audioRuntime = {},
  samplePreload = {},
  scheduledAudio = {},
  audioPlayback = {},
  samplePlayback = {},
  audioFacade = {}
} = {}) {
  return {
    audioStack: {
      audioRuntime,
      samplePreload,
      scheduledAudio,
      audioPlayback,
      samplePlayback
    },
    audioFacade
  };
}
