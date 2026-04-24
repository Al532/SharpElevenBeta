// @ts-check

import { createPlaybackAudioFacadeAppSurface } from './playback-audio-facade-app-surface.js';
import { createPlaybackAudioStackAppAssembly } from './playback-audio-stack-app-assembly.js';
import { createPlaybackAudioStackAppBindings } from './playback-audio-stack-app-bindings.js';
import { createPlaybackAudioStackAppFacade } from './playback-audio-stack-app-facade.js';
import { createPlaybackAudioStackFacadeAppBindings } from './playback-audio-stack-facade-app-bindings.js';
/** @import { PlaybackAudioFacadeLike, PlaybackAudioStackLike } from './playback-audio-types.js' */

/**
 * Materializes the drill audio stack, facade, and app-facing surface from grouped
 * app concerns so `app.js` can keep moving toward orchestration-only wiring.
 *
 * @param {{ audioStack?: PlaybackAudioStackLike, audioFacade?: Partial<Pick<import('./playback-audio-stack-app-facade.js'), never>> & { getCurrentTime?: () => number, defaultFadeDuration?: number } }} [options]
 */
export function createPlaybackAudioRuntimeAppAssembly({
  audioStack = {},
  audioFacade = {}
} = {}) {
  const runtimeAudioStack = createPlaybackAudioStackAppAssembly({
    ...createPlaybackAudioStackAppBindings(audioStack)
  });
  const runtimeAudioFacade = createPlaybackAudioStackAppFacade({
    ...createPlaybackAudioStackFacadeAppBindings({
      audioStack: runtimeAudioStack,
      ...audioFacade
    })
  });

  return {
    audioStack: runtimeAudioStack,
    audioFacade: runtimeAudioFacade,
    audioSurface: createPlaybackAudioFacadeAppSurface(runtimeAudioFacade)
  };
}
