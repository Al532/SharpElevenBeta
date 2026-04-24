// @ts-check

import { createDrillAudioFacadeAppSurface } from './drill-audio-facade-app-surface.js';
import { createDrillAudioStackAppAssembly } from './drill-audio-stack-app-assembly.js';
import { createDrillAudioStackAppBindings } from './drill-audio-stack-app-bindings.js';
import { createDrillAudioStackAppFacade } from './drill-audio-stack-app-facade.js';
import { createDrillAudioStackFacadeAppBindings } from './drill-audio-stack-facade-app-bindings.js';
/** @import { DrillAudioFacadeLike, DrillAudioStackLike } from './drill-audio-types.js' */

/**
 * Materializes the drill audio stack, facade, and app-facing surface from grouped
 * app concerns so `app.js` can keep moving toward orchestration-only wiring.
 *
 * @param {{ audioStack?: DrillAudioStackLike, audioFacade?: Partial<Pick<import('./drill-audio-stack-app-facade.js'), never>> & { getCurrentTime?: () => number, defaultFadeDuration?: number } }} [options]
 */
export function createDrillAudioRuntimeAppAssembly({
  audioStack = {},
  audioFacade = {}
} = {}) {
  const runtimeAudioStack = createDrillAudioStackAppAssembly({
    ...createDrillAudioStackAppBindings(audioStack)
  });
  const runtimeAudioFacade = createDrillAudioStackAppFacade({
    ...createDrillAudioStackFacadeAppBindings({
      audioStack: runtimeAudioStack,
      ...audioFacade
    })
  });

  return {
    audioStack: runtimeAudioStack,
    audioFacade: runtimeAudioFacade,
    audioSurface: createDrillAudioFacadeAppSurface(runtimeAudioFacade)
  };
}
