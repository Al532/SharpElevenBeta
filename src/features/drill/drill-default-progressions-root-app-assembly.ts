
type DrillProgressionEntry = {
  name?: string;
  mode?: string;
  pattern?: string;
};

type CreateDrillDefaultProgressionsRootAppAssemblyOptions = {
  constants?: {
    defaultPatternMode?: string;
  };
  state?: {
    getDefaultProgressions?: () => Record<string, DrillProgressionEntry>;
  };
  helpers?: {
    createProgressionEntryBase?: (
      pattern: string,
      normalizePatternMode: (value: unknown) => string,
      normalizePatternString: (value: unknown) => string,
      mode: string,
      name: string,
      normalizePresetName: (value: unknown) => string
    ) => DrillProgressionEntry;
    normalizeProgressionEntryBase?: (
      name: string,
      entry: unknown,
      options: {
        createEntry: (pattern: string, mode?: string, name?: string) => DrillProgressionEntry;
        defaultMode: string;
      }
    ) => DrillProgressionEntry;
    normalizeProgressionsMapBase?: (
      source: unknown,
      defaults: Record<string, DrillProgressionEntry>,
      normalizeEntry: (name: string, entry: unknown) => DrillProgressionEntry
    ) => Record<string, DrillProgressionEntry>;
    parseDefaultProgressionsTextBase?: (
      source: unknown,
      options: {
        createEntry: (pattern: string, mode?: string, name?: string) => DrillProgressionEntry;
        isModeToken: (value: string) => boolean;
      }
    ) => unknown;
    isModeToken?: (value: string) => boolean;
    normalizePatternMode?: (value: unknown) => string;
    normalizePatternString?: (value: unknown) => string;
    normalizePresetName?: (value: unknown) => string;
  };
};

/**
 * Creates the drill default-progressions assembly from live root-app bindings.
 * This keeps the progression-entry/default-catalog glue out of `app.js` while
 * preserving the same default-progressions behavior.
 *
 * @param {object} [options]
 * @param {object} [options.constants]
 * @param {object} [options.state]
 * @param {object} [options.helpers]
 */
export function createDrillDefaultProgressionsRootAppAssembly({
  constants = {},
  state = {},
  helpers = {}
}: CreateDrillDefaultProgressionsRootAppAssemblyOptions = {}) {
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
    normalizePatternMode = (value) => String(value ?? defaultPatternMode),
    normalizePatternString = (value) => String(value ?? ''),
    normalizePresetName = (value) => String(value ?? '')
  } = helpers;

  function createProgressionEntry(pattern: string, mode = defaultPatternMode, name = '') {
    return createProgressionEntryBase(
      pattern,
      normalizePatternMode,
      normalizePatternString,
      mode,
      name,
      normalizePresetName
    );
  }

  function normalizeProgressionEntry(name: string, entry: unknown): DrillProgressionEntry {
    return normalizeProgressionEntryBase(name, entry, {
      createEntry: createProgressionEntry,
      defaultMode: defaultPatternMode
    });
  }

  function normalizeProgressionsMap(source: unknown) {
    return normalizeProgressionsMapBase(
      source,
      getDefaultProgressions(),
      normalizeProgressionEntry
    );
  }

  function parseDefaultProgressionsText(source: unknown) {
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


