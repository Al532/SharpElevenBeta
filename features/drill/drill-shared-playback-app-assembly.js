// @ts-check

import { publishDirectPlaybackGlobals } from '../../core/playback/direct-playback-globals.js';
import { createDrillDirectRuntimeAppAssembly } from './drill-direct-runtime-app-assembly.js';
import { createDrillEmbeddedRuntimeAppAssembly } from './drill-embedded-runtime-app-assembly.js';
import { initializeEmbeddedDrillRuntime } from './drill-embedded-runtime.js';

/**
 * Creates the shared drill playback app assembly used by both the legacy
 * embedded runtime and the chart-facing direct runtime surface.
 *
 * This keeps the app-level wiring for the two playback entry points aligned in
 * one place while `app.js` continues to own the concrete DOM/state bindings.
 *
 * @param {{
 *   embedded?: {
 *     dom?: Record<string, any>,
 *     host?: Record<string, any>,
 *     patternUi?: Record<string, any>,
 *     normalization?: Record<string, any>,
 *     playbackSettings?: Record<string, any>,
 *     playbackState?: Record<string, any>,
 *     playbackRuntime?: Record<string, any>,
 *     transportActions?: Record<string, any>
 *   },
 *   direct?: {
 *     playbackRuntime?: Record<string, any>,
 *     playbackState?: Record<string, any>,
 *     transportActions?: Record<string, any>
 *   },
 *   publishDirectGlobals?: boolean
 * }} [options]
 * @returns {{
 *   playbackController: import('../../core/types/contracts').PlaybackSessionController,
 *   applyEmbeddedPattern: (payload: import('../../core/types/contracts').EmbeddedPatternPayload) => import('../../core/types/contracts').PlaybackOperationResult,
 *   applyEmbeddedPlaybackSettings: (settings: import('../../core/types/contracts').PlaybackSettings) => unknown,
 *   getEmbeddedPlaybackState: () => Partial<import('../../core/types/contracts').PlaybackRuntimeState> | null | undefined,
 *   directPlaybackControllerOptions: import('../../core/types/contracts').DirectPlaybackControllerOptions
 * }}
 */
export function createDrillSharedPlaybackAppAssembly({
  embedded = {},
  direct = {},
  publishDirectGlobals = true
} = {}) {
  const {
    playbackController,
    applyEmbeddedPattern,
    applyEmbeddedPlaybackSettings,
    getEmbeddedPlaybackState
  } = initializeEmbeddedDrillRuntime(createDrillEmbeddedRuntimeAppAssembly({
    dom: embedded.dom,
    host: embedded.host,
    patternUi: embedded.patternUi,
    normalization: embedded.normalization,
    playbackSettings: embedded.playbackSettings,
    playbackState: embedded.playbackState,
    playbackRuntime: embedded.playbackRuntime,
    transportActions: embedded.transportActions
  }));

  const directPlaybackControllerOptions = createDrillDirectRuntimeAppAssembly({
    embedded: {
      applyEmbeddedPattern,
      applyEmbeddedPlaybackSettings,
      getEmbeddedPlaybackState
    },
    playbackRuntime: direct.playbackRuntime,
    playbackState: direct.playbackState,
    transportActions: direct.transportActions
  });

  if (publishDirectGlobals) {
    publishDirectPlaybackGlobals({
      directPlaybackControllerOptions
    });
  }

  return {
    playbackController,
    applyEmbeddedPattern,
    applyEmbeddedPlaybackSettings,
    getEmbeddedPlaybackState,
    directPlaybackControllerOptions
  };
}
