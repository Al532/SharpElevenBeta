// @ts-check

import { createDrillSharedPlaybackAppAssembly } from './drill-shared-playback-app-assembly.js';
import { createDrillSharedPlaybackAppBindings } from './drill-shared-playback-app-bindings.js';
import { createDrillSharedPlaybackAppContextOptions } from './drill-shared-playback-app-context.js';
import { createDrillSharedPlaybackRootAppContext } from './drill-shared-playback-root-app-context.js';
import { createDrillSharedPlaybackStateAppContext } from './drill-shared-playback-state-app-context.js';

/**
 * Creates the shared drill playback assembly from live root-app bindings.
 * This keeps the embedded/direct playback contract out of `app.js` while
 * preserving the same runtime assembly path used by the chart direct backend.
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
 */
export function createDrillSharedPlaybackRootAppAssembly({
  dom,
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
  const rootAppContext = createDrillSharedPlaybackRootAppContext({
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
  });

  return createDrillSharedPlaybackAppAssembly(
    createDrillSharedPlaybackAppBindings(
      createDrillSharedPlaybackAppContextOptions({
        dom,
        ...createDrillSharedPlaybackStateAppContext(rootAppContext),
        publishDirectGlobals
      })
    )
  );
}
