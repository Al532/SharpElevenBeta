// @ts-check

/**
 * Groups the live embedded/direct playback concerns before they are mapped
 * into the shared-playback assembly options, so `app.js` no longer carries the
 * full same-page/fallback runtime state contract inline.
 *
 * @param {object} [options]
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
 * @returns {{
 *   host: Record<string, any>,
 *   patternUi: Record<string, any>,
 *   normalization: Record<string, any>,
 *   playbackSettings: Record<string, any>,
 *   embeddedPlaybackState: Record<string, any>,
 *   embeddedPlaybackRuntime: Record<string, any>,
 *   embeddedTransportActions: Record<string, any>,
 *   directPlaybackRuntime: Record<string, any>,
 *   directPlaybackState: Record<string, any>,
 *   directTransportActions: Record<string, any>
 * }}
 */
export function createDrillSharedPlaybackStateAppContext({
  host = {},
  patternUi = {},
  normalization = {},
  playbackSettings = {},
  embeddedPlaybackState = {},
  embeddedPlaybackRuntime = {},
  embeddedTransportActions = {},
  directPlaybackRuntime = {},
  directPlaybackState = {},
  directTransportActions = {}
} = {}) {
  return {
    host,
    patternUi,
    normalization,
    playbackSettings,
    embeddedPlaybackState,
    embeddedPlaybackRuntime,
    embeddedTransportActions,
    directPlaybackRuntime,
    directPlaybackState,
    directTransportActions
  };
}
