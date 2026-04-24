
import { bindProgressionControls } from '../progression/progression-bindings.js';
import { createProgressionEditor } from '../progression/progression-editor.js';
import { createProgressionManager } from '../progression/progression-manager.js';

type LiveStateBindings = Record<string, ((value?: unknown) => unknown) | unknown>;

type DrillProgressionEntry = {
  name?: string;
  mode?: string;
  pattern?: string;
};

type DrillProgressionRootAppAssemblyOptions = {
  dom?: Record<string, unknown>;
  editorState?: LiveStateBindings;
  editorConstants?: Record<string, unknown>;
  editorHelpers?: Record<string, unknown>;
  managerState?: LiveStateBindings;
  managerConstants?: Record<string, unknown>;
  managerHelpers?: Record<string, unknown>;
  controlsState?: LiveStateBindings;
  controlsConstants?: Record<string, unknown>;
  controlsHelpers?: Record<string, unknown>;
  domainState?: {
    getDefaultProgressions?: () => Record<string, DrillProgressionEntry>;
  };
  domainConstants?: {
    defaultPatternMode?: string;
  };
  domainHelpers?: {
    createProgressionEntryBase?: ((...args: unknown[]) => DrillProgressionEntry) | null;
    normalizeProgressionEntryBase?: ((name: string, entry: unknown, options: Record<string, unknown>) => DrillProgressionEntry) | null;
    normalizeProgressionsMapBase?: ((source: unknown, defaults: Record<string, DrillProgressionEntry>, normalizeEntry: (name: string, entry: unknown) => DrillProgressionEntry) => Record<string, DrillProgressionEntry>) | null;
    parseDefaultProgressionsTextBase?: ((source: unknown, options: Record<string, unknown>) => Record<string, DrillProgressionEntry>) | null;
    isModeToken?: (value: string) => boolean;
    normalizePatternMode?: (value: unknown) => string;
    normalizePatternString?: (value: unknown) => string;
    normalizePresetName?: (value: unknown) => string;
  };
};

function getStatePropertyName(name: string) {
  if (!name || name.length <= 3) return '';
  return `${name.charAt(3).toLowerCase()}${name.slice(4)}`;
}

function createLiveStateProxy(bindings: LiveStateBindings = {}) {
  const proxy: Record<string, unknown> = {};
  const propertyNames = new Set();

  for (const name of Object.keys(bindings)) {
    if (name.startsWith('get') || name.startsWith('set')) {
      propertyNames.add(getStatePropertyName(name));
    }
  }

  for (const propertyNameValue of propertyNames) {
    const propertyName = String(propertyNameValue);
    if (!propertyName) continue;
    const getterName = `get${propertyName.charAt(0).toUpperCase()}${propertyName.slice(1)}`;
    const setterName = `set${propertyName.charAt(0).toUpperCase()}${propertyName.slice(1)}`;
    const getter = bindings[getterName];
    const setter = bindings[setterName];

    Object.defineProperty(proxy, propertyName, {
      enumerable: true,
      configurable: true,
      get: typeof getter === 'function' ? () => getter() : undefined,
      set: typeof setter === 'function' ? (value) => setter(value) : undefined
    });
  }

  return proxy;
}

/**
 * Creates the drill progression assembly from live root-app bindings. This
 * keeps the editor, manager, and control-binding contracts out of `app.js`
 * while preserving the same progression workflow surface.
 *
 * @param {object} [options]
 * @param {Record<string, unknown>} [options.dom]
 * @param {Record<string, unknown>} [options.editorState]
 * @param {Record<string, unknown>} [options.editorConstants]
 * @param {Record<string, unknown>} [options.editorHelpers]
 * @param {Record<string, unknown>} [options.managerState]
 * @param {Record<string, unknown>} [options.managerConstants]
 * @param {Record<string, unknown>} [options.managerHelpers]
 * @param {Record<string, unknown>} [options.controlsState]
 * @param {Record<string, unknown>} [options.controlsConstants]
 * @param {Record<string, unknown>} [options.controlsHelpers]
 * @param {Record<string, unknown>} [options.domainState]
 * @param {Record<string, unknown>} [options.domainConstants]
 * @param {Record<string, unknown>} [options.domainHelpers]
 */
export function createDrillProgressionRootAppAssembly({
  dom = {},
  editorState = {},
  editorConstants = {},
  editorHelpers = {},
  managerState = {},
  managerConstants = {},
  managerHelpers = {},
  controlsState = {},
  controlsConstants = {},
  controlsHelpers = {},
  domainState = {},
  domainConstants = {},
  domainHelpers = {}
}: DrillProgressionRootAppAssemblyOptions = {}) {
  const {
    getDefaultProgressions = () => ({})
  } = domainState;
  const {
    defaultPatternMode = 'major'
  } = domainConstants;
  const {
    createProgressionEntryBase = null,
    normalizeProgressionEntryBase = null,
    normalizeProgressionsMapBase = null,
    parseDefaultProgressionsTextBase = null,
    isModeToken = () => false,
    normalizePatternMode = (value) => value,
    normalizePatternString = (value) => value,
    normalizePresetName = (value) => value
  } = domainHelpers;

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

  const progressionEditor = createProgressionEditor({
    dom,
    state: createLiveStateProxy(editorState),
    constants: editorConstants,
    helpers: editorHelpers
  });
  const progressionManager = createProgressionManager({
    dom,
    state: createLiveStateProxy(managerState) as any,
    constants: managerConstants,
    helpers: {
      ...progressionEditor,
      ...managerHelpers
    }
  });

  bindProgressionControls({
    dom,
    constants: controlsConstants,
    state: createLiveStateProxy(controlsState),
    helpers: {
      ...progressionEditor,
      ...progressionManager,
      ...controlsHelpers
    }
  });

  return {
    createProgressionEntry,
    normalizeProgressionEntry,
    normalizeProgressionsMap,
    parseDefaultProgressionsText,
    getDefaultProgressionsFingerprint,
    ...progressionEditor,
    ...progressionManager
  };
}


