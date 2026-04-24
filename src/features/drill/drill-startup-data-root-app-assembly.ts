
/**
 * Creates the drill startup-data assembly from live root-app bindings.
 * This keeps the welcome standards, pattern-help, and default-progressions
 * loading workflow out of `app.js` while preserving the same startup data
 * loading behavior.
 *
 * @param {object} [options]
 * @param {Record<string, Function>} [options.state]
 * @param {object} [options.welcomeStandards]
 * @param {object} [options.patternHelp]
 * @param {object} [options.defaultProgressions]
 */
type WelcomeStandardEntry = {
  patternName?: string,
  pattern?: string,
  summary?: string,
  patternMode?: string,
  majorMinor?: boolean,
  repetitionsPerKey?: number,
  tempo?: number,
  chordsPerBar?: number,
  compingStyle?: string,
  enabledKeys?: boolean[],
  sourcePitchClass?: number,
  [key: string]: unknown
};

type StartupDataAssemblyOptions = {
  state?: {
    setWelcomeStandards?: (value: Record<string, WelcomeStandardEntry>) => void,
    setDefaultProgressionsVersion?: (value: string) => void,
    setDefaultProgressions?: (value: Record<string, unknown>) => void,
    setProgressions?: (value: Record<string, unknown>) => void
  },
  welcomeStandards?: {
    noteLetterToSemitone?: Record<string, number>,
    patternModeMinor?: string,
    compingStylePiano?: string,
    normalizePatternMode?: (value: unknown) => string,
    select?: HTMLSelectElement | null,
    getWelcomeStandards?: () => Record<string, WelcomeStandardEntry>,
    fetchImpl?: typeof globalThis.fetch,
    url?: string,
    version?: string,
    welcomeStandardsFallback?: Record<string, WelcomeStandardEntry>
  },
  patternHelp?: {
    loadDrillPatternHelp?: (options: { dom?: unknown, url?: string, version?: string }) => Promise<void>,
    dom?: unknown,
    url?: string,
    version?: string
  },
  defaultProgressions?: {
    fetchImpl?: typeof globalThis.fetch,
    url?: string,
    appVersion?: string,
    parseDefaultProgressionsText?: (value: unknown) => { version?: string, progressions: Record<string, unknown> },
    normalizeProgressionsMap?: (value: unknown) => Record<string, unknown>,
    getDefaultProgressions?: () => Record<string, unknown>
  }
};

export function createDrillStartupDataRootAppAssembly({
  state = {},
  welcomeStandards = {},
  patternHelp = {},
  defaultProgressions = {}
}: StartupDataAssemblyOptions = {}) {
  const {
    setWelcomeStandards = () => {},
    setDefaultProgressionsVersion = () => {},
    setDefaultProgressions = () => {},
    setProgressions = () => {}
  } = state;

  function parseWelcomeStandardsText(text) {
    const {
      noteLetterToSemitone = {},
      patternModeMinor = 'minor',
      compingStylePiano = 'piano',
      normalizePatternMode = (value) => String(value ?? '')
    } = welcomeStandards;

    function slugifyWelcomeStandardName(name) {
      return String(name || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'standard';
    }

    function parsePitchClassFromKeyName(name) {
      const normalized = String(name || '').trim();
      const match = normalized.match(/^([A-Ga-g])([b#]?)/);
      if (!match) return null;
      const letter = match[1].toUpperCase();
      const accidental = match[2] || '';
      let pitchClass = noteLetterToSemitone[letter];
      if (!Number.isFinite(pitchClass)) return null;
      if (accidental === 'b') pitchClass = (pitchClass + 11) % 12;
      if (accidental === '#') pitchClass = (pitchClass + 1) % 12;
      return pitchClass;
    }

    function buildSingleEnabledKeySelectionFromPattern(pattern) {
      const match = String(pattern || '').match(/\bkey:\s*([A-G](?:b|#)?)/i);
      const pitchClass = parsePitchClassFromKeyName(match?.[1] || '');
      if (!Number.isFinite(pitchClass)) {
        return [true, false, false, false, false, false, false, false, false, false, false, false];
      }
      return Array.from({ length: 12 }, (_, index) => index === pitchClass);
    }

    const entries: Record<string, WelcomeStandardEntry> = {};
    const lines = String(text || '').split(/\r?\n/);
    let pendingTempo = 120;
    let pendingName = null;
    let pendingMode = null;
    let pendingPatternParts = [];

    function flushPending() {
      if (!pendingName) return;
      const pattern = pendingPatternParts.join(' | ');
      const normalizedMode = normalizePatternMode(pendingMode);
      const keyMatch = pattern.match(/\bkey:\s*([A-G](?:b|#)?)/i);
      const keyName = keyMatch?.[1] || 'C';
      const isMinor = normalizedMode === patternModeMinor;
      const keyPitchClass = parsePitchClassFromKeyName(keyName);
      const fallbackPitchClass = Number.isFinite(keyPitchClass) ? keyPitchClass : 0;
      entries[slugifyWelcomeStandardName(pendingName)] = {
        summary: `Suggested: ${pendingName}, single key, ${pendingTempo >= 140 ? 'up-tempo' : 'comfortable'} groove.`,
        patternName: pendingName,
        pattern,
        patternMode: normalizedMode,
        majorMinor: isMinor,
        repetitionsPerKey: 1,
        tempo: pendingTempo,
        chordsPerBar: 4,
        compingStyle: compingStylePiano,
        enabledKeys: buildSingleEnabledKeySelectionFromPattern(pattern),
        sourcePitchClass: fallbackPitchClass
      };
      pendingName = null;
      pendingMode = null;
      pendingPatternParts = [];
    }

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('#')) {
        const tempoMatch = trimmed.match(/\bTempo:\s*(\d+)/i);
        if (tempoMatch) pendingTempo = Number.parseInt(tempoMatch[1], 10) || 120;
        continue;
      }
      if (!trimmed) {
        flushPending();
        continue;
      }

      const entryMatch = trimmed.match(/^([^|]+)\|([^|]+)\|(.*)$/);
      if (!entryMatch) continue;

      const col1 = entryMatch[1].trim();
      const col2 = entryMatch[2].trim();
      const col3 = entryMatch[3].trim();
      const isHeader = /^(major|minor)$/i.test(col2) && /^key:/i.test(col3);

      if (isHeader) {
        flushPending();
        pendingName = col1;
        pendingMode = col2;
        pendingPatternParts = [col3];
        continue;
      }

      if (pendingName) {
        pendingPatternParts.push(trimmed);
        continue;
      }

      const patternName = col1;
      const rawMode = col2;
      const pattern = col3;
      const normalizedMode = normalizePatternMode(rawMode);
      const keyMatch = pattern.match(/\bkey:\s*([A-G](?:b|#)?)/i);
      const keyName = keyMatch?.[1] || 'C';
      const isMinor = normalizedMode === patternModeMinor;
      const keyPitchClass = parsePitchClassFromKeyName(keyName);
      const fallbackPitchClass = Number.isFinite(keyPitchClass) ? keyPitchClass : 0;

      entries[slugifyWelcomeStandardName(patternName)] = {
        summary: `Suggested: ${patternName}, single key, ${pendingTempo >= 140 ? 'up-tempo' : 'comfortable'} groove.`,
        patternName,
        pattern,
        patternMode: normalizedMode,
        majorMinor: isMinor,
        repetitionsPerKey: 1,
        tempo: pendingTempo,
        chordsPerBar: 4,
        compingStyle: compingStylePiano,
        enabledKeys: buildSingleEnabledKeySelectionFromPattern(pattern),
        sourcePitchClass: fallbackPitchClass
      };
    }

    flushPending();
    return entries;
  }

  function renderWelcomeStandardOptions() {
    const {
      select = null,
      getWelcomeStandards = () => ({})
    } = welcomeStandards;

    if (!select) return;
    const previousValue = select.value;
    const entries = Object.entries(getWelcomeStandards() as Record<string, WelcomeStandardEntry>);
    select.innerHTML = '';

    entries.forEach(([key, entry], index) => {
      const option = document.createElement('option');
      option.value = key;
      option.textContent = entry?.patternName || key;
      if ((previousValue && previousValue === key) || (!previousValue && index === 0)) {
        option.selected = true;
      }
      select.append(option);
    });
  }

  async function loadWelcomeStandards() {
    const {
      fetchImpl = globalThis.fetch,
      url = '',
      version = '',
      welcomeStandardsFallback = {}
    } = welcomeStandards;

    try {
      const response = await fetchImpl(`${url}?v=${encodeURIComponent(version)}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const parsed = parseWelcomeStandardsText(await response.text());
      if (Object.keys(parsed).length > 0) {
        setWelcomeStandards(parsed);
      }
    } catch {
      setWelcomeStandards({ ...welcomeStandardsFallback });
    }

    renderWelcomeStandardOptions();
  }

  async function loadPatternHelp() {
    const {
      loadDrillPatternHelp = async () => {},
      dom,
      url = '',
      version = ''
    } = patternHelp;

    await loadDrillPatternHelp({
      dom,
      url,
      version
    });
  }

  async function loadDefaultProgressions() {
    const {
      fetchImpl = globalThis.fetch,
      url = '',
      appVersion = '',
      parseDefaultProgressionsText = () => ({ version: '1', progressions: {} }),
      normalizeProgressionsMap = (value): Record<string, unknown> => (
        value && typeof value === 'object'
          ? (value as Record<string, unknown>)
          : {}
      )
    } = defaultProgressions;

    try {
      const versionedUrl = `${url}?v=${encodeURIComponent(appVersion)}`;
      let response = await fetchImpl(versionedUrl);
      if (!response.ok) {
        response = await fetchImpl(url);
      }
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const parsed = parseDefaultProgressionsText(await response.text());
      setDefaultProgressionsVersion(parsed.version || '1');
      setDefaultProgressions(parsed.progressions);
    } catch {
      setDefaultProgressionsVersion('1');
      setDefaultProgressions({});
    }

    setProgressions(normalizeProgressionsMap(defaultProgressions.getDefaultProgressions?.() || {}));
  }

  return {
    parseWelcomeStandardsText,
    renderWelcomeStandardOptions,
    loadWelcomeStandards,
    loadPatternHelp,
    loadDefaultProgressions
  };
}


