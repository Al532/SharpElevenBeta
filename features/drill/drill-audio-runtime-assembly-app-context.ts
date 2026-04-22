type DrillAudioRuntimeAssemblyAppContextOptions = {
  audioRuntime?: Record<string, any>;
  samplePreload?: Record<string, any>;
  scheduledAudio?: Record<string, any>;
  audioPlayback?: Record<string, any>;
  samplePlayback?: Record<string, any>;
  audioFacade?: Record<string, any>;
};

export function createDrillAudioRuntimeAssemblyAppContext({
  audioRuntime = {},
  samplePreload = {},
  scheduledAudio = {},
  audioPlayback = {},
  samplePlayback = {},
  audioFacade = {}
}: DrillAudioRuntimeAssemblyAppContextOptions = {}) {
  return {
    audioStack: {
      audioRuntime,
      samplePreload,
      scheduledAudio,
      audioPlayback,
      samplePlayback
    },
    audioFacade
  };
}
