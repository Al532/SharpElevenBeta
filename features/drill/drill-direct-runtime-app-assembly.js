// @ts-check

import { createDirectDrillRuntimeAppContextOptions } from './drill-direct-runtime-app-context.js';

/**
 * Creates the app-level direct playback controller options from grouped
 * runtime/playback concerns plus the already-initialized embedded bindings.
 * This mirrors the embedded runtime assembly so `app.js` can keep both
 * boundaries aligned while the chart direct backend is being completed.
 *
 * @param {{
 *   embedded?: {
 *     applyEmbeddedPattern?: (payload: import('../../core/types/contracts').EmbeddedPatternPayload) => import('../../core/types/contracts').PlaybackOperationResult,
 *     applyEmbeddedPlaybackSettings?: (settings: import('../../core/types/contracts').PlaybackSettings) => unknown,
 *     getEmbeddedPlaybackState?: () => Partial<import('../../core/types/contracts').PlaybackRuntimeState> | null | undefined
 *   },
 *   playbackRuntime?: Record<string, any>,
 *   playbackState?: Record<string, any>,
 *   transportActions?: Record<string, any>
 * }} [options]
 * @returns {import('../../core/types/contracts').DirectPlaybackControllerOptions}
 */
export function createDrillDirectRuntimeAppAssembly({
  embedded = {},
  playbackRuntime = {},
  playbackState = {},
  transportActions = {}
} = {}) {
  return createDirectDrillRuntimeAppContextOptions({
    applyEmbeddedPattern: embedded.applyEmbeddedPattern,
    applyEmbeddedPlaybackSettings: embedded.applyEmbeddedPlaybackSettings,
    getEmbeddedPlaybackState: embedded.getEmbeddedPlaybackState,
    playbackRuntime,
    playbackState,
    transportActions
  });
}
