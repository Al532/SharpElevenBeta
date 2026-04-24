// @ts-check

import { createDrillPlaybackRuntimeAppContextOptions } from './drill-playback-runtime-app-context.js';
import { createDrillPlaybackRuntimeAppHostAssembly } from './drill-playback-runtime-app-host-assembly.js';
import { createDrillPlaybackRuntimeHostAppBindings } from './drill-playback-runtime-host-app-bindings.js';
import { createDrillPlaybackRuntimeHostAppContext } from './drill-playback-runtime-host-app-context.js';
import { createDrillPlaybackRuntimeHostAudioAppContext } from './drill-playback-runtime-host-audio-app-context.js';
import { createDrillPlaybackRuntimeHostConstantsAppContext } from './drill-playback-runtime-host-constants-app-context.js';
import { createDrillPlaybackRuntimeHostHelpersAppContext } from './drill-playback-runtime-host-helpers-app-context.js';
import { createDrillPlaybackRuntimeHostPreloadAppContext } from './drill-playback-runtime-host-preload-app-context.js';
import { createDrillPlaybackRuntimeHostStateAppContext } from './drill-playback-runtime-host-state-app-context.js';

/**
 * Creates the drill playback runtime host assembly from live root-app bindings.
 * This keeps the largest remaining playback-host contract out of `app.js`
 * while preserving the existing host/app-context layering.
 *
 * @param {object} [options]
 * @param {Record<string, any>} [options.dom]
 * @param {Record<string, any>} [options.runtimeState]
 * @param {Record<string, any>} [options.audioState]
 * @param {Record<string, any>} [options.preloadState]
 * @param {Record<string, any>} [options.playbackConstants]
 * @param {Record<string, any>} [options.runtimeHelpers]
 */
export function createDrillPlaybackRuntimeHostRootAppAssembly({
  dom = {},
  runtimeState = {},
  audioState = {},
  preloadState = {},
  playbackConstants = {},
  runtimeHelpers = {}
} = {}) {
  return createDrillPlaybackRuntimeAppHostAssembly(
    createDrillPlaybackRuntimeHostAppBindings(
      createDrillPlaybackRuntimeAppContextOptions(
        createDrillPlaybackRuntimeHostAppContext({
          dom,
          ...createDrillPlaybackRuntimeHostStateAppContext({
            runtimeState,
            audioState: createDrillPlaybackRuntimeHostAudioAppContext(audioState),
            preloadState: createDrillPlaybackRuntimeHostPreloadAppContext(preloadState),
            playbackConstants: createDrillPlaybackRuntimeHostConstantsAppContext(playbackConstants),
            runtimeHelpers: createDrillPlaybackRuntimeHostHelpersAppContext(runtimeHelpers)
          })
        })
      )
    )
  );
}
