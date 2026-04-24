type DrillRuntimePrimitivesAppContextOptions = {
  patternAnalysisConstants?: Record<string, unknown>;
  playbackSettingsDom?: Record<string, unknown>;
  playbackSettingsMixer?: Record<string, unknown>;
  playbackSettingsHelpers?: Record<string, unknown>;
  playbackSettingsConstants?: Record<string, unknown>;
};

export function createDrillRuntimePrimitivesAppContextOptions({
  patternAnalysisConstants = {},
  playbackSettingsDom = {},
  playbackSettingsMixer = {},
  playbackSettingsHelpers = {},
  playbackSettingsConstants = {}
}: DrillRuntimePrimitivesAppContextOptions = {}) {
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
