// @ts-check

/**
 * Groups the app-level embedded and direct playback concerns into the
 * shared-playback assembly shape, so `app.js` no longer owns that runtime
 * contract structure inline.
 *
 * @param {object} [options]
 * @param {Record<string, any>} [options.dom]
 * @param {Record<string, any>} [options.host]
 * @param {Record<string, any>} [options.patternUi]
 * @param {Record<string, any>} [options.normalization]
 * @param {Record<string, any>} [options.playbackSettings]
 * @param {Record<string, any>} [options.embeddedPlaybackState]
 * @param {Record<string, any>} [options.embeddedPlaybackRuntime]
 * @param {Record<string, any>} [options.embeddedTransportActions]
 * @param {Record<string, any>} [options.directPlaybackRuntime]
 * @param {Record<string, any>} [options.directPlaybackState]
 * @param {Record<string, any>} [options.directTransportActions]
 * @param {boolean} [options.publishDirectGlobals]
 * @returns {{
 *   embedded: {
 *     dom: Record<string, any>,
 *     host: Record<string, any>,
 *     patternUi: Record<string, any>,
 *     normalization: Record<string, any>,
 *     playbackSettings: Record<string, any>,
 *     playbackState: Record<string, any>,
 *     playbackRuntime: Record<string, any>,
 *     transportActions: Record<string, any>
 *   },
 *   direct: {
 *     playbackRuntime: Record<string, any>,
 *     playbackState: Record<string, any>,
 *     transportActions: Record<string, any>
 *   },
 *   publishDirectGlobals: boolean | undefined
 * }}
 */
export function createDrillSharedPlaybackAppContextOptions({
  dom = {},
  host = {},
  patternUi = {},
  normalization = {},
  playbackSettings = {},
  embeddedPlaybackState = {},
  embeddedPlaybackRuntime = {},
  embeddedTransportActions = {},
  directPlaybackRuntime = {},
  directPlaybackState = {},
  directTransportActions = {},
  publishDirectGlobals
} = {}) {
  return {
    embedded: {
      dom,
      host,
      patternUi,
      normalization,
      playbackSettings,
      playbackState: embeddedPlaybackState,
      playbackRuntime: embeddedPlaybackRuntime,
      transportActions: embeddedTransportActions
    },
    direct: {
      playbackRuntime: directPlaybackRuntime,
      playbackState: directPlaybackState,
      transportActions: directTransportActions
    },
    publishDirectGlobals
  };
}
