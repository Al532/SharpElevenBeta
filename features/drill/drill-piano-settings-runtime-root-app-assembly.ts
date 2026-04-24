
type DrillPianoSettingsRuntimeRootAppAssemblyOptions = {
  runtimeState?: Record<string, any>;
  constants?: Record<string, any>;
};

/**
 * Creates the small piano fade/MIDI-settings helpers from live root-app
 * bindings. This keeps the piano settings normalization logic out of `app.js`
 * while preserving the same behavior.
 *
 * @param {object} [options]
 * @param {Record<string, any>} [options.runtimeState]
 * @param {Record<string, any>} [options.constants]
 */
export function createDrillPianoSettingsRuntimeRootAppAssembly({
  runtimeState = {},
  constants = {}
}: DrillPianoSettingsRuntimeRootAppAssemblyOptions = {}) {
  const {
    getPianoFadeSettings = () => ({ timeConstantLow: 0.1, timeConstantHigh: 0.12 })
  } = runtimeState;

  const {
    defaultPianoFadeSettings = { timeConstantLow: 0.1, timeConstantHigh: 0.12 },
    defaultPianoMidiSettings = { enabled: false, inputId: '', sustainPedalEnabled: true }
  } = constants;

  function clamp01(value: number) {
    return Math.min(1, Math.max(0, value));
  }

  function clampRange(value: unknown, min: number, max: number, fallback: number) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.min(max, Math.max(min, parsed));
  }

  function createDefaultPianoFadeSettings(overrides: Record<string, any> = {}) {
    return {
      ...defaultPianoFadeSettings,
      ...overrides
    };
  }

  function normalizePianoFadeSettings(candidate: Record<string, any> = {}) {
    return {
      timeConstantLow: clampRange(
        candidate.timeConstantLow,
        0.01,
        1.5,
        defaultPianoFadeSettings.timeConstantLow
      ),
      timeConstantHigh: clampRange(
        candidate.timeConstantHigh,
        0.01,
        1.5,
        defaultPianoFadeSettings.timeConstantHigh
      )
    };
  }

  function normalizePianoMidiSettings(candidate: Record<string, any> = {}) {
    return {
      enabled: Boolean(candidate.enabled),
      inputId: typeof candidate.inputId === 'string'
        ? candidate.inputId
        : defaultPianoMidiSettings.inputId,
      sustainPedalEnabled: candidate.sustainPedalEnabled !== undefined
        ? Boolean(candidate.sustainPedalEnabled)
        : defaultPianoMidiSettings.sustainPedalEnabled
    };
  }

  function getPianoFadeProfile(midi: number, volume: number, maxDuration: number) {
    const pianoFadeSettings = getPianoFadeSettings();
    const midiNorm = clamp01(((Number(midi) || 60) - 45) / 44);
    const volumeNorm = clamp01((Number(volume) || 0) / 0.42);
    const timeConstantBase = pianoFadeSettings.timeConstantLow
      + ((pianoFadeSettings.timeConstantHigh - pianoFadeSettings.timeConstantLow) * midiNorm);
    const timeConstant = Math.max(0.024, timeConstantBase + (volumeNorm * 0.006));
    const fadeBefore = maxDuration > 0
      ? Math.min(Math.max(0.02, timeConstant * 0.9), Math.max(0.02, maxDuration * 0.28))
      : Math.max(0.02, timeConstant * 0.9);
    return {
      fadeBefore,
      timeConstant
    };
  }

  return {
    clamp01,
    clampRange,
    createDefaultPianoFadeSettings,
    normalizePianoFadeSettings,
    normalizePianoMidiSettings,
    getPianoFadeProfile
  };
}


