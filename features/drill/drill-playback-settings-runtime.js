// @ts-check

/**
 * Creates the small playback/settings helpers that still depend on app DOM and
 * mixer state, so `app.js` does not need to own them inline.
 *
 * @param {object} [options]
 * @param {Record<string, any>} [options.dom]
 * @param {object} [options.mixer]
 * @param {() => Record<string, any> | null} [options.mixer.getMixerNodes]
 * @param {() => BaseAudioContext | null} [options.mixer.getAudioContext]
 * @param {(options: {
 *   dom: Record<string, any>,
 *   mixerNodes: Record<string, any> | null,
 *   audioCtx: BaseAudioContext | null,
 *   sliderValueToGain: (slider: any) => number,
 *   mixerChannelCalibration: Record<string, number>
 * }) => any} [options.mixer.applyAudioMixerSettings]
 * @param {Record<string, any>} [options.helpers]
 * @param {(style: any) => string} [options.helpers.normalizeCompingStyle]
 * @param {Record<string, any>} [options.constants]
 * @param {string} [options.constants.compingStyleOff]
 * @param {Record<string, number>} [options.constants.mixerChannelCalibration]
 * @param {string} [options.constants.drumModeOff]
 * @param {number} [options.constants.bassLow]
 * @param {string[]} [options.constants.noteNamesFlat]
 * @param {boolean} [options.constants.walkingBassDebugEnabled]
 */
export function createDrillPlaybackSettingsRuntime({
  dom = {},
  mixer = {},
  helpers = {},
  constants = {}
} = {}) {
  const noteNamesFlat = Array.isArray(constants.noteNamesFlat)
    ? constants.noteNamesFlat
    : ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

  function sliderValueToGain(slider) {
    const percent = Number(slider?.value ?? 100);
    return Math.max(0, Math.min(1, percent / 100));
  }

  function getCompingStyle() {
    return helpers.normalizeCompingStyle?.(dom.compingStyle?.value);
  }

  function isChordsEnabled() {
    return getCompingStyle() !== constants.compingStyleOff && sliderValueToGain(dom.stringsVolume) > 0;
  }

  function isWalkingBassEnabled() {
    return Boolean(dom.walkingBass?.checked);
  }

  function isWalkingBassDebugEnabled() {
    return constants.walkingBassDebugEnabled !== false;
  }

  function bassMidiToNoteName(midi) {
    if (!Number.isFinite(midi)) return String(midi);
    const pitchClass = ((midi % 12) + 12) % 12;
    const octave = Math.floor(midi / 12) - 1;
    return `${noteNamesFlat[pitchClass]}${octave}`;
  }

  function updateMixerValueLabel(slider, output) {
    if (!slider || !output) return;
    output.value = `${slider.value}%`;
    output.textContent = `${slider.value}%`;
  }

  function applyMixerSettings() {
    return mixer.applyAudioMixerSettings?.({
      dom,
      mixerNodes: mixer.getMixerNodes?.() || null,
      audioCtx: mixer.getAudioContext?.() || null,
      sliderValueToGain,
      mixerChannelCalibration: constants.mixerChannelCalibration
    });
  }

  function getDrumsMode() {
    return dom.drumsSelect?.value || constants.drumModeOff;
  }

  function getBassMidi(key, semitoneOffset) {
    let pitchClass = (key + semitoneOffset) % 12;
    let midi = pitchClass;
    while (midi < constants.bassLow) midi += 12;
    return midi;
  }

  return {
    sliderValueToGain,
    getCompingStyle,
    isChordsEnabled,
    isWalkingBassEnabled,
    isWalkingBassDebugEnabled,
    bassMidiToNoteName,
    updateMixerValueLabel,
    applyMixerSettings,
    getDrumsMode,
    getBassMidi
  };
}
