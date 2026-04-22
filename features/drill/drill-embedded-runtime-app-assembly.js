// @ts-check

import { createEmbeddedDrillRuntimeAppContextOptions } from './drill-embedded-runtime-app-context.js';
import { createDrillEmbeddedRuntimeHostBindings } from './drill-embedded-runtime-host.js';
import { createDrillEmbeddedRuntimeContextBindings } from './drill-runtime-app-bindings.js';

/**
 * Creates the embedded runtime app-context options from grouped runtime/UI
 * concerns plus the host-specific DOM bindings. This keeps the full embedded
 * runtime assembly out of `app.js`.
 *
 * @param {object} [options]
 * @param {Record<string, any>} [options.dom]
 * @param {object} [options.host]
 * @param {object} [options.patternUi]
 * @param {object} [options.normalization]
 * @param {object} [options.playbackSettings]
 * @param {object} [options.playbackState]
 * @param {object} [options.playbackRuntime]
 * @param {object} [options.transportActions]
 * @returns {Record<string, any>}
 */
export function createDrillEmbeddedRuntimeAppAssembly({
  dom,
  host = {},
  patternUi = {},
  normalization = {},
  playbackSettings = {},
  playbackState = {},
  playbackRuntime = {},
  transportActions = {}
} = {}) {
  const hostBindings = createDrillEmbeddedRuntimeHostBindings({
    dom,
    ...host
  });

  return createEmbeddedDrillRuntimeAppContextOptions(
    createDrillEmbeddedRuntimeContextBindings({
      dom,
      patternUi: {
        ...hostBindings.patternUi,
        ...patternUi
      },
      normalization,
      playbackSettings,
      playbackState: {
        ...hostBindings.playbackState,
        ...playbackState
      },
      playbackRuntime: {
        ...hostBindings.playbackRuntime,
        ...playbackRuntime
      },
      transportActions: {
        ...hostBindings.transportActions,
        ...transportActions
      }
    })
  );
}
