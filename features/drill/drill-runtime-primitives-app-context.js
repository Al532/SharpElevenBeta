// @ts-check

/**
 * Groups the app-level runtime-primitives concerns into the normalized
 * assembly input shape, so `app.js` no longer carries those shared playback
 * primitive contracts inline.
 *
 * @param {object} [options]
 * @param {Record<string, any>} [options.patternAnalysisConstants]
 * @param {Record<string, any>} [options.playbackSettingsDom]
 * @param {Record<string, any>} [options.playbackSettingsMixer]
 * @param {Record<string, any>} [options.playbackSettingsHelpers]
 * @param {Record<string, any>} [options.playbackSettingsConstants]
 * @returns {{
 *   patternAnalysis: Record<string, any>,
 *   playbackSettings: {
 *     dom: Record<string, any>,
 *     mixer: Record<string, any>,
 *     helpers: Record<string, any>,
 *     constants: Record<string, any>
 *   }
 * }}
 */
export function createDrillRuntimePrimitivesAppContextOptions({
  patternAnalysisConstants = {},
  playbackSettingsDom = {},
  playbackSettingsMixer = {},
  playbackSettingsHelpers = {},
  playbackSettingsConstants = {}
} = {}) {
  return {
    patternAnalysis: patternAnalysisConstants,
    playbackSettings: {
      dom: playbackSettingsDom,
      mixer: playbackSettingsMixer,
      helpers: playbackSettingsHelpers,
      constants: playbackSettingsConstants
    }
  };
}
