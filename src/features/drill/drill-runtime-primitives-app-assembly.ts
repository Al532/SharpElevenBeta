// @ts-check

import { createDrillPatternAnalysis } from './drill-pattern-analysis.js';
import { createDrillPlaybackSettingsRuntime } from './drill-playback-settings-runtime.js';

/**
 * Creates the low-level drill runtime primitives that are still configured from
 * app constants and DOM bindings.
 *
 * This keeps the pattern-analysis and playback-settings assemblies out of
 * `app.js` while preserving the same helper surfaces for the rest of the app.
 *
 * @param {{
 *   patternAnalysis?: Record<string, unknown>,
 *   playbackSettings?: {
 *     dom?: Record<string, unknown>,
 *     mixer?: Record<string, unknown>,
 *     helpers?: Record<string, unknown>,
 *     constants?: Record<string, unknown>
 *   }
 * }} [options]
 * @returns {{
 *   patternAnalysis: ReturnType<typeof createDrillPatternAnalysis>,
 *   playbackSettingsRuntime: ReturnType<typeof createDrillPlaybackSettingsRuntime>
 * }}
 */
export function createDrillRuntimePrimitivesAppAssembly({
  patternAnalysis = {},
  playbackSettings = {}
} = {}) {
  return {
    patternAnalysis: createDrillPatternAnalysis(patternAnalysis),
    playbackSettingsRuntime: createDrillPlaybackSettingsRuntime(playbackSettings)
  };
}
