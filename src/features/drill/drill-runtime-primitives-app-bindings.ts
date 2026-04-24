// @ts-check

/**
 * Groups the app-level bindings passed into the drill runtime primitives
 * assembly.
 *
 * @param {object} [options]
 * @param {Record<string, unknown>} [options.patternAnalysis]
 * @param {Record<string, unknown>} [options.playbackSettings]
 * @returns {{
 *   patternAnalysis: Record<string, unknown>,
 *   playbackSettings: Record<string, unknown>
 * }}
 */
export function createDrillRuntimePrimitivesAppBindings({
  patternAnalysis = {},
  playbackSettings = {}
} = {}) {
  return {
    patternAnalysis,
    playbackSettings
  };
}
