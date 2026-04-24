// @ts-nocheck

/**
 * Creates the drill default-progressions assembly from live root-app bindings.
 * This keeps the progression-entry/default-catalog glue out of `app.js` while
 * preserving the same default-progressions behavior.
 *
 * @param {object} [options]
 * @param {Record<string, any>} [options.constants]
 * @param {Record<string, Function>} [options.state]
 * @param {Record<string, Function>} [options.helpers]
 */
export function createDrillDefaultProgressionsRootAppAssembly({
  constants = {},
  state = {},
  helpers = {}
} = {}) {
  const {
    defaultPatternMode = 'major'
  } = constants;
  const {
    getDefaultProgressions = () => ({})
  } = state;
  const {
    createProgressionEntryBase,
    normalizeProgressionEntryBase,
    normalizeProgressionsMapBase,
    parseDefaultProgressionsTextBase,
    isModeToken = () => false,
    normalizePatternMode = (value) => value,
    normalizePatternString = (value) => value,
    normalizePresetName = (value) => value
  } = helpers;

  function createProgressionEntry(pattern, mode = defaultPatternMode, name = '') {
    return createProgressionEntryBase(
      pattern,
      normalizePatternMode,
      normalizePatternString,
      mode,
      name,
      normalizePresetName
    );
  }

  function normalizeProgressionEntry(name, entry) {
    return normalizeProgressionEntryBase(name, entry, {
      createEntry: createProgressionEntry,
      defaultMode: defaultPatternMode
    });
  }

  function normalizeProgressionsMap(source) {
    return normalizeProgressionsMapBase(
      source,
      getDefaultProgressions(),
      normalizeProgressionEntry
    );
  }

  function parseDefaultProgressionsText(source) {
    return parseDefaultProgressionsTextBase(source, {
      createEntry: createProgressionEntry,
      isModeToken
    });
  }

  function getDefaultProgressionsFingerprint(source = getDefaultProgressions()) {
    return JSON.stringify(
      Object.entries(source || {}).map(([name, entry]) => {
        const normalized = normalizeProgressionEntry(name, entry);
        return [name, normalized.name || '', normalized.mode || defaultPatternMode];
      })
    );
  }

  return {
    createProgressionEntry,
    normalizeProgressionEntry,
    normalizeProgressionsMap,
    parseDefaultProgressionsText,
    getDefaultProgressionsFingerprint
  };
}


