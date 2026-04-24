// @ts-check

import { createPracticePlaybackRuntimeHost } from './practice-playback-runtime-host.js';
import type { PracticePlaybackRuntimeHostAssemblyFactory } from './practice-playback-runtime-host.js';
import { createPracticePlaybackRuntimeHostAppBindings } from './practice-playback-runtime-host-app-bindings.js';
import {
  createPracticePlaybackRuntimeHostAppContext,
  createPracticePlaybackRuntimeHostAudioAppContext,
  createPracticePlaybackRuntimeHostConstantsAppContext,
  createPracticePlaybackRuntimeHostHelpersAppContext,
  createPracticePlaybackRuntimeHostPreloadAppContext,
  createPracticePlaybackRuntimeHostStateAppContext
} from './practice-playback-runtime-host-app-context.js';

type PracticePlaybackRuntimeHostRootAppAssemblyOptions = {
  dom?: Record<string, unknown>;
  runtimeState?: Record<string, unknown>;
  audioState?: Record<string, unknown>;
  preloadState?: Record<string, unknown>;
  playbackConstants?: Record<string, unknown>;
  runtimeHelpers?: Record<string, unknown>;
  createRuntimeAppAssembly?: PracticePlaybackRuntimeHostAssemblyFactory;
};

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
 * @param {(options: Record<string, unknown>) => unknown} [options.createRuntimeAppAssembly]
 */
export function createPracticePlaybackRuntimeHostRootAppAssembly({
  dom = {},
  runtimeState = {},
  audioState = {},
  preloadState = {},
  playbackConstants = {},
  runtimeHelpers = {},
  createRuntimeAppAssembly
}: PracticePlaybackRuntimeHostRootAppAssemblyOptions = {}) {
  const context = createPracticePlaybackRuntimeHostAppContext({
    dom,
    ...createPracticePlaybackRuntimeHostStateAppContext({
      runtimeState,
      audioState: createPracticePlaybackRuntimeHostAudioAppContext(audioState),
      preloadState: createPracticePlaybackRuntimeHostPreloadAppContext(preloadState),
      playbackConstants: createPracticePlaybackRuntimeHostConstantsAppContext(playbackConstants),
      runtimeHelpers: createPracticePlaybackRuntimeHostHelpersAppContext(runtimeHelpers)
    })
  });

  return createPracticePlaybackRuntimeHost(
    createPracticePlaybackRuntimeHostAppBindings({
      dom: context.dom,
      state: context.runtimeState,
      audio: context.audioState,
      preload: context.preloadState,
      constants: context.playbackConstants,
      helpers: context.runtimeHelpers,
      createRuntimeAppAssembly
    })
  );
}
