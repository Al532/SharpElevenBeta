type DrillRuntimePrimitivesAppContextOptions = {
  patternAnalysisConstants?: Record<string, any>;
  playbackSettingsDom?: Record<string, any>;
  playbackSettingsMixer?: Record<string, any>;
  playbackSettingsHelpers?: Record<string, any>;
  playbackSettingsConstants?: Record<string, any>;
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
