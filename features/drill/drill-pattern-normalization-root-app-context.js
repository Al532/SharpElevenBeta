// @ts-check

/**
 * Creates the drill pattern-normalization root context from live root-app
 * bindings. This keeps small pattern/preset normalizers out of `app.js`
 * while preserving the same normalization behavior.
 *
 * @param {object} [options]
 * @param {Record<string, any>} [options.constants]
 */
export function createDrillPatternNormalizationRootAppContext({
  constants = {}
} = {}) {
  const {
    patternModeBoth = 'both',
    patternModeMajor = 'major',
    patternModeMinor = 'minor'
  } = constants;

  function normalizePatternMode(mode) {
    if (mode === 'major/minor') return patternModeBoth;
    return [patternModeMajor, patternModeMinor, patternModeBoth].includes(mode)
      ? mode
      : patternModeMajor;
  }

  function normalizePresetName(name) {
    return String(name || '')
      .trim()
      .replace(/\s+/g, ' ');
  }

  function normalizePresetNameForInput(name) {
    return String(name || '')
      .replace(/\s{2,}/g, ' ');
  }

  return {
    normalizePatternMode,
    normalizePresetName,
    normalizePresetNameForInput
  };
}
