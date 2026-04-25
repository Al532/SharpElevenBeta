// @ts-check

import { createPracticePatternAnalysis } from '../practice-patterns/practice-pattern-analysis.js';
import { createPracticePlaybackSettingsRuntime } from '../practice-playback/practice-playback-settings-runtime.js';

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
 *   patternAnalysis: ReturnType<typeof createPracticePatternAnalysis>,
 *   playbackSettingsRuntime: ReturnType<typeof createPracticePlaybackSettingsRuntime>
 * }}
 */
export function createDrillRuntimePrimitivesAppAssembly({
  patternAnalysis = {},
  playbackSettings = {}
} = {}) {
  return {
    patternAnalysis: createPracticePatternAnalysis(patternAnalysis),
    playbackSettingsRuntime: createPracticePlaybackSettingsRuntime(playbackSettings)
  };
}
