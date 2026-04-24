import type { PlaybackAudioFacadeLike, PlaybackAudioStackLike } from './playback-audio-types.js';

type PlaybackAudioRuntimeAssemblyAppContextOptions = PlaybackAudioStackLike & {
  audioFacade?: PlaybackAudioFacadeLike;
};

export function createPlaybackAudioRuntimeAssemblyAppContext({
  audioRuntime = {},
  samplePreload = {},
  scheduledAudio = {},
  audioPlayback = {},
  samplePlayback = {},
  audioFacade = {}
}: PlaybackAudioRuntimeAssemblyAppContextOptions = {}) {
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
