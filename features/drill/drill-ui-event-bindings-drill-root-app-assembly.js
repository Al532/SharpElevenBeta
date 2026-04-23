// @ts-check

import { createDrillUiEventBindingsRootAppAssembly } from './drill-ui-event-bindings-root-app-assembly.js';

function createGetter(ref) {
  return typeof ref?.get === 'function' ? () => ref.get() : undefined;
}

function createSetter(ref) {
  return typeof ref?.set === 'function' ? (value) => ref.set(value) : undefined;
}

/**
 * Creates the drill UI event-binding assembly from live app bindings while
 * allowing the remaining UI state sections to be passed via compact `refs`.
 *
 * @param {object} [options]
 * @param {Record<string, any>} [options.welcomeControls]
 * @param {Record<string, any>} [options.analyticsLink]
 * @param {Record<string, any>} [options.settingsControls]
 * @param {Record<string, { get: () => any, set?: (value: any) => void }>} [options.settingsStateRefs]
 * @param {Record<string, any>} [options.pianoPresetControls]
 * @param {Record<string, { get: () => any, set?: (value: any) => void }>} [options.pianoPresetStateRefs]
 * @param {Record<string, any>} [options.lifecycleControls]
 * @param {Record<string, { get: () => any, set?: (value: any) => void }>} [options.lifecycleStateRefs]
 * @param {EventTarget | { addEventListener?: Function }} [options.lifecycleTarget]
 * @param {Function} [options.trackSessionDuration]
 */
export function createDrillUiEventBindingsDrillRootAppAssembly({
  welcomeControls = {},
  analyticsLink = {},
  settingsControls = {},
  settingsStateRefs = {},
  pianoPresetControls = {},
  pianoPresetStateRefs = {},
  lifecycleControls = {},
  lifecycleStateRefs = {},
  lifecycleTarget = globalThis.window,
  trackSessionDuration
} = {}) {
  return createDrillUiEventBindingsRootAppAssembly({
    welcomeControls,
    analyticsLink,
    settingsControls: {
      ...settingsControls,
      isPlaying: createGetter(settingsStateRefs.isPlaying) || settingsControls.isPlaying,
      getAudioContext: createGetter(settingsStateRefs.audioContext) || settingsControls.getAudioContext,
      getCurrentKey: createGetter(settingsStateRefs.currentKey) || settingsControls.getCurrentKey
    },
    pianoPresetControls: {
      ...pianoPresetControls,
      getPianoMidiSettings: createGetter(pianoPresetStateRefs.pianoMidiSettings) || pianoPresetControls.getPianoMidiSettings,
      setPianoFadeSettings: createSetter(pianoPresetStateRefs.pianoFadeSettings) || pianoPresetControls.setPianoFadeSettings,
      setPianoMidiSettings: createSetter(pianoPresetStateRefs.pianoMidiSettings) || pianoPresetControls.setPianoMidiSettings
    },
    lifecycleControls: {
      ...lifecycleControls,
      getIsPlaying: createGetter(lifecycleStateRefs.isPlaying) || lifecycleControls.getIsPlaying,
      getIsPaused: createGetter(lifecycleStateRefs.isPaused) || lifecycleControls.getIsPaused,
      getAudioContext: createGetter(lifecycleStateRefs.audioContext) || lifecycleControls.getAudioContext
    },
    lifecycleTarget,
    trackSessionDuration
  });
}
