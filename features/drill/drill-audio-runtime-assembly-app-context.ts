import type { DrillAudioFacadeLike, DrillAudioStackLike } from './drill-audio-types.js';

type DrillAudioRuntimeAssemblyAppContextOptions = DrillAudioStackLike & {
  audioFacade?: DrillAudioFacadeLike;
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
