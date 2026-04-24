// @ts-check

import { createDrillPlaybackRuntimeAppContextOptions } from './drill-playback-runtime-app-context.js';
import { createDrillPlaybackRuntimeAppHostAssembly } from './drill-playback-runtime-app-host-assembly.js';
import { createDrillPlaybackRuntimeHostAppBindings } from './drill-playback-runtime-host-app-bindings.js';
import {
  createDrillPlaybackRuntimeHostAppContext,
  createDrillPlaybackRuntimeHostAudioAppContext,
  createDrillPlaybackRuntimeHostConstantsAppContext,
  createDrillPlaybackRuntimeHostHelpersAppContext,
  createDrillPlaybackRuntimeHostPreloadAppContext,
  createDrillPlaybackRuntimeHostStateAppContext
} from './drill-playback-runtime-host-app-context.js';

/**
 * Creates the drill playback runtime host assembly from live root-app bindings.
 * This keeps the largest remaining playback-host contract out of `app.js`
 * while preserving the existing host/app-context layering.
 *
 * @param {object} [options]
 * @param {Record<string, unknown>} [options.dom]
 * @param {Record<string, unknown>} [options.runtimeState]
 * @param {Record<string, unknown>} [options.audioState]
 * @param {Record<string, unknown>} [options.preloadState]
 * @param {Record<string, unknown>} [options.playbackConstants]
 * @param {Record<string, unknown>} [options.runtimeHelpers]
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
