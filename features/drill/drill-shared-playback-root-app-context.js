// @ts-check

import { createDrillSharedPlaybackDirectRuntimeAppContext } from './drill-shared-playback-direct-runtime-app-context.js';
import { createDrillSharedPlaybackDirectStateAppContext } from './drill-shared-playback-direct-state-app-context.js';
import { createDrillSharedPlaybackDirectTransportAppContext } from './drill-shared-playback-direct-transport-app-context.js';
import { createDrillSharedPlaybackEmbeddedRuntimeAppContext } from './drill-shared-playback-embedded-runtime-app-context.js';
import { createDrillSharedPlaybackEmbeddedStateAppContext } from './drill-shared-playback-embedded-state-app-context.js';
import { createDrillSharedPlaybackHostAppContext } from './drill-shared-playback-host-app-context.js';
import { createDrillSharedPlaybackNormalizationAppContext } from './drill-shared-playback-normalization-app-context.js';
import { createDrillSharedPlaybackPatternUiAppContext } from './drill-shared-playback-pattern-ui-app-context.js';
import { createDrillSharedPlaybackSettingsAppContext } from './drill-shared-playback-settings-app-context.js';

/**
 * Creates the shared playback root app context from live root-app bindings.
 * This keeps the host/pattern/runtime sub-context construction out of `app.js`
 * while preserving the same embedded/direct playback wiring contracts.
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
 */
export function createDrillSharedPlaybackRootAppContext({
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
    host: createDrillSharedPlaybackHostAppContext(host),
    patternUi: createDrillSharedPlaybackPatternUiAppContext(patternUi),
    normalization: createDrillSharedPlaybackNormalizationAppContext(normalization),
    playbackSettings: createDrillSharedPlaybackSettingsAppContext(playbackSettings),
    embeddedPlaybackState: createDrillSharedPlaybackEmbeddedStateAppContext(embeddedPlaybackState),
    embeddedPlaybackRuntime: createDrillSharedPlaybackEmbeddedRuntimeAppContext(embeddedPlaybackRuntime),
    embeddedTransportActions,
    directPlaybackRuntime: createDrillSharedPlaybackDirectRuntimeAppContext(directPlaybackRuntime),
    directPlaybackState: createDrillSharedPlaybackDirectStateAppContext(directPlaybackState),
    directTransportActions: createDrillSharedPlaybackDirectTransportAppContext(directTransportActions)
  };
}
