// @ts-check

/**
 * Creates the small display/transposition support helpers from live root-app
 * bindings. This keeps app-level display helper logic out of `app.js` while
 * preserving the same harmony-display behavior.
 *
 * @param {object} [options]
 * @param {Record<string, any>} [options.dom]
 * @param {Record<string, any>} [options.constants]
 * @param {Record<string, any>} [options.runtimeHelpers]
 */
export function createDrillDisplaySupportRootAppAssembly({
  dom = {},
  constants = {},
  runtimeHelpers = {}
} = {}) {
  const {
    displayModeChordsOnly = 'chords-only'
  } = constants;

  const {
    getPlayedChordQuality = () => '',
    getDisplayAliasQuality = (quality) => quality,
    normalizeHarmonyDisplayMode = (value) => value,
    normalizeDisplayMode = (value) => value,
    matchMedia = () => ({ matches: false })
  } = runtimeHelpers;

  function getDisplayTranspositionSemitones() {
    return Number(dom.transpositionSelect?.value || 0);
  }

  function transposeDisplayPitchClass(pitchClass) {
    return (pitchClass + getDisplayTranspositionSemitones() + 12) % 12;
  }

  function getDisplayedQuality(chord, isMinor, nextChord = null) {
    const playedQuality = getPlayedChordQuality(chord, isMinor, nextChord);
    return getDisplayAliasQuality(
      playedQuality,
      normalizeHarmonyDisplayMode(dom.harmonyDisplayMode?.value)
    );
  }

  function normalizeDisplayedRootName(rootName) {
    const normalizedEnharmonicMap = {
      'F\u266D': 'E',
      'E\u266F': 'F',
      'C\u266D': 'B',
      'B\u266F': 'C',
      Fb: 'E',
      'E#': 'F',
      Cb: 'B',
      'B#': 'C'
    };
    if (Object.hasOwn(normalizedEnharmonicMap, rootName)) {
      return normalizedEnharmonicMap[rootName];
    }

    const enharmonicMap = {
      'F♭': 'E',
      'E♯': 'F',
      'C♭': 'B',
      'B♯': 'C',
      'FÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­': 'E',
      'EÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¯': 'F',
      'CÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­': 'B',
      'BÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¯': 'C',
      Fb: 'E',
      'E#': 'F',
      Cb: 'B',
      'B#': 'C'
    };
    return enharmonicMap[rootName] || rootName;
  }

  function isCurrentHarmonyHidden() {
    return dom.hideCurrentHarmony?.checked === true;
  }

  function getBaseChordDisplaySize() {
    const mode = normalizeDisplayMode(dom.displayMode?.value);
    const isMobile = matchMedia('(max-width: 720px)').matches;

    if (mode === displayModeChordsOnly) {
      return isMobile ? 3.5 : 6;
    }
    return isMobile ? 3.0 : 5;
  }

  return {
    getDisplayTranspositionSemitones,
    transposeDisplayPitchClass,
    getDisplayedQuality,
    normalizeDisplayedRootName,
    isCurrentHarmonyHidden,
    getBaseChordDisplaySize
  };
}
