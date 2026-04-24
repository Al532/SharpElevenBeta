
import { createDrillSharedPlaybackAppAssembly } from './drill-shared-playback-app-assembly.js';
import {
  createDrillSharedPlaybackAppBindings,
  createDrillSharedPlaybackAppContextOptions
} from './drill-shared-playback-app-context.js';
import { createDrillSharedPlaybackRootAppContext } from './drill-shared-playback-root-app-context.js';
import type { DrillSharedPlaybackAppAssembly, DrillSharedPlaybackHostBindings, DrillSharedPlaybackNormalizationBindings, DrillSharedPlaybackPatternUiBindings, DrillSharedPlaybackRuntimeBindings, DrillSharedPlaybackSettingsBindings, DrillSharedPlaybackStateBindings, DrillSharedPlaybackTransportBindings } from './drill-shared-playback-types.js';

type CreateDrillSharedPlaybackRootAppAssemblyOptions = {
  dom?: Record<string, unknown>;
  host?: DrillSharedPlaybackHostBindings;
  patternUi?: DrillSharedPlaybackPatternUiBindings;
  normalization?: DrillSharedPlaybackNormalizationBindings;
  playbackSettings?: DrillSharedPlaybackSettingsBindings;
  embeddedPlaybackState?: DrillSharedPlaybackStateBindings;
  embeddedPlaybackRuntime?: DrillSharedPlaybackRuntimeBindings;
  embeddedTransportActions?: DrillSharedPlaybackTransportBindings;
  directPlaybackRuntime?: DrillSharedPlaybackRuntimeBindings;
  directPlaybackState?: DrillSharedPlaybackStateBindings;
  directTransportActions?: DrillSharedPlaybackTransportBindings;
  publishDirectGlobals?: boolean;
};

/**
 * Creates the shared drill playback assembly from live root-app bindings.
 * This keeps the embedded/direct playback contract out of `app.js` while
 * preserving the same runtime assembly path used by the chart direct backend.
 *
 * @param {object} [options]
 * @param {Record<string, unknown>} [options.dom]
 * @param {Record<string, unknown>} [options.host]
 * @param {Record<string, unknown>} [options.patternUi]
 * @param {Record<string, unknown>} [options.normalization]
 * @param {Record<string, unknown>} [options.playbackSettings]
 * @param {Record<string, unknown>} [options.embeddedPlaybackState]
 * @param {Record<string, unknown>} [options.embeddedPlaybackRuntime]
 * @param {Record<string, unknown>} [options.embeddedTransportActions]
 * @param {Record<string, unknown>} [options.directPlaybackRuntime]
 * @param {Record<string, unknown>} [options.directPlaybackState]
 * @param {Record<string, unknown>} [options.directTransportActions]
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
}: CreateDrillSharedPlaybackRootAppAssemblyOptions = {}) {
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
        ...rootAppContext,
        publishDirectGlobals
      })
    )
  );
}


