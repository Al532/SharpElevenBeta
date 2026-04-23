// @ts-check

/**
 * Creates the drill settings-normalization root context from live root-app
 * bindings. This keeps small settings/display normalizers out of `app.js`
 * while preserving the same normalization behavior.
 *
 * @param {object} [options]
 * @param {Record<string, any>} [options.constants]
 * @param {Record<string, Function>} [options.helpers]
 */
export function createDrillSettingsNormalizationRootAppContext({
  constants = {},
  helpers = {}
} = {}) {
  const {
    compingStyleOff = 'off',
    compingStyleStrings = 'strings',
    compingStylePiano = 'piano',
    defaultRepetitionsPerKey = 2,
    displayModeShowBoth = 'show-both',
    displayModeChordsOnly = 'chords-only',
    displayModeKeyOnly = 'key-only',
    harmonyDisplayModeDefault = 'default',
    harmonyDisplayModeRich = 'rich'
  } = constants;
  const {
    normalizeChordsPerBarBase = (value) => value
  } = helpers;

  function normalizeCompingStyle(style) {
    if (style === 'piano-one-hand' || style === 'piano-two-hand') return compingStylePiano;
    return [
      compingStyleOff,
      compingStyleStrings,
      compingStylePiano
    ].includes(style)
      ? style
      : compingStyleStrings;
  }

  function normalizeRepetitionsPerKey(value) {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed)) return defaultRepetitionsPerKey;
    return Math.min(8, Math.max(1, parsed));
  }

  function normalizeChordsPerBar(value) {
    return normalizeChordsPerBarBase(value);
  }

  function normalizeDisplayMode(mode) {
    return [
      displayModeShowBoth,
      displayModeChordsOnly,
      displayModeKeyOnly
    ].includes(mode)
      ? mode
      : displayModeShowBoth;
  }

  function normalizeHarmonyDisplayMode(mode) {
    return [
      harmonyDisplayModeDefault,
      harmonyDisplayModeRich
    ].includes(mode)
      ? mode
      : harmonyDisplayModeDefault;
  }

  return {
    normalizeCompingStyle,
    normalizeRepetitionsPerKey,
    normalizeChordsPerBar,
    normalizeDisplayMode,
    normalizeHarmonyDisplayMode
  };
}
