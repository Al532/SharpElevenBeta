// @ts-check

/**
 * Groups the app-level bindings passed into the shared drill audio stack
 * assembly while live runtime state remains in `app.js`.
 *
 * @param {object} [options]
 * @param {Record<string, any>} [options.audioRuntime]
 * @param {Record<string, any>} [options.samplePreload]
 * @param {Record<string, any>} [options.scheduledAudio]
 * @param {Record<string, any>} [options.audioPlayback]
 * @param {Record<string, any>} [options.samplePlayback]
 * @returns {{
 *   audioRuntime: Record<string, any>,
 *   samplePreload: Record<string, any>,
 *   scheduledAudio: Record<string, any>,
 *   audioPlayback: Record<string, any>,
 *   samplePlayback: Record<string, any>
 * }}
 */
export function createDrillAudioStackAppBindings({
  audioRuntime = {},
  samplePreload = {},
  scheduledAudio = {},
  audioPlayback = {},
  samplePlayback = {}
} = {}) {
  return {
    audioRuntime,
    samplePreload,
    scheduledAudio,
    audioPlayback,
    samplePlayback
  };
}
