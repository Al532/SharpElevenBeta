// @ts-check

/**
 * Groups the app-level bindings consumed by the drill runtime primitives
 * assembly.
 *
 * @param {object} [options]
 * @param {Record<string, any>} [options.patternAnalysis]
 * @param {Record<string, any>} [options.playbackSettings]
 * @returns {{
 *   patternAnalysis: Record<string, any>,
 *   playbackSettings: Record<string, any>
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
