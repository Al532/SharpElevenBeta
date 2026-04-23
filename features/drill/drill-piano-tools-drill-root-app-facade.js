// @ts-check

import { createDrillPianoToolsRootAppFacade } from './drill-piano-tools-root-app-facade.js';

function createGetter(ref) {
  return typeof ref?.get === 'function' ? () => ref.get() : undefined;
}

function createSetter(ref) {
  return typeof ref?.set === 'function' ? (value) => ref.set(value) : undefined;
}

/**
 * Creates the drill piano-tools facade from live app bindings while allowing
 * piano settings state to be expressed as compact `refs`.
 *
 * @param {object} [options]
 * @param {Record<string, { get: () => any, set?: (value: any) => void }>} [options.stateRefs]
 */
export function createDrillPianoToolsDrillRootAppFacade({
  stateRefs = {},
  ...options
} = {}) {
  return createDrillPianoToolsRootAppFacade({
    ...options,
    getPianoFadeSettings: createGetter(stateRefs.pianoFadeSettings) || options.getPianoFadeSettings,
    setPianoFadeSettings: createSetter(stateRefs.pianoFadeSettings) || options.setPianoFadeSettings,
    getPianoMidiSettings: createGetter(stateRefs.pianoMidiSettings) || options.getPianoMidiSettings,
    setPianoMidiSettings: createSetter(stateRefs.pianoMidiSettings) || options.setPianoMidiSettings
  });
}
