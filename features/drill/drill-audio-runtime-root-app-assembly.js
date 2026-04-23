// @ts-check

import { createDrillAudioRuntimeAppAssembly } from './drill-audio-runtime-app-assembly.js';
import { createDrillAudioRuntimeAppBindings } from './drill-audio-runtime-app-bindings.js';
import { createDrillAudioRuntimeAssemblyAppContext } from './drill-audio-runtime-assembly-app-context.js';

/**
 * Creates the drill audio runtime assembly from live root-app bindings.
 * This keeps the shared audio stack contract out of `app.js` while preserving
 * the existing runtime/app assembly layering.
 *
 * @param {object} [options]
 * @param {Record<string, any>} [options.audioRuntime]
 * @param {Record<string, any>} [options.samplePreload]
 * @param {Record<string, any>} [options.scheduledAudio]
 * @param {Record<string, any>} [options.audioPlayback]
 * @param {Record<string, any>} [options.samplePlayback]
 * @param {Record<string, any>} [options.audioFacade]
 */
export function createDrillAudioRuntimeRootAppAssembly({
  audioRuntime = {},
  samplePreload = {},
  scheduledAudio = {},
  audioPlayback = {},
  samplePlayback = {},
  audioFacade = {}
} = {}) {
  return createDrillAudioRuntimeAppAssembly(
    createDrillAudioRuntimeAppBindings(
      createDrillAudioRuntimeAssemblyAppContext({
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
