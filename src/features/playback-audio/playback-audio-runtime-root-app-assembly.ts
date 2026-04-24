// @ts-check

import { createPlaybackAudioRuntimeAppAssembly } from './playback-audio-runtime-app-assembly.js';
import { createPlaybackAudioRuntimeAppBindings } from './playback-audio-runtime-app-bindings.js';
import { createPlaybackAudioRuntimeAssemblyAppContext } from './playback-audio-runtime-assembly-app-context.js';
/** @import { PlaybackAudioFacadeLike, PlaybackAudioStackLike } from './playback-audio-types.js' */

/**
 * Creates the drill audio runtime assembly from live root-app bindings.
 * This keeps the shared audio stack contract out of `app.js` while preserving
 * the existing runtime/app assembly layering.
 *
 * @param {object} [options]
 * @param {PlaybackAudioStackLike & { audioFacade?: PlaybackAudioFacadeLike }} [options]
 */
export function createPlaybackAudioRuntimeRootAppAssembly({
  audioRuntime = {},
  samplePreload = {},
  scheduledAudio = {},
  audioPlayback = {},
  samplePlayback = {},
  audioFacade = {}
} = {}) {
  return createPlaybackAudioRuntimeAppAssembly(
    createPlaybackAudioRuntimeAppBindings(
      createPlaybackAudioRuntimeAssemblyAppContext({
        audioRuntime,
        samplePreload,
        scheduledAudio,
        audioPlayback,
        samplePlayback,
        audioFacade
      })
    )
  );
}
