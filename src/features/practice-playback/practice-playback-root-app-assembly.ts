
import { createPracticePlaybackAppAssembly } from './practice-playback-app-assembly.js';
import {
  createPracticePlaybackAppBindings,
  createPracticePlaybackAppContextOptions
} from './practice-playback-app-context.js';
import { createPracticePlaybackRootAppContext } from './practice-playback-root-app-context.js';
import type { PracticePlaybackAppAssembly, PracticePlaybackHostBindings, PracticePlaybackNormalizationBindings, PracticePlaybackPatternUiBindings, PracticePlaybackRuntimeBindings, PracticePlaybackSettingsBindings, PracticePlaybackStateBindings, PracticePlaybackTransportBindings } from './practice-playback-types.js';

type CreatePracticePlaybackRootAppAssemblyOptions = {
  dom?: Record<string, unknown>;
  host?: PracticePlaybackHostBindings;
  patternUi?: PracticePlaybackPatternUiBindings;
  normalization?: PracticePlaybackNormalizationBindings;
  playbackSettings?: PracticePlaybackSettingsBindings;
  embeddedPlaybackState?: PracticePlaybackStateBindings;
  embeddedPlaybackRuntime?: PracticePlaybackRuntimeBindings;
  embeddedTransportActions?: PracticePlaybackTransportBindings;
  directPlaybackRuntime?: PracticePlaybackRuntimeBindings;
  directPlaybackState?: PracticePlaybackStateBindings;
  directTransportActions?: PracticePlaybackTransportBindings;
  publishDirectGlobals?: boolean;
  adapters?: Parameters<typeof createPracticePlaybackAppAssembly>[0]['adapters'];
};

/**
 * Creates the shared practice playback assembly from live root-app bindings.
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
export function createPracticePlaybackRootAppAssembly({
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
  publishDirectGlobals,
  adapters
}: CreatePracticePlaybackRootAppAssemblyOptions = {}) {
  const rootAppContext = createPracticePlaybackRootAppContext({
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

  return createPracticePlaybackAppAssembly({
    ...createPracticePlaybackAppBindings(
      createPracticePlaybackAppContextOptions({
        dom,
        ...rootAppContext,
        publishDirectGlobals
      })
    ),
    adapters
  });
}


