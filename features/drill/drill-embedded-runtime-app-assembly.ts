import { createEmbeddedDrillRuntimeAppContextOptions } from './drill-embedded-runtime-app-context.js';
import { createDrillEmbeddedRuntimeHostBindings } from './drill-embedded-runtime-host.js';
import { createDrillEmbeddedRuntimeContextBindings } from './drill-runtime-app-bindings.js';

export function createDrillEmbeddedRuntimeAppAssembly({
  dom,
  host = {},
  patternUi = {},
  normalization = {},
  playbackSettings = {},
  playbackState = {},
  playbackRuntime = {},
  transportActions = {}
}: {
  dom?: Record<string, any>;
  host?: Record<string, any>;
  patternUi?: Record<string, any>;
  normalization?: Record<string, any>;
  playbackSettings?: Record<string, any>;
  playbackState?: Record<string, any>;
  playbackRuntime?: Record<string, any>;
  transportActions?: Record<string, any>;
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
